// Calibration data for the System · Calibration page.
//
// The thesis the page sells: we measure ourselves. When we publish a
// claim with 79% confidence, you can read off the chart and see how
// often a 79%-confident claim from us has actually been correct over
// the last quarter. Foundry does not publish this. Tableau cannot.
//
// Numbers below are synthetic but plausible for an early-staging
// system: slight over-confidence in the 60-70% band, near-perfect at
// the extremes, with a Brier score in the 0.10-0.14 range that good
// forecast systems achieve.

export interface CalibrationBucket {
  // Midpoint of the predicted-confidence bucket, e.g. 0.65 for [60%, 70%).
  predicted: number;
  // Empirically observed hit rate for claims that landed in this bucket.
  observed: number;
  // Number of claims that fell in this bucket over the period.
  sample: number;
}

export const CALIBRATION_BUCKETS: CalibrationBucket[] = [
  { predicted: 0.25, observed: 0.31, sample: 14 },
  { predicted: 0.35, observed: 0.42, sample: 22 },
  { predicted: 0.45, observed: 0.48, sample: 38 },
  { predicted: 0.55, observed: 0.51, sample: 51 },
  { predicted: 0.65, observed: 0.62, sample: 84 },
  { predicted: 0.75, observed: 0.78, sample: 142 },
  { predicted: 0.85, observed: 0.83, sample: 168 },
  { predicted: 0.95, observed: 0.94, sample: 89 },
];

// Brier score: mean squared error between predicted probability and
// realised outcome (1 hit, 0 miss). Lower is better. Random guessing
// is ~0.25; a well-calibrated forecast system lands 0.10 to 0.15.
export const BRIER_SCORE = 0.118;

// Aggregate readouts shown in the header strip. Hand-derived from the
// bucket totals so the page never drifts: change a bucket, change the
// rollup; nothing else to keep in sync.
export const TOTAL_CLAIMS = CALIBRATION_BUCKETS.reduce((s, b) => s + b.sample, 0);
export const TOTAL_HITS = CALIBRATION_BUCKETS.reduce((s, b) => s + Math.round(b.observed * b.sample), 0);
export const OVERALL_HIT_RATE = TOTAL_HITS / TOTAL_CLAIMS;

// Quarterly window covered by the chart. Authored as a constant so the
// page header, footer, and any export header all say the same thing.
export const CALIBRATION_WINDOW = "last 90 days, 8 named tenants";

// Recent misses we are deliberately showing in the open. Each row is a
// real-shape claim with the confidence we attached and the outcome that
// disproved it; the takeaway names the change we made afterwards.
export interface CalibrationMiss {
  id: string;
  layerKey: string;     // matches a NAV layer key when relevant
  layerLabel: string;   // display label
  claim: string;        // what we said
  predictedConfidence: number; // 0-1
  outcome: string;      // what actually happened
  takeaway: string;     // what we changed in the system as a result
  daysAgo: number;
}

export const CALIBRATION_MISSES: CalibrationMiss[] = [
  {
    id: "M-014",
    layerKey: "demand-intelligence",
    layerLabel: "Demand intelligence",
    claim: "Q3 reorder rate for the Midwest cluster will lift 4 to 6 percentage points off the new winback flow.",
    predictedConfidence: 0.81,
    outcome: "Reorder rate moved 0.8 points. The winback flow underperformed in the Midwest specifically, driven by a deliverability dip in two named ESPs.",
    takeaway: "Cortex Lens now ingests ESP deliverability as a first-class signal, not as a footnote.",
    daysAgo: 41,
  },
  {
    id: "M-019",
    layerKey: "supply-chain",
    layerLabel: "Supply chain",
    claim: "Lead-time variance on the East Coast lane will compress by 12% inside six weeks once the WMS routing rule lands.",
    predictedConfidence: 0.73,
    outcome: "Variance compressed by 4% over eight weeks. A second carrier introduced a routing oscillation the model did not see.",
    takeaway: "Confounder now generates carrier-substitution counterfactuals on any lane with more than one active carrier.",
    daysAgo: 33,
  },
  {
    id: "M-027",
    layerKey: "pricing-margin",
    layerLabel: "Pricing and margin",
    claim: "Promo cadence at the current depth will erode gross margin by 80 to 110bps in the next quarter.",
    predictedConfidence: 0.66,
    outcome: "Erosion came in at 35bps. Two of three category leads pre-empted the issue without the system flagging it as the trigger.",
    takeaway: "Synthesist now stamps the operator action that pre-empted a forecast so the calibration log can credit the human, not the model.",
    daysAgo: 22,
  },
  {
    id: "M-031",
    layerKey: "talent-hr",
    layerLabel: "Talent and HR",
    claim: "Regrettable attrition in the AE cohort will exceed 14% this quarter on current quota lift.",
    predictedConfidence: 0.78,
    outcome: "Attrition closed at 9.1%. A mid-quarter territory rebalancing absorbed the pressure before it manifested.",
    takeaway: "People-ops layer now treats territory ratios as a leading signal, not a lagging one.",
    daysAgo: 18,
  },
  {
    id: "M-034",
    layerKey: "receivables",
    layerLabel: "Receivables and invoicing",
    claim: "Disputed receivables will release within 14 days once the collections workflow is reseated.",
    predictedConfidence: 0.72,
    outcome: "Median release was 23 days. Two anchor accounts re-disputed under a new pricing schedule the system had not ingested.",
    takeaway: "Contract-management feed now syncs schedule deltas hourly instead of on the renewal pulse.",
    daysAgo: 11,
  },
  {
    id: "M-036",
    layerKey: "competitive-intelligence",
    layerLabel: "Competitive intelligence",
    claim: "Competitor X will hold ad-spend share through the September window.",
    predictedConfidence: 0.69,
    outcome: "Competitor X cut spend 38% in the second week of September following a leadership change the news feed surfaced late.",
    takeaway: "External-signal cadence on leadership changes was lifted to hourly. Confidence on identity-change claims was capped at 0.60 until the cadence proves out.",
    daysAgo: 7,
  },
];

// Calibration-page CTA destinations. Centralised so the page and the
// drawer agree on where each row routes. Keys match NAV entries.
export const MISS_ROUTES = {
  layerPage: (k: string) => k,
  architecture: "intelligence-architecture",
  dataSubstrate: "data-substrate",
} as const;
