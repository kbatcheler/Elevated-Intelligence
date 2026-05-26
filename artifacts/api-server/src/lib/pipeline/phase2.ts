// Phase 2 pipeline: five stages per layer (Perceive, Hypothesise, Challenge,
// Narrate, Score). Top-level stages remain ground/profile/layers/artifacts/commit
// so the existing splash UI keeps working; per-layer per-stage progress lives
// in the layers stage's layerStages[] field.
//
// Failure model:
//   - ground/profile failure -> run fails
//   - any layer's stage failure -> degrade that layer (use the best available
//     intermediate output) and mark the layer partial
//   - all layers failing -> run fails
//   - artifacts failure -> run partial
//
// Concurrency: LAYER_CONCURRENCY=5 layers in flight at once; stages within a
// layer run sequentially.

import { eq } from "drizzle-orm";
import {
  db,
  tenantsTable,
  tenantProfileTable,
  tenantLayersTable,
  tenantArtifactsTable,
  tenantPipelineRunsTable,
  type LayerStageEntry,
  type PipelineStage,
  type PipelineStageStatus,
  type PipelineSubStage,
} from "@workspace/db";
import { logger as rootLogger } from "../logger";
import { fetchHomepageContext } from "../homepageContext";
import { callClaudeJson, PIPELINE_MODEL } from "./anthropic";
import { callGeminiJson, GEMINI_MODEL } from "./gemini";
import {
  LAYER_KEYS,
  ARTIFACT_KINDS,
  type LayerKey,
  type ArtifactKind,
  type LayerContent,
  type ProfileOutput,
  type ArtifactsOutput,
  artifactFallbackStubs,
  artifactsOutputSchema,
  layerFallbackStub,
  profileSchema,
} from "./schemas";
import {
  ARTIFACTS_SYSTEM_PROMPT,
  PROFILE_SYSTEM_PROMPT,
  buildArtifactsUserPrompt,
  buildProfileUserPrompt,
} from "./prompts";
import {
  buildChallengeSystemPrompt,
  buildChallengeUserPrompt,
  buildHypothesiseSystemPrompt,
  buildHypothesiseUserPrompt,
  buildNarrateSystemPrompt,
  buildNarrateUserPrompt,
  buildPerceiveSystemPrompt,
  buildPerceiveUserPrompt,
  buildScoreSystemPrompt,
  buildScoreUserPrompt,
} from "./phase2-prompts";
import {
  challengeOutputSchema,
  hypothesisedLayerSchema,
  modelledClaimSchema,
  narrateOutputSchema,
  perceiveOutputSchema,
  scoreOutputSchema,
  verifiedClaimSchema,
  type ChallengeOutput,
  type HypothesisedLayer,
  type ModelledClaim,
  type NarrateOutput,
  type PerceiveOutput,
  type VerifiedClaim,
} from "./phase2-schemas";
import { failRun, markComplete, markFailed, markRunning, serializeRunWrite, updateStage } from "./runner-helpers";

const STAGE_GROUND = "ground";
const STAGE_PROFILE = "profile";
const STAGE_LAYERS = "layers";
const STAGE_ARTIFACTS = "artifacts";
const STAGE_COMMIT = "commit";

// Reduced from 5 to 3 after the first smoke run hit Anthropic 429s with 5
// layers × 4-5 Claude calls each in flight. With Retry-After backoff in the
// wrapper, 3 is the sweet spot: stays under the rate limit while still
// keeping wall-clock under ~15 minutes for 14 layers.
const LAYER_CONCURRENCY = 3;

export function initialPhase2Stages(): PipelineStage[] {
  return [
    { name: STAGE_GROUND, status: "pending" },
    { name: STAGE_PROFILE, status: "pending" },
    {
      name: STAGE_LAYERS,
      status: "pending",
      progress: { current: 0, total: LAYER_KEYS.length },
      pipelinePhase: "phase2",
      layerStages: LAYER_KEYS.map<LayerStageEntry>((layerKey) => ({
        layerKey,
        status: "pending",
        subStages: (["perceive", "hypothesise", "challenge", "narrate", "score"] as const).map(
          (name): PipelineSubStage => ({ name, status: "pending" }),
        ),
      })),
    },
    { name: STAGE_ARTIFACTS, status: "pending" },
    { name: STAGE_COMMIT, status: "pending" },
  ];
}

// ─── Per-layer sub-stage tracker (in-memory; flushed to DB after each sub) ──

type LayerStageRuntime = {
  layerKey: LayerKey;
  startedAt: number;
  subs: Map<PipelineSubStage["name"], { startedAt: number; status: PipelineStageStatus; durationMs?: number; error?: string }>;
};

function newLayerRuntime(layerKey: LayerKey): LayerStageRuntime {
  return { layerKey, startedAt: Date.now(), subs: new Map() };
}

function buildLayerEntry(rt: LayerStageRuntime, status: PipelineStageStatus, error?: string): LayerStageEntry {
  const now = Date.now();
  return {
    layerKey: rt.layerKey,
    status,
    startedAt: new Date(rt.startedAt).toISOString(),
    completedAt: status === "running" || status === "pending" ? undefined : new Date(now).toISOString(),
    durationMs: status === "running" || status === "pending" ? undefined : now - rt.startedAt,
    subStages: (["perceive", "hypothesise", "challenge", "narrate", "score"] as const).map((name) => {
      const sub = rt.subs.get(name);
      return {
        name,
        status: sub?.status ?? "pending",
        durationMs: sub?.durationMs,
        error: sub?.error,
      };
    }),
    error,
  };
}

// Persist the layerStages slice for one specific layer back to the DB stage.
// Serialized via runner-helpers.serializeRunWrite — multiple layer workers
// call this concurrently and the stages-jsonb is updated via RMW.
async function syncLayerEntry(runId: string, entry: LayerStageEntry): Promise<void> {
  await serializeRunWrite(runId, async () => {
    const rows = await db
      .select({ stages: tenantPipelineRunsTable.stages })
      .from(tenantPipelineRunsTable)
      .where(eq(tenantPipelineRunsTable.id, runId))
      .limit(1);
    const stages = rows[0]?.stages ?? [];
    const next: PipelineStage[] = stages.map((s) => {
      if (s.name !== STAGE_LAYERS || !s.layerStages) return s;
      const updated = s.layerStages.map((ls) => (ls.layerKey === entry.layerKey ? entry : ls));
      return { ...s, layerStages: updated };
    });
    await db.update(tenantPipelineRunsTable).set({ stages: next }).where(eq(tenantPipelineRunsTable.id, runId));
  });
}

async function startSub(runId: string, rt: LayerStageRuntime, name: PipelineSubStage["name"]): Promise<void> {
  rt.subs.set(name, { startedAt: Date.now(), status: "running" });
  await syncLayerEntry(runId, buildLayerEntry(rt, "running"));
}

async function endSub(
  runId: string,
  rt: LayerStageRuntime,
  name: PipelineSubStage["name"],
  status: PipelineStageStatus,
  error?: string,
): Promise<void> {
  const sub = rt.subs.get(name);
  const startedAt = sub?.startedAt ?? Date.now();
  rt.subs.set(name, { startedAt, status, durationMs: Date.now() - startedAt, error: error?.slice(0, 400) });
  await syncLayerEntry(runId, buildLayerEntry(rt, "running"));
}

// ─── Per-layer 5-stage runner ─────────────────────────────────────────────

type LayerResult = {
  layerKey: LayerKey;
  content: LayerContent;
  verifiedClaims: VerifiedClaim[];
  modelledClaims: ModelledClaim[];
  status: PipelineStageStatus; // "complete" | "partial" | "failed"
  reason?: string;
};

// Strip evidence_type / source_urls annotations from a Hypothesise output to
// produce a layerContentSchema-shaped fallback if Stage 4 fails.
function stripHypothesisAnnotations(h: HypothesisedLayer): LayerContent {
  const strip = <T extends { evidence_type?: unknown; source_urls?: unknown }>(o: T): Omit<T, "evidence_type" | "source_urls"> => {
    const copy = { ...o } as Record<string, unknown>;
    delete copy.evidence_type;
    delete copy.source_urls;
    return copy as Omit<T, "evidence_type" | "source_urls">;
  };
  return {
    narrative: h.narrative,
    headline_finding: h.headline_finding,
    headline_impact: h.headline_impact,
    headline_lever: h.headline_lever,
    causes: h.causes.map((c) => strip({ ...c, confidence: c.confidence ?? 60 })),
    actions: h.actions.map((a) => strip({ ...a, timing: a.timing ?? "Next 30 days", owner: a.owner ?? "Operations lead" })),
    hypotheses: (h.hypotheses ?? []).map((hy) => strip({
      ...hy,
      supportingSignals: hy.supportingSignals ?? "",
      alternativeExplanation: hy.alternativeExplanation ?? "",
      confidence: hy.confidence ?? 50,
    })),
    proof: { items: (h.proof?.items ?? []).map((p) => strip(p)) },
    gaps: h.gaps ?? [],
    metrics: h.metrics.map((m) => strip({ ...m, sub: m.sub ?? "" })),
    confidence: h.confidence,
    confidence_gap: h.confidence_gap,
  } as unknown as LayerContent;
}

// Derive verified/modelled claim arrays from the Hypothesise output when Stage
// 4 fails. Every "grounded" claim with a source_url becomes verified; every
// "inferred" claim becomes modelled.
function partitionClaimsFromHypothesis(
  h: HypothesisedLayer,
  nowIso: string,
): { verified: VerifiedClaim[]; modelled: ModelledClaim[] } {
  const verified: VerifiedClaim[] = [];
  const modelled: ModelledClaim[] = [];
  const consider = (path: string, text: string, evidence_type: "grounded" | "inferred", source_urls: string[], confidence: number, basis: string) => {
    if (!text || text.length < 2) return;
    if (evidence_type === "grounded" && source_urls.length > 0) {
      verified.push({
        claim_text: text.slice(0, 1100),
        claim_path: path,
        source_urls: source_urls.slice(0, 8),
        source_titles: [],
        verified_by: "anthropic-web-search",
        verified_at: nowIso,
      });
    } else {
      modelled.push({
        claim_text: text.slice(0, 1100),
        claim_path: path,
        confidence: Math.max(10, Math.min(95, confidence)),
        basis: basis.slice(0, 380),
        inferred_from: [],
      });
    }
  };
  h.causes.forEach((c, i) =>
    consider(`causes[${i}].title`, c.title, c.evidence_type, c.source_urls ?? [], c.confidence ?? 60, "Root cause inferred from sector pattern and profile signals."),
  );
  h.actions.forEach((a, i) =>
    consider(`actions[${i}].title`, a.title, a.evidence_type, a.source_urls ?? [], 60, "Action prescribed from cause-and-lever mapping."),
  );
  h.metrics.forEach((m, i) =>
    consider(`metrics[${i}].value`, `${m.label}: ${m.value}`, m.evidence_type, m.source_urls ?? [], 55, "Metric estimate modelled from sector benchmark and revenue band."),
  );
  return { verified, modelled };
}

async function runLayerStages(
  runId: string,
  profile: ProfileOutput,
  layerKey: LayerKey,
  log: typeof rootLogger,
): Promise<LayerResult> {
  const layerLog = log.child({ layer: layerKey });
  const rt = newLayerRuntime(layerKey);
  const nowIso = new Date().toISOString();

  // Stage 1: Perceive
  await startSub(runId, rt, "perceive");
  const perceiveCall = await callClaudeJson({
    system: buildPerceiveSystemPrompt(layerKey),
    user: buildPerceiveUserPrompt(profile),
    schema: perceiveOutputSchema,
    useWebSearch: true,
    maxTokens: 8192,
    log: layerLog,
    context: `phase2/${layerKey}/perceive`,
  });
  let perceive: PerceiveOutput;
  if (perceiveCall.ok) {
    perceive = perceiveCall.value;
    await endSub(runId, rt, "perceive", "complete");
    layerLog.info({ signals: perceive.signals.length, searchCalls: perceiveCall.searchCallCount }, "perceive ok");
  } else {
    perceive = perceiveOutputSchema.parse({});
    await endSub(runId, rt, "perceive", "failed", perceiveCall.reason);
    layerLog.warn({ reason: perceiveCall.reason }, "perceive failed, continuing with empty signals");
  }

  // Stage 2: Hypothesise
  await startSub(runId, rt, "hypothesise");
  const hypothesiseCall = await callClaudeJson({
    system: buildHypothesiseSystemPrompt(layerKey),
    user: buildHypothesiseUserPrompt(profile, perceive),
    schema: hypothesisedLayerSchema,
    maxTokens: 8192,
    log: layerLog,
    context: `phase2/${layerKey}/hypothesise`,
  });
  if (!hypothesiseCall.ok) {
    await endSub(runId, rt, "hypothesise", "failed", hypothesiseCall.reason);
    // No usable draft -> fall back to phase 1 stub for this layer. Mark the
    // layer **failed** (not partial) so the orchestrator can detect "every
    // layer degraded to a stub" and fail the run rather than commit garbage.
    // Architect finding #3 (2026-05-26): runLayerStages must be able to return
    // "failed" for the all-layers-failed check to be reachable.
    const entry = buildLayerEntry(rt, "failed", `hypothesise failed: ${hypothesiseCall.reason}`);
    await syncLayerEntry(runId, entry);
    return {
      layerKey,
      content: layerFallbackStub(layerKey),
      verifiedClaims: [],
      modelledClaims: [
        { claim_text: layerFallbackStub(layerKey).narrative.slice(0, 800), claim_path: "narrative", confidence: 35, basis: "Pipeline stage 2 failure; fallback stub.", inferred_from: [] },
      ],
      status: "failed",
      reason: `hypothesise failed: ${hypothesiseCall.reason}`,
    };
  }
  const hypothesised = hypothesiseCall.value;
  await endSub(runId, rt, "hypothesise", "complete");

  // Stage 3: Challenge (Gemini grounded)
  await startSub(runId, rt, "challenge");
  const challengeCall = await callGeminiJson({
    systemPrompt: buildChallengeSystemPrompt(layerKey),
    userPrompt: buildChallengeUserPrompt(profile, hypothesised),
    schema: challengeOutputSchema,
    useGrounding: true,
    maxTokens: 8192,
    log: layerLog,
    context: `phase2/${layerKey}/challenge`,
  });
  let challenge: ChallengeOutput;
  let challengeOk = false;
  if (challengeCall.ok) {
    challenge = challengeCall.value;
    challengeOk = true;
    await endSub(runId, rt, "challenge", "complete");
    layerLog.info({ verdicts: challenge.claim_verdicts.length, alts: challenge.alternative_hypotheses.length, grounding: challengeCall.groundingChunks.length }, "challenge ok");
  } else {
    challenge = challengeOutputSchema.parse({});
    await endSub(runId, rt, "challenge", "failed", challengeCall.reason);
    layerLog.warn({ reason: challengeCall.reason }, "challenge failed, narrate will get empty challenge");
  }

  // Stage 4: Narrate
  await startSub(runId, rt, "narrate");
  const narrateCall = await callClaudeJson({
    system: buildNarrateSystemPrompt(layerKey),
    user: buildNarrateUserPrompt(profile, hypothesised, challenge, nowIso),
    schema: narrateOutputSchema,
    // Narrate emits a full layer content blob plus two claim arrays, which
    // routinely runs to ~25KB and gets truncated at 8192 tokens. Allow up to
    // 16384 (sonnet-4-6 max output budget headroom).
    maxTokens: 16_384,
    log: layerLog,
    context: `phase2/${layerKey}/narrate`,
  });
  let narrate: NarrateOutput;
  let narrateOk = false;
  if (narrateCall.ok) {
    narrate = narrateCall.value;
    narrateOk = true;
    await endSub(runId, rt, "narrate", "complete");
  } else {
    await endSub(runId, rt, "narrate", "failed", narrateCall.reason);
    layerLog.warn({ reason: narrateCall.reason }, "narrate failed, building fallback from hypothesise");
    const content = stripHypothesisAnnotations(hypothesised);
    const { verified, modelled } = partitionClaimsFromHypothesis(hypothesised, nowIso);
    narrate = { content, verified_claims: verified, modelled_claims: modelled };
  }

  // Stage 5: Score
  await startSub(runId, rt, "score");
  const scoreCall = await callClaudeJson({
    system: buildScoreSystemPrompt(layerKey),
    user: buildScoreUserPrompt(narrate),
    schema: scoreOutputSchema,
    maxTokens: 4096,
    log: layerLog,
    context: `phase2/${layerKey}/score`,
  });
  if (scoreCall.ok) {
    const s = scoreCall.value;
    // Patch confidence onto narrate.content.
    narrate.content.confidence = Math.min(95, s.confidence);
    narrate.content.confidence_gap = s.confidence_gap;
    // Merge score gaps into content.gaps (preserving any existing gaps).
    const existing = narrate.content.gaps ?? [];
    const merged = [...existing, ...s.gaps.map((g) => ({ kind: g.kind, description: g.description, closes: g.closes ?? "" }))].slice(0, 8);
    narrate.content.gaps = merged;
    await endSub(runId, rt, "score", "complete");
  } else {
    // Compute confidence locally as fallback.
    const vCount = narrate.verified_claims.length;
    const mCount = narrate.modelled_claims.length;
    const fallbackConfidence = Math.max(30, Math.min(90, 40 + vCount * 10 + Math.min(20, mCount * 3)));
    narrate.content.confidence = fallbackConfidence;
    narrate.content.confidence_gap = Math.min(40, 90 - fallbackConfidence);
    await endSub(runId, rt, "score", "failed", scoreCall.reason);
  }

  // Validate verified_claims and modelled_claims via their schemas defensively
  // (Narrate already validates, but the fallback path bypasses it).
  const verifiedFinal = narrate.verified_claims.map((c) => verifiedClaimSchema.parse(c));
  const modelledFinal = narrate.modelled_claims.map((c) => modelledClaimSchema.parse(c));

  const status: PipelineStageStatus =
    narrateOk && challengeOk ? "complete" : "partial";
  const finalEntry = buildLayerEntry(rt, status);
  await syncLayerEntry(runId, finalEntry);

  return {
    layerKey,
    content: narrate.content,
    verifiedClaims: verifiedFinal,
    modelledClaims: modelledFinal,
    status,
  };
}

// ─── Top-level Phase 2 orchestrator ────────────────────────────────────────

export async function runPhase2Pipeline(tenantId: string, runId: string): Promise<void> {
  const log = rootLogger.child({ tenantId, runId, phase: "phase2" });
  log.info("Phase 2 pipeline started");
  try {
    await runPhase2PipelineInner(tenantId, runId, log);
  } catch (e) {
    // Architect finding #1 (2026-05-26): any uncaught throw inside the
    // orchestrator must transition the run+tenant to failed instead of
    // leaving them stuck in running/seeding forever.
    const reason = e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e);
    log.error({ err: reason }, "Phase 2 pipeline threw — failing run");
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

async function runPhase2PipelineInner(
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
    context: "phase2/profile",
  });
  if (!profileCall.ok) {
    await markFailed(runId, STAGE_PROFILE, profileStart, profileCall.reason);
    await failRun(runId, tenantId, `Profile stage failed: ${profileCall.reason}`);
    return;
  }
  const profile: ProfileOutput = { ...profileCall.value, url: urlBare };
  await markComplete(runId, STAGE_PROFILE, profileStart);

  // ─── Stage 3: layers (5-stage per layer, concurrency 5) ──────────────────
  const layersStart = await markRunning(runId, STAGE_LAYERS);
  const layerResults: LayerResult[] = [];
  let completedCount = 0;
  for (let i = 0; i < LAYER_KEYS.length; i += LAYER_CONCURRENCY) {
    const batch = LAYER_KEYS.slice(i, i + LAYER_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (layerKey) => {
        const result = await runLayerStages(runId, profile, layerKey, log);
        completedCount += 1;
        updateStage(runId, STAGE_LAYERS, {
          progress: { current: completedCount, total: LAYER_KEYS.length },
        }).catch(() => undefined);
        return result;
      }),
    );
    layerResults.push(...batchResults);
  }
  const failedLayers = layerResults.filter((r) => r.status === "failed");
  const partialLayers = layerResults.filter((r) => r.status === "partial");
  if (failedLayers.length === LAYER_KEYS.length) {
    await markFailed(runId, STAGE_LAYERS, layersStart, "All layers failed");
    await failRun(runId, tenantId, "Layers stage failed: every layer failed");
    return;
  }
  await markComplete(runId, STAGE_LAYERS, layersStart, {
    progress: { current: LAYER_KEYS.length, total: LAYER_KEYS.length },
    ...(partialLayers.length > 0 || failedLayers.length > 0
      ? { error: `${partialLayers.length} partial, ${failedLayers.length} failed: ${[...partialLayers, ...failedLayers].map((r) => r.layerKey).join(", ")}` }
      : {}),
  });

  // ─── Stage 4: artifacts (Phase 1 single-shot, retained) ──────────────────
  const artifactsStart = await markRunning(runId, STAGE_ARTIFACTS);
  const artifactsCall = await callClaudeJson({
    system: ARTIFACTS_SYSTEM_PROMPT,
    user: buildArtifactsUserPrompt(profile),
    schema: artifactsOutputSchema,
    maxTokens: 8192,
    log,
    context: "phase2/artifacts",
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
      await tx.insert(tenantLayersTable).values(
        layerResults.map((r) => ({
          tenantId,
          layerKey: r.layerKey,
          content: r.content as unknown as Record<string, unknown>,
          verifiedClaims: r.verifiedClaims as unknown[],
          modelledClaims: r.modelledClaims as unknown[],
          generatorModel: `${PIPELINE_MODEL}+${GEMINI_MODEL}`,
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

  const finalStatus = partialLayers.length > 0 || failedLayers.length > 0 || artifactsPartial ? "partial" : "complete";
  await db
    .update(tenantPipelineRunsTable)
    .set({ status: finalStatus, completedAt: new Date() })
    .where(eq(tenantPipelineRunsTable.id, runId));
  log.info(
    {
      status: finalStatus,
      partialLayers: partialLayers.length,
      failedLayers: failedLayers.length,
      artifactsPartial,
      verifiedTotal: layerResults.reduce((acc, r) => acc + r.verifiedClaims.length, 0),
      modelledTotal: layerResults.reduce((acc, r) => acc + r.modelledClaims.length, 0),
    },
    "Phase 2 pipeline complete",
  );
}
