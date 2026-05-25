export type FeedStatus = "live" | "stale" | "partial" | "missing" | "manual";
export type FeedType =
  | "ERP" | "CRM" | "WMS" | "POS" | "DW"
  | "Web" | "Ads" | "CDP" | "Social" | "Search"
  | "Survey" | "Panel" | "Scraper" | "External" | "HRIS"
  | "Sensor" | "EDI" | "Audit" | "Model" | "Manual" | "GEO";

export interface DataFeed {
  source: string;
  type: FeedType;
  cadence: string;
  lastSync: string;
  completeness: number;
  status: FeedStatus;
  pipelineUsd?: string;
  pipelineNote?: string;
}

export const FEEDS: Record<string, DataFeed[]> = {
  "business-performance": [
    { source: "SAP S/4HANA, GL + revenue",       type: "ERP",    cadence: "Hourly",        lastSync: "14m ago",  completeness: 100, status: "live" },
    { source: "NetSuite, working capital",        type: "ERP",    cadence: "Daily 6am",     lastSync: "14h ago",  completeness: 98,  status: "live" },
    { source: "Salesforce, order pipeline",       type: "CRM",    cadence: "Real-time",     lastSync: "1m ago",   completeness: 96,  status: "live" },
    { source: "Adaptive Planning, budget v actual", type: "Model", cadence: "Weekly Mon",   lastSync: "2d ago",   completeness: 100, status: "live" },
    { source: "Trade portal, DIY EPOS",           type: "Manual", cadence: "Manual upload", lastSync: "4d ago",   completeness: 78,  status: "manual", pipelineUsd: "$0.4M", pipelineNote: "23% of trade volume reports manually" },
    { source: "Numerator, consumer panel",        type: "Panel",  cadence: "Weekly",        lastSync: "8d ago",   completeness: 100, status: "stale" },
    { source: "Macro feeds, regional sentiment",  type: "External", cadence: "·",            lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.6M", pipelineNote: "Regional confidence not in any model" },
    { source: "Investor relations, peer benchmarks", type: "External", cadence: "Quarterly", lastSync: "47d ago", completeness: 100, status: "live" },
  ],
  "demand-intelligence": [
    { source: "Manhattan WMS, OOS events",        type: "WMS",    cadence: "Real-time",     lastSync: "38s ago",  completeness: 100, status: "live" },
    { source: "POS aggregator, retail stores",    type: "POS",    cadence: "Hourly",        lastSync: "12m ago",  completeness: 99,  status: "live" },
    { source: "Blue Yonder, forecast model",      type: "Model",  cadence: "Quarterly",     lastSync: "187d ago", completeness: 100, status: "stale", pipelineUsd: "$0.3M Q4", pipelineNote: "Last retrain March 2025, pre-supply shock" },
    { source: "Trade EPOS, DIY channel",          type: "EDI",    cadence: "Daily 8am",     lastSync: "18h ago",  completeness: 77,  status: "partial", pipelineUsd: "$0.2M" },
    { source: "Circana, category share",          type: "Panel",  cadence: "Weekly",        lastSync: "6d ago",   completeness: 100, status: "live" },
    { source: "NOAA, regional weather",           type: "External", cadence: "·",           lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.3M", pipelineNote: "Garden & Outdoor demand swings unmodelled" },
    { source: "Google Trends, category interest", type: "Search", cadence: "Daily",         lastSync: "4h ago",   completeness: 100, status: "live" },
    { source: "Competitor price scraper, top 200", type: "Scraper", cadence: "Daily",       lastSync: "5d ago",   completeness: 84,  status: "stale", pipelineUsd: "$0.4M", pipelineNote: "4–7 day lag blocks day-of decisions" },
  ],
  "competitive-intelligence": [
    { source: "Numerator, share + promo",         type: "Panel",  cadence: "Weekly",        lastSync: "6d ago",   completeness: 100, status: "live" },
    { source: "SimilarWeb, competitor web traffic", type: "Web",  cadence: "Weekly",        lastSync: "4d ago",   completeness: 100, status: "live" },
    { source: "Competitor SKU scraper",            type: "Scraper", cadence: "Daily",        lastSync: "5d ago",   completeness: 84,  status: "stale", pipelineUsd: "$0.6M", pipelineNote: "Coverage limited to top 200 SKUs" },
    { source: "Loyalty data, cross-shop pattern", type: "CDP",    cadence: "Weekly",        lastSync: "9d ago",   completeness: 67,  status: "partial", pipelineUsd: "$0.5M", pipelineNote: "Loyalty data does not capture cross-shop behaviour" },
    { source: "Salesforce, internal win/loss",    type: "CRM",    cadence: "Real-time",     lastSync: "4m ago",   completeness: 92,  status: "live" },
    { source: "Pricing intel API → decision tool", type: "Model",  cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.8M", pipelineNote: "Competitor data not fed into pricing tool" },
    { source: "Earnings call transcripts",         type: "External", cadence: "Quarterly",   lastSync: "23d ago",  completeness: 100, status: "live" },
    { source: "Field intel, manual store visits", type: "Manual", cadence: "Weekly",        lastSync: "11d ago",  completeness: 100, status: "manual" },
  ],
  "customer-intelligence": [
    { source: "Salesforce CRM, accounts + activity", type: "CRM", cadence: "Real-time",     lastSync: "2m ago",   completeness: 98,  status: "live" },
    { source: "Zendesk, service tickets",         type: "CRM",    cadence: "Real-time",     lastSync: "47s ago",  completeness: 100, status: "live" },
    { source: "Segment, behavioural events",      type: "CDP",    cadence: "Real-time",     lastSync: "1m ago",   completeness: 94,  status: "live" },
    { source: "Customer health score, internal",  type: "Model",  cadence: "Weekly",        lastSync: "6d ago",   completeness: 100, status: "stale", pipelineUsd: "$0.3M", pipelineNote: "Score is weekly; should fire on event" },
    { source: "CRM ↔ WMS integration (OOS view)",  type: "EDI",    cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.5M", pipelineNote: "AMs cannot see ETA on customer-impacting OOS" },
    { source: "Voice of customer, NPS survey",    type: "Survey", cadence: "Quarterly",     lastSync: "31d ago",  completeness: 100, status: "live" },
    { source: "Five9, call interactions",         type: "CRM",    cadence: "Real-time",     lastSync: "22s ago",  completeness: 71,  status: "partial", pipelineUsd: "$0.4M", pipelineNote: "Phone interactions not coded for sentiment" },
    { source: "Account manager log, CRM notes",   type: "Manual", cadence: "Manual",        lastSync: "1d ago",   completeness: 64,  status: "manual" },
  ],
  "brand-social": [
    { source: "Brandwatch, social sentiment",     type: "Social", cadence: "Hourly",        lastSync: "8m ago",   completeness: 100, status: "live" },
    { source: "SEMrush, search rank",             type: "Search", cadence: "Daily",         lastSync: "6h ago",   completeness: 100, status: "live" },
    { source: "Adobe Analytics, owned content",   type: "Web",    cadence: "Real-time",     lastSync: "1m ago",   completeness: 99,  status: "live" },
    { source: "Cision, earned media",             type: "External", cadence: "Daily",       lastSync: "14h ago",  completeness: 100, status: "live" },
    { source: "Profound + Otterly, AI answer-engine citations", type: "GEO", cadence: "Daily", lastSync: "2d ago", completeness: 58, status: "partial", pipelineUsd: "$0.4M", pipelineNote: "Only ChatGPT and Perplexity tracked today; Gemini and AI Overviews coverage partial, no entity-level diff against Home Depot or Lowe's" },
    { source: "Regional sentiment, DMA-level",    type: "Social", cadence: "Weekly",        lastSync: "9d ago",   completeness: 42,  status: "partial", pipelineUsd: "$0.4M", pipelineNote: "National roll-up only; cannot target by metro" },
    { source: "CMS rank integration, WordPress",  type: "Web",    cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.3M", pipelineNote: "Rank changes not visible to content team" },
    { source: "YouGov, brand tracker",            type: "Survey", cadence: "Quarterly",     lastSync: "31d ago",  completeness: 100, status: "live" },
    { source: "Comms inbox, sentiment alerts",    type: "Manual", cadence: "Manual",        lastSync: "4d ago",   completeness: 100, status: "manual" },
  ],
  "supply-chain": [
    { source: "Manhattan WMS, DC inventory",      type: "WMS",    cadence: "Real-time",     lastSync: "22s ago",  completeness: 100, status: "live" },
    { source: "EDI 856 ASN, supplier ship",       type: "EDI",    cadence: "Real-time",     lastSync: "4m ago",   completeness: 89,  status: "partial", pipelineUsd: "$0.4M", pipelineNote: "Tier-2 suppliers not on EDI" },
    { source: "Blue Yonder, forecast",            type: "Model",  cadence: "Quarterly",     lastSync: "187d ago", completeness: 100, status: "stale", pipelineUsd: "$0.3M" },
    { source: "Carrier API (FedEx, JB Hunt)",      type: "External", cadence: "Hourly",      lastSync: "18m ago",  completeness: 96,  status: "live" },
    { source: "Supplier production line, Tier-1", type: "EDI",    cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.7M", pipelineNote: "No real-time line view from tier-1 suppliers" },
    { source: "Kronos, DC labour scheduling",     type: "HRIS",   cadence: "Daily",         lastSync: "17h ago",  completeness: 88,  status: "partial", pipelineUsd: "$0.3M" },
    { source: "NOAA, weather forecast input",     type: "External", cadence: "·",           lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.3M" },
    { source: "DC throughput sensors, IoT",       type: "Sensor", cadence: "Real-time",     lastSync: "14s ago",  completeness: 100, status: "live" },
  ],
  "pricing-margin": [
    { source: "SAP pricing, ERP",                 type: "ERP",    cadence: "Real-time",     lastSync: "38s ago",  completeness: 100, status: "live" },
    { source: "Competitor price scraper",          type: "Scraper", cadence: "Daily",        lastSync: "5d ago",   completeness: 84,  status: "stale", pipelineUsd: "$0.6M", pipelineNote: "4–7 day lag blocks day-of decisions" },
    { source: "Margin elasticity model, internal", type: "Model", cadence: "Quarterly",    lastSync: "187d ago", completeness: 100, status: "stale", pipelineUsd: "$0.5M", pipelineNote: "Pre-supply-shock; underestimates sensitivity" },
    { source: "Cost master, supplier feeds",      type: "EDI",    cadence: "Weekly",        lastSync: "4d ago",   completeness: 91,  status: "partial", pipelineUsd: "$0.3M" },
    { source: "Promo planning, Adobe Workfront",  type: "Manual", cadence: "Manual",        lastSync: "2d ago",   completeness: 100, status: "manual" },
    { source: "Pricing decision audit trail",      type: "Audit",  cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.4M", pipelineNote: "Manual approval chain, no decision logging" },
    { source: "Trade pricing tier, mainframe",    type: "ERP",    cadence: "Daily",         lastSync: "21h ago",  completeness: 84,  status: "partial" },
    { source: "Cost-pass workflow, ERP↔pricing",  type: "EDI",    cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.3M", pipelineNote: "Two-system manual sync delays activation 48h" },
  ],
  "sales-pipeline": [
    { source: "Salesforce, pipeline + stages",    type: "CRM",    cadence: "Real-time",     lastSync: "1m ago",   completeness: 78,  status: "partial", pipelineUsd: "$0.4M", pipelineNote: "22% of stage transitions missing dates" },
    { source: "Outreach, activity logs",          type: "CRM",    cadence: "Real-time",     lastSync: "22s ago",  completeness: 96,  status: "live" },
    { source: "Gong, call intelligence",          type: "CRM",    cadence: "Daily",         lastSync: "8h ago",   completeness: 100, status: "live" },
    { source: "Forecast model, internal",         type: "Model",  cadence: "Weekly",        lastSync: "27d ago",  completeness: 100, status: "stale", pipelineUsd: "$0.3M" },
    { source: "6sense, buying intent",            type: "External", cadence: "·",           lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.6M", pipelineNote: "No external buying-intent feed for trade segment" },
    { source: "CRM ↔ pricing integration",         type: "EDI",    cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.4M", pipelineNote: "AEs cannot quote with current pricing inside CRM" },
    { source: "ZoomInfo, account intelligence",   type: "External", cadence: "Daily",       lastSync: "11h ago",  completeness: 100, status: "live" },
    { source: "Deal review log, spreadsheet",     type: "Manual", cadence: "Manual",        lastSync: "4d ago",   completeness: 100, status: "manual" },
  ],
  "marketing-performance": [
    { source: "Meta Ads, spend + performance",    type: "Ads",    cadence: "Real-time",     lastSync: "4m ago",   completeness: 100, status: "live" },
    { source: "Google Ads, search + display",     type: "Ads",    cadence: "Real-time",     lastSync: "2m ago",   completeness: 100, status: "live" },
    { source: "Adobe Analytics, conversions",     type: "Web",    cadence: "Real-time",     lastSync: "41s ago",  completeness: 99,  status: "live" },
    { source: "Server-side attribution layer",     type: "Model",  cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.5M Q4", pipelineNote: "33% of conversions unattributed" },
    { source: "MMM run output",                    type: "Model",  cadence: "Quarterly",     lastSync: "67d ago",  completeness: 100, status: "stale", pipelineUsd: "$0.3M" },
    { source: "Klaviyo, lifecycle email",         type: "CDP",    cadence: "Hourly",        lastSync: "24m ago",  completeness: 100, status: "live" },
    { source: "Creative performance signal",       type: "Model",  cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.2M", pipelineNote: "Fatigue detected after the fact, not predicted" },
    { source: "Affiliate networks, CJ + Impact",  type: "External", cadence: "Daily",       lastSync: "14h ago",  completeness: 93,  status: "live" },
  ],
  "finance": [
    { source: "SAP S/4HANA, GL + AP/AR",         type: "ERP",    cadence: "Hourly",        lastSync: "14m ago",  completeness: 100, status: "live" },
    { source: "NetSuite, close + consolidation", type: "ERP",    cadence: "Daily 6am",     lastSync: "14h ago",  completeness: 98,  status: "live" },
    { source: "Adaptive Planning, budget v actual", type: "Model", cadence: "Weekly Mon", lastSync: "2d ago",   completeness: 100, status: "live" },
    { source: "Treasury, bank balance",          type: "ERP",    cadence: "Daily 4am",     lastSync: "18h ago",  completeness: 100, status: "live" },
    { source: "AWS + GCP cost explorer",          type: "External", cadence: "Daily",       lastSync: "9h ago",   completeness: 84,  status: "partial", pipelineUsd: "$0.4M", pipelineNote: "Cloud cost not joined to ERP cost centre" },
    { source: "Vendor invoice extract, Bill.com",type: "EDI",    cadence: "Hourly",        lastSync: "47m ago",  completeness: 92,  status: "live" },
    { source: "Cash forecasting model, 13-week", type: "Model",  cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.6M", pipelineNote: "Direct method only; no rolling 13-week indirect view" },
    { source: "Budget reforecast workflow",       type: "Audit",  cadence: "Quarterly",     lastSync: "67d ago",  completeness: 100, status: "stale", pipelineUsd: "$0.4M", pipelineNote: "No in-quarter envelope reset trigger" },
  ],
  "receivables": [
    { source: "SAP AR sub-ledger",                type: "ERP",    cadence: "Real-time",     lastSync: "1m ago",   completeness: 100, status: "live" },
    { source: "Bill.com, invoice issue",         type: "EDI",    cadence: "Hourly",        lastSync: "22m ago",  completeness: 100, status: "live" },
    { source: "Bank reconciliation feed",         type: "ERP",    cadence: "Daily",         lastSync: "8h ago",   completeness: 88,  status: "partial", pipelineUsd: "$0.3M", pipelineNote: "12% of payments require manual matching" },
    { source: "Salesforce, account + contact",   type: "CRM",    cadence: "Real-time",     lastSync: "2m ago",   completeness: 96,  status: "live" },
    { source: "Dunning workflow, Versapay",      type: "Model",  cadence: "Hourly",        lastSync: "1h ago",   completeness: 78,  status: "partial", pipelineUsd: "$0.4M", pipelineNote: "August approval step stalled cadence" },
    { source: "Promise-to-pay tracking",          type: "Manual", cadence: "Manual",        lastSync: "1d ago",   completeness: 41,  status: "manual", pipelineUsd: "$0.2M", pipelineNote: "Verbal commitments captured in notes" },
    { source: "Payment-risk model",               type: "Model",  cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.4M", pipelineNote: "No predictive late-payment model by account" },
    { source: "Credit bureau API, D&B",          type: "External", cadence: "Weekly",      lastSync: "5d ago",   completeness: 100, status: "live" },
  ],
  "talent-hr": [
    { source: "Workday, HRIS core",              type: "HRIS",   cadence: "Hourly",        lastSync: "17m ago",  completeness: 100, status: "live" },
    { source: "Greenhouse, ATS",                 type: "HRIS",   cadence: "Real-time",     lastSync: "2m ago",   completeness: 100, status: "live" },
    { source: "LinkedIn Recruiter, sourcing",    type: "External", cadence: "Daily",       lastSync: "11h ago",  completeness: 88,  status: "partial", pipelineUsd: "$0.2M", pipelineNote: "Source-of-hire attribution missing for 31%" },
    { source: "Lattice, performance + 1:1s",     type: "Survey", cadence: "Quarterly",     lastSync: "67d ago",  completeness: 100, status: "stale", pipelineUsd: "$0.3M", pipelineNote: "Annual cadence cannot detect mid-quarter risk" },
    { source: "Kronos, time + attendance",       type: "HRIS",   cadence: "Hourly",        lastSync: "33m ago",  completeness: 94,  status: "live" },
    { source: "Quality-of-hire model",            type: "Model",  cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.3M", pipelineNote: "90-day performance not linked to sourcing channel" },
    { source: "Comp benchmarking, Meridian Industrial survey",type: "External", cadence: "Annual",      lastSync: "240d ago", completeness: 100, status: "stale" },
    { source: "Offer approval workflow",          type: "Audit",  cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.2M", pipelineNote: "5-step approval; market window is now 48h" },
  ],
  "contract-management": [
    { source: "DocuSign CLM, executed contracts",      type: "ERP",      cadence: "Real-time",     lastSync: "3m ago",   completeness: 92,  status: "live" },
    { source: "Ironclad, contract repository",         type: "Audit",    cadence: "Hourly",        lastSync: "27m ago",  completeness: 84,  status: "partial", pipelineUsd: "$0.5M", pipelineNote: "Pre-2023 supplier paper still on SharePoint, not indexed" },
    { source: "SAP Ariba, supplier agreement terms",   type: "ERP",      cadence: "Daily",         lastSync: "14h ago",  completeness: 88,  status: "live" },
    { source: "Salesforce CPQ, customer MSA terms",    type: "CRM",      cadence: "Real-time",     lastSync: "2m ago",   completeness: 96,  status: "live" },
    { source: "Counterparty health signal, D&B",       type: "External", cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.4M", pipelineNote: "No early-warning when a supplier or customer's public filings change" },
    { source: "ETF / penalty exposure model",           type: "Model",    cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.6M", pipelineNote: "Early-termination and shortfall-penalty exposure not surfaced across book" },
    { source: "Renewal review workflow, legal ops",    type: "Manual",   cadence: "Manual",        lastSync: "9d ago",   completeness: 58,  status: "manual", pipelineUsd: "$0.4M", pipelineNote: "62 evergreen contracts auto-renew without scheduled review" },
    { source: "Contract terms ↔ ERP propagation",       type: "EDI",      cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.5M", pipelineNote: "Payment terms, SLAs and price escalators not flowed into transactional system" },
  ],
  "people-operations": [
    { source: "Workday, HRIS core",               type: "HRIS",   cadence: "Hourly",        lastSync: "17m ago",  completeness: 100, status: "live" },
    { source: "Greenhouse, recruiting",           type: "HRIS",   cadence: "Real-time",     lastSync: "2m ago",   completeness: 100, status: "live" },
    { source: "Kronos, time + attendance",        type: "HRIS",   cadence: "Hourly",        lastSync: "33m ago",  completeness: 94,  status: "live" },
    { source: "Lattice, performance + engagement",type: "Survey", cadence: "Quarterly",     lastSync: "67d ago",  completeness: 100, status: "stale", pipelineUsd: "$0.3M", pipelineNote: "Engagement measured quarterly; need pulse cadence" },
    { source: "Exit reason coding, free-text",    type: "Manual", cadence: "Manual",        lastSync: "1d ago",   completeness: 41,  status: "partial", pipelineUsd: "$0.2M", pipelineNote: "Free-text only; not codified for analysis" },
    { source: "HRIS ↔ ops dashboard integration",  type: "EDI",    cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.3M", pipelineNote: "Operations dashboards do not show staffing gaps" },
    { source: "Meridian Industrial comp benchmarking",          type: "External", cadence: "Annual",      lastSync: "240d ago", completeness: 100, status: "stale" },
    { source: "Manager nudge workflow",            type: "Model",  cadence: "·",             lastSync: "Never",    completeness: 0,   status: "missing", pipelineUsd: "$0.2M", pipelineNote: "No automated nudge on attrition risk" },
  ],
};

export const ACTIVITY_STREAM: { ts: string; layer: string; text: string; tone: "info" | "warn" | "alert" }[] = [
  { ts: "06:42", layer: "business-performance",     text: "Diagnosis re-scored, Business performance confidence 87% (no change)", tone: "info" },
  { ts: "06:38", layer: "supply-chain",             text: "Stockout detected · DFW DC · SKU-44218 · 3rd event this week", tone: "alert" },
  { ts: "06:33", layer: "competitive-intelligence", text: "Lowe's price drop captured · Outdoor Living Q-tier · -8.2%", tone: "warn" },
  { ts: "06:27", layer: "demand-intelligence",      text: "Forecast variance crossed -10% on Home Improvement", tone: "warn" },
  { ts: "06:18", layer: "pricing-margin",           text: "Margin elasticity model flagged stale, 187 days since refresh", tone: "alert" },
  { ts: "06:12", layer: "customer-intelligence",    text: "3 trade accounts entered at-risk band · Texas region", tone: "alert" },
  { ts: "06:04", layer: "people-operations",        text: "Dallas DC headcount −2 · pick zone now 11 below plan", tone: "warn" },
  { ts: "05:58", layer: "brand-social",             text: "Regional press cycle detected · DFW Morning News · stockout angle", tone: "warn" },
  { ts: "05:51", layer: "sales-pipeline",           text: "Deal slipped Sep → Nov · $340k · Mid-West contractor", tone: "warn" },
  { ts: "05:44", layer: "marketing-performance",    text: "Meta CPM up 11% week-on-week in target audience", tone: "info" },
  { ts: "05:36", layer: "supply-chain",             text: "Supplier B confirmed 7-day delay on 4 SKUs", tone: "alert" },
  { ts: "05:22", layer: "competitive-intelligence", text: "Home Depot opened 3 new SE locations · private label expansion", tone: "warn" },
  { ts: "05:08", layer: "customer-intelligence",    text: "Service SLA breach #41 this week · DFW lane", tone: "alert" },
  { ts: "04:51", layer: "demand-intelligence",      text: "Cortex Lens picked up weather signal for Phoenix Garden", tone: "info" },
  { ts: "04:33", layer: "people-operations",        text: "2 senior data engineers in 30-day notice window", tone: "alert" },
];
