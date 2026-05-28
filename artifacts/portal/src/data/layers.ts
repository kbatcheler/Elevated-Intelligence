// Layer schema. The 14 canonical intelligence layers Phase 1 produces.
//
// Per-tenant narrative, causes, actions, metrics and chart data now live in
// the server-side tenant_layers table and are fetched per tenant. This file
// holds ONLY structural metadata: layer keys, display names, the question
// each layer answers, section headers and chart axis labels.
//
// LayerData remains exported as a type because consumer components (Layer,
// MorningBrief, WhyInspector, etc.) project per-tenant content into this
// shape inside CompanyContext for backward compatibility.

export type Tone = "good" | "bad" | "warn" | "neutral";
export type GapCategory = "DATA" | "INTEG" | "MODEL" | "WORKFLOW" | "SIGNAL";

export interface Metric { label: string; value: string; sub: string; tone: Tone; }
export interface Cause  { title: string; impact: string; detail: string; }
export interface Action { title: string; detail: string; impact: string; }
export interface Gap    { category: GapCategory; title: string; detail: string; confidenceLiftPp: number; solution: string; }

// Phase 2 produced two parallel arrays per layer, attached on tenant_layers
// and surfaced through GET /api/tenants/:id. Phase 3 renders them on the
// layer page as gold pills (verified, web-grounded) and cream bands
// (modelled, analyst inference). Each entry's `claim_path` matches a field
// inside `content` (e.g. "narrative", "causes[0].detail", "metrics[2]") and
// drives where the annotation lands in Layer.tsx.
// Phase 2 sub-stage Hero produces this structured panel per layer. Stored
// nullable on tenant_layers.hero_panel and projected into LayerData.heroPanel.
// Renders above the metric snapshot via components/visuals/GenericHero.
export interface HeroPanel {
  eyebrow: string;
  headline: string;
  subhead: string;
  highlight_pills: Array<{ label: string; tone: Tone }>;
  spotlight_entities: Array<{
    kind: "competitor" | "region" | "segment" | "supplier" | "product" | "channel" | "metric";
    name: string;
    value?: string;
    note?: string;
    tone?: Tone;
  }>;
}

export interface VerifiedClaim {
  claim_path: string;
  claim_text: string;
  source_urls: string[];
  source_titles?: string[];
  verified_at?: string;
  verified_by?: string;
}
export interface ModelledClaim {
  claim_path: string;
  claim_text: string;
  basis: string;
  confidence: number;
  inferred_from?: string[];
}

export type ChartDatum = Record<string, unknown>;

export interface ChartSpec {
  kind: "composed" | "line" | "stacked-bar" | "bar" | "area";
  data: ChartDatum[];
  series: { key: string; name: string; color: string; type?: "line" | "bar" }[];
  xKey: string;
  yLabel?: string;
}

export interface LayerData {
  key: string;
  group: "Executive" | "Market-facing" | "Operational" | "System";
  title: string;
  question: string;
  confidence: number;
  sources: number;
  diagnosedAt: string;
  analystTake: string;
  metrics: Metric[];
  narrative: string;
  causes: Cause[];
  chartTitle: string;
  chart: ChartSpec;
  actions: Action[];
  actionsRecoveryUsd: string;
  gaps: Gap[];
  gapsPipelineUsd: string;
  counterArgs: { title: string; ci: string; detail: string }[];
  // Phase 3 annotations, parallel arrays projected straight from
  // tenant_layers. Empty when the tenant is hardcoded (Meridian Industrial)
  // or when Phase 2 produced no claims for this layer.
  verifiedClaims: VerifiedClaim[];
  modelledClaims: ModelledClaim[];
  // Optional tenant-specific hero panel from Phase 2 sub-stage 6 (Hero).
  // Null when the tenant was seeded before this stage existed, or when the
  // stage failed for this layer. Rendered above metrics in Layer.tsx via
  // components/visuals/GenericHero.
  heroPanel?: HeroPanel | null;
}

export interface LayerSchemaEntry {
  key: string;
  group: "Executive" | "Market-facing" | "Operational" | "System";
  name: string;
  description: string;
  question: string;
  chartAxisLabels: { x: string; y: string };
  sectionHeaders: {
    recommendation: string;
    situation: string;
    diagnosis: string;
    detail: string;
  };
}

const DEFAULT_SECTION_HEADERS = {
  recommendation: "Recommendation",
  situation: "Situation",
  diagnosis: "Root causes",
  detail: "Detail",
} as const;

const SCHEMA_ENTRIES: LayerSchemaEntry[] = [
  {
    key: "business-performance",
    group: "Executive",
    name: "Business performance",
    description: "Overall business health against plan.",
    question: "How is the business performing against plan?",
    chartAxisLabels: { x: "Month", y: "USD millions" },
    sectionHeaders: DEFAULT_SECTION_HEADERS,
  },
  {
    key: "finance",
    group: "Executive",
    name: "Finance",
    description: "Cash, EBITDA, working capital and the plan-to-actual bridge.",
    question: "What does the bridge look like and where is cash exposed?",
    chartAxisLabels: { x: "Month", y: "USD millions" },
    sectionHeaders: DEFAULT_SECTION_HEADERS,
  },
  {
    key: "demand-intelligence",
    group: "Market-facing",
    name: "Demand intelligence",
    description: "Where demand is strong, weak or moving.",
    question: "Where is demand strong, weak, or moving?",
    chartAxisLabels: { x: "Week", y: "Index" },
    sectionHeaders: DEFAULT_SECTION_HEADERS,
  },
  {
    key: "competitive-intelligence",
    group: "Market-facing",
    name: "Competitive intelligence",
    description: "Competitor moves and share dynamics.",
    question: "What are competitors doing, and is share moving?",
    chartAxisLabels: { x: "Week", y: "Share %" },
    sectionHeaders: DEFAULT_SECTION_HEADERS,
  },
  {
    key: "customer-intelligence",
    group: "Market-facing",
    name: "Customer intelligence",
    description: "Customer health, churn risk and retention signal.",
    question: "Which customers are at risk, and which to defend first?",
    chartAxisLabels: { x: "Month", y: "NPS / churn %" },
    sectionHeaders: DEFAULT_SECTION_HEADERS,
  },
  {
    key: "brand-social",
    group: "Market-facing",
    name: "Brand and social",
    description: "Brand sentiment and emerging narratives.",
    question: "What is the brand signal telling us?",
    chartAxisLabels: { x: "Day", y: "Sentiment index" },
    sectionHeaders: DEFAULT_SECTION_HEADERS,
  },
  {
    key: "supply-chain",
    group: "Operational",
    name: "Supply chain",
    description: "Inventory, supplier performance and DC throughput.",
    question: "Where is the network under stress, and what breaks next?",
    chartAxisLabels: { x: "Week", y: "Days / units" },
    sectionHeaders: DEFAULT_SECTION_HEADERS,
  },
  {
    key: "pricing-margin",
    group: "Operational",
    name: "Pricing and margin",
    description: "Pricing posture and margin leakage.",
    question: "Where is margin leaking, and which prices to reset?",
    chartAxisLabels: { x: "Week", y: "Margin %" },
    sectionHeaders: DEFAULT_SECTION_HEADERS,
  },
  {
    key: "sales-pipeline",
    group: "Operational",
    name: "Sales pipeline",
    description: "Pipeline coverage, cycle time and conversion.",
    question: "Will the quarter land, and what bottleneck breaks the cycle?",
    chartAxisLabels: { x: "Stage", y: "Deals / value" },
    sectionHeaders: DEFAULT_SECTION_HEADERS,
  },
  {
    key: "marketing-performance",
    group: "Operational",
    name: "Marketing performance",
    description: "Channel ROAS, attribution and reallocation moves.",
    question: "Which channels deserve more spend and which less?",
    chartAxisLabels: { x: "Channel", y: "ROAS" },
    sectionHeaders: DEFAULT_SECTION_HEADERS,
  },
  {
    key: "people-operations",
    group: "Operational",
    name: "People and operations",
    description: "Workforce, attrition and operational throughput.",
    question: "Where are people constraints throttling the operation?",
    chartAxisLabels: { x: "Month", y: "% / count" },
    sectionHeaders: DEFAULT_SECTION_HEADERS,
  },
  {
    key: "contract-management",
    group: "Operational",
    name: "Contract management",
    description: "Contract exposure, renewals and counterparty risk.",
    question: "Where are we exposed across the contract book?",
    chartAxisLabels: { x: "Month", y: "USD millions" },
    sectionHeaders: DEFAULT_SECTION_HEADERS,
  },
  {
    key: "receivables",
    group: "Operational",
    name: "Receivables and invoicing",
    description: "DSO, ageing buckets and credit exposure.",
    question: "Where is cash trapped in the receivables ledger?",
    chartAxisLabels: { x: "Ageing bucket", y: "USD" },
    sectionHeaders: DEFAULT_SECTION_HEADERS,
  },
  {
    key: "talent-hr",
    group: "Operational",
    name: "Talent and HR",
    description: "Hiring funnel, critical-role coverage and comp gaps.",
    question: "Which critical roles are blocking execution?",
    chartAxisLabels: { x: "Stage", y: "Days / count" },
    sectionHeaders: DEFAULT_SECTION_HEADERS,
  },
];

export const LAYER_KEYS: string[] = SCHEMA_ENTRIES.map(e => e.key);

export const LAYER_SCHEMA: Record<string, LayerSchemaEntry> =
  Object.fromEntries(SCHEMA_ENTRIES.map(e => [e.key, e]));

// Phase 1: LAYERS is exported as an empty array for backward compatibility
// with imports that haven't been rewritten. Per-tenant LayerData is built
// inside CompanyContext from server-fetched LayerContent.
export const LAYERS: LayerData[] = [];

export function getLayer(key: string): LayerData | undefined {
  return LAYERS.find(l => l.key === key);
}
