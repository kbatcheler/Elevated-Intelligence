// Scenario war-room — multi-lever planner. Each lever has a min/max/default
// position and a per-unit dollar impact on Q4 EBITDA, with a confidence band.
// Levers stack additively for revenue and margin, multiplicatively for cash.

export interface Lever {
  id: string;
  layer: string;
  layerLabel: string;
  title: string;
  description: string;
  unit: string;            // "%" or "shifts/wk" or "$K/wk"
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  // dollar impact in $M per unit of lever
  impactPerUnit: number;
  // dollar impact uncertainty band (±$M per unit)
  uncertaintyPerUnit: number;
  // tone for the impact
  direction: "revenue" | "margin" | "cash";
  // human descriptions of the extremes
  minLabel: string;
  maxLabel: string;
  // ceiling guidance — beyond which the lever has real risk
  cautionAbove?: number;
  cautionNote?: string;
}

export const LEVERS: Lever[] = [
  {
    id: "match-cap", layer: "pricing-margin", layerLabel: "Pricing",
    title: "Promo match-cap on cordless tools",
    description: "Cap the match depth vs Home Depot on the 24 SKUs driving the margin slip.",
    unit: "% cap", min: 18, max: 32, step: 1, defaultValue: 22,
    impactPerUnit: -0.30, uncertaintyPerUnit: 0.05,
    direction: "margin",
    minLabel: "Aggressive — 18% cap, volume risk",
    maxLabel: "Permissive — 32% cap, full match",
    cautionAbove: 26, cautionNote: "Above 26%, modelled margin recovery falls below $0.6M and the lever stops being worth the operational cost.",
  },
  {
    id: "counter-promo", layer: "demand-intelligence", layerLabel: "Demand",
    title: "SE-only DIY counter-promo",
    description: "Targeted 15%-off counter-promo, Dallas/Phoenix/Atlanta metros, 24 SKUs.",
    unit: "weeks", min: 0, max: 6, step: 1, defaultValue: 2,
    impactPerUnit: 0.45, uncertaintyPerUnit: 0.10,
    direction: "revenue",
    minLabel: "Skip the counter-promo entirely",
    maxLabel: "Six-week SE-only run",
    cautionAbove: 4, cautionNote: "Beyond 4 weeks, halo effects on full-price categories begin compressing — net revenue uplift starts decaying.",
  },
  {
    id: "phoenix-shifts", layer: "supply-chain", layerLabel: "Supply",
    title: "Phoenix DC temp-labour fill rate",
    description: "Shifts filled via Kelly Services MSA. Throughput moves linearly with shifts filled.",
    unit: "shifts/wk", min: 0, max: 15, step: 1, defaultValue: 11,
    impactPerUnit: 0.08, uncertaintyPerUnit: 0.02,
    direction: "revenue",
    minLabel: "No additional labour",
    maxLabel: "Full backfill + 4 weekend overflow",
    cautionAbove: 12, cautionNote: "Above 12 shifts/week the additional headcount runs into supervisor span-of-control limits.",
  },
  {
    id: "supplier-c", layer: "supply-chain", layerLabel: "Supply",
    title: "Activate Supplier C on cordless range",
    description: "Dual-source the top-4 velocity SKUs from the qualified alternative supplier.",
    unit: "SKUs", min: 0, max: 8, step: 1, defaultValue: 4,
    impactPerUnit: 0.22, uncertaintyPerUnit: 0.04,
    direction: "revenue",
    minLabel: "Stay sole-source on Supplier B",
    maxLabel: "Full dual-source on top-8 cordless SKUs",
  },
  {
    id: "marketing-realloc", layer: "marketing-performance", layerLabel: "Marketing",
    title: "Brand → Email reallocation",
    description: "Move spend from underperforming Brand display (1.8× ROAS) into Email (8.25× ROAS).",
    unit: "$K/week", min: 0, max: 120, step: 10, defaultValue: 50,
    impactPerUnit: 0.012, uncertaintyPerUnit: 0.003,
    direction: "revenue",
    minLabel: "Leave allocation untouched",
    maxLabel: "Aggressive $120K/week shift",
    cautionAbove: 80, cautionNote: "Above $80K/week the Email channel reaches frequency-fatigue thresholds; ROAS curve flattens.",
  },
  {
    id: "credit-holds", layer: "receivables", layerLabel: "Receivables",
    title: "Credit-hold cohort size",
    description: "Number of >45-day accounts placed on hold. Each unlocks working capital but carries account-relationship risk.",
    unit: "accounts", min: 0, max: 12, step: 1, defaultValue: 3,
    impactPerUnit: 0.27, uncertaintyPerUnit: 0.04,
    direction: "cash",
    minLabel: "No credit holds",
    maxLabel: "All 12 >45d accounts on hold",
    cautionAbove: 6, cautionNote: "Above 6 holds, named-account churn risk becomes material — modelled $1.4M ARR exposure.",
  },
];

export interface ScenarioImpact {
  revenue: number;        // $M
  margin: number;         // $M
  cash: number;           // $M
  uncertainty: number;    // $M (combined band)
  ebitda: number;         // $M
}

export function computeImpact(values: Record<string, number>): ScenarioImpact {
  let revenue = 0, margin = 0, cash = 0, varAccum = 0;
  LEVERS.forEach(l => {
    const v = values[l.id] ?? l.defaultValue;
    const delta = v - l.defaultValue;
    const impact = delta * l.impactPerUnit;
    if (l.direction === "revenue") revenue += impact;
    if (l.direction === "margin") margin += impact;
    if (l.direction === "cash") cash += impact;
    varAccum += Math.pow(Math.abs(delta) * l.uncertaintyPerUnit, 2);
  });
  // EBITDA = revenue * 0.18 (sector op-margin) + margin (margin is direct $) + cash * 0 (cash isn't EBITDA)
  const ebitda = revenue * 0.18 + margin;
  return {
    revenue: +revenue.toFixed(2),
    margin: +margin.toFixed(2),
    cash: +cash.toFixed(2),
    uncertainty: +Math.sqrt(varAccum).toFixed(2),
    ebitda: +ebitda.toFixed(2),
  };
}
