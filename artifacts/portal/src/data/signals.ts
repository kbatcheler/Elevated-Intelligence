export type SignalTone = "info" | "warn" | "alert" | "good";

export interface IncomingSignal {
  ts: string;        // 04:18
  source: string;    // "Numerator panel"
  layer: string;     // layer key
  metric?: string;   // optional metric label to pulse
  text: string;
  tone: SignalTone;
  delta?: string;    // optional delta to show
}

// Long pool — ticker rotates through, occasionally pulses a metric on the
// currently-viewed layer.
export const SIGNAL_POOL: IncomingSignal[] = [
  { ts: "04:18", source: "Competitor scraper", layer: "competitive-intelligence", metric: "Competitor promo depth", text: "Home Depot promo depth re-scraped — 32% across SE markets", tone: "alert", delta: "+4pp" },
  { ts: "04:21", source: "Manhattan WMS",       layer: "supply-chain",            metric: "OOS days top 5 SKUs",   text: "Dallas DC stockout cleared on SKU-4128 (cordless drill)", tone: "good",  delta: "−1d" },
  { ts: "04:22", source: "Adobe Analytics",     layer: "brand-social",            metric: "Search visibility index",text: "Owned reach lifted 14% on Garden category page", tone: "good",  delta: "+14%" },
  { ts: "04:25", source: "POS aggregator",      layer: "demand-intelligence",     metric: "Variance vs plan",       text: "DIY hourly POS lagging plan 18% — Phoenix metro", tone: "alert", delta: "−18%" },
  { ts: "04:28", source: "SAP S/4HANA",         layer: "business-performance",    metric: "Revenue",                text: "Revenue ledger refreshed — closed Q3 at $127M", tone: "info" },
  { ts: "04:30", source: "Five9",               layer: "customer-intelligence",   metric: "Trade customer churn",   text: "Call volume spike on order ETA enquiries", tone: "warn",  delta: "+42%" },
  { ts: "04:33", source: "Salesforce",          layer: "sales-pipeline",          metric: "Pipeline coverage",      text: "$1.2M opportunity slipped from Q3 to Q4 commit", tone: "alert", delta: "−$1.2M" },
  { ts: "04:35", source: "Pricing scraper",     layer: "pricing-margin",          metric: "Price index vs Home Depot", text: "Meridian Industrial +$20 vs Home Depot on cordless drill range", tone: "warn",  delta: "+$20" },
  { ts: "04:37", source: "Numerator panel",     layer: "competitive-intelligence",metric: "Market share",           text: "Weekly share refresh — Meridian Industrial 14.2%, HD 38.9%", tone: "warn",  delta: "−0.1pp" },
  { ts: "04:40", source: "DC sensors",          layer: "supply-chain",            metric: "DC throughput",          text: "Phoenix DC throughput +12% on second shift", tone: "good",  delta: "+12%" },
  { ts: "04:43", source: "Brandwatch",          layer: "brand-social",            metric: "Brand sentiment",        text: "Negative mention cluster forming around 'price gouging'", tone: "alert", delta: "−6pts" },
  { ts: "04:46", source: "NetSuite",            layer: "receivables",             metric: "DSO",                    text: "Greater Plains Co. invoice 47d overdue — escalate", tone: "alert", delta: "+47d" },
  { ts: "04:49", source: "Kronos",              layer: "people-operations",       metric: "Voluntary attrition",    text: "DC Ops attrition annualised — 24%, vs 12% target", tone: "alert", delta: "+12pp" },
  { ts: "04:52", source: "Adaptive Planning",   layer: "finance",                 metric: "EBITDA",                 text: "Q3 EBITDA closed $6.5M below plan", tone: "alert", delta: "−$6.5M" },
  { ts: "04:55", source: "Workday ATS",         layer: "talent-hr",               metric: "Time-to-fill",           text: "Senior buyer role hit 84d open — critical", tone: "alert", delta: "+24d" },
  { ts: "04:58", source: "Google Ads",          layer: "marketing-performance",   metric: "MROI",                   text: "Brand campaign ROAS dipped under 2.0× for the first time", tone: "warn",  delta: "−0.3×" },
  { ts: "05:02", source: "Adobe Analytics",     layer: "business-performance",    metric: "Customer NPS",           text: "Pulse NPS refreshed — net 38, down from 41", tone: "warn",  delta: "−3" },
  { ts: "05:05", source: "Trade EPOS",          layer: "demand-intelligence",     metric: "Forecast accuracy",      text: "Forecast MAPE on Home Improvement category — 13pp", tone: "alert", delta: "+5pp" },
  { ts: "05:08", source: "EDI 856",             layer: "supply-chain",            metric: "Supplier OTD",           text: "Supplier B confirmed ASN — DIY range, 4-day ETA", tone: "good",  delta: "OTD" },
  { ts: "05:11", source: "Numerator",           layer: "competitive-intelligence",metric: "Market share",           text: "Garden + Outdoor share +0.4pp WoW", tone: "good",  delta: "+0.4pp" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Anomaly inbox — 47 anomalies surfaced today
// ─────────────────────────────────────────────────────────────────────────────

export type AnomalySeverity = "critical" | "high" | "medium" | "low";

export interface Anomaly {
  id: string;
  ts: string;
  layer: string;
  severity: AnomalySeverity;
  title: string;
  detail: string;
  evidence?: string;
  delta?: string;
}

export const ANOMALIES: Anomaly[] = [
  { id: "A-2841", ts: "06:38", layer: "demand-intelligence",     severity: "critical", title: "DIY variance breaches 2σ for sixth day", detail: "Plan-actual gap on DIY channel has been outside 2σ band for six trading days, concentrated in SE region.", delta: "−$1.4M", evidence: "POS aggregator · 14 stores" },
  { id: "A-2840", ts: "06:22", layer: "competitive-intelligence",severity: "critical", title: "Home Depot promo depth +14pp WoW",        detail: "Competitor promo depth in core overlap categories now 32% vs 18% baseline. Sustained two weeks.", delta: "+14pp", evidence: "Pricing scraper · 412 SKUs" },
  { id: "A-2839", ts: "06:11", layer: "receivables",             severity: "critical", title: "Greater Plains Co. now 47d overdue",      detail: "$420K invoice for August order. No response from AP contact since Sep 14. Credit hold recommended.", delta: "$420K", evidence: "NetSuite + AM log" },
  { id: "A-2838", ts: "05:48", layer: "supply-chain",            severity: "high",     title: "Phoenix DC labour shortfall projected",   detail: "Kronos schedule shows 11 unfilled shifts next week. Throughput risk for Garden category replenishment.", delta: "−14%", evidence: "Kronos roster" },
  { id: "A-2837", ts: "05:36", layer: "pricing-margin",          severity: "high",     title: "Margin slip on Cordless tools",           detail: "Promo matching deepened to 28% on the cordless range; gross margin dropped to 16% vs 22% blended.", delta: "−6pp",  evidence: "SAP P&L + scraper" },
  { id: "A-2836", ts: "05:24", layer: "people-operations",       severity: "high",     title: "DC Operations attrition over target",     detail: "Annualised attrition for DC Ops crossed 24% vs 12% target — second consecutive week.", delta: "+12pp", evidence: "Workday HRIS" },
  { id: "A-2835", ts: "05:11", layer: "customer-intelligence",   severity: "high",     title: "Service ticket spike — order ETA",        detail: "Five9 call volume on order ETA enquiries +42% DoD, consistent with DC inventory gap.", delta: "+42%",  evidence: "Five9 + Zendesk" },
  { id: "A-2834", ts: "05:02", layer: "finance",                 severity: "high",     title: "EBITDA close $6.5M below plan",           detail: "Adaptive Planning reconciliation confirms Q3 EBITDA shortfall driven by margin compression in Pricing.", delta: "−$6.5M", evidence: "Adaptive Planning" },
  { id: "A-2833", ts: "04:54", layer: "talent-hr",               severity: "high",     title: "Senior buyer role — 84 days open",        detail: "Critical role in Pricing & Merchandising team has crossed 84-day open threshold.", delta: "+24d",  evidence: "Workday ATS" },
  { id: "A-2832", ts: "04:42", layer: "brand-social",            severity: "medium",   title: "Negative sentiment cluster forming",      detail: "Brandwatch detected emerging cluster around 'price gouging' narrative — 14 mentions in 6h.", delta: "−6pts", evidence: "Brandwatch" },
  { id: "A-2831", ts: "04:31", layer: "marketing-performance",   severity: "medium",   title: "Brand campaign ROAS under 2.0×",          detail: "Display brand campaigns dipped under 2.0× ROAS — first time this quarter.", delta: "−0.3×", evidence: "Google Ads" },
  { id: "A-2830", ts: "04:21", layer: "sales-pipeline",          severity: "medium",   title: "Q3 commit deal slipped — Q4",             detail: "$1.2M trade deal moved from Q3 commit to Q4 best-case. Customer confirmed delay.", delta: "−$1.2M", evidence: "Salesforce" },
  { id: "A-2829", ts: "04:08", layer: "demand-intelligence",     severity: "medium",   title: "Forecast MAPE drift — Home Imp",          detail: "Forecast error on Home Improvement category drifted to 13pp from 8pp baseline.", delta: "+5pp",  evidence: "Blue Yonder model" },
  { id: "A-2828", ts: "03:54", layer: "supply-chain",            severity: "medium",   title: "Supplier B ASN late",                     detail: "EDI 856 from Supplier B 6h late on DIY range shipment. ETA still within tolerance.", delta: "−6h",   evidence: "EDI 856" },
  { id: "A-2827", ts: "03:42", layer: "competitive-intelligence",severity: "medium",   title: "Lowe's loyalty offer launched",            detail: "Lowe's launched targeted 15% loyalty offer in 6 metros — overlap with Meridian Industrial share.", delta: "−0.3pp",evidence: "Field intel + scraper" },
  { id: "A-2826", ts: "03:28", layer: "receivables",             severity: "low",      title: "9 invoices entered 31–60d bucket",         detail: "Daily aging refresh — 9 invoices migrated from current to 31-60d. Total $187K.", delta: "$187K", evidence: "NetSuite aging" },
  { id: "A-2825", ts: "03:14", layer: "customer-intelligence",   severity: "low",      title: "NPS detractor cluster — Phoenix metro",   detail: "Survey detractor share rose to 28% in Phoenix metro this week.", delta: "+8pp",  evidence: "VOC survey" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Evidence drill-down — what's behind a metric value
// ─────────────────────────────────────────────────────────────────────────────

export interface EvidenceRow {
  source: string;
  ts: string;
  value: string;
  confidence: number;     // per-source 0–100
  note?: string;
}

export interface CalculationStep {
  step: string;             // "Period actual revenue"
  value: string;            // "$19.8M"
  note?: string;            // narrative
}

export interface EvidenceSpec {
  layer: string;
  metric: string;
  value: string;
  computedAs: string;       // human formula
  query: string;            // shown as code
  combinedConfidence: number;
  rows: EvidenceRow[];
  calculation?: CalculationStep[];   // optional step-by-step trace
}

export const EVIDENCE: Record<string, EvidenceSpec> = {
  // demand-intelligence · Variance vs plan
  "demand-intelligence/Variance vs plan": {
    layer: "demand-intelligence",
    metric: "Variance vs plan",
    value: "−$2.8M",
    computedAs: "Σ(period_actual_usd) − Σ(period_plan_usd)  ·  Q3 2026, all channels",
    query:
`SELECT
  SUM(actual_usd) - SUM(plan_usd) AS variance_usd,
  channel
FROM demand.daily_actual_vs_plan
WHERE period BETWEEN '2026-07-01' AND '2026-09-30'
GROUP BY channel;`,
    combinedConfidence: 84,
    rows: [
      { source: "POS aggregator — retail stores",  ts: "Sync 12m ago",  value: "−$1.42M (DIY)",         confidence: 99, note: "99% completeness · hourly" },
      { source: "Trade EPOS — DIY channel",        ts: "Sync 18h ago",  value: "−$0.92M (Home Imp.)",   confidence: 77, note: "77% completeness · 23% trade reports manually" },
      { source: "Manhattan WMS — OOS events",      ts: "Sync 38s ago",  value: "−$0.34M imputed",       confidence: 96, note: "Imputed from 41 stockout days × $8.3K per day" },
      { source: "Blue Yonder — forecast model",    ts: "Sync 187d ago", value: "Reference plan $22.6M", confidence: 62, note: "Last retrain March — biased low on Home Imp." },
      { source: "Adaptive Planning — budget",      ts: "Sync 2d ago",   value: "Budget plan $22.6M",    confidence: 100, note: "Plan locked Q2 close" },
    ],
    calculation: [
      { step: "1. Period plan (Adaptive Planning)",       value: "$22.6M",   note: "Locked at Q2 close · all-channels Q3 plan" },
      { step: "2. Period actual — POS aggregator",        value: "$11.8M",   note: "Retail-store hourly EPOS · 99% completeness" },
      { step: "3. Period actual — Trade EPOS",            value:  "$6.4M",   note: "23% of trade reports manually · imputed at channel mean" },
      { step: "4. Period actual — E-comm DW",             value:  "$1.6M",   note: "100% completeness · 4-minute sync lag" },
      { step: "5. Total period actual (lines 2 + 3 + 4)", value: "$19.8M" },
      { step: "6. Imputed stockout loss (WMS OOS feed)",  value: "+$0.34M",  note: "41 stockout days × $8.3K imputed loss per day on top-5 SKUs" },
      { step: "7. Adjusted actual (line 5 + line 6)",     value: "$20.14M" },
      { step: "8. Variance vs plan (line 7 − line 1)",    value: "−$2.46M",  note: "Rounded to −$2.8M for executive reporting (carries the model-degradation uplift)" },
    ],
  },
  "demand-intelligence/Period actual": {
    layer: "demand-intelligence",
    metric: "Period actual",
    value: "$19.8M",
    computedAs: "Σ(period_actual_usd)  ·  Q3 2026, all channels",
    query: `SELECT SUM(actual_usd) FROM demand.daily_actual WHERE period BETWEEN '2026-07-01' AND '2026-09-30';`,
    combinedConfidence: 91,
    rows: [
      { source: "POS aggregator", ts: "Sync 12m ago", value: "$11.8M",       confidence: 99 },
      { source: "Trade EPOS",     ts: "Sync 18h ago", value: "$6.4M",        confidence: 77, note: "Partial — manual gaps" },
      { source: "E-comm DW",      ts: "Sync 4m ago",  value: "$1.6M",        confidence: 100 },
    ],
  },
  // competitive-intelligence · Market share
  "competitive-intelligence/Market share": {
    layer: "competitive-intelligence",
    metric: "Market share",
    value: "14.3%",
    computedAs: "Meridian Industrial category sales / Σ(category sales for top-10 competitors)  ·  Q3 2026",
    query:
`SELECT
  brand,
  SUM(units * avg_price) AS gmv,
  gmv / SUM(gmv) OVER () AS share
FROM panel.numerator_weekly
WHERE period_end >= '2026-07-01'
GROUP BY brand
ORDER BY share DESC;`,
    combinedConfidence: 79,
    rows: [
      { source: "Numerator — consumer panel",   ts: "Sync 6d ago",  value: "14.1%",  confidence: 100, note: "Panel: 28K households" },
      { source: "Circana — category share",     ts: "Sync 6d ago",  value: "14.5%",  confidence: 100, note: "Retail audit" },
      { source: "SimilarWeb — web traffic",     ts: "Sync 4d ago",  value: "13.8% (proxy)", confidence: 70, note: "Web traffic share, used as cross-check" },
      { source: "Loyalty cross-shop",            ts: "Sync 9d ago",  value: "Partial — 67% coverage", confidence: 67 },
    ],
    calculation: [
      { step: "1. Meridian Industrial category GMV (Numerator)",       value: "$1.42B",  note: "Trailing 13 weeks · top-50 hardware/garden categories" },
      { step: "2. Top-10 competitor GMV (Numerator)",     value: "$9.93B",  note: "Same period · same categories" },
      { step: "3. Numerator share (line 1 ÷ line 2)",     value: "14.1%" },
      { step: "4. Circana cross-check",                   value: "14.5%",   note: "Independent retail audit · used as ±band" },
      { step: "5. SimilarWeb web-traffic proxy",          value: "13.8%",   note: "Web-traffic share, weighted 0.3× in blend" },
      { step: "6. Weighted blend (0.5×0.5×0.3 normalised)", value: "14.3%", note: "Floor confidence set by loyalty cross-shop coverage at 67%" },
    ],
  },
  "competitive-intelligence/Win rate vs Home Depot": {
    layer: "competitive-intelligence",
    metric: "Win rate vs Home Depot",
    value: "32%",
    computedAs: "Won trade deals where Home Depot was named runner-up / total deals where HD was a finalist",
    query:
`SELECT
  COUNT(*) FILTER (WHERE outcome = 'won') * 1.0 / COUNT(*) AS win_rate
FROM crm.opportunities o
JOIN crm.competitor_finalist cf ON cf.opp_id = o.id
WHERE cf.competitor = 'Home Depot'
  AND o.close_date >= '2026-07-01';`,
    combinedConfidence: 92,
    rows: [
      { source: "Salesforce — opportunities",     ts: "Sync 4m ago",  value: "184 deals · 59 won",   confidence: 92 },
      { source: "Field intel — manual visits",    ts: "Sync 11d ago", value: "Confirms HD intensity in SE", confidence: 80 },
    ],
  },
  // business-performance · Revenue
  "business-performance/Revenue": {
    layer: "business-performance",
    metric: "Revenue",
    value: "$127M",
    computedAs: "Σ(GL revenue lines)  ·  Q3 2026",
    query:
`SELECT SUM(amount_usd)
FROM gl.revenue_lines
WHERE period BETWEEN '2026-07-01' AND '2026-09-30';`,
    combinedConfidence: 96,
    rows: [
      { source: "SAP S/4HANA — GL",            ts: "Sync 14m ago", value: "$127.1M",  confidence: 100 },
      { source: "Salesforce — order pipeline", ts: "Sync 1m ago",  value: "$126.8M cross-check", confidence: 96 },
      { source: "Trade portal — DIY EPOS",     ts: "Sync 4d ago",  value: "Partial — 78%",  confidence: 78 },
    ],
    calculation: [
      { step: "1. SAP GL revenue lines (Q3 close)",       value: "$127.1M", note: "All revenue-recognition GL accounts, period 2026-07-01 → 2026-09-30" },
      { step: "2. Salesforce order-pipeline cross-check", value: "$126.8M", note: "Within 0.2% of GL — accepted" },
      { step: "3. Trade portal DIY EPOS reconciliation",  value: "$98.6M",  note: "78% completeness · used to validate channel mix, not headline" },
      { step: "4. Headline (line 1, GL = source of truth)", value: "$127M", note: "Rounded for reporting · combined confidence 96%" },
    ],
  },
};
