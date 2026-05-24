# Elevated Intelligence · Stage-Gate Build Report

**Artifact**: `artifacts/portal` (Different Day · Elevated Intelligence)
**Brief**: `attached_assets/ei-stage-gate-brief_1779651602689.md`
**Date**: 24 May 2026
**Status**: All 5 phases complete · typecheck clean

---

## Phase summary

### P1A · Pill reconciliation (3 mismatches)
Three layer pills were quoting numbers smaller than the sum of their actions. Pills now match.

| Layer | Pill before | Pill after | Source of truth |
|---|---|---|---|
| sales-pipeline | $3.6M | **$5.7M** predicted recovery | actions = 2.2 + 1.6 + 1.1 + 0.8 = 5.7 |
| receivables | $2.9M | **$7.1M** predicted recovery | actions = 3.6 + 1.5 + 1.2 + 0.8 = 7.1 |
| contract-management | $2.3M | **$3.7M** predicted recovery | actions = 1.3 + 1.0 + 0.8 + 0.6 = 3.7 |

Action impacts were re-scaled (not just the pill text) so the `pill = sum(actions[].impactUsd)` invariant holds. A Python audit over all 14 layers reports OK on every row.

Invariant held in `replit.md` updated to clarify pill = sum(actions[].impactUsd), NOT sum(causes[]).

### P1B · Em-dash sweep (48+ occurrences)
Removed every ` — ` (em-dash with spaces) from user-facing prose and data. Middot `·` is the canonical separator inside double-quoted strings. Final state:

```bash
$ rg -nF " — " artifacts/portal/src          # 0 matches
$ rg -n "\\\\u2014" artifacts/portal/src     # 0 matches
```

Files touched: `data/feeds.ts`, `data/layers.ts` (incl. 11 `\u2014` escapes in `analystTake`), `data/trackRecord.ts`, `data/companies.ts`, `data/pipelineDeep.ts`, `brief/IntelligenceBrief.tsx`, `brief/BoardPack.tsx`, `components/CompanyPicker.tsx`, `scenario/WarRoom.tsx`, `context/CompanyContext.tsx`, `context/AppContext.tsx`. User preference recorded in `replit.md`.

### P2A · Contract management hero
`ContractManagementHero` added inline in `components/heroes/index.tsx` and registered in `HEROES`. Matches structural pattern of the other §6 heroes (metric strip + lede + supporting visual).

### P2B · WhatIfLevers refactor + 4 new scenarios
- `WhatIfLevers.tsx` refactored to accept a single `scenario: Scenario` prop.
- `data/scenarios.ts` seeds 6 operational scenarios: pricing, demand, supply-chain, customer-intelligence, sales-pipeline, marketing-performance.
- `Layer.tsx` reads `scenarioForLayer(key)` and conditionally renders the §3 heading as **"Intervention tests"** (when a scenario exists) or **"Root causes"** (default).
- Sliders move; modelled impact updates in real time on all 6 operational layers.

### P3A · Presenter mode
- `components/PresenterStrip.tsx` and `data/presenterTracks.ts` (20 routes: 14 layers + 6 system pages).
- Header toggle button (`PRESENTER`); state persisted to `localStorage.ei.presenterMode`.
- Keyboard shortcut: `Shift+Cmd/Ctrl+P` to toggle.
- Strip mounts below `SignalTicker` and shows page-specific talk-track lines.

### P3B · Sales Playbook
- `components/SalesPlaybook.tsx`: 8-step timeline + 8 objection cards (preview banner).
- Wired into NAV at the top of the System group and routed in `App.tsx`.

### P4A · Promote Intelligence Architecture
- System group reorder: `sales-playbook` (1), `intelligence-architecture` (2), then engagement-pipeline and the rest.
- Morning brief: `ArchPromotionCard` (inline section in `MorningBrief.tsx`) shown only on first session. Dismiss writes `localStorage.ei.archPromoSeen=1`. "Open Intelligence Architecture" routes the user via `setActiveLayer("intelligence-architecture") + closeBrief()`.

### P4B · Confidence-gap dual signal
- Every layer header now shows **"Close N gaps → Y% confidence"** alongside the existing confidence bar, with a hover tooltip explaining the lift math.
- `dependency/DependencyGraph.tsx` gained a system-level summary card above the canvas.

### P5A · Mobile splash
- `components/MobileSplash.tsx` + `useShouldShowMobileSplash()` hook.
- Renders below 1024px viewport width with a deliberate "open this on a laptop" frame (Different Day branding, copy explaining why, recommended-device card).
- Override link writes `localStorage.ei.forceDesktop=1` and re-renders into the full portal.
- Wired as an early return inside `App.tsx`.

### P5B · Meta + final polish
- `index.html`: title updated to middot separator, description bumped from "thirteen" to "fourteen operating layers" with new five-stage reasoning chain language. Added `og:site_name`, `theme-color`. Favicon (existing SVG) verified.
- Analyst's-take prose audited; all em-dashes removed (incl. the `\u2014` escapes that bypassed the literal grep).
- All system page headers populated.

### P5C · Build report
This document, plus screenshots in `docs/screenshots/`.

---

## Acceptance checklist (12 items)

| # | Check | Result |
|---|---|---|
| 1 | All 14 layer pills reconcile to sum(actions[].impactUsd) | ✓ (P1A) |
| 2 | Zero ` — ` em-dashes in `artifacts/portal/src` | ✓ (`rg` returns nothing) |
| 3 | Contract management hero renders §6 panel | ✓ (P2A) |
| 4 | 6 operational layers expose WhatIfLevers; sliders update modelled impact | ✓ (P2B) |
| 5 | Presenter toggle in header; Shift+Cmd/Ctrl+P shortcut works | ✓ (P3A) |
| 6 | Sales playbook reachable from NAV; 8 steps + objections render | ✓ (P3B) |
| 7 | Intelligence architecture sits at position 2 in System group | ✓ (P4A) |
| 8 | First-session promotion card appears in morning brief; dismiss persists | ✓ (P4A) |
| 9 | Every layer header shows dual signal "Close N gaps → Y% confidence" | ✓ (P4B) |
| 10 | Cross-layer map (Dependency graph) has system-level summary card | ✓ (P4B) |
| 11 | Mobile (375px) shows splash; override writes localStorage and reveals portal; 1024px+ goes straight to portal | ✓ (P5A) |
| 12 | `pnpm --filter @workspace/portal run typecheck` clean | ✓ |

---

## Screenshots

- `screenshots/01-home.jpg`, `02-home-fixed.jpg`, `03-home-clean.jpg`: Business performance home before/after em-dash fix
- `screenshots/04-mobile-splash.jpg`: Mobile splash at 390px viewport

---

## Invariants preserved

- `data/layers.ts`: pill `actionsRecoveryUsd` = sum of `actions[].impactUsd` (NOT `causes[]`)
- `data/layers.ts`: `sources: FEEDS[layer.key].length` (DK-3)
- Non-default tenant profiles render `PreviewModeBanner` in `App.tsx`; hero/extras/track-record panels are NOT silently hidden
- No `console.log` in server code (portal is client-only; no server changes in this brief)

## Files added

- `artifacts/portal/src/data/scenarios.ts`
- `artifacts/portal/src/data/presenterTracks.ts`
- `artifacts/portal/src/components/PresenterStrip.tsx`
- `artifacts/portal/src/components/SalesPlaybook.tsx`
- `artifacts/portal/src/components/MobileSplash.tsx`
- `artifacts/portal/docs/build-report.md` (this file)
- `artifacts/portal/docs/screenshots/*.jpg`

## Files materially edited

- `artifacts/portal/src/data/layers.ts` (pills + analystTake prose)
- `artifacts/portal/src/data/feeds.ts`, `data/companies.ts`, `data/pipelineDeep.ts`, `data/trackRecord.ts` (em-dash sweep)
- `artifacts/portal/src/components/heroes/index.tsx` (ContractManagementHero)
- `artifacts/portal/src/components/Layer.tsx` (dual signal + Intervention-tests heading)
- `artifacts/portal/src/components/WhatIfLevers.tsx` (Scenario prop refactor)
- `artifacts/portal/src/components/DependencyGraph.tsx` (system summary card)
- `artifacts/portal/src/brief/MorningBrief.tsx` (ArchPromotionCard)
- `artifacts/portal/src/App.tsx` (NAV reorder, presenter wiring, mobile splash gate, sales-playbook route)
- `artifacts/portal/index.html` (meta + title)
