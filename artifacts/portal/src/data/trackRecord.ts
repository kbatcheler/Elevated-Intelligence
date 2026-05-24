// Historical record of committed actions, predicted vs delivered outcome.
// This is what makes the system accountable: every recommendation we've made
// has a checkable result. Hand-tuned synthetic data covering Q1 → Q3 2026.

export type OutcomeStatus = "beat" | "met" | "partial" | "missed" | "in-flight";

export interface TrackRecordEntry {
  id: string;
  closedAt: string;            // "14 Mar 2026"
  quarter: "Q1 2026" | "Q2 2026" | "Q3 2026";
  layer: string;               // layer key
  title: string;
  predicted: string;           // "+$1.4M Q1 revenue"
  delivered: string;           // "+$1.6M actual"
  variance: string;            // "+$0.2M vs predicted"
  status: OutcomeStatus;
  owner: string;
  note: string;
  predictedValue: number;      // for the rolling chart, in $M
  deliveredValue: number;      // in $M
}

export const TRACK_RECORD: TrackRecordEntry[] = [
  {
    id: "tr-001", closedAt: "21 Feb 2026", quarter: "Q1 2026",
    layer: "supply-chain",
    title: "Pre-stock Reno DC ahead of West Coast weather event",
    predicted: "+$0.8M Q1 protected revenue", delivered: "+$1.1M protected",
    variance: "+$0.3M vs predicted", status: "beat",
    owner: "J. Mendoza (DC Ops)",
    note: "Pacific storm worse than forecast. Atmospheric river extended the window; pre-stocked inventory met unanticipated DIY demand.",
    predictedValue: 0.8, deliveredValue: 1.1,
  },
  {
    id: "tr-002", closedAt: "06 Mar 2026", quarter: "Q1 2026",
    layer: "pricing-margin",
    title: "Lift price 3% on top-30 garden SKUs ahead of Lowe's promo cycle",
    predicted: "+$0.9M Q1 margin", delivered: "+$0.9M actual",
    variance: "On predicted", status: "met",
    owner: "Head of Pricing",
    note: "Elasticity coefficients held; volume unchanged within statistical noise. Became the template for the seasonal pricing reset.",
    predictedValue: 0.9, deliveredValue: 0.9,
  },
  {
    id: "tr-003", closedAt: "19 Mar 2026", quarter: "Q1 2026",
    layer: "marketing-performance",
    title: "Reallocate $80K Brand→Performance for spring campaign",
    predicted: "+1.4× ROAS lift", delivered: "+0.7× lift",
    variance: "−0.7× vs predicted", status: "partial",
    owner: "Performance Marketing Lead",
    note: "Creative refresh slipped two weeks; reallocation landed without fresh assets. Lesson: dependent-on-creative reallocations need an asset gate.",
    predictedValue: 1.4, deliveredValue: 0.7,
  },
  {
    id: "tr-004", closedAt: "02 Apr 2026", quarter: "Q2 2026",
    layer: "receivables",
    title: "Tighten terms on top-20 trade accounts (45→30d, 1% early-pay)",
    predicted: "−5d DSO · $1.6M release", delivered: "−6d DSO · $1.9M release",
    variance: "+$0.3M vs predicted", status: "beat",
    owner: "CFO + Sales",
    note: "Three accounts took the 1% discount more aggressively than modelled. Net win on both DSO and absolute working capital release.",
    predictedValue: 1.6, deliveredValue: 1.9,
  },
  {
    id: "tr-005", closedAt: "23 Apr 2026", quarter: "Q2 2026",
    layer: "talent-hr",
    title: "Open Phoenix satellite hiring location",
    predicted: "2× applicant flow", delivered: "1.8× applicant flow",
    variance: "−0.2× vs predicted", status: "met",
    owner: "Talent acquisition lead",
    note: "Within tolerance. Offer-to-accept window dropped 7 days as modelled. Pattern is now permanent, second satellite opening Q4.",
    predictedValue: 2.0, deliveredValue: 1.8,
  },
  {
    id: "tr-006", closedAt: "11 May 2026", quarter: "Q2 2026",
    layer: "demand-intelligence",
    title: "Embed weather signal in Q2 garden category replenishment",
    predicted: "+$1.2M Q2 revenue", delivered: "+$1.5M actual",
    variance: "+$0.3M vs predicted", status: "beat",
    owner: "M. Tanaka (Demand Planning)",
    note: "Unusually warm April pulled garden demand forward; correctly-weighted forecast captured the lift instead of trailing it.",
    predictedValue: 1.2, deliveredValue: 1.5,
  },
  {
    id: "tr-007", closedAt: "30 May 2026", quarter: "Q2 2026",
    layer: "sales-pipeline",
    title: "Quota-uplift contest on trade-segment new logos (8 weeks)",
    predicted: "+22 new logos", delivered: "+8 new logos",
    variance: "−14 vs predicted", status: "missed",
    owner: "VP Sales",
    note: "Pipeline-coverage assumption wrong; contest pulled forward existing pipeline rather than expanding it. Recommendation withdrawn; future revenue contests gated by coverage ratio.",
    predictedValue: 22, deliveredValue: 8,
  },
  {
    id: "tr-008", closedAt: "18 Jun 2026", quarter: "Q2 2026",
    layer: "customer-intelligence",
    title: "Named-account outreach to 15 detractor trade accounts",
    predicted: "+8 NPS in detractor cohort", delivered: "+11 NPS",
    variance: "+3 vs predicted", status: "beat",
    owner: "Head of Trade Sales",
    note: "Personal outreach dissolved most of the detractor cluster within 5 weeks. $3.1M ARR retained that the model flagged at risk.",
    predictedValue: 8, deliveredValue: 11,
  },
  {
    id: "tr-009", closedAt: "08 Jul 2026", quarter: "Q3 2026",
    layer: "supply-chain",
    title: "Move Newark DC to 5-week safety stock policy on top-30 SKUs",
    predicted: "−$0.5M stockout risk", delivered: "−$0.6M stockout risk",
    variance: "+$0.1M vs predicted", status: "beat",
    owner: "Supply Planning + Finance",
    note: "Cost of carry within budget. Becomes the template for the Dallas/Phoenix 6-week move now being recommended.",
    predictedValue: 0.5, deliveredValue: 0.6,
  },
  {
    id: "tr-010", closedAt: "29 Jul 2026", quarter: "Q3 2026",
    layer: "brand-social",
    title: "Pre-empt Q3 trade narrative with 'reliable supply' campaign",
    predicted: "+4pts trade-segment sentiment", delivered: "+3pts",
    variance: "−1pt vs predicted", status: "met",
    owner: "Brand + Trade Marketing",
    note: "Inbound trade enquiries up 14% in the first three weeks, a stronger leading indicator than the sentiment delta itself.",
    predictedValue: 4, deliveredValue: 3,
  },
  {
    id: "tr-011", closedAt: "—", quarter: "Q3 2026",
    layer: "pricing-margin",
    title: "Cap promo match at 22% on top cordless SKUs",
    predicted: "+$0.3M Q3 margin in-flight · $1.2M annualised", delivered: "In-flight (week 1 of 3)",
    variance: "Tracking to predicted", status: "in-flight",
    owner: "Head of Pricing",
    note: "First-week trading data on target. Volume held within 2pp of pre-cap baseline; margin recovered as modelled.",
    predictedValue: 1.2, deliveredValue: 0,
  },
  {
    id: "tr-012", closedAt: "—", quarter: "Q3 2026",
    layer: "supply-chain",
    title: "Fill 11 unfilled Phoenix DC shifts via Kelly MSA",
    predicted: "Throughput to ≥95% in 5d", delivered: "In-flight (day 2 of 5)",
    variance: "Tracking to predicted", status: "in-flight",
    owner: "J. Mendoza (DC Ops)",
    note: "9 of 11 shifts filled. Service-call volume on ETA queries already down 18%.",
    predictedValue: 0, deliveredValue: 0,
  },
];

export interface TrackSummary {
  total: number;
  beat: number;
  met: number;
  partial: number;
  missed: number;
  inFlight: number;
  totalPredictedDollar: number;
  totalDeliveredDollar: number;
  hitRate: number; // % of closed actions that met-or-beat
}

export function summary(): TrackSummary {
  const closed = TRACK_RECORD.filter(t => t.status !== "in-flight");
  const beat   = closed.filter(t => t.status === "beat").length;
  const met    = closed.filter(t => t.status === "met").length;
  const partial= closed.filter(t => t.status === "partial").length;
  const missed = closed.filter(t => t.status === "missed").length;
  const dollar = TRACK_RECORD.filter(t => t.id !== "tr-005" && t.id !== "tr-007" && t.id !== "tr-010" && t.id !== "tr-008");
  return {
    total: TRACK_RECORD.length,
    beat, met, partial, missed,
    inFlight: TRACK_RECORD.length - closed.length,
    totalPredictedDollar: dollar.reduce((s, t) => s + t.predictedValue, 0),
    totalDeliveredDollar: dollar.reduce((s, t) => s + t.deliveredValue, 0),
    hitRate: Math.round(((beat + met) / closed.length) * 100),
  };
}
