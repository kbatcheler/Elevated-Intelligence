# Elevated Intelligence: Stage-Gate Build Brief v3

## How to use this brief

Paste this entire document into the Replit agent. Work runs as five autonomous phases. Complete each phase end to end before moving to the next. Verify each phase against its own acceptance criteria. If a phase fails, fix it before proceeding rather than escalating.

Only stop and ask if:
1. A change would require destroying or rewriting more than 30% of an existing component
2. A product decision is needed that has not been pre-resolved in this brief
3. Two phases conflict in a way you cannot resolve

Everything else: make the call and proceed. The goal is stage-gate readiness for an internal sell-in to Lauri, Lou, and external advisors, plus a CEO-ready and new-sales-hire-usable artefact.

## Product context (carries from prior briefs)

The portal sells intelligence. The apps and modules are substrate. The system pages (Architecture, Engagement Pipeline, Cross-layer map, Scenario war-room, Committed actions, Track Record) and the 14 intelligence layer reports are also a sales toolkit: the CEO uses them to sell, and new sales hires use them to learn the pitch and to run live demos. Every change in this brief must either fix a credibility hole or make the artefact more sellable. Do not strip features.

Default tenant is Meridian Industrial. Non-default tenants show a Preview-mode banner. Do not change that.

## Design rules (do not violate)

1. No long em dashes anywhere in user-facing prose or data. Use commas, colons, or restructure. Inside double-quoted strings use middot · as separator. Source code comments may keep em dashes.
2. Numbers must reconcile. The most numerate person in the room will column-add the action recovery pills. Pills must equal sums.
3. Visual identity: dark navy, warm gold accent, cream surface, coral for warnings and gaps, teal for recovery and positive. No new colours.
4. The §1 to §4 narrative structure on every intelligence layer is the product. Do not weaken it.
5. The product is diagnosis, not dashboard. Charts must annotate the diagnosis they support.
6. Preserve the existing PreviewModeBanner pattern. Do not silently hide content per tenant; name the preview state.

---

## Phase 1: Numerical reconciliation pass

This is the demo-killer fix. Any prospect with a calculator and ten minutes will catch these. They are also the easiest issues in the entire brief.

### 1.1 Action recovery pill mismatches on three layers

Open `artifacts/portal/src/data/layers.ts`. Three layers have `actionsRecoveryUsd` pills that do not equal the sum of their `actions[].impact` $X.YM values.

| Layer | Current pill | Sum of action $M impacts | Required fix |
|---|---|---|---|
| `sales-pipeline` | $3.6M | $5.70M | Either reset pill to $5.7M or rewrite the action impacts to sum to $3.6M |
| `receivables` | $2.9M | $7.10M | Either reset pill to $7.1M or rewrite the action impacts to sum to $2.9M |
| `contract-management` | $2.3M | $3.70M | Either reset pill to $3.7M or rewrite the action impacts to sum to $2.3M |

**Rule for the fix:** the pill is "predicted Q1 recovery the operating team can act on now." Some actions have headline impacts in non-comparable units ("$240M revenue defended," "8% margin defended"). Those one-line headlines should keep their narrative form but should NOT be included in the pill sum. Either: (a) rewrite the affected actions so they all have $X.YM-form impacts that sum to the pill, or (b) accept the larger sum as the new pill value and update the pill string. Pick whichever produces more credible narrative copy per layer. Do not invent new actions to close the gap.

After fix, run this Python check from the repo root to confirm reconciliation:

```bash
python3 -c "
import re
c = open('artifacts/portal/src/data/layers.ts').read()
ms = list(re.finditer(r'^    key: \"([a-z-]+)\"', c, re.M))
for i, m in enumerate(ms):
    s, e = m.start(), ms[i+1].start() if i+1<len(ms) else len(c)
    block = c[s:e]
    p = re.search(r'actionsRecoveryUsd:\s*\"\\\$([\d.]+)M', block)
    if not p: continue
    pill = float(p.group(1))
    sm = sum(float(x) for x in re.findall(r'impact:\s*\"\\\$([\d.]+)M[^\"]*\"', block))
    flag = '✗' if abs(pill-sm) > 0.015 else '✓'
    print(f'{m.group(1):30s}  pill=\${pill:.2f}M  sum=\${sm:.2f}M  {flag}')
"
```

Acceptance: all 14 layers reconcile (✓).

### 1.2 Em-dash sweep on user-facing prose

48 long em dashes remain in `artifacts/portal/src/**/*.{ts,tsx}`. Sweep them all. The brand-voice rule is hard: zero em dashes in user-facing prose and data. Inside double-quoted strings, prefer middot `·` as separator. Source-code comments outside strings may keep em dashes.

Files with the most occurrences (sweep these first):
- `data/feeds.ts` (22)
- `brief/IntelligenceBrief.tsx` (7)
- `components/CompanyPicker.tsx` (5)
- `brief/BoardPack.tsx` (3)
- `data/trackRecord.ts` (2)
- single-occurrence files: `scenario/WarRoom.tsx`, `data/pipelineDeep.ts`, `data/companies.ts`, `context/CompanyContext.tsx`, `context/AppContext.tsx`

The rewrite is contextual. For most occurrences, replace with comma or full stop. For separator usage (e.g. "Foo — bar — baz"), replace with middot · . If a sentence relies on the dramatic dash, restructure it rather than substitute punctuation. Do not bulk-find-replace blindly.

After sweep, verify zero matches:

```bash
grep -roh "—" artifacts/portal/src --include='*.ts' --include='*.tsx' | wc -l
```

Acceptance: count returns 0.

---

## Phase 2: Coverage gaps

Three layers have less product than the others. Close the gaps so all 14 layers feel equally finished.

### 2.1 Contract management is missing a hero and an extras card

`HEROES` in `artifacts/portal/src/components/heroes/index.tsx` maps 7 layer keys to bespoke hero components. `EXTRAS` in `artifacts/portal/src/components/extras/index.tsx` maps 6 keys. 13 of 14 layers have either a hero or extras. `contract-management` (added in the last layer expansion) has neither.

Build a `ContractManagementHero` and add it to `HEROES`. The hero is a §6 bespoke executive visualisation. Use the existing hero shape: serif headline, one or two illustrative numbers, an annotated micro-chart, and a one-line operator takeaway in italic. Topics that match the layer:
- Contract concentration risk visual: e.g. "65% of FY27 revenue contracted under MSAs with auto-renew, 4 of which are with concentrated counterparties"
- Renewal exposure timeline: a horizontal bar across the next 12 months showing contract value coming up for renewal each month
- Indemnity and SLA breach map: small table of contracts with elevated risk flags

Pick the visualisation that lands the §1 recommendation hardest. Use the same accent colours and 4px card radius as the other heroes. Re-use chart primitives from `Chart.tsx` and `Sparkline.tsx`.

Acceptance: contract-management layer renders a §6 hero panel that visually matches the other 13 layers. No empty space in the §6 slot.

### 2.2 WhatIfLevers extension to operational layers

`Layer.tsx` line 67 currently reads:
```ts
const showWhatIf = layer.key === "pricing-margin" || layer.key === "demand-intelligence";
```

`WhatIfLevers.tsx` only supports `"pricing"` and `"demand"` scenario shapes. The §3 heading on the other 12 layers says "intervention tests" but provides no levers. This is a credibility issue: the framing implies modelling, then no modelling appears.

This is the largest piece of work in the brief. Approach in two passes:

**Pass A (this phase):** refactor `WhatIfLevers` to a discriminated-union scenario interface. Define a `Scenario` type that takes:
- `id: string`
- `levers: Lever[]` where each lever has `id, label, min, max, default, unit, helpText`
- `elasticities: Record<string, number>` mapping lever id to its effect on the three modelled outputs (revenue, margin, time-to-recover)
- `baselineRecovery: number` (the pill value for the layer)

Move `pricing` and `demand` to use this shape. The component itself takes a single `scenario: Scenario` prop and renders 2 to 4 sliders, the modelled impact, and a "reset to baseline" affordance. No layer-specific code in the component.

**Pass B (this phase):** seed 4 more operational layers with their own scenarios:
- `supply-chain`: levers for safety-stock days, lead-time compression, DC rebalance
- `customer-intelligence`: levers for top-decile retention rate, NPS lift, win-back velocity
- `sales-pipeline`: levers for stage 3→4 conversion, average deal cycle days, mid-funnel rep coverage
- `marketing-performance`: levers for paid-channel attribution accuracy, organic conversion lift, campaign frequency

That brings WhatIfLevers to 6 of 8 operational layers. The remaining four (`people-operations`, `finance`, `receivables`, `talent-hr`, `contract-management`) keep `showWhatIf = false` for now and the §3 heading on those reads "Root causes" instead of "Intervention tests." Make that conditional in `Layer.tsx`:

```ts
const showWhatIf = scenarioForLayer(layer.key) != null;
// in §3 header:
{showWhatIf ? "Intervention tests" : "Root causes"}
```

Each new scenario needs realistic defaults, ranges, and elasticities that produce a modelled recovery between $0.3M and $2.0M at default settings on a small slider move. Use the existing layer's `actionsRecoveryUsd` as the baseline anchor.

Acceptance: WhatIfLevers renders on 6 operational layers with non-zero defaults; sliders move; modelled impact updates live. The §3 heading reads "Intervention tests" on those 6 and "Root causes" on the other 8.

---

## Phase 3: Sales toolkit framing (new build)

The system pages and the intelligence reports are not just a product demo. They are a sales asset that the CEO uses to sell and that new sales hires use to learn the pitch and run live demos. Today this is implicit. Make it explicit.

### 3.1 Presenter mode toggle (always-on tool)

Add a new control in the top header, next to PersonaLens. Label: "Presenter." Icon: `Presentation` (lucide-react). State is boolean, persisted in localStorage under `ei.presenterMode`.

When Presenter mode is OFF: the portal looks exactly as it does today.

When Presenter mode is ON: a slim, sticky strip mounts at the top of the canvas (below the header, above the page content). The strip is `bg-[var(--navy)]` with `text-[var(--cream)]`, height ~48px, with the gold accent line below it that already separates the header. The strip shows four columns:

1. **Frame** (10 words max): the 30-second positioning statement for the current page
2. **Say** (one sentence, italic serif): the line to actually say when the prospect lands on this page
3. **If they push back** (one short Q + one short A, both 8 to 12 words): the most common objection at this point + the canned response
4. **Next**: a button "Go to [next page name]" that navigates to the recommended next stop, with a one-line rationale ("They'll ask 'how do you know?', show them the reasoning chain")

The content varies by `active` route. Author content for all 14 layers + the 6 system pages.

Author voice rules:
- Speak as if briefing a sales hire in their first week
- Direct, conviction-led, no hedging
- Specific to the page, not generic
- Numbers wherever possible
- No em dashes (use commas)

Store the talk-track content in a new data file: `artifacts/portal/src/data/presenterTracks.ts`. Shape:

```ts
export interface PresenterTrack {
  routeKey: string;             // matches NAV keys
  frame: string;                // 10 words max
  say: string;                  // one italic-serif sentence
  pushback: { q: string; a: string };
  next: { routeKey: string; rationale: string };
}

export const PRESENTER_TRACKS: Record<string, PresenterTrack> = { ... }
```

The strip component lives at `artifacts/portal/src/components/PresenterStrip.tsx`. Mount it in `App.tsx` directly under the header.

For the "Next" CTA, pick a deliberate path through the product. The recommended ordering for a first-time prospect demo:

1. Morning brief (60-second skim)
2. Business performance (the headline diagnosis)
3. Pricing and margin (depth of one layer)
4. Intelligence architecture (the proof of how this works)
5. Cross-layer map (the systems thinking)
6. Engagement pipeline (the joint roadmap, with dollars)
7. Track record (the trust signal)
8. Scenario war-room (interactive close)

This ordering is the spine. The "Next" button on each page should follow it unless a different jump makes more sense for that specific page.

Acceptance: Presenter strip renders on every page when toggled on, content is page-specific, talk-tracks read like a sales coach wrote them, and the "Next" button moves the user through the demo flow.

### 3.2 Sales Playbook page (structured walkthrough)

Add a new system page: "Sales playbook." Route key: `sales-playbook`. Position it as the **first** entry under the "System" group in the sidebar NAV, above Intelligence Architecture. Icon: `BookOpen`.

The page is the new-sales-hire onboarding artefact. It renders the full recommended demo flow as a numbered vertical timeline, with each step showing:

- Step number and page name (e.g. "3. Pricing and margin")
- Estimated time at this step (e.g. "90 seconds")
- The frame, say, pushback Q+A, and next from `presenterTracks.ts` for that page
- A small "Open this page" CTA that navigates to the route AND turns on Presenter mode
- A "Mark practised" toggle that stores completion in `localStorage` under `ei.playbookComplete.{routeKey}` for self-practice

At the top of the page:
- Hero: "How to demo Different Day in 12 minutes"
- Subhead: "The eight-stop walk-through that lands the elevated intelligence positioning. Built for new hires running their first demo and for the CEO running their fiftieth."
- A progress bar showing how many steps the current viewer has marked practised

At the bottom of the page:
- Section: "Objections you'll hear three times a quarter"
- 6 to 8 short Q+A cards covering: (a) "isn't this just a dashboard?" (b) "what if we don't have clean data?" (c) "how does this differ from [Palantir / Tableau / Salesforce Einstein]?" (d) "what does pricing look like?" (e) "what if the AI is wrong?" (f) "what does implementation look like in a $200M business?" (g) "we already have a BI tool" (h) "we tried this with consultants two years ago"

Each answer is 3 to 4 sentences. Direct, specific, no hedging.

Acceptance: a new hire could land on `/sales-playbook`, read for 5 minutes, and run a credible 12-minute demo. The CEO could open Presenter mode and walk a buyer through the spine without needing notes.

### 3.3 Hide Presenter mode from non-Different-Day viewers

When a prospect is in the room, the seller may forget Presenter mode is on. The strip is fine to leave visible (it reinforces the framing) but make sure two safeguards exist:

1. The "Sales playbook" page itself: when a non-default tenant is active, show a small banner: "Demo flow scaffolding. Hidden from prospect demos by default in production." This is a self-conscious framing rather than a hard hide. Anyone in the room reading the page closely will understand they're seeing internal scaffolding.

2. A keyboard shortcut: `Shift + Cmd + P` (Mac) or `Shift + Ctrl + P` (Windows) toggles Presenter mode globally. Document this on the playbook page so a seller can hide the strip in two keystrokes if a screen is shared.

Acceptance: Presenter mode is discoverable, toggleable, and never accidentally on when it shouldn't be.

---

## Phase 4: Architecture promotion and confidence-gap dual signal

These are two product-shape upgrades that the build report calls out as deferred.

### 4.1 Promote Intelligence Architecture

Currently `intelligence-architecture` sits in the System group as item 15 in the sidebar. It is the strongest commercial story in the product (Cortex Lens, Confounder, Challenger, Synthesist, Evaluator) and is buried.

Move it to the top of the "System" group in the sidebar NAV. Above Engagement pipeline. Below Sales playbook (per phase 3.2).

Additionally, add a **first-class entry point** from the Morning brief view. At the top of the Morning brief, above the layer cards, render a card:

- Eyebrow: "HOW THE SYSTEM WORKS"
- Headline: "Five-stage reasoning chain"
- Subhead: "Every diagnosis routes through Perceive → Hypothesise → Challenge → Narrate → Score. 13,348 tokens, 2.2 seconds. Click to see it in motion."
- A small animated micro-version of the chain (5 dots connected by lines, each lighting up in sequence on a 4-second loop)
- CTA: "See the reasoning chain"

Mount it only on first session per user (track with `localStorage`). Once visited, it shrinks to a one-line link in the Morning brief footer.

Acceptance: a first-time visitor to the Morning brief sees the architecture promotion. A returning user sees a low-key persistent link.

### 4.2 Confidence and gap dual signal on every layer header

The current layer header shows a Confidence band (e.g. 87%). The deeper point, that the gaps are the paid component of confidence, is invisible.

Add a small visual element directly under the Confidence band on every layer header:

- Text: "Close [N] gaps to reach [Y]% confidence"
- Where N = number of gaps on this layer with `confidenceLiftPp > 0`
- Where Y = current confidence + sum of `confidenceLiftPp` across all gaps (capped at 99%)
- On hover, show the gap list as a tooltip with the per-gap pp contribution

Style: small font (11px), italic, gold accent. Should not compete with the existing confidence band, but should sit immediately beneath it so the relationship is obvious.

On the Cross-layer map page, add a top-of-page summary card:
- Eyebrow: "ACROSS ALL 14 LAYERS"
- Headline: "Average confidence today: [X]%. Close the top 10 gaps: [Y]%."
- Subhead: "Indicative pipeline $[Z]M. The architecture is the spec; the gaps are the work."

Pull X from the average of layer confidences. Y from X + sum of top-10 confidence lifts (capped at 99%). Z from the existing Engagement pipeline total.

Acceptance: every layer header shows the dual signal. The Cross-layer map carries the system-level summary. The relationship between confidence today and pipeline value is now legible at a glance.

---

## Phase 5: Mobile graceful degrade and final polish

### 5.1 Mobile splash below 1024px

The portal is desktop-optimised. `App.tsx` uses `max-w-[1200px]` and a fixed `w-[240px]` sidebar with no responsive breakpoints. At 375px width, the sidebar swallows 64% of the viewport.

Build a `MobileSplash.tsx` component that renders ONLY when `window.innerWidth < 1024`. The splash is full-screen, navy background, cream content:

- Different Day wordmark, centred, top
- Headline (serif, 28px): "Elevated Intelligence is designed for a 1024px+ canvas"
- Body (italic serif, 16px): "The portal renders charts, dependency graphs, and dashboards that need horizontal space to read. Open this URL on a laptop or tablet in landscape mode to see the full diagnosis."
- Subhead: "If you're here to skim the pitch, we built a 60-second version."
- CTA button: "Read the 60-second pitch" → opens an in-page modal with: the elevator pitch + 3 stat callouts + a "Request a full demo" mailto link to `hello@differentday.ai`
- Bottom: "differentday.ai · Confidential"

Use a CSS media query rather than a JS resize listener for the initial render. Persist user override: a small "Use the desktop layout anyway" link at the bottom of the splash sets `localStorage.eiForceDesktop = '1'`, and the splash respects that flag.

Acceptance: at 375px width the user sees the splash; at 1024px+ they see the portal. The override link works.

### 5.2 Final stage-gate polish

Sweep these and fix any that surface:

- Open every system page and confirm the page header eyebrow, headline, and italic subhead are populated
- Open every intelligence layer and confirm the Analyst's take card renders for Meridian Industrial and is appropriately absent on preview tenants
- Confirm the OG and Twitter meta in `artifacts/portal/index.html` reads: "An elevated-intelligence operating layer for mid-market companies. Diagnose performance gaps, route recovery actions, and turn signal into board-ready decisions." (or similar; no Replit boilerplate)
- Confirm `favicon.ico` exists and renders the gold-on-navy DD monogram
- Confirm the page title is "Different Day | Elevated Intelligence"

### 5.3 Build report

Produce a final build report at `docs/build-report.md` (overwrite existing) summarising:

- What changed, organised by phase
- Acceptance checks that passed
- Anything you could not ship and why
- Screenshots (in `docs/screenshots/`) of: Morning brief with architecture promotion, a layer with the confidence-gap dual signal, the Engagement Pipeline, the new Sales Playbook page, the Mobile Splash
- Any architectural debt taken on

---

## Final acceptance checklist (run before declaring complete)

1. `python3` reconciliation script in Phase 1.1 reports ✓ on all 14 layers
2. `grep -roh "—" artifacts/portal/src --include='*.ts*' | wc -l` returns 0
3. `contract-management` layer renders a §6 hero panel
4. WhatIfLevers renders on at least 6 operational layers with non-zero defaults
5. Presenter mode toggle exists in header, persists in localStorage, renders the strip on every page when on
6. `sales-playbook` route exists, is the first entry under "System" group, contains the 8-step walkthrough + objections section
7. Intelligence Architecture is now item 2 under "System" group, with Morning brief promotion above the layer cards
8. Confidence-gap dual signal appears on every layer header
9. Cross-layer map carries the system-level confidence summary
10. Mobile splash renders below 1024px with working override
11. `pnpm --filter @workspace/portal run typecheck` passes clean
12. `pnpm run build` completes without errors

## Decisions pre-resolved in this brief (do not re-ask)

- Tenant question (Phase 3 of prior brief): Meridian Industrial is the canonical mid-market tenant. Do not add a second one named anything else.
- SWITCH button: keep as Company picker. Do not refactor to perspective modes (PersonaLens already covers that need).
- Em-dash policy: hard zero in user-facing prose and data. Comments may retain.
- Sales toolkit ownership: lives in the portal itself, not a separate app. Presenter mode + Sales playbook page are the two surfaces.
- Architecture promotion: in-sidebar reorder + Morning brief hero callout. Not a separate top-level tab.

## What "stage-gate ready" means here

After Phase 1 and Phase 2: the demo will survive a CFO column-add test and feel equally finished across all 14 layers.

After Phase 3: a new sales hire can be handed the portal on day 1 and run a credible demo by day 3. The CEO can walk a buyer through the spine without notes.

After Phase 4: the elevated intelligence positioning is visible from the landing surface, not buried. The confidence-gap dual signal makes the commercial mechanism land in one glance.

After Phase 5: the portal degrades gracefully on tablet and mobile, and the production polish (meta, favicon, build artefacts) is complete.

That is the readiness bar. Hit it.
