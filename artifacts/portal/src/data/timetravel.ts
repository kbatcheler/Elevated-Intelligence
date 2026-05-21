// Per-layer historical snapshots for the time-travel slider.
// Each layer has three timepoints: 7 days ago, 3 days ago, now.
// The slider lerps confidence and overlays a snapshot summary.

export interface Snapshot {
  label: string;
  diagnosedAt: string;
  confidence: number;
  headline: string;        // short summary of what the diagnosis said then
  delta?: string;          // what changed since prior snapshot
}

export type Timeline = [Snapshot, Snapshot, Snapshot];

const NOW_LABEL = "Now · Oct 14";
const MID_LABEL = "−3 days · Oct 11";
const OLD_LABEL = "−7 days · Oct 7";

export const TIMELINES: Record<string, Timeline> = {
  "business-performance": [
    { label: OLD_LABEL, diagnosedAt: "Oct 7, 2026 · 06:42 CT",  confidence: 71, headline: "Revenue tracking 4% behind plan; cause unclear — three candidate layers." },
    { label: MID_LABEL, diagnosedAt: "Oct 11, 2026 · 06:42 CT", confidence: 79, headline: "Demand and Pricing isolated as primary drivers. Supply secondary.", delta: "+8pp · Demand isolated" },
    { label: NOW_LABEL, diagnosedAt: "Oct 14, 2026 · 06:42 CT", confidence: 87, headline: "8% behind plan, 380bps margin gap. Pricing is the fastest reversible lever.", delta: "+8pp · Pricing identified as lever" },
  ],
  "demand-intelligence": [
    { label: OLD_LABEL, diagnosedAt: "Oct 7, 2026 · 05:18 CT",  confidence: 68, headline: "Variance widening, but driver attribution split across competitor / supply / forecast." },
    { label: MID_LABEL, diagnosedAt: "Oct 11, 2026 · 05:18 CT", confidence: 76, headline: "Competitor promo intensity confirmed as primary driver (−$1.2M).", delta: "+8pp · Competitor confirmed" },
    { label: NOW_LABEL, diagnosedAt: "Oct 14, 2026 · 05:18 CT", confidence: 84, headline: "Three compounding causes sized: competitor promo, stockout, forecast drift.", delta: "+8pp · 3 causes sized" },
  ],
  "competitive-intelligence": [
    { label: OLD_LABEL, diagnosedAt: "Oct 6, 2026 · 22:51 CT",  confidence: 62, headline: "Share erosion visible but cause not yet attributable to specific competitor." },
    { label: MID_LABEL, diagnosedAt: "Oct 10, 2026 · 22:51 CT", confidence: 71, headline: "Home Depot promo intensity in SE markets identified as primary driver.", delta: "+9pp · HD identified" },
    { label: NOW_LABEL, diagnosedAt: "Oct 13, 2026 · 22:51 CT", confidence: 79, headline: "HD promo at 1.8× baseline in 5 SE markets; share loss 2.1pp YoY.", delta: "+8pp · scale quantified" },
  ],
  "customer-intelligence": [
    { label: OLD_LABEL, diagnosedAt: "Oct 7, 2026 · 14:02 CT",  confidence: 74, headline: "NPS softening; service ticket trend not yet linked to inventory." },
    { label: MID_LABEL, diagnosedAt: "Oct 11, 2026 · 14:02 CT", confidence: 79, headline: "Order-ETA tickets confirmed linked to DC inventory gap.", delta: "+5pp · linkage confirmed" },
    { label: NOW_LABEL, diagnosedAt: "Oct 14, 2026 · 14:02 CT", confidence: 81, headline: "Detractor cluster localised to Phoenix metro; 12 named accounts at risk.", delta: "+2pp · accounts named" },
  ],
  "brand-social": [
    { label: OLD_LABEL, diagnosedAt: "Oct 7, 2026 · 11:14 CT",  confidence: 70, headline: "Sentiment stable; no negative cluster detected." },
    { label: MID_LABEL, diagnosedAt: "Oct 11, 2026 · 11:14 CT", confidence: 74, headline: "Early 'price gouging' narrative forming on social.", delta: "+4pp · narrative emerging" },
    { label: NOW_LABEL, diagnosedAt: "Oct 14, 2026 · 11:14 CT", confidence: 78, headline: "Negative cluster confirmed (14 mentions/6h); brand sentiment −6pts.", delta: "+4pp · cluster confirmed" },
  ],
  "supply-chain": [
    { label: OLD_LABEL, diagnosedAt: "Oct 7, 2026 · 03:42 CT",  confidence: 66, headline: "Phoenix throughput soft; cause not yet attributable to labour vs inbound." },
    { label: MID_LABEL, diagnosedAt: "Oct 11, 2026 · 03:42 CT", confidence: 74, headline: "Labour shortfall identified as primary; Supplier B secondary.", delta: "+8pp · labour isolated" },
    { label: NOW_LABEL, diagnosedAt: "Oct 14, 2026 · 03:42 CT", confidence: 81, headline: "11 unfilled DC shifts next week; Supplier B 6h ASN slippage.", delta: "+7pp · risks quantified" },
  ],
  "pricing-margin": [
    { label: OLD_LABEL, diagnosedAt: "Oct 7, 2026 · 09:24 CT",  confidence: 73, headline: "Margin slipping; promo policy not yet identified as driver." },
    { label: MID_LABEL, diagnosedAt: "Oct 11, 2026 · 09:24 CT", confidence: 79, headline: "Match-not-beat policy on 24 SKUs flagged as primary lever.", delta: "+6pp · lever named" },
    { label: NOW_LABEL, diagnosedAt: "Oct 14, 2026 · 09:24 CT", confidence: 82, headline: "240bps margin compression; recovery sized at $1.2M with policy reset.", delta: "+3pp · recovery sized" },
  ],
  "sales-pipeline": [
    { label: OLD_LABEL, diagnosedAt: "Oct 7, 2026 · 16:14 CT",  confidence: 65, headline: "Win rate sliding; cause unclear (competitor vs cycle vs pricing)." },
    { label: MID_LABEL, diagnosedAt: "Oct 11, 2026 · 16:14 CT", confidence: 73, headline: "Cycle days +13d (vs Q2); proposal-to-negotiation drop primary.", delta: "+8pp · stage isolated" },
    { label: NOW_LABEL, diagnosedAt: "Oct 14, 2026 · 16:14 CT", confidence: 78, headline: "Q4 coverage 2.4× vs 3.1× target — commit at risk without acceleration.", delta: "+5pp · Q4 risk sized" },
  ],
  "marketing-performance": [
    { label: OLD_LABEL, diagnosedAt: "Oct 7, 2026 · 12:08 CT",  confidence: 71, headline: "Channel mix imbalance visible; ROAS by channel still aggregating." },
    { label: MID_LABEL, diagnosedAt: "Oct 11, 2026 · 12:08 CT", confidence: 76, headline: "Brand + Display below 2.0× ROAS; reallocation candidates.", delta: "+5pp · candidates surfaced" },
    { label: NOW_LABEL, diagnosedAt: "Oct 14, 2026 · 12:08 CT", confidence: 80, headline: "Reallocate $50K Brand→Email expected to lift Q4 ROAS to 3.4×.", delta: "+4pp · move sized" },
  ],
  "people-operations": [
    { label: OLD_LABEL, diagnosedAt: "Oct 7, 2026 · 08:52 CT",  confidence: 70, headline: "DC Ops attrition climbing; trend not yet 2σ-significant." },
    { label: MID_LABEL, diagnosedAt: "Oct 11, 2026 · 08:52 CT", confidence: 76, headline: "DC Ops + Customer Service confirmed over attrition target.", delta: "+6pp · 2 teams flagged" },
    { label: NOW_LABEL, diagnosedAt: "Oct 14, 2026 · 08:52 CT", confidence: 80, headline: "DC Ops at 24% annualised (vs 12% target); 34 critical roles open.", delta: "+4pp · scale quantified" },
  ],
  "finance": [
    { label: OLD_LABEL, diagnosedAt: "Oct 7, 2026 · 06:08 CT",  confidence: 76, headline: "EBITDA trending below plan; cause not yet decomposed." },
    { label: MID_LABEL, diagnosedAt: "Oct 11, 2026 · 06:08 CT", confidence: 82, headline: "Cash bridge attributes $4.2M to margin; $1.6M to opex; $0.7M to working capital.", delta: "+6pp · bridge built" },
    { label: NOW_LABEL, diagnosedAt: "Oct 14, 2026 · 06:08 CT", confidence: 86, headline: "EBITDA $6.5M below plan, all three drivers sized and routed.", delta: "+4pp · drivers sized" },
  ],
  "receivables": [
    { label: OLD_LABEL, diagnosedAt: "Oct 7, 2026 · 07:42 CT",  confidence: 78, headline: "DSO drifting up; bucket aging within tolerance." },
    { label: MID_LABEL, diagnosedAt: "Oct 11, 2026 · 07:42 CT", confidence: 83, headline: "Greater Plains Co. + 8 named debtors carrying 60% of overdue.", delta: "+5pp · debtors named" },
    { label: NOW_LABEL, diagnosedAt: "Oct 14, 2026 · 07:42 CT", confidence: 88, headline: "DSO 47d (vs 32d target); $1.8M >60d, credit hold recommended on 3 accounts.", delta: "+5pp · holds recommended" },
  ],
  "talent-hr": [
    { label: OLD_LABEL, diagnosedAt: "Oct 7, 2026 · 10:18 CT",  confidence: 72, headline: "Funnel conversion soft; bottleneck not yet identified." },
    { label: MID_LABEL, diagnosedAt: "Oct 11, 2026 · 10:18 CT", confidence: 78, headline: "Offer-to-accept stage isolated as primary bottleneck.", delta: "+6pp · stage isolated" },
    { label: NOW_LABEL, diagnosedAt: "Oct 14, 2026 · 10:18 CT", confidence: 82, headline: "Senior buyer + 5 critical roles >80d open; comp gap quantified at 12%.", delta: "+4pp · gap quantified" },
  ],
};
