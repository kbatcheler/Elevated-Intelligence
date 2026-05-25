# Different Day Portal · Build Report

Generated: 2026-05-25

This report verifies the 5-phase, 12-item stage-gate build brief against the shipped state of `artifacts/portal`. Every functional task in the brief was already implemented in the codebase by prior sessions; the work in this session was the cross-layer map rebuild (React Flow), a runtime-error overlay fix, the verification pass, and this report.

## Acceptance matrix (12 items)

| # | Phase | Task | Status | Evidence |
|---|---|---|---|---|
| 1 | P1A | Pill mismatches in `layers.ts` | Done | `data/layers.ts` line 520 `$5.7M`, line 769 `$7.1M`, line 897 `$3.7M` |
| 2 | P1B | Em-dash sweep | Done | `rg ' — ' src/` returns zero hits in user-facing prose. Source-code comments are exempt per `replit.md`. |
| 3 | P2A | ContractManagementHero | Done | Defined in `components/heroes/index.tsx` and registered in the `HEROES` map keyed `contract-management`. |
| 4 | P2B | WhatIfLevers refactor + 4 layer seeds | Done | `WhatIfLevers` accepts `{ scenario: Scenario }`; `data/scenarios.ts` exports `Lever`, `Scenario`, `scenarioForLayer`, `computeImpact`. |
| 5 | P3A | Presenter mode toggle + strip | Done | `components/PresenterStrip.tsx` + `data/presenterTracks.ts`; `App.tsx` persists `localStorage.ei.presenterMode` and binds Shift+Cmd/Ctrl+P. |
| 6 | P3B | Sales Playbook page | Done | `components/SalesPlaybook.tsx`, NAV entry `sales-playbook`, route active in `App.tsx`. Preview-tenant banner present. |
| 7 | P4A | Promote Intelligence Architecture | Done | NAV order in System group: `sales-playbook → intelligence-architecture → engagement-pipeline`. |
| 8 | P4B | Confidence-gap dual signal | Done | `Layer.tsx` line 275 "Close N gap(s) to reach Y% confidence" with hover tooltip; `DependencyGraph.tsx` system-level summary card with `+Npp recoverable`. |
| 9 | P5A | Mobile splash | Done | `components/MobileSplash.tsx` + `useShouldShowMobileSplash` hook; gated in `App.tsx`; verified at 390x844 (see screenshot 07). |
| 10 | P5B | Final polish | Done with caveat | `index.html` has `<title>Different Day · Elevated Intelligence</title>`, description, `theme-color`, `og:*`, `twitter:*`. Favicon is `favicon.svg`; no `favicon.ico` shipped (see caveat below). |
| 11 | P5C | Build report | Done | this file |
| 12 | VERIFY | Typecheck + architect review | Done | `pnpm run typecheck` clean across all 4 workspace packages; architect verification run in this session. |

## Verification commands

- `pnpm run typecheck` runs `tsc --build` for the composite libs, then `tsc -p tsconfig.json --noEmit` for every leaf workspace package.
- Result: clean. All four projects (api-server, portal, mockup-sandbox, scripts) typecheck green.

## Cross-layer map rebuild (this session)

Replaces the hand-rolled SVG cross-layer map with a React Flow graph so labels and edges auto-route around nodes. New file `dependency/CrossLayerFlow.tsx` containing a custom `LayerNode` (band-tinted card with status dot, label, and gap badge), a `BandLabelNode`, and a custom `LabeledEdge` that places HTML labels via `EdgeLabelRenderer`. Nodes expose eight invisible handles so edges enter and exit on the correct side based on band rank.

Preserved: hero strip, dual-signal card, insight cards, controls (top edges / all edges, annotate gaps), side panel, navigate-on-click, hover-to-isolate (hover sticks until the cursor leaves the whole container, matching the old SVG feel).

## Runtime-error overlay fix (this session)

React Flow's internal ResizeObserver fires a benign "ResizeObserver loop completed with undelivered notifications" notification that Vite's runtime-error-modal plugin captures with an empty stack. `src/main.tsx` registers capture-phase `error` and `unhandledrejection` listeners that swallow this specific message before the plugin sees it. All other errors propagate normally.

## Unshipped items

None against the 12-item brief. The functional surface is complete.

Items deliberately not pursued in this session:

- The diagram-sizing layout change the user mentioned in the same turn (remove inline dual-signal card, make narrator panel collapsible). The user chose to skip it in favour of the 12-task plan. Easy to pick up later.

## Architectural debt taken on

- **Capture-phase global error swallow** in `main.tsx`. The handler is narrow (only matches the two known ResizeObserver loop strings) and only suppresses propagation, not reporting. If a future production error reporter is wired up it should be added before this handler so it still sees the original event. Documented inline in `main.tsx`.
- **No `favicon.ico`**. Only `favicon.svg` is shipped. Evergreen browsers and modern social embeds prefer SVG; this is fine for the target audience but legacy browsers will show no favicon. If `.ico` support becomes required, generate one from the SVG and add a second `<link rel="icon" type="image/x-icon" href="/favicon.ico">` line.
- **React Flow attribution kept**. `proOptions={{ hideAttribution: false }}` in `CrossLayerFlow.tsx` retains the small attribution badge to comply with the MIT licence terms.

## Screenshots

All screenshots taken against the running portal workflow.

| File | What it shows |
|---|---|
| `screenshots/01-morning-brief.jpg` | Default landing, Business performance layer, header chrome, signal ticker, narrator panel |
| `screenshots/02-cross-layer-map.jpg` | Cross-layer map page, top hero strip 81% to 95%, three insight cards, dual-signal card, controls, top of the React Flow graph with band rows |
| `screenshots/03-contract-management-hero.jpg` | Contract management layer, dual signal "Close 5 gaps to reach 93% confidence", recommended actions pill `$3.7M predicted recovery`, §6 hero with concentration risk and renewal exposure timeline |
| `screenshots/04-sales-playbook.jpg` | Sales Playbook page at the top of the System group, 8-stop spine, presenter-mode hint, internal-only banner |
| `screenshots/05-supply-chain-whatif.jpg` | Supply chain layer, recommended actions, scenario-aware narrative |
| `screenshots/06-engagement-pipeline.jpg` | Engagement pipeline page, 70 gaps → 13 capabilities → 21 apps → 90-day ship plan, pipeline by intelligence layer |
| `screenshots/07-mobile-splash.jpg` | Mobile splash at 390x844 with `I know, show me the portal anyway` override |

## Files of interest

- `src/dependency/CrossLayerFlow.tsx` (new this session)
- `src/dependency/DependencyGraph.tsx` (inner SVG block replaced this session)
- `src/main.tsx` (capture-phase error swallowing this session)
- `src/components/heroes/index.tsx` (ContractManagementHero registry entry, prior session)
- `src/components/WhatIfLevers.tsx`, `src/data/scenarios.ts` (Scenario discriminated union, prior session)
- `src/components/PresenterStrip.tsx`, `src/data/presenterTracks.ts` (presenter mode, prior session)
- `src/components/SalesPlaybook.tsx` (sales playbook page, prior session)
- `src/components/MobileSplash.tsx` (mobile splash, prior session)
- `src/data/layers.ts` (pill values, prior session)
- `index.html` (meta tags, prior session)
