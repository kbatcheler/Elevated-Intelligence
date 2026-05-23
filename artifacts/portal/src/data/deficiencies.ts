// Data-feed deficiency overlay for the cross-layer dependency graph.
// Each gap is a missing or low-confidence data feed that bounds the precision
// of a specific layer's diagnosis. Each gap is mapped to one or more DiffDay
// products that, if deployed, would close the gap and recover the listed
// confidence uplift. The overlay turns the dependency graph into a substrate
// for product positioning: "here's the causal chain, here's where it's bound,
// here's the product that unblocks it."

export type ProductCategory =
  | "intelligence"   // generates new data signals
  | "orchestration"  // operationalises decisions
  | "access"         // how a human queries/consumes
  | "infrastructure";// foundational integration / contracts

// Source-of-truth product IDs. Adding a new product? Add it here AND below.
export const PRODUCT_IDS = [
  "unified-chat",
  "property-intel",
  "comp-sales",
  "contact-ownership",
  "news-monitor",
  "ai-companion",
  "nl-search",
  "data-integration",
  "contract-hub",
  "web-conversion",
  "legislative",
  "ops-intel",
  "invoicing",
] as const;
export type ProductId = (typeof PRODUCT_IDS)[number];

// Source-of-truth layer keys. Must match NODES.key in DependencyGraph.tsx.
export const LAYER_KEYS = [
  "business-performance",
  "finance",
  "demand-intelligence",
  "competitive-intelligence",
  "customer-intelligence",
  "brand-social",
  "supply-chain",
  "pricing-margin",
  "sales-pipeline",
  "marketing-performance",
  "people-operations",
  "receivables",
  "talent-hr",
] as const;
export type LayerKey = (typeof LAYER_KEYS)[number];

export interface DiffDayProduct {
  id: ProductId;
  name: string;
  category: ProductCategory;
  oneLiner: string;
}

export interface DataGap {
  id: string;
  layerKey: LayerKey;          // typed against LAYER_KEYS — typos won't compile
  feed: string;                // the missing data feed (short, < 50 chars)
  blocks: string;              // what this gap prevents the layer from diagnosing
  confidenceUplift: number;    // percentage-points of layer confidence recovered if closed
  productFit: ProductId[];     // typed against PRODUCT_IDS — typos won't compile
}

// 13 DiffDay products, exactly as positioned by the team.
export const DIFFDAY_PRODUCTS: DiffDayProduct[] = [
  { id: "unified-chat",       name: "Unified Chat Interface",          category: "access",        oneLiner: "Single conversational surface for all platform capabilities." },
  { id: "property-intel",     name: "Property Intelligence Module",    category: "intelligence",  oneLiner: "Centralised asset master: physical, financial, lease data." },
  { id: "comp-sales",         name: "Comparable Sales Engine",         category: "intelligence",  oneLiner: "Automated comp retrieval and branded proposal formatting." },
  { id: "contact-ownership",  name: "Contact & Ownership Intelligence",category: "intelligence",  oneLiner: "Unmasks LLC ownership to real decision-makers, syncs CRM." },
  { id: "news-monitor",       name: "News & Market Monitor",           category: "intelligence",  oneLiner: "Continuous external scan: industry, competitor, broader web." },
  { id: "ai-companion",       name: "AI Companion & Proactive Agent",  category: "access",        oneLiner: "Proactively identifies opportunities, drafts outreach." },
  { id: "nl-search",          name: "Natural Language Search",         category: "access",        oneLiner: "Semantic, spatial, temporal querying without report tickets." },
  { id: "data-integration",   name: "Data Integration Layer",          category: "infrastructure",oneLiner: "Normalised data lake across Salesforce, SharePoint, CoStar, etc." },
  { id: "contract-hub",       name: "Contract Intelligence Hub",       category: "intelligence",  oneLiner: "Extracts terms, surfaces ETF exposure, flags high-risk contracts." },
  { id: "web-conversion",     name: "Website Conversion Companion",    category: "orchestration", oneLiner: "AI-guided survey for best-fit product matching at entry." },
  { id: "legislative",        name: "Legislative Tracking Tool",       category: "intelligence",  oneLiner: "Tracks US legislation likely to affect operations; recommends action." },
  { id: "ops-intel",          name: "Operations Intelligence",         category: "orchestration", oneLiner: "Operations orchestration for CPG and multi-DC workflows." },
  { id: "invoicing",          name: "Invoicing Intelligence",          category: "intelligence",  oneLiner: "Flags discrepancies between invoiced and actual weight/quantity." },
];

export const PRODUCT_BY_ID: Record<string, DiffDayProduct> =
  Object.fromEntries(DIFFDAY_PRODUCTS.map(p => [p.id, p]));

// 23 specific data gaps spread across the 13 layer nodes. Each gap names a
// concrete feed that's missing, what it blocks, the expected confidence
// uplift if closed, and which DiffDay product would close it.
export const DATA_GAPS: DataGap[] = [
  // EXECUTIVE
  { id: "g-bp-1",  layerKey: "business-performance", feed: "Normalised cross-channel P&L feed",   blocks: "Margin attribution by channel × category",   confidenceUplift: 9,  productFit: ["data-integration"] },
  { id: "g-fin-1", layerKey: "finance",              feed: "Contract terms & ETF exposure",       blocks: "Forward EBITDA bridge with contract risk",   confidenceUplift: 14, productFit: ["contract-hub"] },
  { id: "g-fin-2", layerKey: "finance",              feed: "Regulatory cost exposure forecast",   blocks: "Legislation-driven cost surprise modelling", confidenceUplift: 6,  productFit: ["legislative"] },

  // MARKET-FACING
  { id: "g-dem-1", layerKey: "demand-intelligence",      feed: "Continuous external news & launches",    blocks: "Demand shocks from competitor moves",           confidenceUplift: 11, productFit: ["news-monitor"] },
  { id: "g-dem-2", layerKey: "demand-intelligence",      feed: "Top-of-funnel intent signal",            blocks: "Forecast accuracy at the entry funnel",         confidenceUplift: 7,  productFit: ["web-conversion"] },
  { id: "g-cmp-1", layerKey: "competitive-intelligence", feed: "Daily competitor pricing index",         blocks: "Real-time price response (currently 4-7d lag)", confidenceUplift: 13, productFit: ["news-monitor"] },
  { id: "g-cmp-2", layerKey: "competitive-intelligence", feed: "Comparable transaction history",         blocks: "Pricing proposals grounded in real comps",      confidenceUplift: 9,  productFit: ["comp-sales"] },
  { id: "g-cus-1", layerKey: "customer-intelligence",    feed: "LLC → decision-maker resolution",        blocks: "Knowing who actually owns the account",         confidenceUplift: 12, productFit: ["contact-ownership"] },
  { id: "g-cus-2", layerKey: "customer-intelligence",    feed: "Bidirectional CRM sync",                 blocks: "Contact freshness across systems",              confidenceUplift: 5,  productFit: ["contact-ownership", "data-integration"] },
  { id: "g-cus-3", layerKey: "customer-intelligence",    feed: "Tracked-asset master record",            blocks: "Physical / lease / financial profile per asset",confidenceUplift: 7,  productFit: ["property-intel"] },
  { id: "g-bs-1",  layerKey: "brand-social",             feed: "Continuous brand mention scan",          blocks: "Brand sentiment shifts before they impact demand", confidenceUplift: 8,  productFit: ["news-monitor"] },

  // OPERATIONAL
  { id: "g-sc-1",  layerKey: "supply-chain",          feed: "Vendor contract terms & SLAs",          blocks: "Supplier risk and ETF exposure on disruption",   confidenceUplift: 10, productFit: ["contract-hub"] },
  { id: "g-sc-2",  layerKey: "supply-chain",          feed: "Real-time multi-DC orchestration",      blocks: "Same-day reroute and OOS-to-PO triggering",      confidenceUplift: 13, productFit: ["ops-intel"] },
  { id: "g-pm-1",  layerKey: "pricing-margin",        feed: "Comparable historical pricing",         blocks: "Defensible pricing proposals at the desk",       confidenceUplift: 9,  productFit: ["comp-sales"] },
  { id: "g-pm-2",  layerKey: "pricing-margin",        feed: "Invoice-vs-actual weight reconciliation", blocks: "Margin leakage from billing discrepancies",     confidenceUplift: 8,  productFit: ["invoicing"] },
  { id: "g-sp-1",  layerKey: "sales-pipeline",        feed: "True decision-maker identification",    blocks: "Outreach landing with the wrong contact",        confidenceUplift: 14, productFit: ["contact-ownership"] },
  { id: "g-sp-2",  layerKey: "sales-pipeline",        feed: "Proactive opportunity drafting",        blocks: "Reactive-only pipeline motion",                  confidenceUplift: 6,  productFit: ["ai-companion"] },
  { id: "g-mk-1",  layerKey: "marketing-performance", feed: "Best-fit product matching at entry",    blocks: "Conversion lift from intent-aware routing",      confidenceUplift: 9,  productFit: ["web-conversion"] },
  { id: "g-po-1",  layerKey: "people-operations",     feed: "Workforce regulatory monitoring",       blocks: "Scheduling & labor-law compliance risk",         confidenceUplift: 5,  productFit: ["legislative"] },
  { id: "g-po-2",  layerKey: "people-operations",     feed: "Ops orchestration for shift fills",     blocks: "Unfilled-shift cascade into supply chain",       confidenceUplift: 8,  productFit: ["ops-intel"] },

  // SYSTEM
  { id: "g-rc-1",  layerKey: "receivables",           feed: "Invoice discrepancy detection",         blocks: "Over/under-billing recovery and dispute volume", confidenceUplift: 12, productFit: ["invoicing"] },
  { id: "g-rc-2",  layerKey: "receivables",           feed: "Contract payment terms digest",         blocks: "DSO forecasting with contractual triggers",      confidenceUplift: 6,  productFit: ["contract-hub"] },
  { id: "g-th-1",  layerKey: "talent-hr",             feed: "Labor-law legislative tracking",        blocks: "Forward planning around scheduling regulation",  confidenceUplift: 5,  productFit: ["legislative"] },
];

// Cross-cutting access products: they don't plug a single layer-specific
// feed gap — they're how analysts consume everything above. Shown as a
// footer band so the story is complete.
export const ACCESS_PRODUCT_IDS = ["unified-chat", "nl-search", "ai-companion"] as const;

export function gapsForLayer(layerKey: string): DataGap[] {
  return DATA_GAPS.filter(g => g.layerKey === layerKey);
}

export function totalLayerUplift(layerKey: string): number {
  return gapsForLayer(layerKey).reduce((s, g) => s + g.confidenceUplift, 0);
}

// Top N gaps system-wide by confidence uplift — used in the default
// side-panel view to show the highest-leverage product slot-ins.
export function topGaps(n: number): DataGap[] {
  return [...DATA_GAPS].sort((a, b) => b.confidenceUplift - a.confidenceUplift).slice(0, n);
}
