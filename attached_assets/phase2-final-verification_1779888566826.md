# Phase 2 final verification brief

Scope: ship two one-line schema relaxations, re-seed all three test tenants at concurrency 4, verify against the Phase 2 acceptance bar. Report back with results. No new features. Kim approves before publish.

Two sub-phases. Run end to end. Stop only on a hard blocker or three failed whack-a-mole cycles in a row.

## Context

The c=4 + cache + Haiku + concurrency speed pass is locked. Production runs at 33 min wall time with 30% reduction over baseline. Two known schema flakes remain on the Gemini Challenge stage that produce one partial layer per tenant. Fixing both is one-line each, same flavor as the recency 40 to 80 fix that already shipped.

We want all three tenants landing clean (zero partials, claim totals 180 to 190, confidence around 73) before Phase 3 UI work begins. Going into UI work with partial data baked in creates ambiguity about whether display issues are data issues.

## Sub-phase F1: Ship the two schema relaxations

In `lib/pipeline/phase2-schemas.ts` (or wherever the Gemini response Zod schema lives, name may differ):

1. Make `claim_verdicts[].suggested_revision` nullable. Current shape is `z.string()`. Change to `z.string().nullable()` or `z.string().optional()`, whichever matches the existing convention in the file.

2. Bump `factual_corrections[].correct_entity` from 200 chars to 400 chars. Current is likely `z.string().max(200)`. Change to `z.string().max(400)`.

These are independent of each other. Both fail the Challenge stage when triggered, and the retry-once path is poisoned by Gemini's tight rate limits, so they reliably produce partials.

After applying:

- `pnpm --filter @workspace/api-server run typecheck` passes clean
- `pnpm --filter @workspace/portal run typecheck` passes clean
- No other schema files touched. Don't optimize anything else in this pass.

Acceptance for F1:
1. Both schema relaxations land in one commit.
2. Typecheck clean across packages.
3. No other code changes.

## Sub-phase F2: Re-seed and verify

Re-seed all three tenants **sequentially**, not in parallel. Parallel doubles rate-limit pressure against both Anthropic and Gemini, which is exactly the failure surface we are trying to verify clean.

Sequence:

1. Delete the existing Stripe tenant. Seed Stripe from scratch with the live URL. Wait for completion.
2. Capture: wall time, verified count per layer, modelled count per layer, total verified, total modelled, average confidence across layers, list of any partial layers with stage and reason.
3. Repeat for Patagonia.
4. Repeat for Twilio.

For each tenant, the gate is:

- Status `ready` (not `partial`)
- Zero partial layers in the pipeline run record
- Verified claims total per tenant in the 75 to 100 range (previous baseline: 79, 85, 66)
- Modelled claims total per tenant in the 80 to 100 range (previous baseline: 90, 84, 90)
- Combined total per tenant in the 180 to 190 range
- Average confidence per tenant in the 70 to 78 range

If a tenant fails any gate criterion, do not proceed to the next tenant. Investigate the cause:

- If a new Gemini schema flake surfaced, apply the same one-line relaxation pattern, re-seed that tenant, continue.
- If an Anthropic-side issue surfaced (not seen at c=4 previously), capture the log evidence and stop. This is escalation territory.
- Maximum three whack-a-mole cycles before stopping and reporting back. Three different schema flakes in one verification pass means there is a systemic issue with the schemas, not isolated tightness.

## Acceptance for Phase 2 final

All three of the following hit:

1. All three tenants in status `ready`, zero partials, claim totals 180 to 190, confidence around 73.
2. Build report updated at `artifacts/portal/docs/build-report-phase2.md` with the final per-tenant numbers, the schema fixes applied, and a clear "Phase 2 locked" statement.
3. Typecheck clean and `pnpm run build` passes.

If all three hit, report back: "Phase 2 verification complete, ready for publish, waiting on Kim's confirmation."

If any fails after three whack-a-mole cycles, report back: "Phase 2 verification stalled after N cycles, last unresolved issue is X, recommend Y."

## Report format expected

A single report at the end of the run, structured as:

```
## Phase 2 final verification

### Stripe
- Wall: HH:MM
- Verified / Modelled / Total: X / Y / Z
- Confidence: NN.N
- Partials: 0 (or list)

### Patagonia
[same]

### Twilio  
[same]

### Schema fixes shipped
- suggested_revision: nullable
- correct_entity: 200 -> 400

### Verdict
[Phase 2 locked / stalled with specific issue]

### Outstanding
[anything Kim needs to decide before publish]
```

## Out of scope

Do not:

- Touch the concurrency setting (locked at c=4)
- Optimize prompts beyond what is needed to clear the gate
- Add new schema fields
- Change pipeline stages
- Touch any UI code (that is Phase 3)
- Re-tune the model selection (Sonnet for Perceive/Hypothesise/Narrate, Haiku for Score is locked)
- Run tenants in parallel
- Try concurrency 5
- Improve Twilio's lower verified count beyond what the schema fixes recover (sector-specific tuning is a future concern, not a Phase 2 blocker)

## Decisions pre-resolved (do not re-ask)

- c=4 is the production setting. Final.
- Sequential re-seeds only.
- Three whack-a-mole cycles maximum before escalation.
- Build report is the publish artifact. Kim confirms publish based on that report.

Hit the gate. Report back. Wait for Kim.
