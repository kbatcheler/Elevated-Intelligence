# Different Day Elevated Intelligence: Full Audit Prompt

## Mission

You are auditing a production demo. The product is at elevated.diffday.info. It is the flagship sales asset for Different Day, an applied AI firm targeting mid-market companies. The narrative thesis is "mini Palantir for mid-market": elevated intelligence at the top, SaaS modules underneath that close the data gaps surfaced by the intelligence layer.

Your job is to find every issue that would weaken this demo when a CFO or CEO sits in front of it. You are not following a punch list. You are using your own judgment to identify what is broken, what is misleading, what is empty when it should be full, and what reads as unfinished even when technically functional.

You have two surfaces to inspect: the live application (run it locally if possible, otherwise audit against the deployed URL) and the codebase. Cross-reference both. A page may render without error but bind to a fixture that is empty. The codebase may contain unused components, dead routes, or fixture data that never makes it to the UI. You need both views to see the full picture.

## Operating principles

1. **Think like a sceptical buyer, not a developer.** A page that renders without a JS error but shows $0.0M as a primary number is broken. A button with no visible active state is broken. A narrative that contradicts a number elsewhere on the page is broken. Hold the product to the standard of "would a CFO trust this," not "does it run."

2. **Cross-reference everything.** If the page header says "14 sources" and the §4 footer says "0 sources," that is a contradiction worth flagging even if both render successfully. If a component imports a fixture that is empty, that is a bug even if the build passes.

3. **Flag intent gaps, not just code bugs.** If a button exists with no clear function, flag it. If a section is present but visually weaker than other sections, flag it. If a control is unlabeled or its purpose is ambiguous, flag it.

4. **Reserve judgment when uncertain.** If you cannot tell whether something is intentional or a bug, flag it as "ambiguous" with your reasoning rather than dismissing it.

5. **Quantify severity.** Rank every issue as one of:
   * **Demo killer**: a buyer would notice in the first minute
   * **Trust eroder**: a buyer would notice on careful review or second viewing
   * **Polish**: a sophisticated viewer would notice

6. **Record findings as you go.** Do not try to hold the audit in memory. Append to the report as you discover each issue. The report should be your working document, not a final write-up.

## Methodology

### Pass 1: User-facing functional walkthrough

Use a headless browser (Playwright or Puppeteer, install if not available) to walk the site as a user would. Inspect the actual DOM, not just visual screenshots. Many of the issues here are data-binding bugs where a sub-label masks a zero hero value: a screenshot looks fine, the DOM reveals the bug.

Document every interactive control. For each:
* Click it. Does it do what its label suggests?
* Does it have an active or selected state if it should?
* Does it route somewhere meaningful or update content?
* If it triggers a panel, modal, or content change, does the new content make sense?

Walk every intelligence layer page (there are 13). For each layer, audit:
* Are scorecard hero numbers populated, or do they show 0, $0, 0%, $0.0B?
* Does the §1 Recommendation narrative match the §2 Situation numbers?
* Does the §3 Diagnosis sum correctly? Root cause dollar figures should approximately add to the variance.
* Does §4 list named architectural gaps, or just a dollar number?
* Does the source count in the §4 footer match the source count in the layer header?
* Does the intervention simulator have non-zero defaults? Do sliders move? Does the modelled impact update live as sliders move?

Walk every system page: Intelligence architecture, Engagement pipeline, Cross-layer map, Scenario war-room, Committed actions, Outcome track record. For each:
* Is every hero number populated?
* Do interactive elements (filters, hovers, sliders, tabs) work?
* Does the page tell a coherent commercial story?
* Intelligence Architecture specifically: do the token counts and latencies reconcile across the 5 stages? Sum should match the headline numbers.
* Engagement Pipeline specifically: does the total reconcile with the sum of per-layer pipeline values referenced on each layer's §4 footer?
* Cross-layer map specifically: do the gap names and pp lifts match what appears on each layer's §4 footer?

Walk the top-level controls: Morning brief, Board pack, Intelligence tabs, Switch button, Lens dropdown, tenant pill, Ask Different Day, Anomaly inbox, Challenge this, COMMIT buttons. For each:
* Does clicking change state?
* Is the active state visible to the user?
* Does the content behind it match the label?
* If it does nothing, is that intentional (a label-only element) or a wiring bug?

Test on mobile viewport (375px wide). Note any layout breakage, overflow, or unreadable content.

### Pass 2: Codebase audit

Walk the codebase. For each finding from Pass 1, locate the responsible code and identify the root cause. For each layer that shows zero values, find the data binding and determine: is the fixture empty, is the binding broken, or is the component defaulting to zero?

Also flag, independently of Pass 1 findings:
* Components or routes defined but never used (dead code)
* Fixture data that exists in files but is not rendered anywhere (orphan data)
* Duplicate components rendering the same content with diverging logic (drift risk)
* Hard-coded values that should be coming from fixtures (will fail when tenant switches)
* Long em dashes anywhere in copy or content files (brand standard is no em dashes, use commas, colons, or restructure)
* Console errors and warnings in the browser dev tools
* Network requests that 404 or 500
* Components with conditional rendering logic that may never resolve to the visible branch

### Pass 3: Commercial coherence audit

This pass is judgment-heavy. Read the product as a buyer.

* Does the narrative on each intelligence layer feel like a human analyst wrote it, or does it feel templated? Are the templates obvious (same sentence structure across layers, same modifier words)?
* Does the §4 "Different Day pipeline" footer feel like a credible commercial mechanism, or like a tacked-on upsell?
* Does the Apple Inc tenant fit the buyer (mid-market companies)? Or does the scale of the numbers ($99B revenue, $148B cash) make the product feel aspirational at best, irrelevant at worst?
* Is the Intelligence Architecture story (Cortex Lens, Confounder, Challenger, Synthesist, Evaluator) discoverable from the landing surface, or buried in the sidebar?
* Are the commercial mechanics (gap surfacing on layers, solution mapping on Cross-layer map, pipeline aggregation on Engagement Pipeline) connected end to end, or do they break somewhere in the middle?
* Is the narrator persona (Katherine Boyd, Lead analyst) used or just named? If named but invisible, that is a missed opportunity.
* Where does the product weaken its own commercial story?

## Output

Produce a single audit report at `/docs/audit-report.md` with this structure:

### 1. Executive summary

Maximum 200 words. The 5 most important findings, ranked. Write to a busy founder, not a developer.

### 2. Demo killers

Every issue ranked Demo killer. For each:
* Issue (one sentence)
* Where it appears (page, component, file path)
* What a buyer would see
* Root cause (your diagnosis from the codebase)
* Suggested fix (one line, plus effort estimate: XS, S, M, L)

### 3. Trust eroders

Same structure as Demo killers, lower severity.

### 4. Polish

Same structure, lowest severity.

### 5. Codebase health

* Dead code or unused components (with file paths)
* Orphan fixture data
* Duplicate components and drift risk
* Hard-coded values that should be fixture-driven
* Em dash count and locations
* Console errors and network failures
* Any other technical debt that does not surface in the UI

### 6. Commercial coherence

Your judgment-heavy findings. Where does the product weaken its own commercial story? Where is the narrative thesis (mini Palantir for mid-market, gaps-to-pipeline mechanism) inconsistent with what the UI actually shows?

### 7. Open questions

Things you flagged as ambiguous, with your reasoning, where a product call is needed before fixing.

## What "complete" looks like

Your audit is complete when:

1. Every interactive control on the live site has been clicked and the outcome documented.
2. Every intelligence layer and every system page has been walked end to end.
3. The codebase has been inspected and findings linked to file paths.
4. The audit report has all seven sections populated.
5. Severity ratings are applied consistently and you can defend them.

Do not produce the report until all five conditions are met. If you hit a blocker (something you cannot test or cannot understand from the code), include it in Open questions rather than skipping it. Skipping a section is worse than admitting you could not audit it.

## Scope boundary

Do not propose fixes in the report beyond a one-line suggestion. The fix work is a separate brief. Your job here is diagnosis, not construction.

Do not start fixing things you find. Resist the urge. Even obvious bugs go in the report, not into the code. The value of this audit is the comprehensive map, and you destroy that value if you start patching mid-walk.

Only exception: if you discover that the site is unreachable, the build is broken, or you cannot run the audit at all without a small fix (e.g. a missing dependency), make that fix and document it under Open questions. Everything else goes in the report.
