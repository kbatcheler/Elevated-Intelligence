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

## Speed pass #2 (2026-05-27): concurrency 3 -> 4

Lever #3 from the speed-pass plan. `LAYER_CONCURRENCY` in `phase2.ts` raised from 3 to 4 now that cache+Haiku had freed enough Anthropic TPM headroom that 429 backoffs were the binding wall-time constraint at 3.

Live verification on Stripe re-seed (runId `b0bade61-c1b8-4125-97f5-5ff3b90ca63d`):

- **Wall time: 33:54** vs **45:16** at concurrency 3 = **11:22 faster (25% reduction)**. Lines up with the original speed-pass projection.
- **Cache reads compound across waves**: 2K cold on the first call, 41-44K by the end of the first wave, 81-94K by the third wave. Caching is doing exactly what it's supposed to do.
- **Per-layer durations actually improved** vs c=3 (business-performance 375s vs 389s, finance 429s vs 472s) because warmer caches reduce per-call input-processing latency.
- **429 backoffs went from 4 -> 36 cumulative**. Every wave start fires N hypothesise calls simultaneously, and the first one to lose the rate-limit dice eats one ~50-60s backoff cascade (5+10+15+20s, then a retry-once with another 5s); the others slip through and the wave naturally desyncs after that. The existing retry+backoff logic absorbs the cascades cleanly. Net wall-time impact per wave is roughly one 60s burst, amortised over 4 layers running in parallel.
- **Quality**: confidence 73.9 (+1.0 vs prior 72.9). Claim totals dipped to 79 verified + 90 modelled = 169 (vs 101 + 88 = 189), but the entire deficit is concentrated in a single layer that went `partial`. See next bullet.
- **One layer went partial** (supply-chain) via `Anthropic 429 -> retry-once -> schema validation failed (signals[N].recency > 40 chars)`. Pre-existing schema flake: `recency` is descriptive text like "Q4 2024 annual letter" and 40 chars is a tight cap; c=3 dodged it by happening to spend less time in the retry path. Bumped `recency` cap from 40 to 80 in `phase2-schemas.ts` to stop dropping otherwise-good perceive responses on a length nit. Still well under `source_title` (400) and `observation` (800), so does not invite essays. No other code change needed for the partial-layer mechanism itself: the architect-driven `scoreOk` addition from the prior pass and the existing perceive empty-signals fallback both did exactly what they were designed to do here.

If concurrency 4 holds clean across Patagonia and Twilio re-seeds, the next lever (5) is a one-line change. The comment block above `LAYER_CONCURRENCY` documents the history and the bump-to-5 condition.

### c=4 validation across Patagonia + Twilio (2026-05-27)

Sequential re-seeds at the new settings to test whether c=4 was a one-tenant fluke or holds across the fleet. User gate for trying c=5 was "both clean, totals back to ~189 claims, zero partials, zero new schema surprises". Result: **both runs landed `partial`, gate failed, c=5 is off the table.** Settling on c=4 as the final value.

| Tenant     | Wall time | Status   | Verified + modelled | Avg conf | Partial layer            | Failure mode                                                                                          |
|------------|-----------|----------|---------------------|----------|--------------------------|-------------------------------------------------------------------------------------------------------|
| Stripe     | 33:54     | partial  | 79 + 90 = 169       | 73.9     | supply-chain             | Anthropic 429 -> retry -> perceive `signals[N].recency > 40` (fixed: cap 40 -> 80)                    |
| Patagonia  | 32:26     | partial  | 85 + 84 = 169       | 71.9     | contract-management      | Gemini schema: `factual_corrections[0].correct_entity > 200` -> retry -> Gemini 429 RATELIMIT         |
| Twilio     | 34:25     | partial  | 66 + 90 = 156       | 73.6     | competitive-intelligence | Gemini schema: `claim_verdicts[N].suggested_revision = null` (expected string) -> retry -> Gemini 429 |

Wall-time is now very consistent across tenants at c=4 (32-34 min), down from the 46-49 min c=3 baseline. Cache reads compounded the same way across all three runs.

**Pattern in the three partials.** Different root-cause schema flake each time, all in the Challenge stage, all on the Gemini side, all compounded by a Gemini-side 429 on the single retry making them unrecoverable. The retry+backoff machinery itself is fine; the Anthropic-side 429s during c=4 waves were absorbed cleanly (66 backoffs across two tenants, zero new Anthropic-side partials). The remaining failure surface is Gemini schema strictness combined with Gemini's much tighter rate limits on retry.

Two low-effort schema relaxations would likely close the remaining failure surface without changing semantics, in the same spirit as the c=3 recency 40 -> 80 fix:

- `claim_verdicts[].suggested_revision`: make nullable (Gemini emits `null` when verdict is `verified` and no revision is needed; current schema rejects that as "expected string").
- `factual_corrections[].correct_entity`: bump cap from 200 to ~400, matching `source_title`. 200 chars is tight for fully-qualified entity names that include parenthetical context.

Not shipping these in this pass — scope was the concurrency validation, and the c=4 settings are now durable enough to ship as-is. Captured here as the next cheap reliability lever if the partial rate continues to bother us in production.

**Decision: keep `LAYER_CONCURRENCY = 4`.** Speed-pass plan is complete. Net wall-time delta from the original ~47 min baseline is **~33 min, a 30% reduction**, with confidence holding steady (~73 vs ~70 baseline) and the partial rate unchanged at 1 layer per tenant.

## Rollback

Set `USE_PHASE2_PIPELINE=false` to fall back to the Phase 1 single-pass generator. Both runners share the same on-disk schema, so no migration is needed.
