// Phase 1 pipeline runner. Single-pass Claude generator with 5 stages:
// ground → profile → layers (14 in parallel) → artifacts → commit.
//
// Stage state is persisted to tenant_pipeline_runs.stages so the boot
// splash can poll progress. Stage failures on `ground` or `profile` fail
// the whole run; failures on individual layers or artifacts degrade to
// `partial` with fallback stubs so the UI still renders.

import { eq } from "drizzle-orm";
import {
  db,
  tenantsTable,
  tenantProfileTable,
  tenantLayersTable,
  tenantArtifactsTable,
  tenantPipelineRunsTable,
  type PipelineStage,
} from "@workspace/db";
import { logger as rootLogger } from "../logger";
import { fetchHomepageContext } from "../homepageContext";
import { callClaudeJson, PIPELINE_MODEL } from "./anthropic";
import {
  LAYER_KEYS,
  ARTIFACT_KINDS,
  type LayerKey,
  type ArtifactKind,
  artifactFallbackStubs,
  artifactsOutputSchema,
  layerContentSchema,
  layerFallbackStub,
  profileSchema,
  type LayerContent,
  type ProfileOutput,
  type ArtifactsOutput,
} from "./schemas";
import {
  ARTIFACTS_SYSTEM_PROMPT,
  PROFILE_SYSTEM_PROMPT,
  buildArtifactsUserPrompt,
  buildLayerSystemPrompt,
  buildLayerUserPrompt,
  buildProfileUserPrompt,
} from "./prompts";

const STAGE_GROUND = "ground";
const STAGE_PROFILE = "profile";
const STAGE_LAYERS = "layers";
const STAGE_ARTIFACTS = "artifacts";
const STAGE_COMMIT = "commit";

function initialStages(): PipelineStage[] {
  return [
    { name: STAGE_GROUND, status: "pending" },
    { name: STAGE_PROFILE, status: "pending" },
    { name: STAGE_LAYERS, status: "pending", progress: { current: 0, total: LAYER_KEYS.length } },
    { name: STAGE_ARTIFACTS, status: "pending" },
    { name: STAGE_COMMIT, status: "pending" },
  ];
}

// Read-modify-write helper for the stages jsonb. Single pipeline per tenant
// at a time so no concurrent-update protection is needed in Phase 1.
async function updateStage(
  runId: string,
  name: string,
  patch: Partial<PipelineStage>,
): Promise<void> {
  const rows = await db
    .select({ stages: tenantPipelineRunsTable.stages })
    .from(tenantPipelineRunsTable)
    .where(eq(tenantPipelineRunsTable.id, runId))
    .limit(1);
  const current = rows[0]?.stages ?? [];
  const next: PipelineStage[] = current.map((s) =>
    s.name === name ? { ...s, ...patch } : s,
  );
  await db
    .update(tenantPipelineRunsTable)
    .set({ stages: next })
    .where(eq(tenantPipelineRunsTable.id, runId));
}

async function markRunning(runId: string, name: string): Promise<number> {
  const startedAt = Date.now();
  await updateStage(runId, name, { status: "running", startedAt: new Date(startedAt).toISOString() });
  return startedAt;
}

async function markComplete(runId: string, name: string, startedAt: number, extra?: Partial<PipelineStage>): Promise<void> {
  const now = Date.now();
  await updateStage(runId, name, {
    status: "complete",
    completedAt: new Date(now).toISOString(),
    durationMs: now - startedAt,
    ...extra,
  });
}

async function markFailed(runId: string, name: string, startedAt: number, reason: string): Promise<void> {
  const now = Date.now();
  await updateStage(runId, name, {
    status: "failed",
    completedAt: new Date(now).toISOString(),
    durationMs: now - startedAt,
    error: reason.slice(0, 800),
  });
}

async function failRun(runId: string, tenantId: string, errorText: string): Promise<void> {
  const now = new Date();
  await db
    .update(tenantPipelineRunsTable)
    .set({ status: "failed", completedAt: now, errorText: errorText.slice(0, 2000) })
    .where(eq(tenantPipelineRunsTable.id, runId));
  await db
    .update(tenantsTable)
    .set({ status: "failed" })
    .where(eq(tenantsTable.id, tenantId));
}

/**
 * Start the Phase 1 pipeline for a tenant. Returns the runId immediately;
 * actual work runs asynchronously. Caller is expected to have already
 * created the tenant row with status='seeding'.
 */
export async function startPipeline(tenantId: string): Promise<string> {
  const [run] = await db
    .insert(tenantPipelineRunsTable)
    .values({
      tenantId,
      status: "running",
      stages: initialStages(),
    })
    .returning({ id: tenantPipelineRunsTable.id });

  // Fire-and-forget. Errors are caught inside runPipeline so an unhandled
  // rejection here would only happen on a bug, but we still attach a
  // last-ditch logger.
  void runPipeline(tenantId, run.id).catch((e) => {
    rootLogger.error({ err: String(e), tenantId, runId: run.id }, "Pipeline crashed");
  });

  return run.id;
}

async function runPipeline(tenantId: string, runId: string): Promise<void> {
  const log = rootLogger.child({ tenantId, runId });
  log.info("Pipeline started");

  // Look up the tenant row to drive the prompts.
  const tenantRows = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.id, tenantId))
    .limit(1);
  const tenant = tenantRows[0];
  if (!tenant) {
    await failRun(runId, tenantId, "Tenant row missing at pipeline start");
    return;
  }

  // ─── Stage 1: ground ─────────────────────────────────────────────────────
  const groundStart = await markRunning(runId, STAGE_GROUND);
  const ground = await fetchHomepageContext(tenant.url);
  if (!ground.ok && !ground.snippet) {
    // The brief says ground failures fully fail the pipeline. However, the
    // fetcher returns ok=false for non-200 responses too — we still try the
    // pipeline if we got any HTML snippet. Pure no-snippet failure = abort.
    await markFailed(runId, STAGE_GROUND, groundStart, ground.errorReason ?? "homepage fetch produced no content");
    await failRun(runId, tenantId, `Ground stage failed: ${ground.errorReason ?? "no content"}`);
    return;
  }
  await markComplete(runId, STAGE_GROUND, groundStart, {
    progress: { current: ground.bytesExtracted, total: ground.bytesFetched || ground.bytesExtracted },
  });

  // ─── Stage 2: profile ────────────────────────────────────────────────────
  const profileStart = await markRunning(runId, STAGE_PROFILE);
  const urlBare = tenant.url
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./i, "")
    .toLowerCase();
  const profileCall = await callClaudeJson({
    system: PROFILE_SYSTEM_PROMPT,
    user: buildProfileUserPrompt({ name: tenant.name, urlBare, rawUrl: tenant.url, ground }),
    schema: profileSchema,
    maxTokens: 4096,
    log,
    context: "profile",
  });
  if (!profileCall.ok) {
    await markFailed(runId, STAGE_PROFILE, profileStart, profileCall.reason);
    await failRun(runId, tenantId, `Profile stage failed: ${profileCall.reason}`);
    return;
  }
  const profile: ProfileOutput = { ...profileCall.value, url: urlBare };
  await markComplete(runId, STAGE_PROFILE, profileStart);

  // ─── Stage 3: layers (batched parallel) ──────────────────────────────────
  // 14 layers in flight at once hammered the Anthropic proxy hard enough to
  // trigger HTTP 429 rate limits. Batching to LAYER_CONCURRENCY at a time
  // keeps total throughput high while staying inside the per-minute envelope.
  const layersStart = await markRunning(runId, STAGE_LAYERS);
  const LAYER_CONCURRENCY = 3;
  let completedCount = 0;
  const layerResults: Array<{ layerKey: LayerKey; content: LayerContent; ok: boolean; reason?: string }> = [];
  for (let i = 0; i < LAYER_KEYS.length; i += LAYER_CONCURRENCY) {
    const batch = LAYER_KEYS.slice(i, i + LAYER_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (layerKey) => {
        const call = await callClaudeJson({
          system: buildLayerSystemPrompt(layerKey),
          user: buildLayerUserPrompt(profile),
          schema: layerContentSchema,
          // 8192 tokens. A full layer doc with all sections runs ~5K output
          // tokens; 4K was being exhausted mid-string and breaking JSON.
          maxTokens: 8192,
          log,
          context: `layer:${layerKey}`,
        });
        completedCount += 1;
        updateStage(runId, STAGE_LAYERS, {
          progress: { current: completedCount, total: LAYER_KEYS.length },
        }).catch(() => undefined);
        if (call.ok) return { layerKey, content: call.value, ok: true };
        return { layerKey, content: layerFallbackStub(layerKey), ok: false, reason: call.reason };
      }),
    );
    layerResults.push(...batchResults);
  }
  const layerFailures = layerResults.filter((r) => !r.ok);
  if (layerFailures.length === LAYER_KEYS.length) {
    // Every single layer failed — treat as a profile-level failure.
    await markFailed(runId, STAGE_LAYERS, layersStart, `All ${LAYER_KEYS.length} layers failed validation`);
    await failRun(runId, tenantId, `Layers stage failed: every layer failed validation`);
    return;
  }
  await markComplete(runId, STAGE_LAYERS, layersStart, {
    progress: { current: LAYER_KEYS.length, total: LAYER_KEYS.length },
    ...(layerFailures.length > 0
      ? { error: `${layerFailures.length}/${LAYER_KEYS.length} layers used fallback: ${layerFailures.map((f) => f.layerKey).join(", ")}` }
      : {}),
  });

  // ─── Stage 4: artifacts ──────────────────────────────────────────────────
  const artifactsStart = await markRunning(runId, STAGE_ARTIFACTS);
  const artifactsCall = await callClaudeJson({
    system: ARTIFACTS_SYSTEM_PROMPT,
    user: buildArtifactsUserPrompt(profile),
    schema: artifactsOutputSchema,
    maxTokens: 8192,
    log,
    context: "artifacts",
  });
  let artifacts: ArtifactsOutput;
  let artifactsPartial = false;
  if (artifactsCall.ok) {
    artifacts = artifactsCall.value;
    await markComplete(runId, STAGE_ARTIFACTS, artifactsStart);
  } else {
    artifacts = artifactFallbackStubs();
    artifactsPartial = true;
    await markFailed(runId, STAGE_ARTIFACTS, artifactsStart, artifactsCall.reason);
    // Keep going to commit so the tenant still ends in a renderable state.
  }

  // ─── Stage 5: commit ─────────────────────────────────────────────────────
  const commitStart = await markRunning(runId, STAGE_COMMIT);
  try {
    await db.transaction(async (tx) => {
      // Profile (upsert).
      await tx
        .insert(tenantProfileTable)
        .values({ tenantId, profile: profile as unknown as Record<string, unknown>, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: tenantProfileTable.tenantId,
          set: { profile: profile as unknown as Record<string, unknown>, updatedAt: new Date() },
        });

      // Layers (delete-then-insert for idempotent refresh).
      await tx.delete(tenantLayersTable).where(eq(tenantLayersTable.tenantId, tenantId));
      const commitTime = new Date().toISOString();
      await tx.insert(tenantLayersTable).values(
        layerResults.map((r) => ({
          tenantId,
          layerKey: r.layerKey,
          content: r.content as unknown as Record<string, unknown>,
          // Phase 1: single-pass Claude output is treated as one modelled claim per layer.
          // verified_claims stays empty until Phase 2 verification track ships.
          modelledClaims: [
            {
              kind: "layer_content",
              source: PIPELINE_MODEL,
              generatedAt: commitTime,
              payload: r.content,
            },
          ] as unknown[],
          verifiedClaims: [] as unknown[],
          generatorModel: PIPELINE_MODEL,
        })),
      );

      // Artifacts (delete-then-insert).
      await tx.delete(tenantArtifactsTable).where(eq(tenantArtifactsTable.tenantId, tenantId));
      const artifactRows: { tenantId: string; kind: ArtifactKind; content: Record<string, unknown> }[] = ARTIFACT_KINDS.map((kind) => {
        const content = artifacts[kind] as unknown as Record<string, unknown>;
        return { tenantId, kind, content };
      });
      await tx.insert(tenantArtifactsTable).values(artifactRows);

      // Tenant status + timestamps.
      const now = new Date();
      const staleAfter = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      await tx
        .update(tenantsTable)
        .set({ status: "ready", lastSeededAt: now, staleAfter, updatedAt: now })
        .where(eq(tenantsTable.id, tenantId));
    });
    await markComplete(runId, STAGE_COMMIT, commitStart);
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    await markFailed(runId, STAGE_COMMIT, commitStart, reason);
    await failRun(runId, tenantId, `Commit stage failed: ${reason}`);
    return;
  }

  // Final run status: partial if any layer used fallback or artifacts failed,
  // otherwise complete.
  const finalStatus = layerFailures.length > 0 || artifactsPartial ? "partial" : "complete";
  await db
    .update(tenantPipelineRunsTable)
    .set({ status: finalStatus, completedAt: new Date() })
    .where(eq(tenantPipelineRunsTable.id, runId));
  log.info({ status: finalStatus, layerFailures: layerFailures.length, artifactsPartial }, "Pipeline complete");
}
