# Cross-layer map: final polish brief

Scope: five small fixes across `artifacts/portal/src/dependency/DependencyGraph.tsx`, `artifacts/portal/src/App.tsx`, `artifacts/portal/src/data/narrator.ts`, and `artifacts/portal/src/data/layers.ts`. Single phase. Deterministic. No product decisions deferred.

Run end to end. Each task has an acceptance check. If a check fails, fix it before moving to the next task. Typecheck must pass at the end.

## Task 1: Reconcile Contracts status across the app

The Cross-layer map graph now correctly shows Contracts as healthy (`status: "good"`) because DATA_GAPS has zero entries for it. The rest of the app still tags it as warn.

Three places to update:

1. `App.tsx` NAV array, find the entry `{ key: "contract-management", label: "Contract management", group: "Operational", icon: FileSignature, status: "warn" }` and change `status: "warn"` to `status: "good"`.

2. `data/layers.ts`, find the `"contract-management"` layer block. Check the layer's hero metric tones, narrative tone, and any explicit status field. If anywhere it tags as warn or bad based on a "gaps" framing, reconcile to neutral/good. The narrative content can stay as-is; only the status signalling should change.

3. Sweep the rest of `artifacts/portal/src/**/*.{ts,tsx}` for any other location where contract-management's status is hardcoded. If found, update consistently.

After fix, run the live app at the Cross-layer map page and the sidebar should show a teal (good) dot next to Contract management.

Acceptance: every status indicator for Contract management across the app reads as healthy/good. No coral or amber dots on Contract management anywhere.

## Task 2: Rewrite narrator cross-layer insights for dependency-graph

In `data/narrator.ts`, the `"dependency-graph"` key has a `cross` array with three insight cards. The first two duplicate the page hero exactly:

- "Demand → Business performance carries 60% of the gap" (duplicates hero card 1)
- "Talent gates Supply, Pricing and People at the same time" (duplicates hero card 2)

The third card ("Contracts quietly amplifies three other diagnoses") was the right kind of supplementary insight. Now Contracts is healthy so that card is stale.

Replace all three with three new supplementary insights. The right narrator panel is supplementary to the page hero, not a repeat of it. Each new insight must:

- Reference actual numbers, layer names, or feeds from `data/layers.ts` or `data/feeds.ts`
- Point to a DIFFERENT layer from those the page hero already names (page hero covers Demand, Talent, Pricing/Finance)
- Have a single-sentence headline, 12 words or under
- Have a body of 1 to 2 short sentences
- Have a `targetLayer` matching the layer the insight references

Suggested directions (use these as starting points, refine to match actual data):

- Longest-cycle gap card pointing at Receivables or Sales pipeline
- Unmet-feeds concentration card pointing at the layer with the most stale/missing feeds
- High-confidence outlier card pointing at the layer whose confidence already exceeds 85%
- Cross-band leverage card showing a System or Operational layer that feeds two Executive layers
- Capability-density card naming the DiffDay module that closes the most gaps across the most layers

Pick the three strongest. Keep the existing `icon` field convention (`link`, `alert`, `trend`, etc).

Acceptance: zero word-for-word overlap between the page hero strip and the narrator panel for this page. All three new narrator cards reference real numbers from the codebase and point to layers the hero does not name.

## Task 3: Make the +14pp and +206pp relationship explicit

The page now carries two recoverable-headroom numbers:

- Top system-confidence card: "+14pp recoverable headroom, capped at 95% so we never imply mechanical certainty"
- Right-side Dual Signal card: "+206pp recoverable"

Both are correct (14pp is capped, 206pp is the raw sum) but the relationship between them is invisible.

In the Dual Signal card body, add one sentence that ties the two numbers together. Suggested copy:

"Raw sum across all 23 gaps is +206pp. We cap the headline lift at 99% confidence, so today's actionable headroom from 81% is +14pp."

Adjust the exact wording so the math reconciles to whatever the current values are in the data. The two cards must now read as one story.

Acceptance: the Dual Signal card body explicitly references both the +206pp raw figure and the +14pp capped figure, and explains the relationship in plain language.

## Task 4: Rename the page H1 to match the sidebar nav

In `DependencyGraph.tsx`, find the page H1 ("Cross-layer dependency graph") and rename to "Cross-layer map".

The eyebrow above the H1 ("INTELLIGENCE LAYER · SYSTEM") already carries the technical framing. The friendlier "map" matches the sidebar nav and the narrator's `"dependency-graph"` references in body copy (they refer to "the cross-layer map", not "the dependency graph").

Update any other page-internal references that read "dependency graph" in user-facing copy to "cross-layer map". The route key, file name, and component name stay as they are (internal).

Acceptance: the page H1 reads "Cross-layer map" matching the sidebar nav. The eyebrow still reads "INTELLIGENCE LAYER · SYSTEM". Body copy on this page no longer uses "dependency graph" in user-facing prose.

## Task 5: Reconcile the Live Signals strip confidence value

The Live Signals strip at the top of the app currently reads (when on the Cross-layer map page): "06:42 Diagnosis re-scored, Confidence 87% (no change)". The page itself shows 81% as the system confidence.

Two possibilities:
- (a) The 87% is the Business performance layer's confidence, not the system average. In which case label it clearly: "Confidence 87% on Business performance (no change)".
- (b) The 87% is meant to be the system average and is stale. In which case reconcile to 81%.

Find the source of the 87% (likely in `data/signals.ts` or a similar fixture). Inspect adjacent signal entries to see which interpretation is intended. If signals are per-layer (most likely), apply fix (a) and update every signal entry that names a confidence number to include the layer name. If signals are system-level only, apply fix (b) and reconcile the number.

Acceptance: every confidence number in the Live Signals strip either matches the system value on the current page, or names the specific layer it refers to. No ambiguous "Confidence X%" strings remain.

## Verification

Run before declaring complete:

1. `pnpm --filter @workspace/portal run typecheck` passes clean
2. Sidebar shows a teal (good) dot next to Contract management
3. The Cross-layer map page hero strip and the narrator panel share zero word-for-word duplicate text
4. All three narrator cards reference real layers and real numbers
5. The Dual Signal card body explains the +14pp / +206pp relationship in one sentence
6. The page H1 reads "Cross-layer map"
7. Every Live Signals confidence entry either matches the page or names its layer
8. No em dashes introduced anywhere in the new copy

## Out of scope

Do not:
- Restructure the Cross-layer map page layout further
- Change the underlying NODES, EDGES, or DATA_GAPS arrays
- Touch any other page's content
- Change route keys, file names, or component names

These are five surgical fixes. The page is right; the joins between it and the rest of the app are not yet.
