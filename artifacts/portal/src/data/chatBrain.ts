// Hand-tuned NLQ brain. Routes user input to the best answer pattern, returns
// a structured response with text, citations and an optional navigation hint.
// Not an LLM, this is a curated demo brain that performs well on the kinds of
// questions an executive actually asks of an intelligence portal.

export interface ChatCitation {
  layer: string;
  label: string;
}

export interface ChatResponse {
  text: string;         // markdown-lite (italic via _x_, bold via **x**)
  citations: ChatCitation[];
  navigate?: string;    // layer key to navigate to
  openInbox?: boolean;
  openBrief?: boolean;
  followups?: string[]; // suggested next questions
}

export interface ChatPattern {
  match: (q: string, activeLayer: string) => boolean;
  respond: (q: string, activeLayer: string) => ChatResponse;
}

// Word-boundary aware substring match. Short tokens (≤3 chars) must match as
// whole words to avoid e.g. "ar" matching "year" or "share".
const has = (q: string, ...keys: string[]) =>
  keys.some(k => {
    if (k.length <= 3) {
      const re = new RegExp(`(^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
      return re.test(q);
    }
    return q.includes(k);
  });

const containsWord = (q: string, word: string) => {
  const re = new RegExp(`(^|[^a-z0-9])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
  return re.test(q);
};

export const SUGGESTED: string[] = [
  "What's the headline diagnosis?",
  "Where should I start?",
  "What can we recover in Q4?",
  "Show me the biggest risk",
  "Why is revenue behind plan?",
  "What if we cut price by 5%?",
  "Which actions are committed?",
  "Read me the morning brief",
];

export const PATTERNS: ChatPattern[] = [
  // Headline diagnosis
  {
    match: (q) => has(q, "headline", "summary", "tl;dr", "tldr", "what's going on", "whats going on", "overview", "executive summary"),
    respond: () => ({
      text:
        "Q3 closed **8% behind plan** and **380bps behind margin target**. The variance is not diffuse: three layers, _Demand_, _Pricing_, _Supply_, account for almost the entire gap. " +
        "Cash held only because working capital tightened. Of the three, **Pricing is the fastest reversible lever** this quarter.",
      citations: [
        { layer: "business-performance", label: "Executive scorecard" },
        { layer: "demand-intelligence", label: "$2.8M variance" },
        { layer: "pricing-margin", label: "240bps margin slip" },
      ],
      followups: ["Where should I start?", "What can we recover in Q4?", "What's the biggest risk?"],
    }),
  },
  // Where to start
  {
    match: (q) => has(q, "where do i start", "where should i start", "what should i do first", "what first", "priority", "what's first"),
    respond: () => ({
      text:
        "Three moves, in order. **One, cap the cordless-tools promo match at 22% today.** Reversible, $1.2M annualised. " +
        "**Two, fill the 11 unfilled Phoenix DC shifts this week.** Stops the stockout cascade. " +
        "**Three, launch the SE-only DIY counter-promo on Monday.** Recovers $1.45M Q4 revenue. " +
        "Together: $5.6M of in-quarter recovery, all reversible inside 14 days.",
      citations: [
        { layer: "pricing-margin", label: "Margin match-cap" },
        { layer: "supply-chain", label: "Phoenix DC shifts" },
        { layer: "demand-intelligence", label: "DIY counter-promo" },
      ],
      followups: ["What can we recover in Q4?", "Show me the supply layer", "Why is revenue behind plan?"],
    }),
  },
  // Recovery
  {
    match: (q) => has(q, "recover", "q4", "fourth quarter", "what can we win back", "how much can we get back"),
    respond: () => ({
      text:
        "Modelled Q4 recovery: **$5.6M**. Breakdown, Pricing match-cap $1.2M; DIY counter-promo $1.45M; Phoenix throughput restoration $0.9M; Marketing reallocation $0.5M; Receivables tightening $0.8M; rest distributed across smaller plays. " +
        "Confidence is 87% on the first $3M, 64% on the rest. The first three are reversible inside 14 days.",
      citations: [
        { layer: "pricing-margin", label: "$1.2M margin" },
        { layer: "demand-intelligence", label: "$1.45M revenue" },
        { layer: "finance", label: "Bridge view" },
      ],
      followups: ["Which actions are committed?", "Where should I start?", "Show me the finance bridge"],
    }),
  },
  // Risk
  {
    match: (q) => has(q, "biggest risk", "what could go wrong", "what's the worst", "biggest threat", "what should i worry about"),
    respond: () => ({
      text:
        "Two risks, in order. **One, the Phoenix DC labour shortfall.** 11 unfilled shifts this week with peak Q4 starting in 18 days. Throughput drops linearly with shifts filled; downstream service-call spike is already visible. " +
        "**Two, the 'price gouging' sentiment cluster.** Small now (14 mentions/6h) but rising fast. Reliably dissolved by a 24h public statement, ignored typically reaches a 50-mention escalation in 7–10 days.",
      citations: [
        { layer: "supply-chain", label: "Phoenix labour" },
        { layer: "brand-social", label: "Sentiment cluster" },
      ],
      followups: ["What can we do about Phoenix?", "Show me the anomaly inbox", "Read me the morning brief"],
    }),
  },
  // Why revenue behind
  {
    match: (q) => has(q, "why", "revenue", "behind plan", "why is", "what's driving") && (has(q, "revenue", "miss", "gap", "behind", "down")),
    respond: () => ({
      text:
        "Revenue is $11M behind plan; 60% of the gap traces to **Demand**, specifically the DIY and Home Improvement categories. " +
        "Three causes: Home Depot promo at 1.8× baseline depth in five SE markets, Dallas + Phoenix stockouts on the top five SKUs (41 OOS days), and forecast drift (MAPE 13pp from 8pp baseline on Home Improvement). " +
        "Of those, the competitive pressure is the largest single contributor.",
      citations: [
        { layer: "demand-intelligence", label: "$2.8M variance" },
        { layer: "competitive-intelligence", label: "HD promo depth" },
        { layer: "supply-chain", label: "41 OOS days" },
      ],
      navigate: "demand-intelligence",
      followups: ["What if we cut price by 5%?", "Where should I start?", "What can we recover in Q4?"],
    }),
  },
  // What-if pricing
  {
    match: (q) => has(q, "what if", "what-if", "drop price", "cut price", "lower price", "price cut", "match deeper"),
    respond: () => ({
      text:
        "Modelled in the Pricing what-if lever: a **−5% price cut on top-50 SKUs** lifts volume by an estimated 3.4% (average elasticity −0.46), but margin compresses by 480bps, net Q4 EBITDA impact **−$2.1M**. " +
        "The opposite move, **+2% on the 10 lowest-elasticity SKUs**, lifts margin without a meaningful volume penalty: net **+$0.4M**. " +
        "Open the Pricing layer to run the slider live.",
      citations: [
        { layer: "pricing-margin", label: "Elasticity model" },
      ],
      navigate: "pricing-margin",
      followups: ["Show me the pricing pipeline", "What about a margin floor?", "Where should I start?"],
    }),
  },
  // Committed actions
  {
    match: (q) => has(q, "committed", "what's in flight", "in flight", "what have we done", "what's been actioned", "tray"),
    respond: () => ({
      text:
        "Open the **Committed actions** tray (left nav, System group) for the live list. Each action has an owner, due date and modelled outcome, and can be advanced through committed → in-flight → done. " +
        "Anything you commit from a layer's recommended-actions list lands there automatically.",
      citations: [
        { layer: "committed-actions", label: "Committed actions" },
      ],
      navigate: "committed-actions",
      followups: ["Where should I start?", "What can we recover in Q4?", "Read me the morning brief"],
    }),
  },
  // Scenario war-room
  {
    match: (q) => has(q, "war-room", "war room", "scenario", "what if we", "stack levers", "stack the levers", "model the recovery", "lever"),
    respond: () => ({
      text:
        "Opening the **scenario war-room**. Six reversible levers, pricing match-cap, SE counter-promo, Phoenix DC shifts, Supplier C activation, marketing reallocation, credit holds. " +
        "Stack them in any combination and the combined Q4 EBITDA bridge updates live, with a confidence band. Commit the whole scenario in one click.",
      citations: [],
      navigate: "scenario-warroom",
      followups: ["What's the headline diagnosis?", "What can we recover in Q4?"],
    }),
  },
  // Track record
  {
    match: (q) => has(q, "track record", "track-record", "outcomes", "past actions", "how have we done", "are you accurate", "how accurate", "your record", "your history"),
    respond: () => ({
      text:
        "Opening the **outcome track record**. Every recommendation we've made is graded against what it actually delivered, predicted vs delivered dollars, hit rate by category, and short notes on what worked and what didn't.",
      citations: [],
      navigate: "track-record",
      followups: ["Where should I start?", "What can we recover in Q4?"],
    }),
  },
  // Board pack
  {
    match: (q) => has(q, "board pack", "board-pack", "boardpack", "board folder", "board read"),
    respond: () => ({
      text: "The **board pack** is open from the topbar, eight pages, print-ready: cover, headline scorecard, three root causes, three recovery levers, the system's track record, decisions log, layer findings, and appendix.",
      citations: [],
      followups: ["Read me the morning brief", "What can we recover in Q4?"],
    }),
  },
  // Brief
  {
    match: (q) => has(q, "morning brief", "brief", "read me", "print", "executive briefing"),
    respond: () => ({
      text: "Opening the **morning brief**, print-ready, one page, the top finding from each of the 13 layers.",
      citations: [],
      openBrief: true,
      followups: ["What's the headline diagnosis?", "Where should I start?"],
    }),
  },
  // Anomaly inbox
  {
    match: (q) => has(q, "anomaly", "anomalies", "alerts", "what's new", "what changed", "today"),
    respond: () => ({
      text: "Opening the **anomaly inbox**, 17 anomalies today, ranked by severity, each click-through to the source layer.",
      citations: [],
      openInbox: true,
      followups: ["Show me the biggest risk", "What's the headline diagnosis?"],
    }),
  },
  // Show me a layer (catch named layers in the question)
  {
    match: (q) => has(q, "show me", "open", "take me to", "go to", "let me see"),
    respond: (q) => {
      const target = NAMED_LAYERS.find(l => containsWord(q, l.match));
      if (target) {
        return {
          text: `Opening the **${target.label}** layer.`,
          citations: [{ layer: target.key, label: target.label }],
          navigate: target.key,
        };
      }
      return {
        text: "Tell me which layer, _demand_, _supply_, _pricing_, _sales_, _customer_, _brand_, _finance_, _receivables_, _people_, _talent_, _competitive_, _marketing_, or _business performance_.",
        citations: [],
      };
    },
  },
  // Phoenix-specific
  {
    match: (q) => has(q, "phoenix", "phx", "dallas"),
    respond: () => ({
      text:
        "Phoenix is the operational pressure point this quarter. **23 stockout days** on top-5 SKUs, **94% capacity utilisation** but **only 61% of shifts filled**. " +
        "Service-call volume on order-ETA enquiries is up 42% DoD, a direct downstream of the inventory gap. " +
        "Fix the staffing first; the rest cascades back to normal within 10 days.",
      citations: [
        { layer: "supply-chain", label: "DC operational view" },
        { layer: "customer-intelligence", label: "Service tickets +42%" },
      ],
      navigate: "supply-chain",
      followups: ["What's the next step on Phoenix?", "Show me supply chain", "Where should I start?"],
    }),
  },
  // Confidence/methodology
  {
    match: (q) => has(q, "confidence", "how do you know", "how confident", "evidence", "trust"),
    respond: (_, active) => ({
      text:
        `Each layer carries a confidence score derived from feed freshness, source agreement and historical model accuracy. The current layer (_${active}_) is showing the confidence band in the header. ` +
        "Click any metric card with a gold dot to see the underlying observations, calculation and feeds.",
      citations: [{ layer: active, label: "Confidence band" }],
      followups: ["What's the headline diagnosis?", "Where should I start?"],
    }),
  },
  // Architecture/system
  {
    match: (q) => has(q, "how does this work", "architecture", "framework", "skeletal", "what is this"),
    respond: () => ({
      text:
        "This is the **intelligence framework** layer of Different Day. 13 layers, each with a question it answers, a confidence band, a narrative, and a set of recommended actions. " +
        "Underneath, the operational depth lives in **Demand by Different Day**, the planning platform feeding the diagnoses you see in Demand, Supply, Pricing and Sales. " +
        "Open the **Cross-layer map** (System group) to see how the layers feed each other.",
      citations: [
        { layer: "dependency-graph", label: "Cross-layer map" },
        { layer: "intelligence-architecture", label: "Architecture" },
      ],
      navigate: "dependency-graph",
      followups: ["What's the headline diagnosis?", "Show me the demand pipeline"],
    }),
  },
];

// Named-layer matcher used by the "show me X" handler
const NAMED_LAYERS = [
  { match: "demand",           key: "demand-intelligence",      label: "Demand intelligence" },
  { match: "supply",           key: "supply-chain",             label: "Supply chain" },
  { match: "pricing",          key: "pricing-margin",           label: "Pricing and margin" },
  { match: "margin",           key: "pricing-margin",           label: "Pricing and margin" },
  { match: "sales",            key: "sales-pipeline",           label: "Sales pipeline" },
  { match: "customer",         key: "customer-intelligence",    label: "Customer intelligence" },
  { match: "brand",            key: "brand-social",             label: "Brand and social" },
  { match: "social",           key: "brand-social",             label: "Brand and social" },
  { match: "finance",          key: "finance",                  label: "Finance" },
  { match: "receivable",       key: "receivables",              label: "Receivables and invoicing" },
  { match: "ar",               key: "receivables",              label: "Receivables and invoicing" },
  { match: "people",           key: "people-operations",        label: "People and operations" },
  { match: "talent",           key: "talent-hr",                label: "Talent and HR" },
  { match: "hr",               key: "talent-hr",                label: "Talent and HR" },
  { match: "competitive",      key: "competitive-intelligence", label: "Competitive intelligence" },
  { match: "competitor",       key: "competitive-intelligence", label: "Competitive intelligence" },
  { match: "marketing",        key: "marketing-performance",    label: "Marketing performance" },
  { match: "business",         key: "business-performance",     label: "Business performance" },
  { match: "executive",        key: "business-performance",     label: "Business performance" },
];

// Default fallback when nothing matches
export const FALLBACK: ChatResponse = {
  text:
    "I can answer the questions an executive typically asks, _what's the headline_, _where should I start_, _what can we recover_, _what's the biggest risk_, _why is revenue behind plan_, _what if we cut price by 5%_. " +
    "Or just tell me which layer to open: _demand_, _supply_, _pricing_, _sales_, etc.",
  citations: [],
  followups: SUGGESTED.slice(0, 4),
};

export function answer(q: string, activeLayer: string): ChatResponse {
  const lower = q.toLowerCase().trim();
  for (const p of PATTERNS) {
    if (p.match(lower, activeLayer)) return p.respond(lower, activeLayer);
  }
  return FALLBACK;
}
