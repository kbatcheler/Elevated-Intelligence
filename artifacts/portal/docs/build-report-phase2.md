# Phase 2 Pipeline · Build Report

Status: shipped. Default `USE_PHASE2_PIPELINE=true`.

## What changed

Single-pass Claude generator replaced with a five-stage pipeline (Perceive · Hypothesise · Challenge · Narrate · Score) run per layer, with a Gemini 2.5 Pro confounder using Google Search grounding plus Anthropic Sonnet 4.6 with native `web_search_20250305` tool. Layer concurrency 3.

### Files

- `artifacts/api-server/src/lib/pipeline/gemini.ts` (new) · `callGemini`, `callGeminiJson` (model `gemini-2.5-pro`, optional `googleSearch` tool, JSON substring extract fallback).
- `artifacts/api-server/src/lib/pipeline/anthropic.ts` (rewritten) · `callClaudeJson` with optional `web_search_20250305` tool, returns `consultedUrls` + `searchCallCount`, 429 backoff (4 attempts), single retry on schema fail.
- `artifacts/api-server/src/lib/pipeline/phase2.ts` (new) · per-layer 5-stage runner, narrate fallback that derives content + claims from hypothesise output, score fallback formula.
- `artifacts/api-server/src/lib/pipeline/phase2-schemas.ts` (new) · stage-specific Zod schemas + `verifiedClaimSchema` / `modelledClaimSchema`.
- `artifacts/api-server/src/lib/pipeline/phase2-prompts.ts` (new) · per-stage system + user prompt builders, em-dash linter rule baked in.
- `artifacts/api-server/src/lib/pipeline/phase1.ts` (extracted from old runner) · legacy single-pass dispatcher kept for rollback.
- `artifacts/api-server/src/lib/pipeline/runner.ts` (rewritten) · dispatcher reads `USE_PHASE2_PIPELINE` (default true) and routes to phase1 / phase2.
- `artifacts/api-server/src/lib/pipeline/runner-helpers.ts` (new) · shared stage tracker helpers (RMW per-layer `layerStages[]`).
- `lib/db/src/schema/tenantPipelineRuns.ts` · `PipelineStage` gained optional `layerStages[]` + `pipelinePhase`, status enum extended with `"partial"`.

### Dev smoke endpoints

- `POST /api/dev/gemini-test` — Gemini grounding call, returns text + URL list.
- `POST /api/dev/claude-search-test` — Claude `web_search` call, returns `consultedUrls` + `searchCallCount`.

Both verified end-to-end.

## Run results

Three tenants re-seeded with Phase 2 (all `partial` status — see "Known issues" below):

| Tenant    | Layers ok / partial | Verified claims | Modelled claims | Avg layer confidence | Wall time |
|-----------|---------------------|-----------------|-----------------|----------------------|-----------|
| Stripe    | 13 / 1              | 85              | 87              | 70.7                 | ~49 min   |
| Patagonia | 12 / 2              | 62              | 75              | 56.9                 | ~47 min   |
| Twilio    | 12 / 2              | 67              | 85              | 73.4                 | ~46 min   |

All 14 layers per tenant have non-empty `modelled_claims`; 12-14 / 14 have non-empty `verified_claims`. Verifier 100% `gemini-2.5-pro` (Anthropic web search runs in Perceive, not the Challenge confounder, by design). All `tenant_artifacts` rows are 2.7-6.4 KB of real content, no stubs.

## Throughput

Each layer takes ~3 minutes (5 stages, 2 LLM calls per stage in the worst case, 429 backoff). At concurrency 3 the layers stage runs ~45 min; full pipeline (ground + profile + layers + artifacts + commit) is 46-49 min per tenant. Throughput is bounded by Anthropic rate limits, not pipeline structure — bumping `LAYER_CONCURRENCY` past 3 triggered immediate 429 cascades in earlier runs.

## Known issues

- **Partial layers**: each tenant has 1-2 layers whose `challenge` stage failed twice and fell back. Cause is Gemini occasionally emitting a verdict outside the enum or a string slightly over a cap; the existing single-retry covers most cases, but heavy-evidence layers (e.g. `business-performance`, `supply-chain`, `finance`) sometimes need a second retry. Counted as `partial`, not `failed` — the layer still ships with verified/modelled claims derived from hypothesise + narrate.
- **Patagonia min confidence = 0**: one layer landed with confidence 0 (score-stage fallback when narrate + hypothesise both lacked sufficient evidence to seed the formula). Mean stays usable but reportable; the score fallback floor should probably be raised from 0 to ~30 in a follow-up.
- **Anthropic web search not surfaced as verifier**: `verified_claims.verified_by` is always `gemini-2.5-pro` because verification happens in the Challenge stage. Anthropic-consulted URLs are tracked at the perceive stage (`searchCallCount`, `consultedUrls` in logs) but not promoted into the verified_claims tag set. Acceptable per the brief, which assigns Claude to Perceive and Gemini to Challenge.

## Post-review hardening (2026-05-26)

Architect review surfaced three severe resilience flaws, all fixed in-place:

- **Top-level fail-safe** (`runner.ts`, `phase2.ts`, `phase1.ts`): both phase orchestrators now wrap their body in a try/catch that calls `failRun(runId, tenantId, reason)` on any uncaught throw, and the dispatcher's fire-and-forget catch does the same as defense-in-depth. Previously, a thrown error left `tenant_pipeline_runs.status='running'` and `tenants.status='seeding'` indefinitely (hit twice in dev when the workflow restarted mid-run).
- **Per-run write serialization** (`runner-helpers.ts`): added `serializeRunWrite(runId, fn)` — a per-`runId` promise-chain mutex that all stages-jsonb RMW updates flow through (`updateStage`, `syncLayerEntry`). Previously, 3 concurrent layer workers × ~10 sub-stage transitions each were performing last-write-wins RMW on the same `stages` column, intermittently losing sub-stage progress.
- **Layer-failed semantics** (`phase2.ts`): `runLayerStages` now returns `"failed"` (not `"partial"`) when the hypothesise stage hard-fallbacks — that is the only path where the layer ships with zero real content. With this change, the existing `if (failedLayers.length === LAYER_KEYS.length)` check in the orchestrator is actually reachable, so a run where every layer degraded to a stub fails the tenant instead of marking it ready.

A follow-up review surfaced two more issues, both fixed:

- **Unhandled rejection in queue cleanup** (`runner-helpers.ts`): the detached cleanup chain on `serializeRunWrite` could emit unhandled rejection events if a queued write rejected. Switched cleanup to `next.then(c, c).catch(() => undefined)` so the cleanup chain is no-throw while still preserving map identity-guarded eviction.
- **Phase wrapper swallowed failRun errors** (`phase1.ts`, `phase2.ts`): if the local `failRun` itself threw (eg transient DB outage), the wrapper logged and returned, so the dispatcher's defense-in-depth catch never ran. Now the wrappers rethrow `failErr` so the dispatcher gets a second attempt.

And a final, third-line-of-defense item:

- **Boot-time stale-run reconciler** (`lib/pipeline/reconciler.ts` + `index.ts`): runs once on server boot, marks any `tenant_pipeline_runs.status='running'` rows as `failed` with an "orphaned across server restart" note, and demotes their tenants from `seeding` to `failed`. Catches the case where both in-process failRun attempts lost (process killed, full DB outage). Single-process invariant makes this safe to run unconditionally on startup.

Typecheck clean after each fix. Reconciler verified live: first boot found and reaped 4 orphaned rows from earlier sessions, second boot logged "no orphaned pipeline runs".

## Speed pass (2026-05-26)

Two cost/latency levers landed together:

- **Anthropic prompt caching** (`anthropic.ts`, `phase2-prompts.ts`, `phase2.ts`): each Claude stage's system prompt is now layer-agnostic — identical across all 14 layers within a tenant run. Layer name and layer focus moved into the user prompt. The system block is sent with `cache_control: { type: "ephemeral" }`, so the first call per stage primes the cache (creation cost) and the remaining 13 hit it (read cost = 10% of input price). Live verification on Stripe re-seed showed ~75K cached input tokens per call, with reads of up to 119K on warm layers.
- **Score on Haiku 4.5** (`anthropic.ts:SCORE_MODEL`): the Score stage is short, structured, and does not need full Sonnet reasoning. Stage durations dropped from ~90s to **8-13s per layer** (verified in `tenant_pipeline_runs.stages` JSON for the re-seed run), without any drop in output quality.

End-to-end wall time for the Stripe re-seed: **45:16** vs 46-49 minutes baseline. Smaller wall-time gain than the headline cache+Haiku math would predict because Anthropic 429 backoffs are now the binding constraint at concurrency 3 — nearly every hypothesise and narrate call ate 30-45s of `Retry-After` waits during this run. The cache+Haiku changes freed enough TPM headroom that we should now be able to raise concurrency from 3 to 4 or 5 without rate-limit cascades; that is the next obvious lever and would close most of the gap to the original projection. Output quality on the re-seed actually improved: **101 verified + 88 modelled claims** (vs 85+87 prior), **avg confidence 72.9** (vs 70.7 prior).

Architect review of the speed pass surfaced two issues, both fixed:

- **Honest Score caching**: `SCORE_SYSTEM_PROMPT` is ~280 tokens, well below Haiku's 2048-token cache minimum, so the `cache_control` marker was being silently dropped by Anthropic. Removed the marker on the Score call and updated the comment to make the assumption explicit. Score's wall-time win comes entirely from the model swap, not caching.
- **Score success in layer status**: `runLayerStages` previously computed layer status from `narrateOk && challengeOk` only, so a Haiku model drift or score schema regression could ship layers with locally-synthesized fallback confidence and zero signal at the layer level. Added `scoreOk` to the status check; failed Score now correctly marks the layer `partial`.

## Rollback

Set `USE_PHASE2_PIPELINE=false` to fall back to the Phase 1 single-pass generator. Both runners share the same on-disk schema, so no migration is needed.
