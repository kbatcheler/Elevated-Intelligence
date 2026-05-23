export type Tone = "good" | "bad" | "warn" | "neutral";
export type GapCategory = "DATA" | "INTEG" | "MODEL" | "WORKFLOW" | "SIGNAL";

export interface Metric { label: string; value: string; sub: string; tone: Tone; }
export interface Cause  { title: string; impact: string; detail: string; }
export interface Action { title: string; detail: string; impact: string; }
export interface Gap    { category: GapCategory; title: string; detail: string; }

export interface ChartSpec {
  kind: "composed" | "line" | "stacked-bar" | "bar" | "area";
  data: any[];
  series: { key: string; name: string; color: string; type?: "line" | "bar" }[];
  xKey: string;
  yLabel?: string;
}

export interface LayerData {
  key: string;
  group: "Executive" | "Market-facing" | "Operational" | "System";
  title: string;
  question: string;
  confidence: number;          // 0–100
  sources: number;
  diagnosedAt: string;
  metrics: Metric[];
  narrative: string;
  causes: Cause[];
  chartTitle: string;
  chart: ChartSpec;
  actions: Action[];
  actionsRecoveryUsd: string;  // pill text
  gaps: Gap[];
  gapsPipelineUsd: string;
  counterArgs: { title: string; ci: string; detail: string }[];
}

const NAVY = "#1B2A4E";
const CORAL = "#D85A30";
const TEAL = "#1D9E75";
const GOLD = "#C8A24A";
const SLATE = "#6B7280";

export const LAYERS: LayerData[] = [
  {
    key: "business-performance",
    group: "Executive",
    title: "Business performance",
    question: "How is the business performing against plan?",
    confidence: 87,
    sources: 14,
    diagnosedAt: "Oct 14, 2026 · 06:42 CT",
    metrics: [
      { label: "Revenue",        value: "$127M",  sub: "vs $138M plan",       tone: "bad"  },
      { label: "Operating margin", value: "11.4%", sub: "vs 15.2% target",     tone: "bad"  },
      { label: "Cash position",  value: "$42M",   sub: "vs $38M plan",        tone: "good" },
      { label: "Customer NPS",   value: "38",     sub: "vs 41 prior quarter", tone: "warn" },
    ],
    narrative:
      "Mercer ended Q3 8% behind revenue plan and 380 basis points behind margin target, with the cash position holding up only because working capital tightening offset trading shortfalls. The variance is not diffuse. Three layers of the business account for almost the entire gap: demand softness in DIY and Home Improvement, supply disruption that compounded the demand issue rather than offsetting it, and pricing decisions that protected volume at the expense of margin. The fastest reversible lever this quarter is in pricing, not demand or supply.",
    causes: [
      { title: "Demand variance concentrated in two channels", impact: "-$6.2M",
        detail: "DIY channel underperformed by 23% and Home Improvement category by 18%, jointly accounting for 60% of the revenue gap." },
      { title: "Supply disruption compounded rather than absorbed", impact: "-$3.1M",
        detail: "Top SKU stockouts during peak weeks meant demand softness was not partially offset by tighter inventory, and inventory days lengthened anyway." },
      { title: "Margin protection via promotion deepened erosion", impact: "-$1.8M",
        detail: "Promotional response to competitor activity defended unit volume but compressed margin by 240bps, with no recovery in share." },
    ],
    chartTitle: "Revenue versus plan, monthly",
    chart: {
      kind: "composed",
      xKey: "month",
      yLabel: "USD millions",
      data: [
        { month: "Jul", actual: 44.1, plan: 45.2 },
        { month: "Aug", actual: 40.8, plan: 46.4 },
        { month: "Sep", actual: 42.1, plan: 46.4 },
      ],
      series: [
        { key: "actual", name: "Actual", color: NAVY,  type: "bar"  },
        { key: "plan",   name: "Plan",   color: CORAL, type: "line" },
      ],
    },
    actions: [
      { title: "Reset pricing on top 50 SKUs", detail: "Targeted price corrections, not blanket increases", impact: "$1.2M" },
      { title: "Activate alternative supplier for DIY range", detail: "Supplier B already qualified, contract ready", impact: "$0.9M Q4" },
      { title: "Pull Q4 marketing forward to defend share", detail: "Mid-October rather than late November", impact: "$0.6M Q4" },
      { title: "Hold price discipline through end of October", detail: "Cease promotional matching on margin-protected lines", impact: "$0.4M margin" },
    ],
    actionsRecoveryUsd: "$3.1M predicted recovery",
    gaps: [
      { category: "DATA",     title: "Real-time competitor pricing absent", detail: "4–7 day lag prevents responsive pricing decisions" },
      { category: "INTEG",    title: "Trade segment EPOS not consolidated", detail: "23% of trade volume reports manually" },
      { category: "MODEL",    title: "Margin elasticity model out of date", detail: "Last refresh March 2025, pre-supply shock" },
      { category: "WORKFLOW", title: "No automated stock-out to PO trigger", detail: "Manual reorder process in DIY channel" },
      { category: "SIGNAL",   title: "Macro consumer sentiment signal absent", detail: "Regional confidence not in any model" },
    ],
    gapsPipelineUsd: "$2.4M indicative pipeline",
    counterArgs: [
      { title: "Macro contraction in trade segment", ci: "9% CI", detail: "Tested against trade segment performance — rejected at 91% confidence. Trade orders flat YoY across the period." },
      { title: "Single-month outlier in August", ci: "14% CI", detail: "Variance persists in September at 9.3%, eliminating outlier as primary explanation." },
      { title: "Brand-led demand erosion", ci: "11% CI", detail: "Brand sentiment decline lagged demand decline by 4–6 weeks, indicating reverse causality." },
    ],
  },
  {
    key: "demand-intelligence",
    group: "Market-facing",
    title: "Demand intelligence",
    question: "Where is demand strong, weak, or moving?",
    confidence: 84,
    sources: 11,
    diagnosedAt: "Oct 14, 2026 · 05:18 CT",
    metrics: [
      { label: "Variance vs plan",          value: "-$2.8M", sub: "12.4% below",      tone: "bad"  },
      { label: "Period actual",             value: "$19.8M", sub: "vs $22.6M plan",   tone: "neutral" },
      { label: "Forecast accuracy",         value: "71%",    sub: "vs 84% Q2",        tone: "warn" },
      { label: "Stockout days top 5 SKUs",  value: "41",     sub: "target 5",         tone: "bad"  },
    ],
    narrative:
      "Q3 demand finished $2.8M behind plan, with the variance concentrated in the DIY channel and Home Improvement category. Three compounding causes account for almost all of it: competitor promotional intensity, a portfolio stockout pattern in Dallas and Phoenix distribution centres, and forecast model degradation that has not been retrained since March. Of the three, the pricing response is the fastest to reverse.",
    causes: [
      { title: "Competitor promotional intensity", impact: "-$1.2M",
        detail: "Home Depot ran 1.8x baseline promo depth in five SE markets, redirecting DIY browse-to-buy share away from Mercer." },
      { title: "Stockout pattern in Dallas and Phoenix", impact: "-$0.9M",
        detail: "41 OOS days on the top 5 SKUs concentrated in weeks 30–34, lost peak-season conversion that does not recover later in quarter." },
      { title: "Forecast model degradation", impact: "-$0.7M",
        detail: "Demand forecast has not been retrained since March; error rose to 13pp on Home Improvement, biasing replenishment low." },
    ],
    chartTitle: "Plan versus actual demand, weekly",
    chart: {
      kind: "line",
      xKey: "week",
      yLabel: "USD millions",
      data: Array.from({ length: 13 }, (_, i) => {
        const w = 27 + i;
        const plan = 1.65 + Math.sin(i / 2) * 0.06 + 0.02 * i;
        const drag = i >= 3 && i <= 10 ? 0.18 + (i - 3) * 0.012 : 0.05;
        return { week: `W${w}`, plan: +plan.toFixed(2), actual: +(plan - drag).toFixed(2) };
      }),
      series: [
        { key: "plan",   name: "Plan",   color: NAVY  },
        { key: "actual", name: "Actual", color: CORAL },
      ],
    },
    actions: [
      { title: "Reset DIY pricing on key SKUs",         detail: "Match-not-beat policy on 24 top SKUs",      impact: "$0.42M" },
      { title: "Re-balance Dallas / Phoenix inventory", detail: "Inter-DC transfer of 3 SKU families",        impact: "$0.55M" },
      { title: "Retrain forecast model on Q3 data",     detail: "Include weather + competitor promo inputs",  impact: "$0.30M Q4" },
      { title: "Reduce promo depth on margin lines",    detail: "Step down from 32% to 22% promo intensity",  impact: "$0.18M" },
    ],
    actionsRecoveryUsd: "$1.45M predicted recovery",
    gaps: [
      { category: "DATA",     title: "Competitor pricing latency",       detail: "4–7 day lag on category-level intelligence" },
      { category: "SIGNAL",   title: "Regional weather signal absent",   detail: "Garden and Outdoor demand swings unmodelled" },
      { category: "INTEG",    title: "Store-level POS missing",          detail: "Trade channel reports daily, not hourly" },
      { category: "MODEL",    title: "Marketing attribution to demand",  detail: "Campaign-to-SKU lift not isolated in current model" },
      { category: "WORKFLOW", title: "OOS-to-PO trigger missing",        detail: "Manual replenishment review only" },
    ],
    gapsPipelineUsd: "$1.8M indicative pipeline",
    counterArgs: [
      { title: "Macro DIY contraction explains gap", ci: "10% CI", detail: "Tractor Supply and Ace posted flat-to-up DIY in same regions. Macro contraction rejected." },
      { title: "Weather-led seasonal shift", ci: "6% CI", detail: "Weather contribution sized at +$0.1M, insufficient to account for variance." },
    ],
  },
  {
    key: "competitive-intelligence",
    group: "Market-facing",
    title: "Competitive intelligence",
    question: "How is our market position shifting?",
    confidence: 79,
    sources: 9,
    diagnosedAt: "Oct 13, 2026 · 22:51 CT",
    metrics: [
      { label: "Market share",          value: "14.3%", sub: "down 2.1pp",        tone: "bad"  },
      { label: "Share of voice",        value: "11.8%", sub: "down 4pp",          tone: "bad"  },
      { label: "Win rate vs Home Depot",value: "32%",   sub: "down from 41%",     tone: "bad"  },
      { label: "Competitor promo depth",value: "32%",   sub: "vs 18% baseline",   tone: "warn" },
    ],
    narrative:
      "Mercer's market position eroded materially in Q3. Share fell 2.1pp to 14.3%, driven primarily by Home Depot's private-label expansion in the Southeast and Lowe's price aggression in Texas and the South Central region. The story is asymmetric: in volume terms the loss is concentrated in three product families and three regions. Sustained position recovery requires either matched pricing in those segments or rapid product differentiation, not both.",
    causes: [
      { title: "Home Depot private-label expansion", impact: "-1.1pp share",
        detail: "New private-label range launched across 320 SE stores at 12–18% discount to Mercer equivalents, with strong end-cap placement." },
      { title: "Lowe's promotional intensity", impact: "-0.7pp share",
        detail: "Sustained 4-week price campaign in Texas and South Central regions, depth averaging 24% on overlapping SKUs." },
      { title: "Ace Hardware availability advantage", impact: "-0.3pp share",
        detail: "During Mercer stockouts in weeks 30–34, Ace held in-stock position on top 12 overlapping SKUs and captured switchers." },
    ],
    chartTitle: "Share by competitor, last four quarters",
    chart: {
      kind: "stacked-bar",
      xKey: "quarter",
      yLabel: "Share %",
      data: [
        { quarter: "Q4 25", Mercer: 16.8, "Home Depot": 31.2, "Lowe's": 24.4, Others: 27.6 },
        { quarter: "Q1 26", Mercer: 16.4, "Home Depot": 31.6, "Lowe's": 24.6, Others: 27.4 },
        { quarter: "Q2 26", Mercer: 16.4, "Home Depot": 32.0, "Lowe's": 24.5, Others: 27.1 },
        { quarter: "Q3 26", Mercer: 14.3, "Home Depot": 33.1, "Lowe's": 25.4, Others: 27.2 },
      ],
      series: [
        { key: "Mercer",      name: "Mercer",      color: NAVY,  type: "bar" },
        { key: "Home Depot",  name: "Home Depot",  color: CORAL, type: "bar" },
        { key: "Lowe's",      name: "Lowe's",      color: GOLD,  type: "bar" },
      ],
    },
    actions: [
      { title: "Private-label response in Outdoor Living", detail: "Three SKU launches with margin-protected pricing", impact: "$1.4M" },
      { title: "Match competitive prices on top 12 SKUs",  detail: "Geo-targeted to SE and Texas markets",            impact: "$0.9M" },
      { title: "Accelerate two product launches",          detail: "Pull from late-Nov to mid-Nov",                     impact: "$1.1M Q4" },
      { title: "Trade-only loyalty programme expansion",   detail: "Defend trade base in contested regions",            impact: "$0.7M Q4" },
    ],
    actionsRecoveryUsd: "$4.1M predicted recovery",
    gaps: [
      { category: "DATA",     title: "Real-time competitor SKU coverage", detail: "Coverage limited to top 200 SKUs, weekly cadence" },
      { category: "SIGNAL",   title: "Customer switching pattern signal", detail: "Loyalty data does not capture cross-shop behaviour" },
      { category: "INTEG",    title: "Pricing intelligence integration",  detail: "Competitor data not fed into pricing decision tool" },
      { category: "MODEL",    title: "Share elasticity model",            detail: "No model linking promo depth to share recovery" },
      { category: "WORKFLOW", title: "Competitive intel to category mgr", detail: "Insights surface in weekly PDF, not real-time alerts" },
    ],
    gapsPipelineUsd: "$2.9M indicative pipeline",
    counterArgs: [
      { title: "Share loss is temporary noise", ci: "8% CI", detail: "Three consecutive quarters of decline rule out noise; trend is statistically significant." },
      { title: "Caused by Mercer assortment change", ci: "6% CI", detail: "No material assortment changes in Q3; ruled out by category audit." },
    ],
  },
  {
    key: "customer-intelligence",
    group: "Market-facing",
    title: "Customer intelligence",
    question: "Which customers are growing, churning, or worth defending?",
    confidence: 82,
    sources: 10,
    diagnosedAt: "Oct 14, 2026 · 03:09 CT",
    metrics: [
      { label: "Trade customer churn",   value: "18%",    sub: "vs 11% baseline",   tone: "bad"  },
      { label: "Lifetime value",         value: "$8,400", sub: "down 12%",          tone: "bad"  },
      { label: "12-month repeat rate",   value: "62%",    sub: "down 4pp",          tone: "warn" },
      { label: "Trade account growth",   value: "+71",    sub: "vs +180 plan",      tone: "bad"  },
    ],
    narrative:
      "The trade customer base is the leading indicator that worries us most. Churn ran at 18% in Q3, up from 11% baseline, and lifetime value fell 12%. The pattern is service-driven, not price-driven. Customers leaving had 2.3x the average rate of OOS incidents and 1.8x the average delivery slippage. The supply chain layer holds most of the diagnostic, and customer recovery depends on supply chain recovery being visible to those customers within 30 days.",
    causes: [
      { title: "Service quality decline post stockouts", impact: "60% of churn",
        detail: "Departing accounts saw 2.3x average OOS rate and 1.8x delivery slippage during weeks 28–36." },
      { title: "Aggressive competitor account acquisition", impact: "25% of churn",
        detail: "Identified 47 lost accounts now active on Ace or independent trade suppliers in Texas and South Central." },
      { title: "Price perception erosion in regional markets", impact: "15% of churn",
        detail: "Survey data shows price-trust scores dropped 9pts in TX and 7pts in MountainWest, lagging promo activity." },
    ],
    chartTitle: "Cohort retention by quarter",
    chart: {
      kind: "line",
      xKey: "month",
      yLabel: "% retained",
      data: [
        { month: "M0",  Q3_25: 100, Q4_25: 100, Q1_26: 100, Q2_26: 100, Q3_26: 100 },
        { month: "M3",  Q3_25: 92,  Q4_25: 91,  Q1_26: 90,  Q2_26: 88,  Q3_26: 82 },
        { month: "M6",  Q3_25: 86,  Q4_25: 85,  Q1_26: 83,  Q2_26: 79,  Q3_26: 71 },
        { month: "M9",  Q3_25: 81,  Q4_25: 79,  Q1_26: 76,  Q2_26: 71,  Q3_26: 65 },
        { month: "M12", Q3_25: 77,  Q4_25: 75,  Q1_26: 71,  Q2_26: 66,  Q3_26: 60 },
      ],
      series: [
        { key: "Q3_25", name: "Q3 25 cohort", color: SLATE },
        { key: "Q2_26", name: "Q2 26 cohort", color: NAVY  },
        { key: "Q3_26", name: "Q3 26 cohort", color: CORAL },
      ],
    },
    actions: [
      { title: "Service recovery contact, top 200 trade accounts", detail: "Account-manager-led outreach, 30-day window", impact: "$0.8M LTV" },
      { title: "Restore delivery SLA in 4 regions",                detail: "Dedicated dispatch lanes ex-Dallas DC",        impact: "$0.6M" },
      { title: "Targeted loyalty bonus on at-risk accounts",       detail: "Score-based, not blanket",                     impact: "$0.4M" },
      { title: "Account manager workload rebalance",                detail: "Reduce span from 38 to 28 accounts in TX",    impact: "$0.3M" },
    ],
    actionsRecoveryUsd: "$2.1M predicted recovery",
    gaps: [
      { category: "MODEL",    title: "Customer health score real-time", detail: "Score is weekly; should fire on event" },
      { category: "INTEG",    title: "CRM-to-supply chain integration", detail: "AMs cannot see ETA on customer-impacting OOS" },
      { category: "DATA",     title: "Customer service interaction logging", detail: "Phone interactions not coded for sentiment" },
      { category: "SIGNAL",   title: "Churn early warning",             detail: "No leading indicator surfaces 30+ days out" },
      { category: "WORKFLOW", title: "At-risk customer to AM workflow", detail: "Daily list goes to a shared inbox, not assigned" },
    ],
    gapsPipelineUsd: "$1.6M indicative pipeline",
    counterArgs: [
      { title: "Churn is price-driven", ci: "7% CI", detail: "Departing accounts had average pricing within 2% of retained; price-driven explanation rejected." },
      { title: "Seasonal trade pattern", ci: "5% CI", detail: "Prior Q3 cohorts retained at 82% at M3; current 71% lies outside normal seasonal range." },
    ],
  },
  {
    key: "brand-social",
    group: "Market-facing",
    title: "Brand and social",
    question: "How is the brand performing in the market's mind?",
    confidence: 76,
    sources: 8,
    diagnosedAt: "Oct 13, 2026 · 19:34 CT",
    metrics: [
      { label: "Brand sentiment",          value: "62%",    sub: "down 8pp positive", tone: "bad"  },
      { label: "Share of voice",           value: "11.8%",  sub: "down 4pp",          tone: "bad"  },
      { label: "Search visibility index",  value: "84",     sub: "down 11pts",        tone: "bad"  },
      { label: "Earned media mentions",    value: "1,247",  sub: "down 19%",          tone: "warn" },
    ],
    narrative:
      "Brand health softened across every measure that matters in Q3. The headline finding is not the decline itself but its concentration: 73% of the negative sentiment cluster relates to product availability and delivery, not brand affinity. This is the supply chain story showing up in the brand layer. Recovery here lags supply chain recovery by 4–6 weeks based on historic patterns, so investment in PR alongside operational recovery is justified now, not later.",
    causes: [
      { title: "Stockout coverage in regional press", impact: "-4pp sentiment",
        detail: "Twelve regional outlets ran stockout-related coverage during weeks 30–34, concentrated in DFW and Phoenix metros." },
      { title: "Search ranking erosion on category terms", impact: "-11pts SOV",
        detail: "Average rank slipped from 4.1 to 5.8 on 30 priority terms, partly due to thin content vs Home Depot revamp." },
      { title: "Competitor SOV expansion via paid placement", impact: "-2pp SOV",
        detail: "Home Depot and Lowe's combined paid spend up 22% in DMA-overlapping markets." },
    ],
    chartTitle: "Sentiment trend with stockout markers",
    chart: {
      kind: "line",
      xKey: "week",
      yLabel: "Positive sentiment %",
      data: Array.from({ length: 13 }, (_, i) => {
        const w = 27 + i;
        const base = 70 - (i > 2 ? Math.min(10, (i - 2) * 1.1) : 0) + (i > 9 ? (i - 9) * 0.6 : 0);
        return { week: `W${w}`, sentiment: +base.toFixed(1), stockout: [4, 5, 7, 8].includes(i) ? base : null };
      }),
      series: [
        { key: "sentiment", name: "Sentiment",     color: NAVY  },
        { key: "stockout",  name: "Stockout event", color: CORAL },
      ],
    },
    actions: [
      { title: "PR programme on supply recovery",   detail: "Regional press outreach in DFW and Phoenix",     impact: "$0.4M" },
      { title: "SEO content refresh, top 30 pages", detail: "Rewrite + structured data for category pages",   impact: "$0.3M" },
      { title: "Targeted paid search in regions",   detail: "Defensive bidding on Mercer + competitor terms", impact: "$0.5M" },
      { title: "Influencer programme, DIY + Garden",detail: "12 creators, six-week activation",                impact: "$0.3M" },
    ],
    actionsRecoveryUsd: "$1.5M predicted recovery",
    gaps: [
      { category: "DATA",     title: "Regional sentiment granularity",    detail: "National roll-up only; cannot target by metro" },
      { category: "SIGNAL",   title: "Owned content to demand signal link",detail: "No model from on-site engagement to category demand" },
      { category: "MODEL",    title: "Brand health to operational KPI",   detail: "Brand metrics not in operational dashboard" },
      { category: "INTEG",    title: "Search ranking integration into CMS",detail: "Rank changes not visible to content team" },
      { category: "WORKFLOW", title: "Sentiment alert to comms team",     detail: "Reactive only; alerts fire after press cycle" },
    ],
    gapsPipelineUsd: "$1.2M indicative pipeline",
    counterArgs: [
      { title: "Decline is global category, not Mercer", ci: "9% CI", detail: "Home Depot sentiment up 2pp in same period; rejects category-wide explanation." },
      { title: "Single PR incident driving cluster", ci: "5% CI", detail: "Sentiment decline spread across 12 outlets; not single-incident." },
    ],
  },
  {
    key: "supply-chain",
    group: "Operational",
    title: "Supply chain",
    question: "Where is the supply chain failing, and what is it costing?",
    confidence: 89,
    sources: 12,
    diagnosedAt: "Oct 14, 2026 · 04:22 CT",
    metrics: [
      { label: "OOS days top 5 SKUs", value: "41",  sub: "target 5",         tone: "bad"  },
      { label: "Supplier OTD",        value: "78%", sub: "was 91%",          tone: "bad"  },
      { label: "DC throughput",       value: "88%", sub: "vs 95% target",    tone: "warn" },
      { label: "Inventory days",      value: "54",  sub: "target 42",        tone: "bad"  },
    ],
    narrative:
      "Supply chain is the operational source of most of the customer and brand decline this quarter. Supplier B's production delay, compounded by a Dallas DC capacity constraint during peak weeks 28–34, drove the OOS pattern that ripples into demand, customer and brand layers. The story is not a single failure but two simultaneous constraints, and recovery requires both moves. Activating qualified Supplier C is the largest single lever, and the contract is already in legal review.",
    causes: [
      { title: "Supplier B production delay", impact: "-$1.4M",
        detail: "Two-week shortfall on six Home Improvement SKUs, propagated to Dallas and Phoenix DCs by week 30." },
      { title: "Dallas DC labour shortage", impact: "-$0.9M",
        detail: "Throughput dropped to 82% during weeks 31–33 due to 14 unfilled roles in inbound and pick zones." },
      { title: "Forecast accuracy degradation upstream", impact: "-$0.6M",
        detail: "Demand forecast error of 13pp meant replenishment orders were biased low across the Home Improvement category." },
    ],
    chartTitle: "Supplier on-time delivery, last 13 weeks",
    chart: {
      kind: "bar",
      xKey: "week",
      yLabel: "% on time",
      data: Array.from({ length: 13 }, (_, i) => {
        const w = 27 + i;
        const otd = i < 3 ? 91 : i < 8 ? 76 - (i - 3) * 1.5 : 80 + (i - 8);
        return { week: `W${w}`, otd: +otd.toFixed(1) };
      }),
      series: [{ key: "otd", name: "Supplier OTD %", color: NAVY, type: "bar" }],
    },
    actions: [
      { title: "Activate qualified Supplier C",       detail: "Contract in legal, can ship in 14 days",        impact: "$0.8M Q4" },
      { title: "Dallas DC labour augmentation",       detail: "Temp staffing across inbound + pick for 8 weeks", impact: "$0.5M" },
      { title: "Forecast inputs upgrade",             detail: "Add competitor promo + weather signals",         impact: "$0.4M" },
      { title: "Top SKU safety stock review",         detail: "Lift cover from 7 to 14 days on 22 SKUs",        impact: "$0.3M" },
    ],
    actionsRecoveryUsd: "$2.0M predicted recovery",
    gaps: [
      { category: "DATA",     title: "Supplier production data",            detail: "No real-time line view from tier-1 suppliers" },
      { category: "MODEL",    title: "DC capacity forecasting",             detail: "Capacity model assumes static labour pool" },
      { category: "WORKFLOW", title: "POS to replenishment trigger",        detail: "Replenishment runs nightly, not event-driven" },
      { category: "SIGNAL",   title: "Weather signal in forecast",          detail: "Regional weather not feeding demand model" },
      { category: "INTEG",    title: "Multi-supplier orchestration",        detail: "No system to route demand across qualified suppliers" },
    ],
    gapsPipelineUsd: "$2.1M indicative pipeline",
    counterArgs: [
      { title: "Single carrier issue", ci: "11% CI", detail: "Issue spans two carriers and three lanes; carrier-specific explanation rejected." },
      { title: "Inventory-only fix sufficient", ci: "8% CI", detail: "Adding safety stock alone leaves throughput constraint unaddressed; modelled recovery 38% of needed." },
    ],
  },
  {
    key: "pricing-margin",
    group: "Operational",
    title: "Pricing and margin",
    question: "Where is margin leaking, and which actions recover it?",
    confidence: 91,
    sources: 13,
    diagnosedAt: "Oct 14, 2026 · 06:11 CT",
    metrics: [
      { label: "Gross margin",                value: "38.2%", sub: "down 240bps",        tone: "bad"  },
      { label: "Promo intensity",             value: "32%",   sub: "+14pp of sales",     tone: "warn" },
      { label: "Price index vs Home Depot",   value: "102",   sub: "vs target 105",      tone: "warn" },
      { label: "Margin contribution, top 50", value: "$18M",  sub: "down $4M",           tone: "bad"  },
    ],
    narrative:
      "Promotional response to competitor activity defended unit volume but cost us material margin. Pricing reset is the highest-leverage Q4 intervention identified across all layers. The 240bps margin decline is concentrated in 50 SKUs that account for 64% of competitive overlap with Home Depot and Lowe's. Targeted reset on these SKUs recovers most of the margin without forfeiting share where share matters.",
    causes: [
      { title: "Competitive matching depth",          impact: "-180bps",
        detail: "Matched 90% of competitor promo events at full depth; reducing match rate to 50% on margin-protected lines recovers 110bps." },
      { title: "Mix shift to lower margin",            impact: "-40bps",
        detail: "DIY share grew within total sales while higher-margin Trade share contracted." },
      { title: "Supplier cost inflation passed only partially", impact: "-20bps",
        detail: "8.4% supplier cost increase, passed through at 5.1% to retain price points." },
    ],
    chartTitle: "Gross margin trend, last 13 weeks",
    chart: {
      kind: "area",
      xKey: "week",
      yLabel: "Gross margin %",
      data: Array.from({ length: 13 }, (_, i) => {
        const w = 27 + i;
        const m = 40.6 - Math.min(2.6, i * 0.22);
        return { week: `W${w}`, margin: +m.toFixed(2) };
      }),
      series: [{ key: "margin", name: "Gross margin %", color: CORAL }],
    },
    actions: [
      { title: "Targeted reset on top 50 SKUs",         detail: "Lift price 2–4% on 31 SKUs, hold on 19",       impact: "$1.2M margin" },
      { title: "Suspend matching on margin-protected lines", detail: "Cease auto-matching of competitor depth", impact: "$0.4M" },
      { title: "Mix optimisation in trade channel",      detail: "Reactivate trade pricing tier benefits",        impact: "$0.5M Q4" },
      { title: "Cost-pass discipline on next 30 SKUs",  detail: "Pass full 8.4% cost on lower-elasticity SKUs",  impact: "$0.3M Q4" },
    ],
    actionsRecoveryUsd: "$2.4M predicted recovery",
    gaps: [
      { category: "DATA",     title: "Real-time competitor pricing",      detail: "4–7 day lag, blocks day-of decisions" },
      { category: "MODEL",    title: "Margin elasticity model",            detail: "Pre-supply-shock; underestimates current sensitivity" },
      { category: "WORKFLOW", title: "Pricing decision audit trail",       detail: "Manual approval chain, no decision logging" },
      { category: "SIGNAL",   title: "Cost signal from suppliers",         detail: "Cost changes arrive in PO, not as forward signal" },
      { category: "INTEG",    title: "Pricing to ERP propagation",         detail: "Two-system manual sync delays activation by 48h" },
    ],
    gapsPipelineUsd: "$2.6M indicative pipeline",
    counterArgs: [
      { title: "Mix shift explains entire gap", ci: "10% CI", detail: "Mix-only explanation accounts for 17% of decline; ruled out as sole cause." },
      { title: "Cost inflation explains gap",   ci: "8% CI",  detail: "Cost inflation accounts for 20bps; remaining 220bps from competitive matching." },
    ],
  },
  {
    key: "sales-pipeline",
    group: "Operational",
    title: "Sales pipeline",
    question: "Is the pipeline healthy enough to make the forecast?",
    confidence: 73,
    sources: 7,
    diagnosedAt: "Oct 13, 2026 · 21:08 CT",
    metrics: [
      { label: "Pipeline coverage", value: "1.8x",     sub: "need 2.5x",    tone: "bad"  },
      { label: "Win rate",          value: "24%",      sub: "vs 31%",       tone: "bad"  },
      { label: "Sales cycle",       value: "84 days",  sub: "+18 days",     tone: "warn" },
      { label: "Forecast accuracy", value: "61%",      sub: "vs 78%",       tone: "bad"  },
    ],
    narrative:
      "B2B trade pipeline is materially undercovered for Q4 forecast. Mid-funnel stall in deals over $100k and 12 large deal slippages tell a single story: enterprise approval cycles materially lengthened post-budget season, and Mercer's sales motion has not adapted. Coverage at 1.8x against a need of 2.5x means we cannot make the forecast on natural conversion alone; targeted acceleration is required on the top 20 stalled deals.",
    causes: [
      { title: "Mid-funnel stall in enterprise segment", impact: "-$3.4M Q4 risk",
        detail: "Deals over $100k stuck at stage 3 for 38+ days; budget-cycle delays at 9 named accounts." },
      { title: "Deal slippage on 12 large deals", impact: "$2.1M Q4 risk",
        detail: "Deals slipped from Sep to Nov/Dec; 4 to Q1 2027. Concentrated in TX and Mountain West." },
      { title: "Competitive losses in 4 key accounts", impact: "-$1.6M",
        detail: "Lost to Ferguson and HD Supply on procurement consolidation plays." },
    ],
    chartTitle: "Pipeline by stage versus required",
    chart: {
      kind: "stacked-bar",
      xKey: "stage",
      yLabel: "USD millions",
      data: [
        { stage: "Stage 1", actual: 6.2, required: 9.0 },
        { stage: "Stage 2", actual: 5.1, required: 7.5 },
        { stage: "Stage 3", actual: 3.4, required: 6.0 },
        { stage: "Stage 4", actual: 2.1, required: 4.5 },
        { stage: "Stage 5", actual: 1.2, required: 3.0 },
      ],
      series: [
        { key: "actual",   name: "Actual",   color: NAVY,  type: "bar" },
        { key: "required", name: "Required", color: CORAL, type: "bar" },
      ],
    },
    actions: [
      { title: "Pipeline acceleration on top 20 stalled deals", detail: "Joint pricing + AE coverage push", impact: "$1.4M Q4" },
      { title: "Executive sponsorship on 8 large deals",        detail: "CEO + CRO outreach to procurement", impact: "$1.0M" },
      { title: "Competitive defence in 4 named accounts",       detail: "Loss prevention with custom commercial terms", impact: "$0.7M" },
      { title: "New-business motion in trade segment",          detail: "Outbound activation in TX + Mountain West", impact: "$0.5M" },
    ],
    actionsRecoveryUsd: "$3.6M predicted recovery",
    gaps: [
      { category: "DATA",     title: "Stage progression data quality", detail: "Stage transitions logged manually; 22% missing dates" },
      { category: "SIGNAL",   title: "Buyer signal monitoring",        detail: "No external buying-intent feed for trade segment" },
      { category: "INTEG",    title: "CRM to pricing integration",     detail: "AEs cannot quote with current pricing inside CRM" },
      { category: "MODEL",    title: "Forecast model recalibration",   detail: "Model uses 2024 win-rate; needs Q3 26 refresh" },
      { category: "WORKFLOW", title: "Deal review automation",         detail: "Weekly deal reviews driven by manual spreadsheet pull" },
    ],
    gapsPipelineUsd: "$2.2M indicative pipeline",
    counterArgs: [
      { title: "Sales rep capacity is the constraint", ci: "12% CI", detail: "Activity per rep up 8% vs Q2; capacity rejected as primary constraint." },
      { title: "Pricing alone unlocks pipeline",       ci: "9% CI",  detail: "Won deals show no statistical price-cut pattern; pricing-only thesis weak." },
    ],
  },
  {
    key: "marketing-performance",
    group: "Operational",
    title: "Marketing performance",
    question: "What is marketing actually returning?",
    confidence: 74,
    sources: 9,
    diagnosedAt: "Oct 13, 2026 · 23:47 CT",
    metrics: [
      { label: "CAC",                          value: "$186",   sub: "+31%",            tone: "bad"  },
      { label: "Marketing-influenced revenue", value: "$12.4M", sub: "-8%",             tone: "warn" },
      { label: "Attribution coverage",         value: "67%",    sub: "target 90%",      tone: "warn" },
      { label: "MROI",                         value: "3.1x",   sub: "vs 4.2x",         tone: "bad"  },
    ],
    narrative:
      "Marketing efficiency deteriorated in Q3 with channel saturation in paid social and search, and attribution gaps preventing reallocation decisions. The 31% CAC increase is concentrated in two channels and three campaigns. Reallocating spend toward retention and improving attribution coverage are the two interventions that compound; either alone delivers half the recovery.",
    causes: [
      { title: "Channel saturation in paid social", impact: "-$0.4M efficiency",
        detail: "Meta CPMs up 38% in target audiences; frequency capped efficiency before spend cap took effect." },
      { title: "Creative fatigue across key formats", impact: "-$0.3M",
        detail: "CTR dropped 22% on flagship video assets, refreshed only once in Q3 versus planned cadence of every 6 weeks." },
      { title: "Attribution gaps blocking optimisation", impact: "-$0.2M",
        detail: "Coverage at 67% leaves 33% of conversions unattributed, biasing the optimiser toward last-click channels." },
    ],
    chartTitle: "CAC trend, last 13 weeks",
    chart: {
      kind: "line",
      xKey: "week",
      yLabel: "USD",
      data: Array.from({ length: 13 }, (_, i) => {
        const w = 27 + i;
        const cac = 142 + i * 4 + (i > 6 ? (i - 6) * 3 : 0);
        return { week: `W${w}`, cac, target: 165 };
      }),
      series: [
        { key: "cac",    name: "CAC",    color: CORAL },
        { key: "target", name: "Target", color: NAVY  },
      ],
    },
    actions: [
      { title: "Channel rebalance from social to retention", detail: "Shift 18% of paid social to lifecycle email", impact: "$0.6M" },
      { title: "Creative refresh sprint",                    detail: "Six-week sprint on flagship video formats",   impact: "$0.4M" },
      { title: "Attribution layer build",                    detail: "Server-side tagging across DTC + retail",     impact: "$0.5M Q4" },
      { title: "Cohort-based investment model",              detail: "Optimise to 90-day cohort value, not CAC",    impact: "$0.3M Q4" },
    ],
    actionsRecoveryUsd: "$1.8M predicted recovery",
    gaps: [
      { category: "MODEL",    title: "Multi-touch attribution",         detail: "Single-touch model masks paid-search role" },
      { category: "DATA",     title: "Retention to acquisition link",   detail: "Cohort retention not joined to acquisition source" },
      { category: "SIGNAL",   title: "Creative performance signal",     detail: "Fatigue detected after the fact, not predicted" },
      { category: "WORKFLOW", title: "MMM to channel team workflow",    detail: "Quarterly MMM reports not actioned mid-quarter" },
      { category: "INTEG",    title: "Marketing tech to BI integration",detail: "Ad platforms not piped into central BI cube" },
    ],
    gapsPipelineUsd: "$1.4M indicative pipeline",
    counterArgs: [
      { title: "CAC rise is industry-wide", ci: "8% CI", detail: "Peer benchmarks show 14% CAC rise; remainder is Mercer-specific." },
      { title: "Brand pull weakness is root cause", ci: "11% CI", detail: "Branded search volume flat YoY; brand pull not deteriorated." },
    ],
  },
  {
    key: "people-operations",
    group: "Operational",
    title: "People and operations",
    question: "Where is the workforce productive, stretched, or at risk?",
    confidence: 78,
    sources: 8,
    diagnosedAt: "Oct 14, 2026 · 01:55 CT",
    metrics: [
      { label: "Voluntary attrition",   value: "19%", sub: "target 12%",     tone: "bad"  },
      { label: "Productivity index",    value: "92",  sub: "vs 100 baseline", tone: "warn" },
      { label: "Engagement score",      value: "68",  sub: "vs 74",          tone: "bad"  },
      { label: "Open critical roles",   value: "24",  sub: "target 8",       tone: "bad"  },
    ],
    narrative:
      "Workforce stretch in operations roles correlates directly with the service quality issues showing up in the customer layer. Attrition is concentrated in DC and customer service functions, and 24 open critical roles span four DC regions plus the central pricing team. Recovery here needs investment, not exhortation; compensation review in two DC regions is the single highest-leverage move.",
    causes: [
      { title: "DC role attrition",                      impact: "-$0.4M productivity",
        detail: "Inbound and pick attrition at 27% in Dallas, 22% in Phoenix; replacement lag of 6+ weeks." },
      { title: "Customer service team attrition",        impact: "-$0.3M service",
        detail: "Senior service reps down 4 in three months; CSAT drop tracks role losses by 3-week lag." },
      { title: "Engineering retention in critical roles",impact: "-$0.2M",
        detail: "Lost 3 senior data engineers in Q3; model retrain and attribution work backlogged." },
    ],
    chartTitle: "Voluntary attrition by function",
    chart: {
      kind: "bar",
      xKey: "function",
      yLabel: "% annualised",
      data: [
        { function: "DC operations",     attrition: 27, baseline: 14 },
        { function: "Customer service",  attrition: 22, baseline: 12 },
        { function: "Retail store",      attrition: 18, baseline: 16 },
        { function: "Engineering",       attrition: 14, baseline: 9  },
        { function: "Corporate",         attrition: 9,  baseline: 8  },
      ],
      series: [
        { key: "attrition", name: "Q3 2026", color: CORAL, type: "bar" },
        { key: "baseline",  name: "Baseline", color: NAVY,  type: "bar" },
      ],
    },
    actions: [
      { title: "Retention plan for top 50 critical roles", detail: "Targeted comp + retention bonus, 90-day cycle", impact: "$0.5M" },
      { title: "Compensation review in 2 DC regions",      detail: "Dallas + Phoenix inbound roles, market+8%",      impact: "$0.4M" },
      { title: "Training investment in customer service",  detail: "8-week certification programme, intake of 24",   impact: "$0.3M" },
      { title: "Span of control review",                   detail: "Rebalance manager spans in TX and Mountain West",impact: "$0.2M" },
    ],
    actionsRecoveryUsd: "$1.4M predicted recovery",
    gaps: [
      { category: "SIGNAL",   title: "Engagement signal real-time", detail: "Engagement measured quarterly; need pulse cadence" },
      { category: "MODEL",    title: "Workforce-to-output model",   detail: "No model linking headcount to throughput recovery" },
      { category: "INTEG",    title: "HRIS to ops integration",     detail: "Operations dashboards do not show staffing gaps" },
      { category: "DATA",     title: "Exit reason coding",          detail: "Free-text only; not codified for analysis" },
      { category: "WORKFLOW", title: "Manager intervention workflow",detail: "No automated nudge to managers on attrition risk" },
    ],
    gapsPipelineUsd: "$1.1M indicative pipeline",
    counterArgs: [
      { title: "Compensation alone fixes it", ci: "10% CI", detail: "Comp-only modelled recovery is 41%; structural workload also contributes." },
      { title: "Industry-wide labour effect", ci: "8% CI",  detail: "Peer DC attrition averages 18%; Mercer 27% is Mercer-specific." },
    ],
  },
  {
    key: "finance",
    group: "Executive",
    title: "Finance",
    question: "Where is cash, margin, and spend tracking against plan?",
    confidence: 91,
    sources: 11,
    diagnosedAt: "Oct 14, 2026 · 06:42 CT",
    metrics: [
      { label: "Operating cash flow", value: "$24.2M", sub: "vs $19.4M plan",   tone: "good" },
      { label: "EBITDA",              value: "$14.5M", sub: "vs $21.0M plan",   tone: "bad"  },
      { label: "Working capital",     value: "54 days", sub: "vs 49 days plan", tone: "warn" },
      { label: "Opex variance",       value: "+$3.6M", sub: "vs plan, Q3",      tone: "bad"  },
    ],
    narrative:
      "Cash position closed Q3 ahead of plan by $3.8M, but that strength is a consequence of working capital tightening, not operational outperformance. EBITDA finished $6.5M behind plan, with Technology + Data and Operations both overspending while Marketing and HR came in under. The opex variance is concentrated in two budget lines — cloud infrastructure and DC contract labour — both of which are addressable in Q4 without structural cuts. Finance leadership should reset the Technology budget envelope before Q4 board, not after.",
    causes: [
      { title: "Technology + Data overspend",     impact: "+$3.2M",
        detail: "Cloud and data platform run-rate +18% vs plan, driven by unrationalised pipelines and three duplicate model serving stacks." },
      { title: "DC contract labour over plan",    impact: "+$1.4M",
        detail: "Dallas and Phoenix used contract pickers to cover Q3 attrition gap; rate was 1.6x salaried equivalent." },
      { title: "Trade receivables drag on cash",  impact: "-$2.1M",
        detail: "DSO extended from 47 to 51 days; six trade accounts past 90 days account for 38% of overdue value." },
    ],
    chartTitle: "Plan vs actual P&L lines, quarterly",
    chart: {
      kind: "bar",
      xKey: "line",
      yLabel: "USD millions",
      data: [
        { line: "Revenue",   plan: 138, actual: 127 },
        { line: "Gross profit", plan: 53,  actual: 48.6 },
        { line: "Opex",      plan: 32,  actual: 35.6 },
        { line: "EBITDA",    plan: 21,  actual: 14.5 },
        { line: "Cash flow", plan: 19.4, actual: 24.2 },
      ],
      series: [
        { key: "plan",   name: "Plan",   color: CORAL, type: "bar" },
        { key: "actual", name: "Actual", color: NAVY,  type: "bar" },
      ],
    },
    actions: [
      { title: "Rationalise cloud + data platform",         detail: "Consolidate three model serving stacks; renegotiate enterprise tier",  impact: "$1.4M Q4" },
      { title: "Receivables sprint on top 6 debtors",       detail: "Dunning escalation + payment plan workflow on 90+ day accounts",        impact: "$0.9M cash" },
      { title: "Contract labour to permanent conversion",   detail: "Convert 18 contract DC roles to permanent at market rate",              impact: "$0.6M Q4" },
      { title: "Marketing reinvestment from underspend",    detail: "Redeploy unused Q3 marketing budget into Q4 acquisition push",          impact: "$0.4M" },
    ],
    actionsRecoveryUsd: "$3.3M predicted recovery",
    gaps: [
      { category: "DATA",     title: "Real-time spend telemetry",   detail: "Cloud spend visible weekly via vendor portal, not in BI" },
      { category: "INTEG",    title: "ERP ↔ banking integration",   detail: "Cash position computed nightly via batch upload" },
      { category: "MODEL",    title: "Cash forecasting model",      detail: "Direct method only; no rolling 13-week indirect view" },
      { category: "SIGNAL",   title: "Vendor cost change feed",     detail: "Supplier price increases discovered at invoice, not negotiation" },
      { category: "WORKFLOW", title: "Budget reforecast workflow",  detail: "Quarterly cycle only; no in-quarter envelope reset trigger" },
    ],
    gapsPipelineUsd: "$1.7M indicative pipeline",
    counterArgs: [
      { title: "Cash strength is real, not optical",  ci: "11% CI", detail: "Working capital release accounts for $2.4M of $3.8M; cash conversion did improve in 2 of 3 months." },
      { title: "Tech overspend was deliberate",       ci: "18% CI", detail: "Three platform migrations were CFO-approved; overspend is one-time, not run-rate." },
    ],
  },
  {
    key: "receivables",
    group: "Operational",
    title: "Receivables and invoicing",
    question: "How healthy is the order-to-cash cycle?",
    confidence: 84,
    sources: 7,
    diagnosedAt: "Oct 14, 2026 · 06:42 CT",
    metrics: [
      { label: "Total outstanding", value: "$40.5M", sub: "724 open invoices",   tone: "neutral" },
      { label: "Past 60 days",      value: "$10.9M", sub: "27% of book",          tone: "bad"     },
      { label: "DSO",               value: "51 days", sub: "vs 47 target",        tone: "warn"    },
      { label: "Collection rate",   value: "87%",    sub: "vs 94% Q2",            tone: "bad"     },
    ],
    narrative:
      "The receivables book swelled to $40.5M in Q3, with $10.9M past 60-day terms — a 41% increase on Q2. The deterioration is not broad; six trade customers carry 62% of the past-due value. Three of those six also appear in Customer intelligence as critical churn risks, suggesting the receivables stress is a symptom of the same underlying service quality and supply reliability issues. Collections should be sequenced with account recovery, not run as a parallel adversarial workflow.",
    causes: [
      { title: "Concentration in 6 large debtors",  impact: "$2.8M past terms",
        detail: "Heritage Pro, Mountain West Trades and Kessler together account for 35% of overdue receivables and all three have open service tickets." },
      { title: "Service breach correlates with payment delay", impact: "Causal r=0.71",
        detail: "Accounts with SLA breaches in Q3 paid 18 days slower on average than accounts on SLA." },
      { title: "Dunning workflow paused mid-quarter", impact: "$1.4M deferred",
        detail: "August workflow change introduced a manual approval step that stalled 240 reminder emails for 12 days." },
    ],
    chartTitle: "Receivables aging trend by month",
    chart: {
      kind: "stacked-bar",
      xKey: "month",
      yLabel: "USD millions",
      data: [
        { month: "Apr", current: 16.8, watch: 7.4, overdue: 3.1, critical: 1.8 },
        { month: "May", current: 17.4, watch: 8.2, overdue: 3.4, critical: 2.1 },
        { month: "Jun", current: 17.8, watch: 9.1, overdue: 4.2, critical: 2.4 },
        { month: "Jul", current: 18.2, watch: 9.8, overdue: 5.1, critical: 2.9 },
        { month: "Aug", current: 18.6, watch: 10.4, overdue: 5.8, critical: 3.4 },
        { month: "Sep", current: 18.4, watch: 11.2, overdue: 6.8, critical: 4.1 },
      ],
      series: [
        { key: "current",  name: "0–30 days",  color: TEAL,  type: "bar" },
        { key: "watch",    name: "31–60 days", color: GOLD,  type: "bar" },
        { key: "overdue",  name: "61–90 days", color: "#BA7517", type: "bar" },
        { key: "critical", name: "90+ days",   color: CORAL, type: "bar" },
      ],
    },
    actions: [
      { title: "Recovery contact on top 6 debtors",     detail: "Joint account-manager + finance call sequence within 10 days", impact: "$1.4M cash" },
      { title: "Restore dunning workflow",              detail: "Remove August approval step; reactivate automated 30/60/90 cadence", impact: "$0.6M Q4" },
      { title: "Service-pegged payment plans",          detail: "Offer 60-day payment plan tied to SLA restoration on at-risk accounts", impact: "$0.5M retained" },
      { title: "Early-pay discount on Q4 invoices",     detail: "2% net-10 incentive on next-quarter invoicing to reset DSO",   impact: "$0.4M Q4" },
    ],
    actionsRecoveryUsd: "$2.9M predicted recovery",
    gaps: [
      { category: "DATA",     title: "Promise-to-pay tracking",     detail: "Verbal commitments captured in notes, not structured" },
      { category: "INTEG",    title: "Receivables ↔ CRM integration", detail: "AMs see invoice status one click away, not in account view" },
      { category: "MODEL",    title: "Payment-risk model",          detail: "No predictive model on late-payment risk by account" },
      { category: "WORKFLOW", title: "Recovery + churn shared queue", detail: "Collections and CSM work the same 6 accounts in parallel" },
      { category: "SIGNAL",   title: "Bank file matching",          detail: "12% of payments require manual matching to invoice" },
    ],
    gapsPipelineUsd: "$1.3M indicative pipeline",
    counterArgs: [
      { title: "Macro tightening explains slowdown",  ci: "14% CI", detail: "Sector peers report DSO drift of +2–3 days; Mercer +4 days is partly macro, partly account-specific." },
      { title: "Concentration is structural, not new",ci: "9% CI",  detail: "The top 6 debtors have always carried >50% of book; magnitude is new, mix is not." },
    ],
  },
  {
    key: "talent-hr",
    group: "Operational",
    title: "Talent and HR",
    question: "Is the organisation staffed to deliver the Q4 plan?",
    confidence: 79,
    sources: 9,
    diagnosedAt: "Oct 14, 2026 · 06:42 CT",
    metrics: [
      { label: "Open critical roles", value: "24",   sub: "vs 8 target",       tone: "bad"  },
      { label: "Time-to-fill",        value: "53d",  sub: "vs 32d target",     tone: "bad"  },
      { label: "Funnel conversion",   value: "1.3%", sub: "vs 2.4% Q2",        tone: "warn" },
      { label: "Internal mobility",   value: "11%",  sub: "vs 18% target",     tone: "warn" },
    ],
    narrative:
      "Q4 delivery risk concentrates in a small number of unfilled roles. Twenty-four critical positions are open, of which six have been open more than 60 days; those six map onto Operations, Data Engineering and Commercial — exactly the functions whose performance gaps drive the Q3 variance. Funnel conversion has halved versus Q2, suggesting the issue is sourcing quality and offer competitiveness, not late-stage drop-off. Targeted compensation moves in two DC regions plus an executive search for the lead data engineer slot would close 80% of the Q4 staffing risk.",
    causes: [
      { title: "Sourcing pipeline thinning",         impact: "-540 applicants vs Q2",
        detail: "Top of funnel down 30% — Greenhouse + LinkedIn pipeline shows fewer qualified candidates in target zip codes." },
      { title: "Offer acceptance rate decline",      impact: "Accept rate 59%",
        detail: "Down from 78% Q2; two-thirds of decliners cite compensation, one-third cite remote flexibility." },
      { title: "Manager bandwidth on interviews",    impact: "Cycle +12 days",
        detail: "Hiring managers in DC and Tech functions running 14+ open reqs each, slowing first-round scheduling." },
    ],
    chartTitle: "Headcount plan vs actual by quarter",
    chart: {
      kind: "line",
      xKey: "quarter",
      yLabel: "Headcount",
      data: [
        { quarter: "Q1 25", plan: 2180, actual: 2174 },
        { quarter: "Q2 25", plan: 2240, actual: 2218 },
        { quarter: "Q3 25", plan: 2310, actual: 2256 },
        { quarter: "Q4 25", plan: 2380, actual: 2298 },
        { quarter: "Q1 26", plan: 2440, actual: 2334 },
        { quarter: "Q2 26", plan: 2490, actual: 2378 },
        { quarter: "Q3 26", plan: 2540, actual: 2392 },
      ],
      series: [
        { key: "plan",   name: "Plan",   color: CORAL, type: "line" },
        { key: "actual", name: "Actual", color: NAVY,  type: "line" },
      ],
    },
    actions: [
      { title: "Compensation review · DC + Tech",         detail: "Market+8% reset for Dallas, Phoenix DC and senior data engineering", impact: "$0.6M productivity" },
      { title: "Executive search · senior data engineer", detail: "Retained search on the role blocking 3 model retrains",              impact: "$0.4M Q4" },
      { title: "Interview load rebalance",                detail: "Shift screening to talent partners for 5 over-loaded managers",      impact: "$0.3M cycle time" },
      { title: "Internal mobility marketplace",           detail: "Open 14 lateral moves to fill 6 critical roles internally",          impact: "$0.3M retention" },
    ],
    actionsRecoveryUsd: "$1.6M predicted recovery",
    gaps: [
      { category: "DATA",     title: "Source-of-hire attribution",  detail: "Job board attribution missing for 31% of applicants" },
      { category: "MODEL",    title: "Quality-of-hire model",       detail: "90-day performance not linked back to sourcing channel" },
      { category: "INTEG",    title: "ATS ↔ HRIS integration",      detail: "Greenhouse to Workday handoff still manual for 12% of joiners" },
      { category: "SIGNAL",   title: "Engagement pulse cadence",    detail: "Annual survey only; cannot detect mid-quarter risk" },
      { category: "WORKFLOW", title: "Offer approval workflow",     detail: "5-step approval; market data shows 48-hour offer window now standard" },
    ],
    gapsPipelineUsd: "$1.2M indicative pipeline",
    counterArgs: [
      { title: "Macro labour market the cause",  ci: "12% CI", detail: "Peer median time-to-fill is 41 days; Mercer 53 is partly macro, mostly Mercer-specific." },
      { title: "Hiring slowdown is intentional", ci: "16% CI", detail: "CFO requested Q3 hiring freeze on 8 non-critical reqs; included in 24 open count." },
    ],
  },
  {
    key: "contract-management",
    group: "Operational",
    title: "Contract management",
    question: "Where is contract exposure compounding the Q3 variance, and which renewals concentrate risk?",
    confidence: 81,
    sources: 8,
    diagnosedAt: "Oct 14, 2026 · 06:42 CT",
    metrics: [
      { label: "Active contracts",       value: "412",   sub: "supplier, customer, labour",         tone: "neutral" },
      { label: "Expiring next 90 days",  value: "37",    sub: "$11.2M annualised value",            tone: "warn"    },
      { label: "ETF / penalty exposure", value: "$4.6M", sub: "concentrated in 9 supplier contracts", tone: "bad"   },
      { label: "Evergreen auto-renew",   value: "62",    sub: "no review in last 18 months",        tone: "warn"    },
    ],
    narrative:
      "Contract exposure is silently amplifying the Q3 variance. Three clusters concentrate the risk. First, Supplier B is invoking its force-majeure clause to defer a $1.4M production-shortfall penalty, blocking the credit that would have offset part of the OOS damage. Second, Dallas and Phoenix DC contract-labour rate cards auto-renewed at peak-demand premiums without negotiation, contributing $1.4M of the opex overrun flagged in Finance. Third, four of the six past-due trade customers operate under evergreen master service agreements with rolling 60-day terms — there is no contractual lever to enforce earlier payment, which leaves the receivables recovery dependent on goodwill alone. The Supplier C activation that the whole Q4 plan rests on is also a contract problem: the qualified-supplier agreement has been in legal review for 23 days against a 10-day target, and every additional day costs roughly $60K in further OOS damage on Home Improvement.",
    causes: [
      { title: "Supplier B force-majeure invocation",     impact: "$1.4M credit deferred",
        detail: "Production-shortfall penalty deferred under FM clause until Q4 close; legal recovery probability assessed at 55%." },
      { title: "DC contract labour rate-card auto-renew", impact: "+$1.4M opex",
        detail: "Dallas and Phoenix temp-labour contracts renewed at peak-premium rates with no built-in negotiation window before the peak period." },
      { title: "Supplier C agreement in extended review", impact: "14-day shipment delay",
        detail: "Indemnity and audit clauses still open after 23 days; each day in review equals ~$60K of additional OOS damage on Home Improvement." },
    ],
    chartTitle: "Contract value expiring by month, next two quarters",
    chart: {
      kind: "stacked-bar",
      xKey: "month",
      yLabel: "USD millions / annualised",
      data: [
        { month: "Oct", supplier: 1.8, customer: 0.6, labour: 0.4 },
        { month: "Nov", supplier: 2.1, customer: 0.4, labour: 0.3 },
        { month: "Dec", supplier: 1.4, customer: 1.2, labour: 0.5 },
        { month: "Jan", supplier: 0.9, customer: 0.7, labour: 0.2 },
        { month: "Feb", supplier: 1.6, customer: 0.5, labour: 0.4 },
        { month: "Mar", supplier: 2.3, customer: 0.8, labour: 0.6 },
      ],
      series: [
        { key: "supplier", name: "Supplier",        color: NAVY,  type: "bar" },
        { key: "customer", name: "Customer / MSA",  color: GOLD,  type: "bar" },
        { key: "labour",   name: "Contract labour", color: CORAL, type: "bar" },
      ],
    },
    actions: [
      { title: "Close Supplier C legal review this week", detail: "Escalate indemnity and audit clauses to GC; target 5-day close to unlock shipment", impact: "$0.8M Q4" },
      { title: "Renegotiate DC labour rate cards",        detail: "Phoenix card renews Nov 1 — reset to off-peak benchmark before counter-signing",  impact: "$0.6M Q4" },
      { title: "Pursue Supplier B FM partial recovery",   detail: "Counter-letter on shortfall penalty; settlement target 60% of the $1.4M deferred", impact: "$0.5M cash" },
      { title: "Convert top-6 debtor MSAs to net-30",     detail: "Bundle into recovery plan with service-restoration milestones tied to payment terms", impact: "$0.4M DSO" },
    ],
    actionsRecoveryUsd: "$2.3M predicted recovery",
    gaps: [
      { category: "DATA",     title: "Unified contract repository",      detail: "Contracts split across SharePoint, DocuSign and email — no single source of truth" },
      { category: "MODEL",    title: "ETF and penalty exposure model",   detail: "No automatic surfacing of early-termination or shortfall-penalty exposure across the book" },
      { category: "WORKFLOW", title: "Renewal review cadence",           detail: "62 evergreen contracts auto-renew with no scheduled review touchpoint" },
      { category: "INTEG",    title: "Contract terms → ERP propagation", detail: "Payment terms, SLAs and price escalators are not flowed into the transactional system" },
      { category: "SIGNAL",   title: "Counterparty financial health",    detail: "No early-warning signal when a supplier or customer's public filings change" },
    ],
    gapsPipelineUsd: "$3.4M indicative pipeline",
    counterArgs: [
      { title: "Force majeure is industry-standard exposure",   ci: "12% CI", detail: "FM clauses appear in 78% of peer supplier contracts; the issue is invocation pattern, not the clause itself." },
      { title: "Evergreen renewals are operationally efficient", ci: "9% CI",  detail: "True for low-value contracts; 18 of the 62 evergreens are above $250K annualised and should be on a review cycle." },
    ],
  },
];

export function getLayer(key: string) {
  return LAYERS.find(l => l.key === key)!;
}
