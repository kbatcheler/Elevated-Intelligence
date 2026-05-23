# Different Day | Elevated Intelligence Portal

High-fidelity interactive prototype of an enterprise intelligence portal for the fictional client **Meridian Industrial** (US diversified retail and trade, Q3 2026).

## Run

```
pnpm --filter @workspace/portal run dev
pnpm --filter @workspace/portal run typecheck
pnpm --filter @workspace/portal run build
```

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS v4 (with custom CSS variables for the brand palette)
- Recharts (all charts)
- Lucide React (all icons)
- Google Fonts: Crimson Pro (serif), Inter (sans)
- No backend. No state library. No routing library. No animation library.

## File layout

```
src/
  App.tsx                 Shell: top bar, left nav, main canvas, narrator
  index.css               Palette CSS variables, type system, utility classes
  components/
    Layer.tsx             Generic renderer used by all 10 intelligence layers
    Chart.tsx             Recharts dispatcher (composed | line | bar | stacked-bar | area)
    ConfidenceBand.tsx    60px red/amber/teal band + hover popover
    ChallengeModal.tsx    Counter-arguments + "Force re-diagnosis" theatre
  data/
    layers.ts             All 10 layer content (metrics, narrative, causes, chart, actions, gaps, counter-args)
    narrator.ts           Per-layer summary, cross-layer insights, next-steps
    architecture.ts       Five-component stack content + sample query outputs
  narrator/
    Narrator.tsx          Right-side persistent panel (320px)
  architecture/
    Architecture.tsx      System page (5-card flow + sample query expandable)
```

## How to extend

**Add a new intelligence layer**
1. Append a new entry to `LAYERS` in `src/data/layers.ts` (follow the `LayerData` interface).
2. Add a `NARRATOR[key]` entry in `src/data/narrator.ts`.
3. Add a `NAV` entry in `src/App.tsx` (icon, group, status colour).

**Change palette or type**
- All design tokens live in `src/index.css` as CSS variables and Tailwind `@theme` entries.

**Add a chart type**
- Extend `ChartSpec["kind"]` in `src/data/layers.ts` and add a branch in `src/components/Chart.tsx`.

## Design rules in force

- Card border radius 4px, 1px solid border, no shadow, no gradient (except confidence band fills).
- Serif (Crimson Pro) only for narrative / executive voice. Sans (Inter) for all chrome and data.
- Max three colours per chart. Status colours: coral (bad/prescriptive), amber (warn), teal (positive/recovery), navy (primary).
- All icons Lucide, stroke 1.5, 14–20px, colour matched to surrounding text.
