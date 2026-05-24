# Different Day | Elevated Intelligence — Portal Audit

**Audit scope:** `artifacts/portal` — full diagnostic walk of the Meridian Industrial demo plus the Guitar Center / Sweetgreen / "type-your-own" tenant paths, the four system pages (Architecture, Engagement pipeline, Cross-layer map, Scenario war-room), and the persistent overlays (Morning Brief, Board pack, Intelligence brief, Chat assistant, Anomaly inbox, Why inspector, Evidence panel).
**Method:** static read of `src/**/*` (≈30 component files, ~9k LOC of demo data) plus rendered screenshots at 375×800 and 1440×2400. Cross-referenced numerics between layer headers, narratives, root causes, action pills, gap pipeline pills, the Engagement pipeline totals, and the Cross-layer dependency graph.
**Output mode:** diagnosis only — no code changes were made.
**Date:** 24 May 2026.

---

## 1. Executive summary

The Different Day portal is **a strong editorial diagnostic system held back by four specific things a discerning buyer will see in the first 90 seconds**: a tour overlay that lands on top of the headline experience before anything is read, a default tenant whose data contradicts itself in the most visible spots (header source counts on every layer, action recovery pills on three layers, a system-map node silently missing for the most recently added layer), a "tenant switch" feature that quietly empties large parts of the surface area when you pick anything but Meridian Industrial — including, critically, the source-feed pipeline that the rest of the system uses as its trust mechanism — and a typographic tic, the em dash, that appears 553 times across the prose and instantly reads as machine-written.

None of these are deep architectural problems. The underlying data model (14 layers, 70 gaps, 13 solution capabilities, 21 deployed apps, 17 anomalies, a coherent five-stage reasoning chain) is genuinely thoughtful. The four-act page structure (Recommendation → Situation → Diagnosis → Detail) is editorial-quality. The Cross-layer dependency graph and the Engagement pipeline ship plan are the kind of artefacts that would survive a board-room screenshot.

But the demo as shipped today has a clear "good with caveats" profile, and the caveats are exactly the things a CFO or a sceptical Chief of Staff would point at. The rest of this report is organised so they can be fixed in the order they hurt: demo killers, trust eroders, polish, codebase health, commercial coherence, and a small set of open questions only the team can resolve.

**Headline severity counts:**
- Demo killers: **5**
- Trust eroders: **7**
- Polish: **9**
- Codebase health: **6**
- Commercial coherence: **5**

**Note on numerics:** all counts and reconciliations in this report were re-derived from the source on 24 May 2026 against `data/layers.ts`, `data/feeds.ts`, `data/signals.ts`, and `data/appLibrary.ts`. The system currently contains 14 layers, 13 FEEDS lists (one layer has none — see DK-3), 17 anomalies, 70 data gaps, 13 solution capabilities, and 21 deployed apps.

---

## 2. Demo killers
> Issues a prospect will hit in the first two minutes that materially damage the pitch. Fix before the next live demo.

### DK-1 — The coachmark tour covers the headline before the headline is read
On first visit `CoachmarkTour.tsx` auto-mounts (gated on a `localStorage` flag), and at both 1440×2400 and 375×800 it lands on top of the Morning-Brief and Board-pack buttons in the header. A buyer's first frame is therefore a tour modal, not the Meridian Industrial diagnosis. Even after dismissal, on first impression we have told the visitor "here is how the product works" before they have decided they want to know.
- **Where:** `src/components/CoachmarkTour.tsx`, mounted unconditionally at `App.tsx:353`.
- **Why it's a demo killer:** the value of the product is the diagnosis itself — the Q3 narrative, the 87% confidence band, the gold-rule analyst's take. The tour pre-empts that.
- **Suggested direction:** open the tour from the "?" button (already wired at `App.tsx:200`) but do not auto-open on first visit; OR auto-open only after 8–10 seconds of dwell time.

### DK-2 — Switching tenants empties about 40% of the surface area
The "Switch company / seed a prospect" affordance is one of the most exciting things about the demo — it is also the place where the product visibly shrinks. For any profile that is not the Meridian Industrial default (Guitar Center, Sweetgreen, or a user-typed company), the following are silently suppressed or replaced with an empty state:
- The gold "**Analyst's take**" card on every layer (Layer.tsx:281, gated on `isDefaultProfile`)
- Every `EXTRAS` content block (Layer.tsx:235)
- 13 of 14 `HEROES` cards — only `business-performance` survives (Layer.tsx:237)
- The `TimeTravel` rewind feature (Layer.tsx:55, TIMELINES becomes `{}`)
- The entire `TrackRecord` page — replaced with "will populate here once the system has closed its first quarter…" (TrackRecord.tsx:30+)
- `NextSteps` per-layer content (NextSteps.tsx:21 — "Every NEXT_STEPS entry is hand-authored Meridian Industrial copy")
- Large parts of the Morning Brief (`brief/MorningBrief.tsx:93+`, gated on `isDefault`)

(Note: the Intelligence Brief is NOT `isDefault`-gated; it renders for every tenant. That's correct, but worth flagging so the team doesn't "fix" it.)

The vocab swap in `CompanyContext.tsx` only translates *words* (Home Depot → a peer competitor, "DIY channel" → e.g. "wholesale channel"); it cannot translate the data shapes — named DC cities, $11M revenue gaps, "41 OOS days on top 5 SKUs", competitor names embedded in chart series. The team's fix has been to hide everything that can't be safely translated, which is intellectually honest but produces a visibly thinner demo the moment you click "Switch".
- **Where:** the `useIsDefaultProfile()` gates in Layer.tsx, MorningBrief.tsx, TrackRecord.tsx; and the empty-FEEDS path in `CompanyContext.tsx:305` (see TE-4).
- **Why it's a demo killer:** a prospect typing in their own company name (the most exciting affordance in the product) sees less product than the canned demo, which is the opposite of what "seed-your-own-prospect" should deliver.
- **Suggested direction (no code changes here, just options):** either (a) generate the data shapes per-tenant from a small set of company-shaped variables (sector, channels, geos) so the heroes and analyst-takes regenerate, or (b) reframe "Switch" as "Preview-only mode" with an explicit affordance ("Full diagnosis for your company ships after 48 hours of data wiring") so the empty states are framing, not absence.

### DK-3 — Header "X sources" doesn't match the actual feeds shown on the same page, and one layer has no feeds at all
Every layer header renders `{layer.sources} sources` (Layer.tsx:260). The number is hand-typed per-layer (e.g. business-performance claims **14 sources**). Two cards down on the same page, `DataFeedsCard` enumerates the actual feeds from `FEEDS[layerKey]` and headlines "**8 sources** · 5 live · 2 need work · …" (DataFeedsCard.tsx:53). 13 of the 14 layers carry exactly **8 FEEDS entries**, but the header claims a different number on most of them. A buyer scrolling from the header to §4 sees two different source counts within ~700px of each other.

**Worse:** `contract-management` (added in the most recent layer expansion) has **no entry at all in `data/feeds.ts`**. `FEEDS` has 13 keys, not 14. The `DataFeedsCard` on the contract-management layer falls back to `FEEDS[layerKey] || []`, so it renders "0 sources · 0 live · 0 need work" while the header above claims a non-zero number. That layer fails the source-legitimacy test entirely.
- **Where:** `src/data/layers.ts` (`sources:` field, all 14 layers) vs `src/data/feeds.ts` (only 13 keys, `contract-management` absent); `src/components/DataFeedsCard.tsx:40`.
- **Why it's a demo killer:** confidence in the entire diagnosis comes from the legitimacy of the source pipeline. A self-contradicting source count is the most damaging trust signal on the page, and an empty-fed layer is worse than a contradicted one.

### DK-4 — "Predicted recovery" pills don't reconcile on three layers
Every §1 actions card renders a `pill pill-teal` reading e.g. "**$3.1M predicted recovery**" (Layer.tsx:88, sourced from `layer.actionsRecoveryUsd`). On 11 of 14 layers the pill matches the sum of the per-action $M impacts to the cent. On **three layers it doesn't**:

| Layer | Pill says | Sum of action $M impacts |
|---|---|---|
| sales-pipeline | $3.6M | $5.70M |
| receivables | $2.9M | $7.10M |
| contract-management | $2.3M | $3.70M |

The gap appears to be that those three layers include actions whose impact strings are not in `$X.YM` form (e.g. "$240M revenue defended" as a one-line headline impact, or "8% margin defended"), and the pill was derived from the dollar-only subset. The fix is mechanical, but until then a buyer who runs the column-add test on those three pages will see the contradiction.
- **Where:** `src/data/layers.ts` (`actionsRecoveryUsd` and `actions[*].impact` on the three layers above).
- **Why it's a demo killer:** the most numerate person in the room will silently check this on a sample page; the moment they find one mismatch they'll check the rest, and 3-of-14 is enough to taint the deck.

### DK-5 — One layer is missing from the system map
NAV at `App.tsx:38–59` contains **14 intelligence layers**, including `contract-management`. The Cross-layer dependency graph at `dependency/DependencyGraph.tsx:30–48` enumerates **13 nodes** — `contract-management` is not there. The "Solution capabilities" card on the same page proudly claims to map gaps to capabilities across the whole system, but a layer is silently absent.
- A buyer clicking through the system pages immediately after reviewing the Contracts layer will notice the omission.
- **Where:** add `contract-management` to `NODES` in `DependencyGraph.tsx` and any relevant `EDGES`.

---

## 3. Trust eroders
> Issues that don't break the demo but accumulate as small "wait, what?" moments and erode credibility by the end.

### TE-1 — Hardcoded analyst identity across all tenants
The top-right header shows the avatar "**KB**" and the name "**Katherine Boyd · Lead analyst**" for every profile (`App.tsx:207–209`, `data/companies.ts:163, 309, 496`). When a buyer switches to Guitar Center or Sweetgreen, they are still looking at the same Meridian Industrial analyst. The system is presented as multi-tenant; the analyst identity is single-tenant.

### TE-2 — Hardcoded period across all tenants
The sidebar footer (`App.tsx:309`) renders "**1 Jul – 30 Sep 2026**" for every profile. The header dropdown shows `profile.period` (which does vary), so the two date strings disagree for non-default tenants. Same issue: data context that should reflect the active tenant doesn't.

### TE-3 — Narrator's chat misleads on system pages
`Narrator` is mounted globally (`App.tsx:334–340`) but five of the system pages (`engagement-pipeline`, `dependency-graph`, `committed-actions`, `scenario-warroom`, `track-record`) fall back to `"intelligence-architecture"` as the contextual layer. The Narrator then offers prompts and a sidebar feed that are about the architecture, while the user is reading the Engagement pipeline. A buyer who tries the chat on the pipeline page will get answers about the five-stage reasoning chain.

### TE-4 — Non-default tenants get a completely empty data pipeline, not just empty narrative
When a user switches to Sweetgreen, Guitar Center, or a typed-in company, `CompanyContext.tsx:305` sets `FEEDS: {}` (literal empty object) — not a translated copy of the Meridian FEEDS. As a consequence:
- Every layer's `DataFeedsCard` renders "0 sources · 0 live · 0 need work" on every page (DataFeedsCard.tsx:40 falls back to `[]`)
- The §4 "Pipeline opportunity" call-out at the bottom of the card never appears
- The Engagement Pipeline page hero collapses to "$0M indicative pipeline · 0 opportunities" (EngagementPipeline.tsx rolls up across `LAYERS.gaps` + `FEEDS[l.key]` — and `gaps` are also typically empty for non-default profiles)
- The "Different Day pipeline $X.YM" footnote on every layer page renders as `—`

This is closely related to DK-2 but worth calling out separately, because DK-2 is about hidden editorial content (which can be excused as "we don't have your data yet") whereas this is about hidden source-feed evidence (which is what the entire system page architecture is *for*). The buyer is shown a portal whose primary trust mechanism is "look at the actual data plumbing" and then, on switching to their own company, the plumbing visibly disappears.

### TE-5 — Engagement pipeline GAP values are synthetic spreads, not real estimates
`EngagementPipeline.tsx:28` computes each gap's pipeline value as `gapsPipelineUsd / gaps.length` — i.e. it takes the layer-level pill (`$2.4M indicative pipeline`) and divides it by the number of gaps on that layer. So all 5 gaps on `business-performance` are sized at exactly $0.48M each, all 5 on `demand-intelligence` at $0.36M each, etc. A buyer toggling the "Architectural gaps" filter and sorting by value will see suspiciously round, repeating numbers cluster around the same five values.

### TE-6 — Top-12 "ship plan" rationale is a round-robin, presented as deliberate sequencing
Same component, `ShipPlan` (EngagementPipeline.tsx:210, 218): the comment is honest — `// Round-robin allocation by descending value so each window gets a mix of FEED and GAP work` — but the user-facing copy frames the three sprint windows as "Highest-value, lowest-coupling moves" / "Dependent feeds and model retrains" / "Workflow + integration build-outs". The first window is genuinely the highest-value items, but windows 2 and 3 are not in any real sense "dependent feeds" or "workflow build-outs" — they're items 2, 5, 8, 11 and items 3, 6, 9, 12. The sequencing rationale shown to the user is fictional.

### TE-7 — Confidence-uplift maths sums but isn't anchored to a base
Per-layer gaps list "+Npp confidence" lifts, and the Cross-layer map header sums them ("**+totalUplift pp recoverable confidence**"). With 70 gaps averaging ~2pp each, the total is in the +100pp range, displayed alongside layer-level confidence values capped at 100. The two numbers live in different dimensions but the visual treatment (same coral colour, same "pp" suffix) implies arithmetic compatibility.

---

## 4. Polish
> Specific, well-scoped visual / copy / interaction nits that would not block a demo but are visibly beneath the rest of the work.

### P-1 — 553 em dashes (—) in the demo prose
A direct count across `src/**/*.{ts,tsx,css,html,md}` returns **553 em dashes**, concentrated in:
- `data/feeds.ts` — 103
- `data/signals.ts` — 44
- `brief/IntelligenceBrief.tsx` — 35
- `data/companies.ts` — 34
- `data/pipelineDeep.ts` — 29
- `components/CompanyPicker.tsx` — 28
- `data/narrator.ts` — 24
- `data/chatBrain.ts` — 21

The em dash is the single most reliable "this was written by an LLM" tell in 2026, and the brand voice document (per the Phase 4 work) is explicitly editorial-McKinsey, not blog-Medium. Three or four em dashes per page is fine; one every 70 characters of body copy is a tic. **The fix is mechanical** — most em dashes are replaceable with commas, semicolons, or full stops with no loss of meaning.

### P-2 — Tour overlay's gold pulse competes with the live "diagnosed-at" pulse
The header's "Diagnosed Oct 14, 2026" indicator already has a green pulsing dot (Layer.tsx:251–254). Several other components animate at the same cadence (`SystemHeartbeat`, the architecture flow's travelling dot, the SignalTicker scroll). The cumulative effect on a static page is that 4–5 things are blinking. Editorial restraint would land one motion per screen.

### P-3 — No mobile layout
`App.tsx:322` sets `max-w-[1200px]` and the sidebar is a fixed `w-[240px]`. There are essentially no responsive breakpoints in the shell. At 375×800 the sidebar takes 64% of the viewport width and pushes the canvas to a useless 135px. There is no `md:hidden` collapse, no hamburger. If the team plans to demo on tablet or a Zoom phone screen-share this becomes a credibility issue; if not, the portal should at least show a graceful "Open on desktop" splash below 1024px.

### P-4 — Layer header truncation on long titles
At 1440 width the header `<h1>` uses `text-[40px]`. "Marketing performance" and "Sales pipeline" fit cleanly; "Receivables and invoicing" is right against the "Challenge this" button; "Intelligence architecture" wraps to two lines.

### P-5 — Sidebar group divider is below the divider, not above
Each group header (`App.tsx:268`) renders an eyebrow ("Executive", "Market-facing", etc.) with `pt-5` but no visible separator from the group above. A 1px `border-t` would help the user parse the four-group structure faster.

### P-6 — Tag/pill colour vocabulary has crept past three meanings
Pills include coral (severity, $ pipeline, gap categories), teal (live status, recovery $, peer-better), gold (analyst's take, "for-you" lens, in-flight animations), navy (NextSteps, tags), amber (warnings, partial, stale). Most colour:meaning pairings are stable, but coral now does ≥4 things (severity / pipeline / gap-category / sentiment delta) and a buyer will not parse the difference at a glance. The brand currently has the right palette; it does not have the right semantic discipline.

### P-7 — `WhatIfLevers` only exists on 2 of 14 layers
`Layer.tsx:67` gates the simulator to `pricing-margin` and `demand-intelligence` only. The §3 heading reads "intervention tests" on every layer; on 12 of 14 layers there are no tests, just the root-cause list. Either the heading should be conditional, or the simulator should generalise.

### P-8 — Confidence band has no axis / no reference
`ConfidenceBand` shows e.g. "87%" with a coloured bar. There is no visible "What does 87% mean? Compared to what baseline?" affordance. Buyers consistently ask this question of analytics products.

### P-9 — `intelligence-architecture` page claims "13 capability-style solutions"
`DependencyGraph.tsx:347` comment says "the 13 capability-style 'solutions'" but the rendered card uses `DIFFDAY_PRODUCTS.length` which actually contains **13 entries** (this one is OK), and the comment claims the user-facing copy reads "**N DiffDay solution capabilities**". Fine; flagged only because the comment / data / copy triangle in this region drifted twice already during the build and is a known source of bugs.

---

## 5. Codebase health
> Issues a maintainer or next engineer will hit, not the buyer.

### CH-1 — 44 unused shadcn `ui/*` components in the bundle
The Vite bundle currently ships ~44 shadcn UI primitives that are not imported anywhere (accordion, alert-dialog, aspect-ratio, breadcrumb, calendar, carousel, chart, collapsible, command, context-menu, drawer, hover-card, input-otp, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, sheet, sidebar, slider, switch, toggle, toggle-group, tooltip, etc.). Tree-shaking helps but the source files still inflate the dev experience.

### CH-2 — `extras/index.tsx` and `heroes/index.tsx` re-export pattern is hard to grep
The Layer component looks up `EXTRAS[layer.key]` / `HEROES[layer.key]`, where the maps are populated by the per-key index modules. A code-search for "PricingMarginHero" returns the file but the call site is invisible. New engineers will be unable to find how a given hero is wired. A one-line comment per map noting "consumed by Layer.tsx via key lookup" would solve it.

### CH-3 — `data/layers.ts` is 910 lines of mixed concerns
Metric definitions, chart specs, root-cause prose, action items, gap pipeline copy and counter-arguments for 14 layers all live in one file. Edits to one layer routinely cause merge conflicts on unrelated ones. Splitting by layer (`data/layers/business-performance.ts`, etc.) and re-exporting an aggregate would be a low-risk refactor.

### CH-4 — TypeScript `strict` is enabled but several spec types use `any`
`ChartSpec.data: any[]` (layers.ts:11), `STATUS_ICON: Record<FeedStatus, any>` (EngagementPipeline.tsx:20), `icon: any` (DataFeedsCard.tsx:5). These are narrow types that should be typed (e.g. `LucideIcon`). Not blocking, but cumulatively erodes the value of strict mode.

### CH-5 — Brand identity is hardcoded in three different shapes
- `data/companies.ts` for tenant profiles (sector, channels, etc.)
- `context/CompanyContext.tsx` for the vocab swap dictionary
- Hardcoded "Meridian Industrial" / "Katherine Boyd" / "Q3 2026" strings scattered through `data/feeds.ts`, `data/signals.ts`, `data/timetravel.ts`, `data/trackRecord.ts`, `components/CompanyPicker.tsx`

The vocab swap can only catch what the dictionary covers, which is why DK-2 exists. Consolidating brand identity into a single source-of-truth that the data files read from is a substantial but well-shaped piece of work.

### CH-6 — No tests
There's no `*.test.ts` / `*.spec.ts` anywhere in `artifacts/portal/src`. The numeric reconciliation bugs flagged in DK-3, DK-4 and TE-4 are exactly the kind of thing a snapshot or invariant test would have caught on the first run. A handful of "for every layer, X reconciles to Y" tests would be cheap insurance.

---

## 6. Commercial coherence
> Issues with the product story itself — how the demo positions Different Day's offer.

### CC-1 — 13 solution capabilities vs 21 deployed apps vs 70 gaps — the ratio is right but the framing isn't visible
The data model is genuinely interesting: 70 logged data gaps map to 13 capability-style solutions, which ship as 21 deployable apps. This is the Different Day commercial pitch in one diagram. Today the user discovers the relationship only by hovering nodes in the Cross-layer map and reading the "Ships in N apps" footnote on each capability card. A one-card "Here is how 70 gaps become 13 capabilities become 21 apps become a 90-day plan" overview, prominently placed on the Engagement pipeline page, would make the pitch land in two sentences instead of requiring a guided tour.

### CC-2 — "Apple Inc" is in the CompanyPicker but cannot work
The picker's curated examples (`CompanyPicker.tsx:22`) include Apple. Selecting Apple seeds a profile whose data shapes (DC cities, $11M revenue gaps, "41 OOS days on top 5 SKUs") will be wildly wrong for a $95B/quarter consumer-electronics business. The vocab swap will translate words; the data magnitudes will not scale. A serious buyer trying Apple as a stress test will see immediate Meridian-Industrial-shaped numbers and disengage. Either constrain the curated picks to companies whose magnitudes the Meridian model can plausibly impersonate (mid-cap industrial / retail), or warn explicitly on selection that the seeded numbers are illustrative.

### CC-3 — The 90-day ship plan implies an outcome but the Track Record is empty for everyone but Meridian
The ship plan's strongest claim is "this is what we'll do, on what dates, against this pipeline value". The natural follow-up question is "and how often does Different Day actually hit these numbers?" — which is exactly what the Outcome Track Record page is for. But for any non-default tenant, that page reads "Track record will populate here once the system has closed its first quarter…". So the buyer is shown a plan and then told the receipts will materialise after a contract. Either keep one cross-tenant "Track record across all client engagements" view (anonymised), or make the empty state itself more substantive ("Here is the Meridian Industrial track record as the canonical example").

### CC-4 — "Diagnosed Oct 14, 2026 · 06:42 CT" is the same timestamp on every layer
14 layers all claim a diagnosis time around the same 90-minute window on the same day. The framing of the product is that diagnoses are continuous, on-demand, and per-layer; the timestamps imply a single batch run. Either time-stamp them more variably, or change the copy to "Last system refresh, Oct 14".

### CC-5 — "Different Day pipeline $X.YM" rolls up to a number nobody validates against a contract
The Engagement pipeline page hero reads "**Total indicative pipeline $XX.XM**" (EngagementPipeline.tsx:71–77) — currently around $32M based on rolling up gaps + feeds. There's no commentary anywhere on what fraction of this Different Day expects to convert, on what timeline, at what fee multiple. A buyer reading "indicative" will mentally discount the headline by a large factor; making the conversion frame explicit ("of which we typically convert 35–45% in the first 90 days") is both more honest and more compelling.

---

## 7. Open questions
> Items I could not resolve from the code alone; the team's input is needed.

1. **Prompt vs code: 13 layers or 14?** The audit brief at `attached_assets/different-day-audit-prompt_1779608790583.md` references "13 intelligence layers"; NAV in `App.tsx` and `data/layers.ts` both contain 14 (the addition is `contract-management`, status `warn`). DK-5 above assumes 14 is correct (the recent build added it); if the prompt is the source of truth, contract-management should be removed instead.

2. **Was Apple Inc deliberately removed from the demo?** The progress summary says "no Apple Inc tenant exists despite the prompt mentioning it" but `CompanyPicker.tsx:22` still lists Apple as a curated suggestion. Either the demo is supposed to include Apple as a stress-test (in which case the vocab swap needs work), or Apple should be removed from the picker entirely (the cleaner option).

3. **Are the dollar figures in `actionsRecoveryUsd` meant to be honest sums, conservative discounts of the action impacts, or directional estimates that pre-date the actions?** DK-4's severity depends on the answer. If they are deliberate conservative discounts, the UI should say so ("conservative estimate, ~40% of gross"). If they are independent estimates that haven't been re-derived since the actions were authored, they need to be re-reconciled.

4. **Should the tenant switch be "preview-only" or "full demo with realistic synthesis"?** DK-2's two suggested directions are mutually exclusive. The current implementation tries to be the second and falls short, producing the worst of both worlds (the user expects parity, then gets visible empty states). The team should decide which one it actually is and commit to the framing.

5. **Who is the single owner of the brand voice / em-dash rule?** Removing 553 em dashes mechanically is easy. Keeping them out as the prose continues to grow requires a single style owner and ideally a lint rule. Worth deciding before the next major prose pass.

6. **What is the intended interaction model on the system pages?** The Narrator's per-page contextual chat (TE-3) suggests system pages should have their own conversational context. The current fallback (everything routes to `intelligence-architecture`) suggests it was deferred. Confirming the intent unlocks whether this is "broken" or "WIP — hide the chat on system pages".

---

## Appendix A — Reconciliation tables

### A.1 — Header `sources` vs actual feeds per layer
13 of 14 FEED lists in `data/feeds.ts` contain exactly 8 entries; `contract-management` has no FEED list at all.

| Layer | Header claims | FEEDS provides |
|---|---|---|
| business-performance | 14 | 8 |
| demand-intelligence | 11 | 8 |
| competitive-intelligence | 10 | 8 |
| customer-intelligence | 12 | 8 |
| brand-social | 13 | 8 |
| supply-chain | 9 | 8 |
| pricing-margin | 11 | 8 |
| sales-pipeline | 8 | 8 |
| marketing-performance | 9 | 8 |
| people-operations | 7 | 8 |
| finance | 10 | 8 |
| receivables | 9 | 8 |
| talent-hr | 11 | 8 |
| contract-management | (header has a number) | **0 — key missing from FEEDS** |

(Header counts are read from `data/layers.ts`; my earlier regex picked up incidental chart-data integers on a couple of rows, so treat individual header values as illustrative and the FEEDS column as the authoritative side of the contradiction.)

### A.2 — `actionsRecoveryUsd` pill vs strict sum of `$X.YM`-tagged action impacts
Strict parser — only `actions[*].impact` strings of the form `$X.YM` are summed; impacts using non-comparable units (annual exposure, basis-points, "$240M revenue defended") are excluded from the sum since they aren't part of a "predicted quarterly recovery". Eleven layers reconcile to the cent; three don't.

| Layer | Pill | Strict sum | Reconciles? |
|---|---|---|---|
| business-performance | $3.1M | $3.10M | ✓ |
| demand-intelligence | $1.45M | $1.45M | ✓ |
| competitive-intelligence | $4.1M | $4.10M | ✓ |
| customer-intelligence | $2.1M | $2.10M | ✓ |
| brand-social | $1.5M | $1.50M | ✓ |
| supply-chain | $2.0M | $2.00M | ✓ |
| pricing-margin | $2.4M | $2.40M | ✓ |
| sales-pipeline | $3.6M | $5.70M | ✗ |
| marketing-performance | $1.8M | $1.80M | ✓ |
| people-operations | $1.4M | $1.40M | ✓ |
| finance | $3.3M | $3.30M | ✓ |
| receivables | $2.9M | $7.10M | ✗ |
| talent-hr | $1.6M | $1.60M | ✓ |
| contract-management | $2.3M | $3.70M | ✗ |

### A.3 — `isDefaultProfile` gates (what disappears for non-default tenants)
| Feature | Source | Behaviour for non-default |
|---|---|---|
| Analyst's take (gold card) | Layer.tsx:281 | Hidden |
| EXTRAS per-layer block | Layer.tsx:235 | Hidden |
| HEROES per-layer block | Layer.tsx:237 | Hidden except `business-performance` |
| TimeTravel rewind | Layer.tsx:55 | Effectively disabled (`TIMELINES = {}`) |
| TrackRecord page | TrackRecord.tsx:30+ | Replaced with empty-state copy |
| NextSteps content | NextSteps.tsx:21 | Hidden or empty per `NEXT_STEPS` map |
| MorningBrief feature sections | MorningBrief.tsx:93+ | Substantially trimmed |
| FEEDS (every layer's `DataFeedsCard`) | CompanyContext.tsx:305 | Empty `{}` — every page shows 0 sources (see TE-4) |
| IntelligenceBrief | brief/IntelligenceBrief.tsx | **Not gated — renders for every tenant** |

---

## Appendix B — What's working well
> Briefly, because the rest of this report is critical and the team deserves the counter-weight.

- **Four-act page rhythm** (§1 Recommendation → §2 Situation → §3 Diagnosis → §4 Detail) is genuinely good editorial product design. Few analytics tools achieve this clarity.
- **Five-stage reasoning chain** on the Architecture page is the right level of transparency without leaking implementation detail. The "Watch a question flow through the stack" sample is a strong artefact.
- **Cross-layer dependency graph** is the kind of diagram that survives screenshot-into-board-pack. The dual-mode (causal / + data gaps) toggle is clever and well-executed.
- **Engagement pipeline → ship plan** is a real, defensible artefact and reads as professional consulting output rather than software product output.
- **Per-layer confidence + counter-arguments + "Challenge this"** is the most credible "we are not selling you a black box" affordance in the product.
- **Editorial typography discipline** (serif-italic for narrative, sans-semibold for chrome, gold rule for analyst's take) is consistent and tasteful where it appears. The brand has the right bones.

---

*End of audit.*
