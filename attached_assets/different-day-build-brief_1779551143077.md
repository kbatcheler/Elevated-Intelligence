# Different Day Elevated Intelligence: Autonomous Build Brief v2

## How to use this brief

Paste this entire document into the Replit agent and let it run. The work is structured as autonomous phases. Complete each phase end to end before moving to the next. Verify your own work against the acceptance criteria at the bottom of each phase. If a phase fails its criteria, fix it before proceeding rather than escalating.

Only stop and ask for input if you hit one of these blockers:

1. A change would require destroying or rewriting more than 30% of the existing codebase.
2. A dependency is missing that you cannot install or substitute.
3. Two phases conflict in a way that requires a product decision (not a technical one).

Everything else: make the call and proceed. Bias toward shipping.

## Product context (do not lose sight of this)

This is the flagship sales asset for Different Day, an applied AI implementation firm targeting mid-market companies. The product positions Different Day as elevated intelligence at the top of the tree, with a SaaS solution layer underneath. Think mini Palantir for small to mid-size businesses.

The demo currently uses a synthetic Apple Q3 2026 tenant. Every intelligence layer follows the same narrative pattern:

* §1 Recommendation: the call, with dollars attached
* §2 Situation: numbers vs plan and vs peers
* §3 Diagnosis: root causes and intervention tests
* §4 Detail: source data, drill-downs, and architectural gaps

The §4 footer is the commercial mechanism of the entire product. Every diagnosis surfaces architectural gaps that map to a Different Day engagement, with a dollar figure attached. The Engagement Pipeline page aggregates those gaps into a 90 day ship plan that becomes the joint roadmap with the buyer.

If anything you build breaks this narrative pattern or weakens this commercial mechanism, you have built the wrong thing.

## Design principles (do not violate)

1. Numbers must always be populated. Zero values in a hero position read as broken, not as empty state. If a real value is not available, generate a plausible synthetic value. Never display 0, $0.0M, or 0% as a primary number.
2. Every claim in the narrative must be traceable to either source data, a model output, or a clearly marked architectural gap.
3. Every architectural gap must map to a named Different Day solution with a dollar value.
4. Never use long em dashes anywhere in copy. Use commas, colons, or restructure the sentence. This is a hard rule.
5. Visual identity stays dark navy with warm gold accent. Cream text on dark. Coral for warnings and gaps. No new colour introductions.
6. Maintain the §1 to §4 narrative structure on every intelligence layer page. This is the product, not a style choice.
7. The product is diagnosis, not dashboard. Avoid BI dashboard tropes (raw KPI grids with no narrative, generic charts with no annotation). Every chart must be annotated with the diagnosis it supports.

---

## Phase 0: Codebase inventory and baseline

Before making any changes, audit the codebase and produce a written map.

Tasks:

* Map every intelligence layer page (all 13) and the component(s) that render its scorecard, intervention simulator, and §4 footer. Identify which components are shared versus duplicated.
* Document where per-layer pipeline values live. Business performance shows $2.4M, Finance $1.7M, Demand $1.8M, and so on. Trace whether these come from a shared fixture, individual files, or values computed from gap definitions.
* Document the data binding for the top-level tabs (Morning brief, Board pack, Intelligence). Note whether they have route handlers, view state, or are unwired.
* Confirm the Intelligence Architecture page token and latency math reconciles. Stage tokens should sum to 13,348 (4,218 + 3,104 + 2,876 + 1,942 + 1,208) and latencies should sum to 2,222ms (612 + 488 + 521 + 384 + 217).
* Inventory all fixture data files and note their structure.
* Output a short codebase map as a markdown file at `/docs/codebase-map.md`. This is your reference for later phases.

Acceptance: `/docs/codebase-map.md` exists and lists every layer page, shared component, where fixture data lives, and the current state of all known bugs from Phase 1. Do not proceed until this exists.

---

## Phase 1: Critical commercial bugs

These are the demo killers. Fix in order. None of these are optional.

### 1.1 The Engagement Pipeline page is empty

Current state:

* TOTAL INDICATIVE PIPELINE: $0.0M across 0 opportunities
* ARCHITECTURAL GAPS: 0 across 5 categories
* MISSING OR STALE FEEDS: 0 data sources
* All three sprint windows (Days 0 to 30, 31 to 60, 61 to 90) show $0.0M
* The opportunity table renders headers (Rank, Layer, Type, Opportunity, Category, Value) but no rows
* PREDICTED Q4 CONFIDENCE LIFT: +9pp is the only populated number

Required state:

* Aggregate the per-layer indicative pipeline values into the total. Sum should be approximately $25M to $32M across 30 to 45 opportunities. Source these from the existing per-layer numbers (Business perf $2.4M, Finance $1.7M, Demand $1.8M, plus the other ten layers, each between $1M and $3M).
* Architectural Gaps tile: count actual gaps defined per layer (see 1.3 below).
* Missing or Stale Feeds tile: realistic mid-teens to low-twenties number.
* Predicted Q4 confidence lift: keep +9pp but show the math on hover (top 10 opportunities, average +0.9pp each).
* Opportunity table: render 30 to 45 rows, sorted by value descending. Each row needs Rank, Layer, Type (Architectural gap, Data feed work, or Workflow integration), Opportunity name (e.g. "Contract terms and ETF exposure feed"), Category (which DiffDay solution: Contract Intelligence Hub, Contact and Ownership Intelligence, News and Market Monitor, Operations Intelligence, etc.), Value in $M.
* 90 day ship plan: sequence the top 12 opportunities into three windows. Days 0 to 30 holds the highest value, lowest coupling work (4 opportunities). Days 31 to 60 holds dependent feeds and model retrains (4 opportunities). Days 61 to 90 holds workflow and integration plumbing (4 opportunities). Each window shows its $M subtotal and lists the opportunities.

Acceptance: Engagement Pipeline page has no zero values anywhere. Table renders 30+ rows. Three sprint windows each show 4 opportunities with a $M subtotal. Sum of three windows equals the top 12 subset of total pipeline.

### 1.2 Scorecard tiles on layer pages show zeros

Current state: On Demand intelligence and likely all market-facing and operational layers, the hero scorecard tiles show 0, $0.0B, 0%, 0, while the sub-labels show the real values ("vs $17.8B plan", "vs 84% Q2", "target 5").

Required state:

* The hero number must be the actual value, not zero. Period actual should show $15.6B (the value that pairs with "vs $17.8B plan"). Forecast accuracy should show 71% (pairs with "vs 84% Q2"). Stockout days should show 41 (which already appears as 41d in the simulator).
* The Executive scorecard on Business performance works correctly ($91B, 92%, 26.1%, $148B, 61 NPS). Identify the binding pattern that works there and replicate it on every other layer page.
* Audit all 13 intelligence layers. Confirm every scorecard tile has a populated hero number.

Acceptance: Across all 13 layer pages, no scorecard hero number reads as 0, 0%, $0, $0.0B, or $0.0M.

### 1.3 Architectural gaps footer is just a dollar number

Current state: Each layer's §4 footer reads "Architectural gaps surfaced, $2.4M indicative pipeline" with no actual gaps listed.

Required state:

* Each layer surfaces 2 to 4 named gaps. Each gap shows: gap name, the confidence lift it would deliver in pp, the DiffDay solution that closes it, and the dollar pipeline value.
* The Cross-layer map page already has this data structure (e.g. "Contract terms and ETF exposure, +14pp, Contract Intelligence Hub"). Reuse the same gap inventory and extend it to cover every layer.
* Layer page gaps must reconcile with the Engagement Pipeline aggregated total from 1.1.

Acceptance: Every layer's §4 footer lists named gaps with solution mapping. Sum of all layer gap values equals the Engagement Pipeline total.

### 1.4 Data feeds footer says "0 sources, 0 live, 0 need work"

Current state: Every layer header claims "11 sources" or "14 sources" but the §4 footer contradicts with "0 sources, 0 live, 0 need work, Different Day pipeline,". Em dash followed by nothing.

Required state:

* The sources count in the §4 footer must match the layer header.
* Live, stale, and need-work split must be populated (e.g. "14 sources, 11 live, 2 stale, 1 need work").
* The trailing dangling em dash should become "Different Day pipeline $X.XM" matching the layer's pipeline value.

Acceptance: Every layer footer source count matches its header. No "0 sources" anywhere. No trailing dangling separators.

---

## Phase 2: Functional bugs

### 2.1 Top tabs are non-functional

Current state: All three buttons (Morning brief, Board pack, Intelligence) share identical className. Clicking does nothing. No active state.

Required state:

* Intelligence is the current full depth view. Keep as is.
* Morning brief is a condensed 60 second skim. Render all 13 layers as cards, each showing: layer name, headline call (one sentence), $ recovery, confidence %, one CTA per layer ("View full diagnosis"). Designed for a CEO checking before standup.
* Board pack is the formal printable view. Same content as Intelligence but optimised for print: page breaks before each §, no live data tickers, "Prepared for [Board] on [Date]" header, "Confidential" footer, single-column layout.
* Active tab gets a visible state (background fill or underline in warm gold).
* If full implementation of Morning brief or Board pack will take more than 4 hours, ship a working placeholder for that view that explains what it will become, but ship the active-state styling and routing this phase. Do not hide the tabs.

Acceptance: Clicking each tab changes the view. Active tab is visually distinct. Morning brief shows 13 cards. Board pack renders in print preview as a clean document.

### 2.2 Intervention simulator is zero'd out

Current state: On Demand intelligence, the simulator shows "Self-service promo lift 0% / 0% / baseline 0%", "Inter-DC inventory move 0% / 0% / baseline 0%", "Forecast retrain No / 0 / baseline No", modelled Revenue +$0.00M, EBITDA +$0.00M.

Required state:

* Each slider or toggle has a meaningful default value. Self-service promo lift defaults to 15% (range 0 to 25). Inter-DC inventory move defaults to 18% (range 0 to 30). Forecast retrain toggles Yes or No, default Yes.
* The modelled Q4 impact updates live as sliders move. Use linear elasticities tied to the per-layer narrative numbers. Revenue impact should land between +$0.3M and +$1.5M at default settings. EBITDA impact 30 to 40% of revenue impact.
* Stockout days should reduce as inventory move slider increases (default reduces from 41d to approximately 22d).
* Replicate this pattern on every operational layer: Supply chain, Pricing and margin, Sales pipeline, Marketing performance, People and operations, Contract management, Receivables and invoicing, Talent and HR. Each gets its own 2 to 4 simulator levers tied to its narrative.

Acceptance: At every operational layer, the simulator shows non-zero defaults, sliders move, the modelled impact updates live, and the math reconciles directionally.

### 2.3 System stats banner shows all zeros

Current state: "SYSTEM healthy, 0 live, 0 stale, 0 partial, 0 missing, 0 anomalies today".

Required state: Zero values here read as "this thing is not connected to anything," which undermines the demo from the first second. Populate with realistic values, for example "84 live, 6 stale, 3 partial, 2 missing, 3 anomalies today". The anomalies count should be clickable and open the Anomaly Inbox.

### 2.4 Anomaly Inbox shows "0 today"

Required state:

* Populate with 3 to 5 plausible anomalies for today. Examples for the Apple tenant: "iPhone 16 Pro stockout in Austin DC, day 4", "Samsung promo intensity stepped 14pp in EMEA overnight", "Forecast accuracy on Ecosystem expansion fell to 71% from 84% baseline".
* Each anomaly shows: time detected, source feed, narrative summary, which intelligence layer is affected, CTA "Investigate" linking to that layer.
* Update the count in the banner and the button to match.

---

## Phase 3: Demo tenant variants

The Apple tenant is impressive but commercially misaligned. The buyer for Different Day is a $50M to $500M revenue mid-market business, not Tim Cook. Numbers like $99B revenue and $148B cash unconsciously read as "this is for someone else." Apple makes sense as a keynote demo or investor pitch artefact. It does not make sense as the first impression for a sales conversation with a mid-market CFO.

### 3.1 Build a second tenant: mid-market

* Create a second tenant fixture: a mid-market specialty manufacturer at approximately $180M annual revenue, 850 employees, four sites across the US, B2B with some D2C. Name: "Meridian Industrial". Use a synthetic logo (simple geometric mark in warm gold on dark navy).
* Same intelligence architecture, same §1 to §4 narrative structure, same 13 layers. Different numbers, different stakes.
* Headline numbers: Revenue plan $180M, Q3 actual $164M (9% behind plan). Operating margin target 14.2%, actual 11.8%. Cash position $11M against $14M plan. Customer NPS 47 vs 52 prior quarter.
* Per-layer pipeline values scale proportionally (Business performance approximately $0.4M, Finance approximately $0.3M, Demand approximately $0.3M, and so on) for a total Engagement Pipeline of approximately $4M to $5M. This is the right order of magnitude for mid-market and is the actual sellable engagement size.
* Narratives are mid-market specific: enterprise vs DIY channel mix, supplier concentration risk on a single resin supplier, contract labour at one plant, regional rep performance variance, working capital tied up in slow-moving SKUs, etc.

### 3.2 Tenant switcher

* The top-left tenant pill currently shows "Q3 2026, Apple Inc., Direct, carrier, enterprise, third-party retail". Make this a working dropdown with two tenants: Apple Inc (existing) and Meridian Industrial (new).
* Switching tenant changes all fixture data across the app. Persist selection across page navigation.
* Default tenant on initial load: Meridian Industrial (the prospect-shaped one). Apple is the wow version for keynote and investor demos but not the first impression a mid-market buyer should see.

Acceptance: Both tenants are fully populated across all 13 intelligence layers, Engagement Pipeline, Cross-layer map, Intelligence Architecture, and the special pages. Switcher works without page reload.

---

## Phase 4: Strategic UX improvements

### 4.1 "Powered by [Module]" callouts on every operational layer

Current state: Only Demand intelligence shows "Powered by Demand by Different Day, Demand planning module". This is the most important upsell mechanism in the product and it is used once.

Required state:

* Every operational layer gets a "Powered by [Module name], [Capability]" callout in the header, directly under the layer title.
* Use module names tied to the Cross-layer map solution catalogue. Pricing and margin becomes "Powered by Pricing Sentinel, Margin protection module". Supply chain becomes "Powered by Operations Intelligence, Network orchestration module". Receivables becomes "Powered by Cash Runway, Working capital module". Build out the full set.
* Each callout is clickable, opening a side panel with: what the module does, what data feeds it needs, what additional capability it unlocks, indicative annual contract value.

### 4.2 Promote Intelligence Architecture as the lead demo page

The Intelligence Architecture page (Cortex Lens, Confounder, Challenger, Synthesist, Evaluator) is the strongest commercial story in the product. It is the answer to AI commoditisation. It should not be buried in the sidebar.

Required state:

* Add a hero entry point on the landing or Morning brief view: "How this works" with a short visual of the 5 stage chain and a CTA "See it in action".
* On the Intelligence Architecture page itself, add a short overlay on first visit that animates the chain: each stage lights up in sequence with its token count, then settles to the static view. Make this skippable.
* Add a CTA at the bottom of the Intelligence Architecture page: "Every layer's diagnosis routes through this chain. The architectural gaps it logs become your engagement pipeline." Link to Engagement Pipeline.

### 4.3 Confidence and gap as a dual signal

Current state: Confidence shows as a % on each layer header (87%, 91%, 84%). The deeper point, that gaps are the paid component of confidence, is not visualised.

Required state:

* Below the confidence % on each layer header, add a small visual: "Confidence 87%, close 3 gaps to reach 96%" with the 3 gaps named on hover.
* On Cross-layer map, add a top-of-page summary: "Across all 13 layers, current average confidence is 87%. Closing the top 10 architectural gaps lifts this to 96%. Indicative pipeline $X.XM."
* This is the entire commercial pitch in one frame. Make it visually distinct (warm gold accent, not the default cream on navy).

### 4.4 Narrator persona

Current state: "Katherine Boyd, Lead analyst, KB" appears in the top bar but never elsewhere. Named but invisible.

Required state:

* Every layer diagnosis gets a one-line "Analyst's take" from Katherine, sitting directly above the §1 Recommendation narrative.
* Format: KB avatar, italic single sentence, "Diagnosed [date], [time]". Tone is direct and conviction-led, no hedging. Example: "The pricing reversal is the only Q4 lever that recovers before the Samsung holiday push. Everything else is structural."
* For the mid-market tenant, use a different named analyst (e.g. "Marcus Vance, Lead analyst, MV") to demonstrate the multi-tenant pattern.

---

## Phase 5: Sections not yet audited

These sections have not been reviewed in depth. Treat them as suspect. Audit each against the same standards: no zero values, populated content, working interactions.

### 5.1 Scenario war-room

Required functionality: ability to model multiple intervention scenarios side by side, each showing revenue, EBITDA, and cash impact. A "commit this scenario" action adds its interventions to Committed actions.

### 5.2 Committed actions

Required: list of interventions that have been committed across all layers (via the COMMIT buttons on layer pages). Each shows: action, layer of origin, dollar value, owner, date committed, status (planning, in-flight, shipped), predicted vs actual impact where data exists.

### 5.3 Outcome track record

Required: historical record of past diagnoses and their predicted vs actual outcomes. This is the trust signal that distinguishes Different Day from "another AI dashboard." Populate with 12 to 20 historical entries spanning 4 quarters, showing prediction accuracy in the 75 to 90% range, with named misses to maintain credibility. Perfect accuracy reads as fake.

### 5.4 Interactive controls

Audit and fix each:

* SWITCH button: unclear purpose currently. Either give it a clear function (switch between perspective modes: Operator view, Investor view, Board view) or remove it.
* LENS dropdown (currently "ALL"): should filter the active layer's content by a dimension (channel, region, product line, customer segment). Should change scorecard values, charts, and narratives when active.
* "Challenge this" button on each layer header: should open a dialog showing the adversarial analysis the Challenger stage ran on this diagnosis. Use the existing Intelligence Architecture content as the pattern. This makes the explainability story tangible at the point of decision.
* "Ask Different Day" button: should open a chat panel. If a live LLM integration is out of scope, ship a scripted version with 6 to 8 prepared Q&A pairs covering common buyer questions ("How do you handle our messy CRM data?", "What if we don't have an FP&A tool?", "What does implementation look like?", "What's the typical engagement size?", etc.). Mark scripted responses as "demo response" so they are not mistaken for production.

---

## Phase 6: Polish pass and smoke test

* Audit every page for em dashes and replace with commas, colons, or restructured sentences. This applies to all narrative copy across both tenants. Use a regex search for the long em dash character to catch them all.
* Audit for any remaining zero values in hero positions across all pages and both tenants.
* Confirm tenant switcher works across all pages without state loss.
* Confirm all CTAs and navigation work: Challenge this, COMMIT, View full diagnosis, Investigate, Ask Different Day, every sidebar entry.
* Test on mobile viewport (375px wide). Intelligence layers should be readable, sidebar should collapse to a hamburger, charts should reflow. If mobile is broken beyond minor reflow issues, flag and skip rather than redesign.
* Update the page meta description from the default Replit text to: "Different Day Elevated Intelligence: applied AI for mid-market companies, decision-grade diagnosis with the SaaS layer that closes the gaps." Update OG title and Twitter description similarly. Keep all under 160 chars.
* Generate a branded OG image (dark navy, warm gold accent, product name "Different Day Elevated Intelligence"). Replace the default Replit OG image.
* Add a favicon if missing. Simple geometric mark in warm gold.

---

## Final acceptance criteria

Before reporting back as complete, confirm every one of the following:

1. Zero hero values do not appear anywhere across either tenant.
2. Both tenants (Apple Inc and Meridian Industrial) are fully populated across all 13 layers, the 6 system pages, and all special controls.
3. Engagement Pipeline reconciles to the sum of per-layer pipeline values.
4. All 3 top tabs (Morning brief, Board pack, Intelligence) and the 13 layers plus 6 system pages render real content.
5. Intervention simulators on all 8 operational layers respond to user input.
6. Anomaly inbox shows populated anomalies, system stats banner shows non-zero counts.
7. Every operational layer has a "Powered by" module callout.
8. Confidence and gap dual signal appears on every layer header and on Cross-layer map.
9. Narrator persona appears with a one-line take above §1 on every layer.
10. No long em dashes anywhere in copy.
11. Mobile viewport renders without breakage.
12. Page meta and OG tags are branded and accurate.

## Final deliverable

Produce a build report at `/docs/build-report.md` summarising:

* What changed, organised by phase.
* Anything you could not ship and why (with proposed next steps).
* Screenshots of the 5 most important pages on both tenants (Business performance, Demand intelligence, Engagement Pipeline, Intelligence Architecture, Cross-layer map).
* Any architectural debt taken on that should be paid down in a future pass.

Ship the report only when all final acceptance criteria are met. If any criterion is unmet, fix it before producing the report.
