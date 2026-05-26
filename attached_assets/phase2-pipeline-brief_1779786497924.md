# Phase 2: Five-stage pipeline with Gemini confounder

Scope: replace the single-pass Phase 1 Claude pipeline with a rigorous five-stage architecture that fact-checks itself. Add Gemini 2.5 Pro as the confounder. Add Anthropic web search to Claude calls. Populate the `verified_claims` track with URL-backed evidence and the `modelled_claims` track with confidence-banded hypotheses for everything else.

This is Phase 2 of four. Phase 3 surfaces the verified vs modelled split in the UI. Phase 4 adds operational tooling.

Five sub-phases below. Each has acceptance criteria. Run end to end. Typecheck must pass between sub-phases. If a sub-phase fails its acceptance, fix it before moving to the next.

## Architectural decisions, pre-resolved (do not re-ask)

- Primary generator: Claude Sonnet 4.6 (`claude-sonnet-4-6`), unchanged from Phase 1.
- Confounder: Gemini 2.5 Pro via Google's GenAI API. Hardcoded model string `gemini-2.5-pro`.
- Web search for Claude calls: Anthropic's built-in web search tool (`{type: "web_search_20250305", name: "web_search"}`).
- Web search for Gemini calls: Google's built-in grounding (`tools: [{google_search: {}}]`).
- Two API keys via env: `ANTHROPIC_API_KEY` (already exists) and `GEMINI_API_KEY` (new). Both in Replit secrets, never in source.
- Per-layer pipeline: Perceive → Hypothesise → Challenge → Narrate → Score, run sequentially within a layer.
- Cross-layer pipeline: layers run with concurrency cap of 5 (avoid rate limits while keeping wall-clock under 20 min).
- Existing Phase 1 tenants stay as they are. Refresh action re-runs them through the Phase 2 pipeline.
- Failure handling: if any stage in a layer fails after one retry, mark that layer's `tenant_pipeline_runs.stages[layer].status = 'partial'`, keep whatever output the previous stage produced, continue to next layer. Pipeline only fully fails if Profile stage fails.
- No new database tables. `verified_claims` and `modelled_claims` columns already exist on `tenant_layers` from Phase 1.

## Sub-phase 2.1: Gemini client wrapper

Add a small typed wrapper for Gemini API calls.

### Files

`artifacts/api-server/src/lib/gemini.ts` (new):

```typescript
import { GoogleGenAI } from "@google/genai";

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function callGemini(opts: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  useGrounding?: boolean;  // when true, enables google_search tool
  responseFormat?: "text" | "json";
}): Promise<{
  text: string;
  groundingChunks?: Array<{ uri: string; title: string }>;
  durationMs: number;
  inputTokens: number;
  outputTokens: number;
}> {
  // Standard call pattern matching the existing callAnthropic wrapper in
  // intelligence.ts. Capture grounding URLs from response.candidates[0].groundingMetadata.
}
```

### Test

Add a thin test endpoint `GET /api/dev/gemini-test` (only mounted when `NODE_ENV !== 'production'`) that calls Gemini with a fixed prompt and returns the result. Use this to verify the wrapper works before the pipeline depends on it.

### Acceptance for 2.1

1. `GEMINI_API_KEY` is set in Replit secrets.
2. `pnpm --filter @workspace/api-server run typecheck` passes with the new wrapper.
3. `GET /api/dev/gemini-test` returns a non-empty text response with at least one grounding chunk.
4. The wrapper handles transient errors (rate limit, network) with one automatic retry before throwing.

## Sub-phase 2.2: Add web search to Claude calls

Update the existing `callAnthropic` wrapper in `artifacts/api-server/src/routes/intelligence.ts` (or wherever it lives now after Phase 1 refactor) to accept a `useWebSearch` option. When true, include the web search tool in the `tools` array of the Claude API call.

When the tool is invoked, Claude's response includes `tool_use` blocks that the wrapper must walk to extract any URLs Claude consulted. Return them in a new `consultedUrls: string[]` field on the wrapper's return.

### Acceptance for 2.2

1. `callAnthropic({ useWebSearch: true, ... })` returns `consultedUrls` populated when Claude actually searched.
2. Existing call sites that don't set `useWebSearch` still work unchanged.
3. The wrapper logs the number of search calls and the URLs consulted to the pipeline run record.

## Sub-phase 2.3: Five-stage pipeline refactor

Replace the Phase 1 single-pass generator with the five-stage pipeline. The new pipeline file is `lib/pipeline/phase2.ts`. Keep `lib/pipeline/phase1.ts` available for one release cycle as a fallback (a feature flag `USE_PHASE2_PIPELINE=true` controls which runs; default to phase 2).

### The five stages, per layer

**Stage 1: Perceive** (Claude with web search)

Input: tenant profile (from Phase 1 profile stage, runs once before layers), layer schema (key, name, expected sections).

System prompt sketch:
```
You are gathering ground-truth signals for the {layer.name} layer of {profile.name}.
Search the web for recent (last 12 months) information relevant to this layer.
Look for: named competitors, pricing changes, product launches, regulatory actions,
financial disclosures, leadership changes, supply chain events, customer wins/losses,
sector benchmark data.

Output a structured JSON object:
{
  signals: [
    { observation: string, source_url: string, source_title: string, recency: "Q3 2025" | "Q4 2025" | etc },
    ...
  ],
  named_entities: { competitors: string[], suppliers: string[], regions: string[], products: string[] },
  sector_context: { benchmark_metrics: {...}, recent_industry_events: [...] }
}

Cite every observation with a source URL. If no public source exists for a topic,
omit it from signals. The Challenge stage will catch hallucinated sources.
```

Expected duration: 30-45 seconds. May search 3-8 URLs.

**Stage 2: Hypothesise** (Claude, no web search)

Input: signals from Stage 1, profile, layer schema.

System prompt sketch:
```
Given these grounded signals, generate the layer's diagnostic content.
Produce ranked hypotheses for what is happening in this layer for this company.
For each hypothesis, cite which signal(s) support it. Mark each claim as either:
- "grounded": directly supported by a signal from Stage 1 (cite source_url)
- "inferred": derived from sector knowledge or signal interpretation (no source)

Output the layer content as a draft, matching the existing Layer schema:
{
  narrative, headline_finding, headline_impact, headline_lever,
  causes: [{title, impact, detail, confidence, evidence_type: "grounded"|"inferred", source_urls?: string[]}],
  actions: [{title, detail, impact, timing, owner, evidence_type, source_urls?}],
  hypotheses: [{statement, supportingSignals, alternativeExplanation, confidence, evidence_type, source_urls?}],
  proof: { items: [{ source, observation, evidence_type, source_urls? }] },
  gaps: [{ kind, description, closes }],
  metrics: [{label, value, sub, tone, evidence_type, source_urls?}]
}
```

Expected duration: 30-60 seconds.

**Stage 3: Challenge** (Gemini with grounding)

Input: hypothesised output from Stage 2, profile, layer schema.

System prompt sketch:
```
You are an adversarial fact-checker reviewing a diagnostic report about {profile.name}'s
{layer.name} layer. Your job is to find errors, hallucinations, and weak claims.

For each "grounded" claim with a source_url, verify the URL exists and the claim is
supported by what's at that URL. For each "inferred" claim, search the web for
counter-evidence or alternative explanations.

Output:
{
  claim_verdicts: [
    {
      original_claim: string,
      claim_path: string,  // e.g. "causes[0].title" so Narrate can route the verdict back
      verdict: "verified" | "unsupported" | "contradicted",
      verified_sources?: string[],  // for verified claims, list the URLs that support
      contradicting_evidence?: { url: string, summary: string }[],  // for contradicted
      suggested_revision?: string,  // optional rewrite suggestion
    }
  ],
  alternative_hypotheses: string[],  // sector-aware alternative diagnoses Gemini surfaces
  factual_corrections: { incorrect_entity: string, correct_entity: string }[]
}
```

Expected duration: 45-75 seconds (Gemini grounding is slower than Anthropic web search).

**Stage 4: Narrate** (Claude, no web search)

Input: hypothesised output (Stage 2) + claim_verdicts (Stage 3).

System prompt sketch:
```
You are finalising the layer content based on the Challenge stage's verdicts.
For each claim in the Hypothesise output:
- verdict="verified": keep the claim; move to verified_claims with sources
- verdict="unsupported": demote to modelled_claims; reduce confidence; add hedge phrasing
  ("based on sector signals", "we estimate that", etc.)
- verdict="contradicted": apply suggested_revision if present; otherwise remove claim and
  replace with a different angle from Gemini's alternative_hypotheses
- factual_corrections: apply globally to all entity references in the output

Also synthesise any of Gemini's alternative_hypotheses that add value into the narrative.

Final output schema matches Phase 1 layer schema, but with claims partitioned:
{
  narrative: string,  // operator-ready prose, integrating verified and modelled claims naturally
  headline_finding, headline_impact, headline_lever,
  causes, actions, hypotheses, proof, gaps, metrics  // unchanged structure
}

Separately produce:
{
  verified_claims: [{ claim_text, source_urls: [...], evidence_type: "grounded", verified_by: "gemini-2.5-pro" }],
  modelled_claims: [{ claim_text, confidence: 0-100, basis: "sector benchmark" | "public signal interpretation" | "industry pattern" }]
}
```

Expected duration: 30-45 seconds.

**Stage 5: Score** (Claude, no web search)

Input: narrated output (Stage 4) including verified_claims and modelled_claims.

System prompt sketch:
```
Compute the layer's confidence score and gap pipeline.

confidence = base + verified_boost - modelled_penalty
where:
  base = 50
  verified_boost = min(40, verified_claims.length * 5)
  modelled_penalty = max(0, (modelled_claims.length - 3) * 2)

Cap confidence at 95 (never claim mechanical certainty).

Then produce gaps: for each modelled claim with confidence < 60, suggest a gap
(DATA/SIGNAL/INTEG/MODEL/FLOW) that would lift it. For each unverified causal claim,
suggest a gap that would let us verify.

Output:
{
  confidence: number,
  confidence_gap: number,  // pp lift available if all gaps closed
  gaps: [{ kind, description, closes_claims: string[], confidence_lift_pp: number }]
}
```

Expected duration: 15-25 seconds.

### Orchestration

Per-tenant pipeline:
1. Ground (unchanged from Phase 1) - 5s
2. Profile (Claude, no change) - 30s
3. Layers (14 in parallel, concurrency cap 5):
   - Each layer runs all 5 stages sequentially
   - Per-layer total: 2.5-4 minutes
   - With concurrency 5, wall-clock for 14 layers: ~7-10 minutes
4. Artifacts (Claude, no change) - 45s
5. Commit - 1s

Total target: 12-15 minutes per tenant. Allow 20 min before declaring timeout.

### Failure handling

Per stage, per layer:
- One automatic retry on transient errors (network, rate limit).
- On second failure, mark the stage as failed in `tenant_pipeline_runs.stages`, but use whatever output the previous stage produced as the layer's final content.
- A layer that fails at Stage 1 (Perceive) skips Stages 2-5 and writes a minimal placeholder layer with confidence=30 and a single gap noting "Generation failed, refresh required."
- The tenant pipeline only fully fails if Ground or Profile stages fail.

### Acceptance for 2.3

1. Pipeline runs end to end on a test tenant (use Stripe as the first test).
2. Pipeline duration is 12-20 minutes.
3. All 14 layers produce content. At least 12 of 14 complete all 5 stages successfully.
4. `tenant_pipeline_runs.stages` shows per-stage durations for every layer.
5. Typecheck passes.

## Sub-phase 2.4: Verified-vs-modelled separation

Wire Stage 4's split output into the database.

### Schema check

`tenant_layers` already has `verified_claims jsonb` and `modelled_claims jsonb` from Phase 1. No new columns.

### Storage shape

`verified_claims` is an array of:
```typescript
{
  claim_text: string,         // the actual statement
  claim_path: string,         // where in the layer it appears, e.g. "causes[0].title"
  source_urls: string[],      // 1-N supporting URLs
  source_titles?: string[],   // optional page titles for nicer rendering later
  verified_by: "gemini-2.5-pro" | "anthropic-web-search",
  verified_at: string         // ISO timestamp
}
```

`modelled_claims` is an array of:
```typescript
{
  claim_text: string,
  claim_path: string,
  confidence: number,          // 0-100, capped from Stage 5
  basis: string,               // e.g., "sector benchmark", "industry pattern"
  inferred_from?: string[]     // optional list of Perceive-stage observation strings
}
```

### Population rules

- Every claim that ends up in the final narrative MUST be tracked in either `verified_claims` or `modelled_claims`. No untracked claims.
- A claim's `claim_path` must be valid: a UI consumer in Phase 3 will use it to attach the source pill or confidence band to the right element on the rendered page.
- For Phase 1 tenants that haven't been refreshed, `verified_claims = []` and `modelled_claims` is backfilled (already done per Phase 1 turn). Phase 2 pipeline overwrites both when a tenant is refreshed.

### Quality bar

For a successful Phase 2 seed, each layer should produce:
- At least 2 verified_claims (claims with actual source URLs)
- At least 4 modelled_claims (confidence-banded hypotheses)
- At most 1 claim per layer can be "unsupported" without a source AND without confidence framing. The agent should self-check this on every layer and reject layers that don't meet the bar (treat as a Stage 4 retry).

### Acceptance for 2.4

1. After running the Phase 2 pipeline on Stripe, every layer has populated `verified_claims` (length >= 1) and `modelled_claims` (length >= 3).
2. Spot-check 3 random verified_claims. Each `source_urls[0]` returns a valid HTTP 200 when fetched. The claim_text is plausibly supported by what's on that page.
3. Spot-check 3 random modelled_claims. Each has a `confidence` between 30 and 85 (never claims certainty, never claims unusable). Each has a `basis` string that names the inference source.
4. No layer has more than 5 total claims marked as unsupported (no source, no confidence).

## Sub-phase 2.5: Test, document, hand off

### Re-seed three tenants

Delete and re-seed via the Phase 2 pipeline:
- Stripe (fintech, fast-moving public info)
- Patagonia (consumer goods, sustainability claims often well-documented)
- Twilio (B2B SaaS, dense competitor landscape)

Measure for each:
- Pipeline duration end to end
- Number of verified_claims per layer (avg, min, max across 14 layers)
- Number of modelled_claims per layer (avg, min, max)
- Number of distinct source URLs cited
- Sample 3 layers per tenant for manual quality review

### Sample quality review

For each tenant, manually open 3 layer pages (Business Performance, Pricing, Competitive Intelligence) and confirm:
- Named competitors are real and current
- Recent events referenced are actually recent (last 12 months) and verifiable
- Dollar magnitudes are plausible for the company's revenue band
- No layer contains content that reads like vocab-swapped Meridian
- Confidence scores are believable (not all 95%, not all 50%)

Document any layers where Phase 2 produced WEAKER content than Phase 1 (this would be a regression and needs prompt tuning).

### Build report

Write `artifacts/portal/docs/build-report-phase2.md` documenting:
- Pipeline timing per tenant per stage
- Claims-per-layer statistics
- Sample of 3 verified_claims with their source URLs (one per tenant)
- Sample of 3 modelled_claims with their confidence and basis
- Any prompt tunings made during testing
- Any layers where regression occurred
- Hand-off notes for Phase 3 (UI surfacing)

### Acceptance for 2.5

1. Three tenants re-seeded successfully via Phase 2 pipeline.
2. Per-tenant verified_claims total >= 30 across all layers.
3. Per-tenant modelled_claims total >= 60 across all layers.
4. Per-tenant unique source URLs cited >= 20.
5. Build report committed.
6. `pnpm run build` succeeds.

## Final acceptance for Phase 2

Run this manual flow and confirm each step:

1. Sign in. Library shows the 3 Phase 1 tenants from previous turn.
2. Refresh Stripe. Boot splash opens. Pipeline shows five stages per layer (Perceive, Hypothesise, Challenge, Narrate, Score), 14 layers in progress.
3. Watch the splash for ~15 minutes. Timer counts up. Stages complete in sequence per layer.
4. Splash auto-dismisses around 12-18 minute mark. Stripe lands on Morning Brief.
5. Click Pricing and Margin layer. Open browser devtools, inspect the layer data from `GET /api/tenants/:id`.
6. Confirm `tenant_layers` row for "pricing-margin" has `verified_claims` populated with real URLs (e.g., stripe.com/pricing, a recent press release, a competitor article).
7. Confirm `modelled_claims` has confidence-banded entries with non-empty `basis` strings.
8. Seed a fresh tenant ("Slack", "https://slack.com"). Watch the full pipeline run. Confirm it completes in 12-20 minutes.
9. Open Slack's Sales Pipeline layer. Verify it references actual Slack competitors (Microsoft Teams, Zoom) not generic placeholders.
10. Open the pipeline run record in DB (`SELECT stages FROM tenant_pipeline_runs WHERE tenant_id = ...`). Confirm every stage has a `duration_ms` and `status='complete'`.

If every step passes, Phase 2 is complete. Move to Phase 3.

## Out of scope (do not attempt in Phase 2)

- UI changes to surface verified vs modelled (that's Phase 3).
- Source URL pills on claims in the rendered layer pages.
- Confidence band visualisations beyond what already exists.
- Provenance tooltips.
- Per-claim "challenge this" buttons.
- Real-time pipeline progress via WebSockets (polling is fine).
- Cost dashboard or token accounting (Phase 4).
- Refresh scheduling.
- Multi-user access controls beyond the existing single admin login.

## Decisions pre-resolved (do not re-ask)

- Gemini model is `gemini-2.5-pro`. Do not substitute Flash or Ultra without flagging.
- Anthropic web search and Gemini grounding both stay enabled in production. Cost is acceptable per prior decision.
- Existing Phase 1 tenant content remains until manually refreshed. No auto-migration.
- The five-stage architecture mirrors the Cortex Architecture story the product tells clients. This is deliberate and the stage names should not be renamed.
- Confidence is capped at 95% globally. The system never claims mechanical certainty.
- The `claim_path` convention (e.g., "causes[0].title") is the contract between Phase 2 and Phase 3. Don't change the path format.

Hit the acceptance bar. Send the build report and any layer-level regressions you spot. Then ping for Phase 3.
