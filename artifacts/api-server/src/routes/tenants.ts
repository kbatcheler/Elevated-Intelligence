// Tenant CRUD routes. All routes here are mounted behind requireAuth in
// routes/index.ts. The pipeline runs asynchronously after POST / and POST /:id/refresh;
// clients poll GET /:id/status for progress.

import { Router, type IRouter } from "express";
import { desc, eq, and } from "drizzle-orm";
import {
  db,
  tenantsTable,
  tenantProfileTable,
  tenantLayersTable,
  tenantArtifactsTable,
  tenantPipelineRunsTable,
} from "@workspace/db";
import { startPipeline } from "../lib/pipeline/runner";
import { generateBriefOverrides, generateHeroPanel, generatePeerBenchmark, generateSupplementBlocks } from "../lib/pipeline/phase2";
import type { LayerKey, ProfileOutput } from "../lib/pipeline/schemas";
import type { NarrateOutput } from "../lib/pipeline/phase2-schemas";
import { logger as rootLogger } from "../lib/logger";

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
    briefOverrides: profileRows[0]?.briefOverrides ?? null,
    layers: layerRows.map((r) => ({
      layerKey: r.layerKey,
      content: r.content,
      heroPanel: r.heroPanel,
      peerBenchmark: r.peerBenchmark,
      supplementBlocks: r.supplementBlocks,
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

// ─── POST /tenants/:id/panels/backfill ───────────────────────────────────
// Fill all panel sub-stages (hero_panel + peer_benchmark + future
// supplement_blocks etc.) for every layer of an existing tenant WITHOUT
// re-running the full ~30+ min pipeline. Each panel stage is a short
// Haiku call against the layer's already-finalised content + the saved
// profile. Non-degrading per-layer per-panel: a single failure leaves the
// previous value (or null) in place and is counted in the response.
router.post("/tenants/:id/panels/backfill", async (req, res) => {
  const id = req.params.id;
  const tenantRows = await db.select().from(tenantsTable).where(eq(tenantsTable.id, id)).limit(1);
  if (!tenantRows[0]) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  const [profileRows, layerRows] = await Promise.all([
    db.select().from(tenantProfileTable).where(eq(tenantProfileTable.tenantId, id)).limit(1),
    db.select().from(tenantLayersTable).where(eq(tenantLayersTable.tenantId, id)),
  ]);
  const profileRaw = profileRows[0]?.profile as ProfileOutput | undefined;
  if (!profileRaw) {
    res.status(409).json({ error: "no_profile", detail: "Tenant has no profile yet, run /refresh first." });
    return;
  }
  const profile: ProfileOutput = profileRaw;
  const log = rootLogger.child({ tenantId: id, op: "panels/backfill" });
  log.info({ layerCount: layerRows.length }, "starting panels backfill");

  // Per-layer worker: runs every panel stage in PARALLEL within the layer
  // (they share inputs and are independent), then writes only the columns
  // whose generation succeeded. Cross-layer concurrency is capped to 4 to
  // mirror the main pipeline's LAYER_CONCURRENCY and respect Haiku TPM.
  const CONCURRENCY = 4;
  let cursor = 0;
  const counts = {
    hero:        { ok: 0, failed: 0 },
    peers:       { ok: 0, failed: 0 },
    supplements: { ok: 0, failed: 0 },
    briefs:      { ok: 0, failed: 0 },
  };
  async function worker(): Promise<void> {
    while (true) {
      const i = cursor++;
      if (i >= layerRows.length) return;
      const row = layerRows[i];
      const content = row.content as NarrateOutput["content"];
      const layerKey = row.layerKey as LayerKey;
      const [heroPanel, peerBenchmark, supplementBlocks] = await Promise.all([
        generateHeroPanel(profile, content, layerKey, log).catch((e) => {
          log.warn({ err: String(e), layerKey }, "hero generation threw");
          return null;
        }),
        generatePeerBenchmark(profile, content, layerKey, log).catch((e) => {
          log.warn({ err: String(e), layerKey }, "peers generation threw");
          return null;
        }),
        generateSupplementBlocks(profile, content, layerKey, log).catch((e) => {
          log.warn({ err: String(e), layerKey }, "supplements generation threw");
          return null;
        }),
      ]);
      // Build a partial set of only the columns we successfully generated.
      // Skipping nulls means a flaky retry can't regress an existing good
      // panel to null. The next backfill call retries the failed ones.
      const update: Record<string, unknown> = {};
      if (heroPanel)         { update.heroPanel        = heroPanel as unknown;        counts.hero.ok++;        } else counts.hero.failed++;
      if (peerBenchmark)     { update.peerBenchmark    = peerBenchmark as unknown;    counts.peers.ok++;       } else counts.peers.failed++;
      if (supplementBlocks)  { update.supplementBlocks = supplementBlocks as unknown; counts.supplements.ok++; } else counts.supplements.failed++;
      if (Object.keys(update).length > 0) {
        await db
          .update(tenantLayersTable)
          .set(update)
          .where(and(eq(tenantLayersTable.tenantId, id), eq(tenantLayersTable.layerKey, row.layerKey)));
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  // Tenant-scope briefs stage: runs once per tenant after every layer panel
  // call has finished. Takes profile + all finalised layer contents and
  // emits the rich copy that drives MorningBrief + BoardPack. Skipped if
  // no layers have content yet.
  if (layerRows.length > 0) {
    const layerContents = layerRows.map((r) => ({
      layerKey: r.layerKey as LayerKey,
      content: r.content as NarrateOutput["content"],
    }));
    const briefOverrides = await generateBriefOverrides(profile, layerContents, log).catch((e) => {
      log.warn({ err: String(e) }, "briefs generation threw");
      return null;
    });
    if (briefOverrides) {
      await db
        .update(tenantProfileTable)
        .set({ briefOverrides: briefOverrides as unknown as Record<string, unknown> })
        .where(eq(tenantProfileTable.tenantId, id));
      counts.briefs.ok++;
    } else {
      counts.briefs.failed++;
    }
  }

  log.info(counts, "panels backfill complete");
  res.json({ ok: true, counts });
});

export default router;
