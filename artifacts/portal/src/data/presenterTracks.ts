// Talk-tracks for Presenter mode. Each entry maps a route key to a slim
// sales coach script: frame, say, anticipated pushback Q+A, and a deliberate
// "next" step that follows the recommended demo spine.
//
// Spine (8 stops): morning-brief → business-performance → pricing-margin →
// intelligence-architecture → dependency-graph → engagement-pipeline →
// track-record → scenario-warroom. Routes outside the spine still point
// somewhere sensible so the strip is useful on every page.

export interface PresenterTrack {
  routeKey: string;
  frame: string;                            // <= 10 words
  say: string;                              // one italic-serif sentence
  pushback: { q: string; a: string };
  next: { routeKey: string; label: string; rationale: string };
}

// Display order for the Sales Playbook timeline (the 8-stop spine).
export const PRESENTER_SPINE: string[] = [
  "morning-brief",
  "business-performance",
  "pricing-margin",
  "intelligence-architecture",
  "dependency-graph",
  "engagement-pipeline",
  "track-record",
  "scenario-warroom",
];

// Estimated time per stop for the Sales Playbook page (seconds).
export const PRESENTER_TIMES: Record<string, number> = {
  "morning-brief":              60,
  "business-performance":       90,
  "pricing-margin":             120,
  "intelligence-architecture":  90,
  "dependency-graph":           75,
  "engagement-pipeline":        90,
  "track-record":               60,
  "scenario-warroom":           90,
};

export const PRESENTER_TRACKS: Record<string, PresenterTrack> = {
  // ─────────── Spine stops ───────────
  "morning-brief": {
    routeKey: "morning-brief",
    frame: "Sixty-second skim of last night's diagnosis",
    say: "This is what landed in the operator's inbox at six this morning, three things, ranked, with dollars.",
    pushback: {
      q: "Is this just an email digest?",
      a: "It's a diagnosis, not a digest. Each item routes to its full proof chain.",
    },
    next: { routeKey: "business-performance", label: "Business performance", rationale: "Now show them the headline diagnosis the brief was distilled from." },
  },
  "business-performance": {
    routeKey: "business-performance",
    frame: "Four-metric scoreboard, the executive's first view",
    say: "Behind plan, margin gap widening, cash position holding, the system already knows why.",
    pushback: {
      q: "Our BI tool shows the same four numbers.",
      a: "Yours stops at the number. Click any tile, ours opens the full reasoning chain underneath it.",
    },
    next: { routeKey: "pricing-margin", label: "Pricing and margin", rationale: "Go deep on one layer so they feel how diagnosis actually works." },
  },
  "pricing-margin": {
    routeKey: "pricing-margin",
    frame: "One layer, end to end, the depth proof",
    say: "Watch the four-act flow, what to do, the situation, why it's happening, and the receipts behind every number.",
    pushback: {
      q: "How do you know your elasticities are right?",
      a: "Move the sliders. The model uses the elasticities cited in the narrative, all auditable, treated as directional.",
    },
    next: { routeKey: "intelligence-architecture", label: "Intelligence architecture", rationale: "They'll ask 'how do you actually do this?', show them the five-stage reasoning chain." },
  },
  "intelligence-architecture": {
    routeKey: "intelligence-architecture",
    frame: "Five-stage reasoning chain, the proof of mechanism",
    say: "Perceive, hypothesise, challenge, narrate, score, every diagnosis routes through all five, 13,348 tokens, 2.2 seconds.",
    pushback: {
      q: "Isn't this just a wrapper over GPT?",
      a: "It's a deterministic pipeline with five named agents and a confidence score on every output.",
    },
    next: { routeKey: "dependency-graph", label: "Cross-layer map", rationale: "Now show how the 14 layers connect, this is what BI tools cannot do." },
  },
  "dependency-graph": {
    routeKey: "dependency-graph",
    frame: "Fourteen layers, one organism, the systems view",
    say: "Pricing is bleeding because demand is missing because supply is failing, three layers, one cascade.",
    pushback: {
      q: "Could we build this with a data warehouse and a dashboard?",
      a: "A dashboard shows you the layers. The cross-layer map shows you the causality between them.",
    },
    next: { routeKey: "engagement-pipeline", label: "Engagement pipeline", rationale: "Causality without delivery is theatre, show them the joint roadmap with dollars." },
  },
  "engagement-pipeline": {
    routeKey: "engagement-pipeline",
    frame: "The joint roadmap, dollars and delivery sequenced",
    say: "These are the gaps the diagnosis surfaced, scoped, costed, and routed into a 90-day plan.",
    pushback: {
      q: "What does pricing look like?",
      a: "Engagements range from 80k to 320k per quarter depending on layer count and data maturity.",
    },
    next: { routeKey: "track-record", label: "Outcome track record", rationale: "After dollars comes trust, show them what's actually shipped." },
  },
  "track-record": {
    routeKey: "track-record",
    frame: "Outcomes shipped, the trust signal",
    say: "Twelve closed engagements, each with a named outcome and the operator who signed off.",
    pushback: {
      q: "Anyone in our sector?",
      a: "Three mid-market industrials in the last eighteen months, references available on request.",
    },
    next: { routeKey: "scenario-warroom", label: "Scenario war-room", rationale: "Close interactively, hand them the controls." },
  },
  "scenario-warroom": {
    routeKey: "scenario-warroom",
    frame: "Hand them the controls, interactive close",
    say: "Pick a scenario, move the levers, the system re-runs the diagnosis live, this is what owning an operating layer feels like.",
    pushback: {
      q: "Can we run this against our own data?",
      a: "Yes, that's exactly the first 30 days, data wiring and a baseline diagnosis from your last quarter.",
    },
    next: { routeKey: "morning-brief", label: "Back to the morning brief", rationale: "Loop back to the brief so they leave with the operator view in mind." },
  },

  // ─────────── Off-spine intelligence layers ───────────
  "demand-intelligence": {
    routeKey: "demand-intelligence",
    frame: "Variance versus plan, channel by channel",
    say: "Twelve point four percent below plan, sixty percent of the gap in two channels, the system caught it eleven days early.",
    pushback: {
      q: "What if your forecast is wrong?",
      a: "Forecast accuracy is on the page. We score it openly and route the gap to a retraining loop.",
    },
    next: { routeKey: "supply-chain", label: "Supply chain", rationale: "Demand misses are usually supply misses dressed up, show them the link." },
  },
  "competitive-intelligence": {
    routeKey: "competitive-intelligence",
    frame: "Head to head, share, price, and promo depth",
    say: "Down 2.1 points of share to Home Depot, while matching their promo depth, the worst of both worlds.",
    pushback: {
      q: "Where does the competitor data come from?",
      a: "Syndicated panel for share, scraped pricing for the ladder, both refreshed weekly.",
    },
    next: { routeKey: "pricing-margin", label: "Pricing and margin", rationale: "Share loss with deeper promo is a pricing problem, route them straight there." },
  },
  "customer-intelligence": {
    routeKey: "customer-intelligence",
    frame: "Top trade accounts, churn risk lensed",
    say: "Two of the top six trade accounts are critical risk, 0.8 million in defendable revenue, the system saw it before the AM did.",
    pushback: {
      q: "Why didn't the CRM flag this?",
      a: "CRM tracks activity. The risk model fuses activity, SLA, and order cadence into a single score.",
    },
    next: { routeKey: "sales-pipeline", label: "Sales pipeline", rationale: "Account risk and pipeline coverage live in the same operator's head." },
  },
  "brand-social": {
    routeKey: "brand-social",
    frame: "Earned media tone, sentiment by campaign",
    say: "Seventy-three percent of the negative cluster traces to availability, not brand, that's a supply problem masquerading as a PR problem.",
    pushback: {
      q: "Sentiment scores are noisy.",
      a: "Agreed, that's why we cluster by underlying cause, not by raw polarity.",
    },
    next: { routeKey: "supply-chain", label: "Supply chain", rationale: "The earned-media tone is a leading signal for the supply diagnosis." },
  },
  "supply-chain": {
    routeKey: "supply-chain",
    frame: "DC health and supplier OTD, the operations spine",
    say: "Dallas DC at 78 percent throughput, Tier-1 supplier OTD down 14 points, this is where the demand gap actually comes from.",
    pushback: {
      q: "We already have a TMS for this.",
      a: "Your TMS tracks the lane. The diagnosis layer ties the lane back to the revenue impact in dollars.",
    },
    next: { routeKey: "demand-intelligence", label: "Demand intelligence", rationale: "Close the loop, supply failures cascade into the demand variance." },
  },
  "sales-pipeline": {
    routeKey: "sales-pipeline",
    frame: "Funnel health, stage by stage",
    say: "Stage 3 to 4 conversion at 22 percent against a 28 percent target, that's the 5.7 million pipeline gap in one number.",
    pushback: {
      q: "Our SFDC reports show better numbers.",
      a: "SFDC reports cohorts. We diagnose cohort drift over time and attach a dollar value to each stage leak.",
    },
    next: { routeKey: "marketing-performance", label: "Marketing performance", rationale: "Funnel health upstream is a marketing problem, route there next." },
  },
  "marketing-performance": {
    routeKey: "marketing-performance",
    frame: "Attribution, creative, and cohort efficiency",
    say: "Thirty-three percent of paid conversions are unattributed, that's not a measurement problem, it's a routing problem.",
    pushback: {
      q: "How are you different from a marketing analytics platform?",
      a: "We sit downstream of attribution and tie creative performance to the cohort margin curve.",
    },
    next: { routeKey: "sales-pipeline", label: "Sales pipeline", rationale: "Attribution leaks become pipeline gaps, show the downstream impact." },
  },
  "people-operations": {
    routeKey: "people-operations",
    frame: "Team health, attrition and engagement by function",
    say: "Three teams above attrition target, with 34 critical roles open, the cost is already in the opex overrun.",
    pushback: {
      q: "Isn't this HR's problem?",
      a: "It is, until it becomes a service-level problem. We surface the link the week before that happens.",
    },
    next: { routeKey: "talent-hr", label: "Talent and HR", rationale: "From the operational symptom (attrition) to the talent funnel that drives it." },
  },
  "finance": {
    routeKey: "finance",
    frame: "Cash bridge and departmental spend, plan versus actual",
    say: "Cash plus 3.8 against plan, but working capital is masking a 6.4 million opex overrun in Tech and Ops.",
    pushback: {
      q: "Our CFO has this in the close pack.",
      a: "She does, monthly. We diagnose it weekly and route the overrun to its operational root cause.",
    },
    next: { routeKey: "receivables", label: "Receivables and invoicing", rationale: "Working capital health lives next door, show the receivables story." },
  },
  "receivables": {
    routeKey: "receivables",
    frame: "DSO, ageing, and the $7.1M of recoverable cash",
    say: "DSO at 47 days, six accounts past due more than 60, that's 7.1 million of avoidable working capital drag.",
    pushback: {
      q: "Our collections team owns this.",
      a: "They do. We give them the priority queue, ranked by recovery probability and customer health.",
    },
    next: { routeKey: "contract-management", label: "Contract management", rationale: "Past-due trade customers are usually a contract terms problem, route there." },
  },
  "talent-hr": {
    routeKey: "talent-hr",
    frame: "Hiring funnel, sourcing efficiency, and offer acceptance",
    say: "Time-to-hire at 72 days against a 45-day market, every extra day is a continuation of the attrition cascade.",
    pushback: {
      q: "Our ATS already tracks this.",
      a: "It tracks the funnel. We tie the funnel to the operational gap the open role is causing.",
    },
    next: { routeKey: "people-operations", label: "People and operations", rationale: "Talent fixes the funnel, ops feels the gap, show the loop." },
  },
  "contract-management": {
    routeKey: "contract-management",
    frame: "Renewal exposure and counterparty risk",
    say: "$4.6 million of ETF exposure in nine supplier contracts, and the Q4 plan rests on one that's been in legal review for 23 days.",
    pushback: {
      q: "Legal review takes as long as it takes.",
      a: "Visibility shortens it. We surface the impact-per-day so legal knows what each delay costs operationally.",
    },
    next: { routeKey: "receivables", label: "Receivables and invoicing", rationale: "Contract terms drive collectability, route to the working capital view." },
  },

  // ─────────── Off-spine system pages ───────────
  "committed-actions": {
    routeKey: "committed-actions",
    frame: "What the operator has actually picked up",
    say: "These are the actions the operating team has committed to this quarter, with owner, due date, and modelled recovery.",
    pushback: {
      q: "How is this different from a task list?",
      a: "Every committed action is back-linked to the diagnosis that surfaced it, kill the diagnosis, kill the action.",
    },
    next: { routeKey: "track-record", label: "Outcome track record", rationale: "Committed actions become track-record entries when they close, show the through-line." },
  },

  "sales-playbook": {
    routeKey: "sales-playbook",
    frame: "The new-hire demo guide, on the wall",
    say: "This is the spine every demo follows, eight stops, twelve minutes, no notes required.",
    pushback: {
      q: "Won't the prospect see this?",
      a: "It's hidden by default on prospect tenants, and Shift Cmd P hides it in two keystrokes.",
    },
    next: { routeKey: "morning-brief", label: "Morning brief", rationale: "Start the demo at stop one with Presenter mode already on." },
  },
};
