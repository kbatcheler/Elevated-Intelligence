# Cross-layer map: page upgrade brief

Scope: `artifacts/portal/src/dependency/DependencyGraph.tsx` only (plus its imports). Single phase. Deterministic. No product decisions deferred.

Run end to end. Each task has an acceptance check. If a check fails, fix it before moving to the next task. If the typecheck breaks, fix it before declaring complete.

## Context

The page renders a fourteen-node graph with twenty-two weighted causal edges and twenty-three data-gap badges. The visual is currently the weakest element on the page: edges crisscross, edge-weight variance is too small to read, and the strongest content (three "Cross-layer insights" cards) is buried in a 220px right column. This brief restructures the page so the diagram earns its centre-stage position and the insights lead.

## Task 1: Fix the band-label clip

Today the band rail on the left of the SVG renders "CUTIVE", "ACING", "IONA", "YSTEM" instead of "EXECUTIVE", "MARKET-FACING", "OPERATIONAL", "SYSTEM". The labels are being clipped on the left edge of the SVG viewport or container.

Fix: locate the band-label text elements in the SVG. Either (a) shift the SVG viewBox to start at a negative x so the labels render in negative space, or (b) move the labels into the container in HTML, positioned absolutely outside the SVG. Whichever is less invasive. The labels must render fully without truncation at the current page width.

Acceptance: at 1440px viewport the four band labels read "EXECUTIVE", "MARKET-FACING", "OPERATIONAL", "SYSTEM" in full.

## Task 2: Promote the Cross-layer insights to the page hero

The three insight cards currently in the right sidebar ("Demand → Business performance carries 60% of the gap" etc) are the page. Move them above the graph as a hero strip.

Layout: three equal-width cards in a single row, full canvas width. Each card retains its eyebrow icon, headline, body, and "View [layer]" CTA. Style identical to existing card treatment.

When a card is hovered or clicked, the corresponding edge in the graph below highlights: the named edge renders at full opacity in coral, all other edges fade to 15% opacity, and the two endpoint nodes glow. Clicking the CTA still navigates to the target layer.

Remove the cards from their current location in the right sidebar. The right sidebar keeps Reading the graph, Top data gaps, and the new recoverable-headroom card from Task 5.

Acceptance: three hero cards render above the graph, full width. Hovering each card isolates the corresponding edge visually. The right sidebar no longer duplicates them.

## Task 3: Prune the default graph view

Today the default view renders all twenty-two weighted edges plus twenty-three data-gap connections. Forty-five lines crossing each other in 600px. Default the view to the top-weighted edges only.

Implementation: filter edges by `weight >= 0.30` for the default view. Add a small control above the graph: "Show: [Top edges] | [All edges]" as a segmented control. Default to "Top edges". The data-gaps toggle becomes a separate, secondary filter ("Annotate gaps: off | on"), defaulting to off.

Edges that the filter hides do not render at all (not faded). The data-gap badges on nodes (the +1, +2, +3 coral pills) remain visible regardless of edge filter state.

Acceptance: default view shows roughly six to nine edges, not twenty-two. "Show all" reveals the full set. The Annotate gaps toggle reveals the per-edge gap connections separately.

## Task 4: Label the top weighted edges

The two or three highest-weight edges should carry inline labels rather than being identifiable only by hover.

For edges with `weight >= 0.50`: render a small label at the edge midpoint with the weight as a percentage and a single-word descriptor. Examples: "60% Demand → Bizperf", "55% Talent → People". Label style: 10px font, semibold, navy text on a cream-light pill background, 2px corner radius.

Edges with weight below 0.50 stay unlabeled.

Acceptance: every edge with weight 0.50 or higher carries a visible inline label. Lower-weight edges remain unlabeled. Labels do not overlap with nodes or each other (use simple midpoint positioning, accept minor overlap at this level of fidelity).

## Task 5: Recoverable headroom card

The "+206pp recoverable headroom (sum across gaps, not a layer-level confidence figure)" string is currently a parenthetical aside in the stat line. It is the entire dual-signal payoff and deserves its own card.

Add a card in the right sidebar, above Reading the graph:

- Eyebrow: "DUAL SIGNAL"
- Headline (serif 28px, gold): "+[N]pp recoverable"
- Subhead (italic serif 14px): "Across [M] data gaps. Closes the headroom between today's average layer confidence and 99%."
- Body (sans 12px): "Recoverable headroom is the sum of confidence lifts across every architectural gap. It is not a layer-level figure. The Engagement pipeline page sequences the work."
- CTA: "Open Engagement pipeline →" navigates to that page.

N comes from the same computation that produces the existing "+206pp" string. M from the existing data-gap count.

Acceptance: the card renders in the right sidebar above Reading the graph. The two numbers match the existing header stat line. The CTA navigates correctly.

## Task 6: Toggle redesign

The "Causal | + Data gaps" toggle in the header reads as a button to add data gaps, not as a paired mode toggle. Replace with two clearer controls:

1. Edge visibility (the existing "Top edges | All edges" segmented control from Task 3) sits to the left of the graph header
2. The data-gaps annotation overlay becomes an independent toggle ("Annotate data gaps: on | off"), also as a segmented control, sitting next to the first

Remove the existing combined toggle entirely. Default state: Top edges, Annotate gaps off.

Acceptance: two visually distinct segmented controls render above the graph. No coral circle with a plus inside it.

## Task 7: "Hover to isolate" affordance

Today this is one comma-separated entry in the stat line ("14 nodes · 22 weighted dependencies · hover to isolate"). It announces the page's most useful interaction as a stat.

Remove "hover to isolate" from the stat line. Add a small inline coach affordance directly above the SVG: a tiny icon (lucide-react `MousePointer2`) with the text "Hover any node to isolate its dependencies" in slate-light 12px italic. Dismissable with a small "x"; dismissal persists in localStorage under `ei.depGraph.coachDismissed`.

Acceptance: the stat line no longer reads "hover to isolate". A discoverable coach hint sits above the graph and can be dismissed.

## Task 8: Contracts node badge

Every node renders a coral "+N" badge except Contracts. Either the Contracts node has zero unmet data feeds (in which case the rest of the layer's status as "warn" needs reconciling) or the badge is missing.

Check `NODES` in `DependencyGraph.tsx` and the underlying data source for the badge count. If Contracts has gaps, the badge must render. If it genuinely has none, the layer's status pill on the left sidebar should not be warn.

Pick whichever is true and apply. Document the decision in a one-line comment above the Contracts node entry.

Acceptance: either Contracts renders a +N badge matching its actual gap count, or its status across the app is consistently healthy.

## Task 9: Header stat line cleanup

After tasks 1, 5, and 7, the stat line is shorter. Tighten the remaining copy.

Current: "14 nodes · 22 weighted dependencies · hover to isolate · 23 data gaps · +206pp recoverable headroom (sum across gaps, not a layer-level confidence figure)"

New: "14 intelligence layers · 22 causal dependencies · 23 architectural gaps surfaced"

The recoverable headroom moves to the new card from Task 5. The "hover to isolate" hint moves to the coach affordance from Task 7. The parenthetical aside disappears because the new card carries the explanation in proper body copy.

Acceptance: header stat line is one line, three items, no parenthetical.

## Verification

Run before declaring complete:

1. `pnpm --filter @workspace/portal run typecheck` passes clean
2. At 1440px viewport the four band labels render fully
3. Three insight cards above the graph; hovering each isolates the corresponding edge
4. Default graph view shows six to nine edges; Show all reveals the full set
5. Top two or three edges carry inline percentage labels
6. Recoverable headroom card in the right sidebar with matching numbers
7. Two segmented controls above the graph (edge visibility + gap annotation)
8. Hover coach hint above the SVG, dismissable, persists
9. Contracts node badge resolves one way or the other, with rationale comment
10. Header stat line is the new tightened version

No em dashes anywhere in the new copy.

## Out of scope

Do not:
- Change the underlying NODES or EDGES data structure
- Change the page route key
- Change the icon or label of "Cross-layer map" in the sidebar nav
- Touch the narrator content for this page
- Modify any other page

The graph data is correct. The page just needs to lead with its strongest content and stop trying to render every connection at once.
