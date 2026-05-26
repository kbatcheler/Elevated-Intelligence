// Phase 1 single-pass Claude pipeline. Kept for one release cycle as a
// fallback behind the USE_PHASE2_PIPELINE feature flag. New work goes in
// phase2.ts.
//
// Stages: ground → profile → layers (14, batched concurrency 3) → artifacts → commit.
// Stage failures on `ground` or `profile` fail the run; failures on individual
// layers or artifacts degrade to `partial` with fallback stubs.

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
import { failRun, markComplete, markFailed, markRunning, updateStage } from "./runner-helpers";

const STAGE_GROUND = "ground";
const STAGE_PROFILE = "profile";
const STAGE_LAYERS = "layers";
const STAGE_ARTIFACTS = "artifacts";
const STAGE_COMMIT = "commit";

export function initialPhase1Stages(): PipelineStage[] {
  return [
    { name: STAGE_GROUND, status: "pending" },
    { name: STAGE_PROFILE, status: "pending" },
    { name: STAGE_LAYERS, status: "pending", progress: { current: 0, total: LAYER_KEYS.length }, pipelinePhase: "phase1" },
    { name: STAGE_ARTIFACTS, status: "pending" },
    { name: STAGE_COMMIT, status: "pending" },
  ];
}

export async function runPhase1Pipeline(tenantId: string, runId: string): Promise<void> {
  const log = rootLogger.child({ tenantId, runId, phase: "phase1" });
  log.info("Phase 1 pipeline started");
  try {
    await runPhase1PipelineInner(tenantId, runId, log);
  } catch (e) {
    // Architect finding #1 (2026-05-26): any uncaught throw must transition
    // the run+tenant to failed instead of leaving them stuck in running.
    const reason = e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e);
    log.error({ err: reason }, "Phase 1 pipeline threw — failing run");
    try {
      await failRun(runId, tenantId, `Pipeline threw: ${reason}`);
    } catch (failErr) {
      // Local failRun lost (eg transient DB outage). Rethrow so the
      // dispatcher's defense-in-depth catch gets a second attempt.
      log.error({ err: failErr instanceof Error ? failErr.message : String(failErr) }, "failRun itself threw; rethrowing for dispatcher");
      throw failErr;
    }
  }
}

async function runPhase1PipelineInner(
  tenantId: string,
  runId: string,
  log: typeof rootLogger,
): Promise<void> {
  const tenantRows = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId)).limit(1);
  const tenant = tenantRows[0];
  if (!tenant) {
    await failRun(runId, tenantId, "Tenant row missing at pipeline start");
    return;
  }

  // ─── Stage 1: ground ─────────────────────────────────────────────────────
  const groundStart = await markRunning(runId, STAGE_GROUND);
  const ground = await fetchHomepageContext(tenant.url);
  if (!ground.ok && !ground.snippet) {
    await markFailed(runId, STAGE_GROUND, groundStart, ground.errorReason ?? "homepage fetch produced no content");
    await failRun(runId, tenantId, `Ground stage failed: ${ground.errorReason ?? "no content"}`);
    return;
  }
  await markComplete(runId, STAGE_GROUND, groundStart, {
    progress: { current: ground.bytesExtracted, total: ground.bytesFetched || ground.bytesExtracted },
  });

  // ─── Stage 2: profile ────────────────────────────────────────────────────
  const profileStart = await markRunning(runId, STAGE_PROFILE);
  const urlBare = tenant.url.replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/^www\./i, "").toLowerCase();
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

  // ─── Stage 3: layers ─────────────────────────────────────────────────────
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
  }

  // ─── Stage 5: commit ─────────────────────────────────────────────────────
  const commitStart = await markRunning(runId, STAGE_COMMIT);
  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(tenantProfileTable)
        .values({ tenantId, profile: profile as unknown as Record<string, unknown>, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: tenantProfileTable.tenantId,
          set: { profile: profile as unknown as Record<string, unknown>, updatedAt: new Date() },
        });

      await tx.delete(tenantLayersTable).where(eq(tenantLayersTable.tenantId, tenantId));
      const commitTime = new Date().toISOString();
      await tx.insert(tenantLayersTable).values(
        layerResults.map((r) => ({
          tenantId,
          layerKey: r.layerKey,
          content: r.content as unknown as Record<string, unknown>,
          // Phase 1: whole content blob wrapped as one modelled claim.
          modelledClaims: [
            { kind: "layer_content", source: PIPELINE_MODEL, generatedAt: commitTime, payload: r.content },
          ] as unknown[],
          verifiedClaims: [] as unknown[],
          generatorModel: PIPELINE_MODEL,
        })),
      );

      await tx.delete(tenantArtifactsTable).where(eq(tenantArtifactsTable.tenantId, tenantId));
      const artifactRows: { tenantId: string; kind: ArtifactKind; content: Record<string, unknown> }[] = ARTIFACT_KINDS.map((kind) => {
        const content = artifacts[kind] as unknown as Record<string, unknown>;
        return { tenantId, kind, content };
      });
      await tx.insert(tenantArtifactsTable).values(artifactRows);

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

  const finalStatus = layerFailures.length > 0 || artifactsPartial ? "partial" : "complete";
  await db
    .update(tenantPipelineRunsTable)
    .set({ status: finalStatus, completedAt: new Date() })
    .where(eq(tenantPipelineRunsTable.id, runId));
  log.info({ status: finalStatus, layerFailures: layerFailures.length, artifactsPartial }, "Phase 1 pipeline complete");
}
