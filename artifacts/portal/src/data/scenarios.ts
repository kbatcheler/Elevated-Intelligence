// Scenario definitions for the WhatIfLevers component on operational layers.
// Each scenario is a self-contained spec: levers (sliders), elasticities
// (multiplicative effects on the three modelled outputs), and a baseline
// recovery anchor that lines up with the layer's actionsRecoveryUsd pill.
//
// The component reads exactly one Scenario at a time, so adding a new layer
// = add a row in SCENARIOS below + flip showWhatIf in Layer.tsx via
// scenarioForLayer().

export interface Lever {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  default: number;
  step?: number;
  helpText?: string;
}

// Three output metrics, every scenario produces these so the impact panel
// stays uniform across layers. `primary` is the headline number ($M
// recovery), `secondary` and `tertiary` are layer-specific colour. Labels
// are chosen so the same component template can render any scenario.
export interface ScenarioOutputs {
  primaryLabel: string;     // e.g. "Q4 EBITDA"
  primaryUnit: "USD_M" | "PP" | "PCT" | "DAYS";
  secondaryLabel: string;
  secondaryUnit: "USD_M" | "PP" | "PCT" | "DAYS";
  tertiaryLabel: string;
  tertiaryUnit: "USD_M" | "PP" | "PCT" | "DAYS";
}

export interface Scenario {
  id: string;
  layerKey: string;
  title: string;
  // baselineRecovery is the pill's recovery anchor in $M. The default lever
  // settings already produce this, the impact engine just delta-adjusts.
  baselineRecovery: number;
  levers: Lever[];
  // Per-lever elasticities into the three outputs. Read by the impact
  // engine: output = baseline + sum(levers, (v - default) * elasticity).
  elasticities: Record<string, { primary?: number; secondary?: number; tertiary?: number }>;
  // Static offsets baked into each output regardless of lever positions
  // (the "what does this layer contribute when nothing moves" baseline).
  baselineOutputs: { primary: number; secondary: number; tertiary: number };
  outputs: ScenarioOutputs;
}

const SCENARIOS: Scenario[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Pricing & margin (carried forward from the original WhatIfLevers shape)
  // baseline pill: $2.4M recovery
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "pricing",
    layerKey: "pricing-margin",
    title: "pricing policy",
    baselineRecovery: 2.4,
    levers: [
      { id: "promo",  label: "Promo depth",          unit: "%",     min: 14, max: 36,  default: 32, helpText: "Discount depth across the matched-SKU set" },
      { id: "match",  label: "Match policy SKUs",    unit: " SKUs", min: 0,  max: 80,  default: 24, helpText: "Number of SKUs auto-matched to peer price" },
      { id: "price",  label: "Headline price index", unit: "",      min: 96, max: 110, default: 104, helpText: "Index vs peer = 100" },
    ],
    elasticities: {
      promo: { primary: -0.14, secondary:  0.04, tertiary: -0.084 },
      match: { primary: -0.018, secondary: 0.005, tertiary: -0.011 },
      price: { primary:  0.22, secondary: -0.12, tertiary:  0.148 },
    },
    baselineOutputs: { primary: 0, secondary: 0, tertiary: 0 },
    outputs: {
      primaryLabel: "Margin",      primaryUnit:   "USD_M",
      secondaryLabel: "Share",     secondaryUnit: "PP",
      tertiaryLabel: "Q4 EBITDA",  tertiaryUnit:  "USD_M",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Demand intelligence
  // baseline pill: $1.45M
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "demand",
    layerKey: "demand-intelligence",
    title: "demand recovery",
    baselineRecovery: 1.45,
    levers: [
      { id: "promo",     label: "DIY promo lift",          unit: "%", min: 0, max: 25, default: 8,  helpText: "Targeted promo intensity in DIY channel" },
      { id: "inventory", label: "Inter-DC inventory move", unit: "%", min: 0, max: 30, default: 12, helpText: "Inventory reallocated to short DCs" },
      { id: "retrain",   label: "Forecast retrain",        unit: "",  min: 0, max: 1,  default: 0, step: 1, helpText: "Recalibrate the demand model on Q3 actuals" },
    ],
    elasticities: {
      promo:     { primary:  0.060, secondary: -0.025, tertiary:   0 },
      inventory: { primary:  0.040, secondary:  0,     tertiary:  -1.1 },
      retrain:   { primary:  0.300, secondary:  0,     tertiary:  -6.0 },
    },
    baselineOutputs: { primary: 0, secondary: 0, tertiary: 41 },
    outputs: {
      primaryLabel: "Revenue lift",   primaryUnit:   "USD_M",
      secondaryLabel: "Margin cost",  secondaryUnit: "USD_M",
      tertiaryLabel: "Stockout days", tertiaryUnit:  "DAYS",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Supply chain
  // baseline pill: $2.0M
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "supply-chain",
    layerKey: "supply-chain",
    title: "network resilience",
    baselineRecovery: 2.0,
    levers: [
      { id: "safety",  label: "Safety-stock days",       unit: "d",  min: 5,  max: 30, default: 14, helpText: "Buffer days held against demand variance" },
      { id: "lead",    label: "Lead-time compression",   unit: "%",  min: 0,  max: 25, default: 6,  helpText: "Tier-1 lead-time tightened by negotiation" },
      { id: "balance", label: "Dallas → Phoenix rebalance", unit: "%", min: 0, max: 40, default: 12, helpText: "Inventory shifted from Dallas to relieve OOS in Phoenix" },
    ],
    elasticities: {
      safety:  { primary:  0.06, secondary: -0.020, tertiary: -0.4 },
      lead:    { primary:  0.10, secondary:  0,     tertiary: -0.6 },
      balance: { primary:  0.07, secondary:  0,     tertiary: -0.9 },
    },
    baselineOutputs: { primary: 0, secondary: 0, tertiary: 28 },
    outputs: {
      primaryLabel: "Q4 recovery",       primaryUnit:   "USD_M",
      secondaryLabel: "Carrying cost",   secondaryUnit: "USD_M",
      tertiaryLabel: "OOS days",         tertiaryUnit:  "DAYS",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Customer intelligence
  // baseline pill: $2.1M
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "customer-intelligence",
    layerKey: "customer-intelligence",
    title: "retention recovery",
    baselineRecovery: 2.1,
    levers: [
      { id: "retention", label: "Top-decile retention rate", unit: "%", min: 78, max: 96, default: 86, helpText: "Annual retention of top-decile trade accounts" },
      { id: "nps",       label: "NPS lift",                  unit: "pp", min: 0,  max: 12, default: 3,  helpText: "NPS uplift driven by SLA close-out workflow" },
      { id: "winback",   label: "Win-back velocity",         unit: "d", min: 14, max: 90, default: 42, helpText: "Median days to recover a churned account" },
    ],
    elasticities: {
      retention: { primary:  0.18, secondary:  0.05, tertiary:  0 },
      nps:       { primary:  0.09, secondary:  0.04, tertiary:  0 },
      winback:   { primary: -0.012, secondary: 0,    tertiary: -0.05 },
    },
    baselineOutputs: { primary: 0, secondary: 0, tertiary: 78 },
    outputs: {
      primaryLabel: "Q4 LTV defended", primaryUnit:   "USD_M",
      secondaryLabel: "NPS delta",     secondaryUnit: "PP",
      tertiaryLabel: "SLA index",      tertiaryUnit:  "PCT",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Sales pipeline
  // baseline pill: $5.7M
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "sales-pipeline",
    layerKey: "sales-pipeline",
    title: "pipeline acceleration",
    baselineRecovery: 5.7,
    levers: [
      { id: "conv",     label: "Stage 3 → 4 conversion", unit: "%", min: 14, max: 32, default: 22, helpText: "Discovery → Proposal conversion rate" },
      { id: "cycle",    label: "Average deal cycle",      unit: "d", min: 35, max: 90, default: 64, helpText: "Median cycle from Qualified to Closed-Won" },
      { id: "coverage", label: "Mid-funnel rep coverage", unit: "x", min: 1.5, max: 4.5, default: 2.4, step: 0.1, helpText: "Pipeline coverage at Discovery vs target" },
    ],
    elasticities: {
      conv:     { primary:  0.32, secondary:  0,     tertiary:  0.18 },
      cycle:    { primary: -0.06, secondary: -0.4,   tertiary:  0 },
      coverage: { primary:  0.85, secondary:  0,     tertiary:  0.12 },
    },
    baselineOutputs: { primary: 0, secondary: 64, tertiary: 0 },
    outputs: {
      primaryLabel: "Pipeline value",  primaryUnit:   "USD_M",
      secondaryLabel: "Deal cycle",    secondaryUnit: "DAYS",
      tertiaryLabel: "Win rate lift",  tertiaryUnit:  "PP",
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Marketing performance
  // baseline pill: $1.8M
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "marketing-performance",
    layerKey: "marketing-performance",
    title: "attribution + creative",
    baselineRecovery: 1.8,
    levers: [
      { id: "attrib",    label: "Paid attribution accuracy", unit: "%", min: 55, max: 95, default: 67, helpText: "Server-side attribution coverage of paid conversions" },
      { id: "organic",   label: "Organic conversion lift",   unit: "%", min: 0,  max: 25, default: 4,  helpText: "Organic CR uplift from creative refresh" },
      { id: "frequency", label: "Campaign frequency",        unit: "/wk", min: 1, max: 6, default: 3,  helpText: "Top-of-funnel creative cadence per week" },
    ],
    elasticities: {
      attrib:    { primary:  0.038, secondary:  0,    tertiary:  0.45 },
      organic:   { primary:  0.052, secondary:  0,    tertiary:  0.18 },
      frequency: { primary:  0.090, secondary: -0.06, tertiary: -0.05 },
    },
    baselineOutputs: { primary: 0, secondary: 12.4, tertiary: 0 },
    outputs: {
      primaryLabel: "Q4 revenue",      primaryUnit:   "USD_M",
      secondaryLabel: "CAC payback",   secondaryUnit: "USD_M",
      tertiaryLabel: "Attribution gain", tertiaryUnit: "PP",
    },
  },
];

const SCENARIO_BY_LAYER: Record<string, Scenario> = Object.fromEntries(
  SCENARIOS.map(s => [s.layerKey, s]),
);

export function scenarioForLayer(layerKey: string): Scenario | undefined {
  return SCENARIO_BY_LAYER[layerKey];
}

export function computeImpact(scenario: Scenario, values: Record<string, number>) {
  const out = { ...scenario.baselineOutputs };
  for (const lever of scenario.levers) {
    const delta = values[lever.id] - lever.default;
    const e = scenario.elasticities[lever.id] ?? {};
    if (e.primary)   out.primary   += delta * e.primary;
    if (e.secondary) out.secondary += delta * e.secondary;
    if (e.tertiary)  out.tertiary  += delta * e.tertiary;
  }
  return out;
}
