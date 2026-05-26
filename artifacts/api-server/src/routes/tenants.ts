// Tenant CRUD routes. All routes here are mounted behind requireAuth in
// routes/index.ts. The pipeline runs asynchronously after POST / and POST /:id/refresh;
// clients poll GET /:id/status for progress.

import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  tenantsTable,
  tenantProfileTable,
  tenantLayersTable,
  tenantArtifactsTable,
  tenantPipelineRunsTable,
} from "@workspace/db";
import { startPipeline } from "../lib/pipeline/runner";

const router: IRouter = Router();

// ─── GET /tenants ────────────────────────────────────────────────────────
// Picker list: lightweight columns only. No profile/layers/artifacts.
router.get("/tenants", async (_req, res) => {
  const rows = await db
    .select({
      id: tenantsTable.id,
      name: tenantsTable.name,
      url: tenantsTable.url,
      sector: tenantsTable.sector,
      status: tenantsTable.status,
      lastSeededAt: tenantsTable.lastSeededAt,
      staleAfter: tenantsTable.staleAfter,
      createdAt: tenantsTable.createdAt,
    })
    .from(tenantsTable)
    .orderBy(desc(tenantsTable.createdAt));
  res.json({ tenants: rows });
});

// ─── GET /tenants/:id ────────────────────────────────────────────────────
// Full tenant document: tenant + profile + all layers + all artifacts.
router.get("/tenants/:id", async (req, res) => {
  const id = req.params.id;
  const tenantRows = await db.select().from(tenantsTable).where(eq(tenantsTable.id, id)).limit(1);
  const tenant = tenantRows[0];
  if (!tenant) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const [profileRows, layerRows, artifactRows] = await Promise.all([
    db.select().from(tenantProfileTable).where(eq(tenantProfileTable.tenantId, id)).limit(1),
    db.select().from(tenantLayersTable).where(eq(tenantLayersTable.tenantId, id)),
    db.select().from(tenantArtifactsTable).where(eq(tenantArtifactsTable.tenantId, id)),
  ]);
  res.json({
    tenant,
    profile: profileRows[0]?.profile ?? null,
    layers: layerRows.map((r) => ({
      layerKey: r.layerKey,
      content: r.content,
      verifiedClaims: r.verifiedClaims,
      modelledClaims: r.modelledClaims,
      generatedAt: r.generatedAt,
      generatorModel: r.generatorModel,
    })),
    artifacts: artifactRows.map((r) => ({
      kind: r.kind,
      content: r.content,
      generatedAt: r.generatedAt,
    })),
  });
});

// ─── POST /tenants ───────────────────────────────────────────────────────
// Create a tenant + kick off the pipeline. Returns {id, runId} within ~1s.
router.post("/tenants", async (req, res) => {
  const body = (req.body ?? {}) as { name?: unknown; url?: unknown };
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const urlRaw = typeof body.url === "string" ? body.url.trim().slice(0, 200) : "";
  if (!name) {
    res.status(400).json({ error: "name_required" });
    return;
  }
  if (!urlRaw) {
    res.status(400).json({ error: "url_required" });
    return;
  }
  // Canonicalise the URL to a bare domain. The pipeline re-uses this when
  // building the profile so the saved profile.url is always clean.
  const urlBare = urlRaw
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./i, "")
    .toLowerCase();
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(urlBare)) {
    res.status(400).json({ error: "url_invalid", detail: "Homepage URL must look like a real domain (e.g. stripe.com)." });
    return;
  }

  const [inserted] = await db
    .insert(tenantsTable)
    .values({ name, url: urlBare, createdBy: "admin" })
    .returning({ id: tenantsTable.id });

  const runId = await startPipeline(inserted.id);
  res.json({ id: inserted.id, runId });
});

// ─── GET /tenants/:id/status ─────────────────────────────────────────────
// Latest pipeline run row for this tenant. Used by the boot splash.
router.get("/tenants/:id/status", async (req, res) => {
  const id = req.params.id;
  const tenantRows = await db
    .select({ id: tenantsTable.id, status: tenantsTable.status, name: tenantsTable.name })
    .from(tenantsTable)
    .where(eq(tenantsTable.id, id))
    .limit(1);
  if (!tenantRows[0]) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const runRows = await db
    .select()
    .from(tenantPipelineRunsTable)
    .where(eq(tenantPipelineRunsTable.tenantId, id))
    .orderBy(desc(tenantPipelineRunsTable.startedAt))
    .limit(1);
  res.json({
    tenant: tenantRows[0],
    run: runRows[0] ?? null,
  });
});

// ─── DELETE /tenants/:id ─────────────────────────────────────────────────
// Cascade removes profile, layers, artifacts, pipeline runs.
router.delete("/tenants/:id", async (req, res) => {
  const id = req.params.id;
  const result = await db.delete(tenantsTable).where(eq(tenantsTable.id, id)).returning({ id: tenantsTable.id });
  if (result.length === 0) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.json({ ok: true });
});

// ─── POST /tenants/:id/refresh ───────────────────────────────────────────
// Re-runs the pipeline. Layers/artifacts are deleted-then-reinserted in the
// commit transaction so refresh is idempotent.
router.post("/tenants/:id/refresh", async (req, res) => {
  const id = req.params.id;
  const tenantRows = await db.select().from(tenantsTable).where(eq(tenantsTable.id, id)).limit(1);
  if (!tenantRows[0]) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  await db.update(tenantsTable).set({ status: "seeding" }).where(eq(tenantsTable.id, id));
  const runId = await startPipeline(id);
  res.json({ id, runId });
});

export default router;
