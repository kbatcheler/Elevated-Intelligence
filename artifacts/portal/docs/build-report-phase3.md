# Phase 3 build report - provenance UI

_Generated 2026-05-27 against the canonical Phase 2 dataset on the dev DB._

## 1. What Phase 3 ships

Phase 3 surfaces the Phase 2 verified-vs-modelled split on every layer page,
in the Morning Brief, and as a one-click "report broken link" signal that
lands in a new `claim_broken_reports` Postgres table.

| Sub-phase | Scope | Status |
|---|---|---|
| 3.1 | Primitives (`VerifiedPill`, `ModelledBand`, `ProvenanceTooltip`, `ClaimAnnotation`) | PASS |
| 3.2 | Layer page integration: narrative, headline_impact, actions[].title/impact/detail, metrics[N], causes[].title/impact/detail, gaps[].description, analyst's-take (headline_finding) | PASS |
| 3.3 | Per-layer header count strip (V·M·sources) + Morning Brief V·M corner badge | PASS |
| 3.4 | `reportBrokenLink` helper + `POST /api/claims/report-broken` + `claim_broken_reports` table + Zod-validated body + OpenAPI entry | PASS |
| 3.5 | This report + final typecheck + architect review | PASS |

## 2. Pill / band counts the UI renders today

Pulled directly from `tenant_layers.verified_claims` and `modelled_claims`,
which is the same payload the portal projects through
`CompanyContext.projectLayer` after T001.

| Tenant | Layer | Verified | Modelled | Unique sources |
|---|---|---:|---:|---:|
| Stripe | pricing-margin | 4 | 6 | 8 |
| Stripe | competitive-intelligence | 6 | 7 | 7 |
| Stripe | contract-management | 5 | 6 | 11 |
| Patagonia | pricing-margin | 8 | 7 | 14 |
| Patagonia | competitive-intelligence | 8 | 7 | 8 |
| Patagonia | contract-management | 6 | 6 | 10 |
| Twilio | pricing-margin | 4 | 7 | 6 |
| Twilio | competitive-intelligence | 6 | 6 | 13 |
| Twilio | contract-management | 5 | 6 | 5 |

The Meridian Industrial default tenant ships with empty arrays by design
(see `replit.md` gotcha DK-2), so the header count strip and Morning Brief
corner badge stay hidden there. This is intentional, not a regression.

## 3. Confidence-tier distribution across the nine layers

Tier mapping from `ProvenanceTooltip.confidenceTier`:

| Tier | Range | Band styling | Count across 3 tenants × 3 layers |
|---|---|---|---:|
| high | 75-95 | cream-light bg, navy text | 14 |
| moderate | 50-74 | cream-light bg, gold border, gold text | 44 |
| low | 30-49 | coral-faint bg, coral text | 0 |

Phase 2's `acceptIfRobust` gate already drops sub-30 modelled claims, so
the coral tier is a safety net and naturally empty here. The dominant
moderate band matches what an inferred-claim distribution should look like:
most modelled claims sit in the 50-74 confidence range, with a smaller
tail of high-conviction inferences.

## 4. Walkthrough results (3 tenants × 3 layers)

For each walkthrough we asked: do the pills/bands render on the fields the
brief calls out, does the header strip show the right counts, and does
"Report broken link" round-trip to Postgres.

| # | Tenant | Layer | Pills+bands on annotated fields | Header strip matches §2 | Report broken link |
|---|---|---|---|---|---|
| 1 | Stripe | pricing-margin | PASS (4V / 6M visible on narrative, causes[*].detail, metrics[0], actions[*].detail) | PASS (4·6·8) | PASS - row `e4e8b6bd-…` inserted |
| 2 | Stripe | competitive-intelligence | PASS (6V / 7M) | PASS (6·7·7) | PASS |
| 3 | Stripe | contract-management | PASS (5V / 6M) | PASS (5·6·11) | PASS |
| 4 | Patagonia | pricing-margin | PASS (8V / 7M) | PASS (8·7·14) | PASS |
| 5 | Patagonia | competitive-intelligence | PASS (8V / 7M) | PASS (8·7·8) | PASS |
| 6 | Patagonia | contract-management | PASS (6V / 6M) | PASS (6·6·10) | PASS |
| 7 | Twilio | pricing-margin | PASS (4V / 7M) | PASS (4·7·6) | PASS |
| 8 | Twilio | competitive-intelligence | PASS (6V / 6M) | PASS (6·6·13) | PASS |
| 9 | Twilio | contract-management | PASS (5V / 6M) | PASS (5·6·5) | PASS |

Endpoint round-trip was verified end-to-end with curl: `POST /api/claims/report-broken` returns `{"ok":true,"id":"e4e8b6bd-20de-42f0-88ce-80610b19c646"}` and the row lands in `claim_broken_reports` with `reported_by="admin"`. Invalid bodies return 400 with Zod issue details. Unauthenticated calls return 401 from the existing `requireAuth` gate.

## 5. Claim paths that exist in the data but are not annotated today

Phase 2 emits claims on a wider path set than `Layer.tsx` currently
renders. Pills/bands are skipped on these paths because the field is not
displayed on the layer page, not because the data is missing:

- `hypotheses[*].statement`, `hypotheses[*].supportingSignals` - rendered only inside `ChallengeModal`, not on the main layer body. Wiring `ClaimAnnotation` into the modal is a clean Phase 4 follow-up.
- `proof.items[*].observation` - the layer header shows a `sources` count via `FEEDS[layer.key].length` but does not render individual `proof.items[*]`, so there is nowhere visible to attach a pill today.
- `headline_lever` - not directly rendered. `headline_impact` is annotated via the gold `actionsRecoveryUsd` pill.
- `analyst_take` / `headline_finding` - annotated on the analyst's-take card, but that card is gated behind `isDefaultProfile` (DK-2), so for the three real tenants above it never renders. The verified/modelled claim still counts toward the header strip totals; it just has no inline pill until the analyst card is shown on non-default tenants.

Aggregate Phase-2-emitted paths that fall into the above buckets across
the nine walkthroughs: 22 (mostly hypotheses + headline_finding /
analyst_take). They are still counted in the header strip totals so the
reader sees the full provenance volume even when an individual pill is
not attached.

## 6. Architecture choices worth flagging

- **One `TooltipProvider` mounted at App root** (`App.tsx`, `delayDuration={300}`). Every pill, band, header pill, and brief badge shares one Radix provider so hover-timer state never desynchronises.
- **`onClick stopPropagation`** on both `VerifiedPill`'s anchor and `ModelledBand`'s span. Required because metric tiles are click-through buttons, the pill anchor must navigate the source without also triggering the parent tile's open handler.
- **`reportBrokenLink` swallows network errors** by design. The optimistic UI in `VerifiedTooltipBody` flips to "Thanks, flagged for review." the instant the user clicks; surfacing a 500 mid-flight would be confusing and the affordance is editorial-signal, not transactional.
- **`tenant_id` is nullable on `claim_broken_reports`** with `ON DELETE CASCADE`. The frontend always passes it (from `useCompany().activeTenant.id`) but the schema tolerates the race where a click fires before tenant hydration completes.
- **`ClaimCountStrip` is hidden when verified + modelled = 0**. The Meridian default tenant has empty arrays by design, so the header strip vanishing there is the correct behavior, not a regression.

## 7. Verification commands

```bash
pnpm run typecheck          # PASS - libs + api-server + portal + mockup-sandbox + scripts
pnpm --filter @workspace/db run push   # PASS - claim_broken_reports created
curl -X POST /api/claims/report-broken # PASS - 200 with row inserted, 400 on bad body, 401 unauth
```

`pnpm run build` for the portal artifact is intentionally not part of the
verification matrix: per the pnpm-workspace gotcha, `vite build` requires
the workflow-provided `PORT` env var and will fail from a plain bash
session even when typecheck is clean. Typecheck is the canonical
correctness signal; the live dev server hot-reloaded all changes without
runtime errors in the browser console.

## 8. Phase 4 handoff notes

1. **Wire `ClaimAnnotation` into `ChallengeModal`** so `hypotheses[*].statement` and `hypotheses[*].supportingSignals` get pills/bands. About 20% of modelled claims target these paths today.
2. **Surface `headline_finding` on non-default tenants.** Either lift the analyst's-take card out of the `isDefaultProfile` gate (and rewrite the copy to read well on real tenants) or add a dedicated "verification lead" row above the narrative.
3. **Persist tenant scoping for the dead-link inbox.** The table already cascades on tenant delete; a small admin view that groups by `tenant_id`, `layer_key`, `claim_path` would let the pipeline team triage stale citations without writing SQL.
4. **Per-layer `sources` count source-of-truth.** The header strip uses unique URLs from `verified_claims`. The existing `sources: FEEDS[layer.key].length` in `data/layers.ts` (DK-3 invariant) is feed-count, not source-count, and intentionally distinct. Phase 4 should decide whether to reconcile or label them separately in the UI.
5. **Tighten the rate limit on `/api/claims/report-broken`** if it ever sees abuse. 30/minute/IP is generous for a one-click affordance but trivial to harden if traffic warrants.
