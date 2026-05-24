// Peer-set benchmarks. For each layer, the metrics where peer comparison
// is meaningful, with Meridian Industrial's value alongside sector median and best-in-class.
// Peer set: Home Depot, Lowe's, Ace Hardware, Tractor Supply.

export interface PeerMetric {
  metric: string;
  meridian: string;
  median: string;
  best: string;
  bestLabel: string;          // peer name leading the metric
  unit: string;
  // Position on the 0-100 spectrum where Meridian Industrial sits relative to peers.
  // 0 = worst, 50 = median, 100 = best-in-class.
  position: number;
  // tone of Meridian Industrial's position
  tone: "ahead" | "median" | "behind";
  comment: string;
}

export interface PeerBlock {
  peerSet: string;
  asOf: string;
  metrics: PeerMetric[];
}

const PEER_SET = "Home Depot · Lowe's · Ace · Tractor Supply";
const AS_OF = "Q3 2026 · Numerator panel + 10-Q filings";

export const PEERS: Record<string, PeerBlock> = {
  "business-performance": {
    peerSet: PEER_SET, asOf: AS_OF,
    metrics: [
      { metric: "Revenue growth YoY",  meridian: "−2.1%", median: "+3.4%", best: "+6.8%", bestLabel: "Tractor Supply", unit: "%",
        position: 14, tone: "behind", comment: "Bottom quartile; Tractor Supply leads on rural/agriculture mix that's structurally insulated." },
      { metric: "Operating margin",    meridian: "11.2%", median: "13.8%", best: "16.4%", bestLabel: "Home Depot",     unit: "%",
        position: 28, tone: "behind", comment: "Sector-wide compression visible, but Meridian Industrial's 240bps Q3 slip is the deepest." },
      { metric: "Customer NPS",        meridian: "38",    median: "44",    best: "56",    bestLabel: "Ace Hardware",   unit: "pts",
        position: 38, tone: "behind", comment: "Ace's local-store model commands a structural NPS premium. Median gap is the relevant target." },
      { metric: "Inventory turns",     meridian: "4.8×",  median: "5.1×",  best: "6.4×",  bestLabel: "Home Depot",     unit: "×",
        position: 48, tone: "median", comment: "On-median; Q3 stockout pattern would have lifted turns artificially, adjust for that." },
    ],
  },

  "demand-intelligence": {
    peerSet: PEER_SET, asOf: AS_OF,
    metrics: [
      { metric: "Forecast accuracy (MAPE)", meridian: "11pp", median: "8pp", best: "5pp", bestLabel: "Home Depot", unit: "pp",
        position: 22, tone: "behind", comment: "Median is the credible near-term target, HD's 5pp reflects 4 years of ML investment." },
      { metric: "Stockout days top-100",     meridian: "41",   median: "22",  best: "12",  bestLabel: "Home Depot", unit: "days",
        position: 18, tone: "behind", comment: "Concentrated in DIY/cordless. Once Supplier C is live, projected to fall to 18, back inside the peer band." },
      { metric: "Share of category, DIY",   meridian: "11.4%",median: "12.6%",best: "38.9%",bestLabel: "Home Depot", unit: "%",
        position: 42, tone: "behind", comment: "HD is the outlier; median is the live competitive set Meridian Industrial is fighting on the ground." },
    ],
  },

  "pricing-margin": {
    peerSet: PEER_SET, asOf: AS_OF,
    metrics: [
      { metric: "Gross margin, top-50 SKUs", meridian: "18.4%", median: "21.1%", best: "24.6%", bestLabel: "Tractor Supply", unit: "%",
        position: 24, tone: "behind", comment: "Match-and-bleed on cordless is the proximate cause. Match-cap brings this to 21%, sector median." },
      { metric: "Price index vs market",       meridian: "+1.4%",  median: "−0.2%", best: "−0.8%", bestLabel: "Lowe's",         unit: "%",
        position: 32, tone: "behind", comment: "Meridian Industrial prices slightly above market, fine on premium SKUs, costly on cordless where elasticity is highest." },
      { metric: "Margin pull-through rate",    meridian: "84%",    median: "91%",   best: "96%",   bestLabel: "Home Depot",     unit: "%",
        position: 38, tone: "behind", comment: "How much of headline margin actually lands after promotion + return rate. HD's discipline is industry-leading." },
    ],
  },

  "supply-chain": {
    peerSet: PEER_SET, asOf: AS_OF,
    metrics: [
      { metric: "Supplier OTD",         meridian: "78%",  median: "89%",  best: "94%",  bestLabel: "Home Depot", unit: "%",
        position: 18, tone: "behind", comment: "Supplier B's production delay drags the average. Median is recoverable once Supplier C is live." },
      { metric: "Days inventory on-hand",meridian: "62d",  median: "58d",  best: "44d",  bestLabel: "Home Depot", unit: "days",
        position: 52, tone: "median", comment: "Near-median; cost-of-carry is the constraint at the low end, demand volatility at the high end." },
      { metric: "Perfect-order rate",   meridian: "86%",  median: "92%",  best: "96%",  bestLabel: "Home Depot", unit: "%",
        position: 28, tone: "behind", comment: "DC labour shortfall pulls this down. Permanent retention fix (people-ops layer) is the lever." },
    ],
  },

  "sales-pipeline": {
    peerSet: PEER_SET, asOf: AS_OF,
    metrics: [
      { metric: "Trade win rate",        meridian: "14%",  median: "19%",  best: "24%",  bestLabel: "Home Depot",  unit: "%",
        position: 22, tone: "behind", comment: "Halved YoY (was 21%). The slip is structural to the pricing-match cycle, not the salesforce." },
      { metric: "Cycle days (trade)",     meridian: "82d",  median: "61d",  best: "48d",  bestLabel: "Ace",         unit: "days",
        position: 26, tone: "behind", comment: "Re-quoting on price moves adds an average 13d. Sales-ops quote tool is on the critical path." },
      { metric: "Pipeline coverage (Q+1)",meridian: "2.4×", median: "3.0×", best: "3.6×", bestLabel: "Home Depot",  unit: "×",
        position: 32, tone: "behind", comment: "Looks adequate but six >$300K deals distort the ratio. True coverage at $50K cap = 1.9×." },
    ],
  },

  "customer-intelligence": {
    peerSet: PEER_SET, asOf: AS_OF,
    metrics: [
      { metric: "NPS, trade segment",     meridian: "44", median: "48", best: "61", bestLabel: "Ace Hardware", unit: "pts",
        position: 42, tone: "behind", comment: "Trade NPS holds better than retail. Ace's local-store model is the benchmark to study, not match." },
      { metric: "12-month repeat rate",     meridian: "61%", median: "68%", best: "78%", bestLabel: "Home Depot", unit: "%",
        position: 38, tone: "behind", comment: "Concentrated drop in two metros (Phoenix, Atlanta). National rate masks the local issue." },
      { metric: "Service-resolution time",  meridian: "18h", median: "14h", best: "6h",  bestLabel: "Tractor Supply", unit: "h",
        position: 32, tone: "behind", comment: "Five9 staffing model + escalation routing both contribute. Tractor's regional-team model is the benchmark." },
    ],
  },

  "marketing-performance": {
    peerSet: PEER_SET, asOf: AS_OF,
    metrics: [
      { metric: "Blended ROAS",        meridian: "3.2×", median: "3.6×", best: "4.4×", bestLabel: "Lowe's",       unit: "×",
        position: 38, tone: "behind", comment: "Brand-heavy mix vs peers' performance bias. Reallocation modelled to close to median." },
      { metric: "Attribution coverage", meridian: "64%",  median: "78%",  best: "92%",  bestLabel: "Home Depot",   unit: "%",
        position: 28, tone: "behind", comment: "Below sector. MMM overlay closes the gap to ~90%; recommended in the marketing layer." },
    ],
  },
};
