// Battle cards for the System · Battle cards page.
//
// One card per common competitor / alternative. Same shape as the
// Foundry parity matrix in `connectors.ts`, but framed as sales arms,
// not capability tables. Each card is structured the same way so a
// presenter can switch competitors without re-learning the layout.
//
// No prices, ever, on any card. The asymmetry we sell is time-to-value
// and posture, not licence cost. Where a competitor has a genuine
// advantage we say so in `whereTheyWin`; never pretend otherwise.

export interface BattleCard {
  id: string;
  competitor: string;
  // One-line frame the buyer is likely arriving with.
  theirPitch: string;
  // 2-4 capabilities the competitor genuinely does well.
  whereTheyWin: string[];
  // 2-4 capabilities we win on, framed as buyer outcomes.
  whereWeWin: string[];
  // The single sentence the operator should land if the room is
  // tilting the wrong way. Memorise this.
  killerLine: string;
  // Where to take the conversation after the killer line lands.
  recommendedPivot: { label: string; layerKey: string };
  // Verdict at a glance: who tends to win the mid-market industrial
  // buyer this competitor is being weighed against.
  verdict: "we-typically-win" | "split" | "they-typically-win";
}

export const BATTLE_CARDS: BattleCard[] = [
  {
    id: "foundry",
    competitor: "Palantir Foundry",
    theirPitch: "The ontology-first operating layer for the enterprise.",
    whereTheyWin: [
      "Defense, intelligence, and FedRAMP-High estates",
      "Bespoke ontology projects where the buyer can fund a multi-quarter modelling team",
      "Customers who want a workshop platform first and answers second",
    ],
    whereWeWin: [
      "Time-to-first-defended-diagnosis measured in days, not quarters",
      "Pre-built 14-layer ontology that does not need to be modelled",
      "Operator can read the brief on Monday and act on Wednesday without a Foundry engineer in the room",
    ],
    killerLine: "Foundry is the right answer at year three. We are the only right answer this Friday.",
    recommendedPivot: { label: "Data substrate", layerKey: "data-substrate" },
    verdict: "split",
  },
  {
    id: "tableau",
    competitor: "Tableau and the modern BI stack",
    theirPitch: "Self-service dashboards across every team, on top of your warehouse.",
    whereTheyWin: [
      "Routine reporting where the question is already known and stable",
      "Wide analyst populations who want to author their own views",
      "Companies that have already paid for the licences and the team",
    ],
    whereWeWin: [
      "Diagnosis instead of description, the dashboard tells you what; we tell you why",
      "Cross-layer reasoning instead of one chart per question",
      "Confidence on every claim, not just on the underlying data",
    ],
    killerLine: "Tableau answers the question you already had. We name the question you should have asked.",
    recommendedPivot: { label: "Intelligence architecture", layerKey: "intelligence-architecture" },
    verdict: "we-typically-win",
  },
  {
    id: "looker",
    competitor: "Looker / LookML",
    theirPitch: "A governed semantic layer plus modelled metrics on top of the warehouse.",
    whereTheyWin: [
      "Teams that have already invested in LookML and want to extend it",
      "Embedded analytics for product surfaces with controlled metric definitions",
      "Customers whose primary need is consistency of definitions, not reasoning",
    ],
    whereWeWin: [
      "Semantic layer is given on day one across all 14 layers, not authored field by field",
      "Reasoning chain published alongside every metric, not just a definition",
      "We close gaps proactively, Looker requires the analyst to notice and act",
    ],
    killerLine: "Looker is the metric. We are the meaning of the metric.",
    recommendedPivot: { label: "Cross-layer map", layerKey: "dependency-graph" },
    verdict: "we-typically-win",
  },
  {
    id: "thoughtspot",
    competitor: "ThoughtSpot",
    theirPitch: "Search and AI on top of your data, ask any question in natural language.",
    whereTheyWin: [
      "Ad-hoc exploration by a broad analyst population",
      "Customers whose dominant workflow is question-and-answer, not diagnosis",
      "Self-service exploration where the user knows what to look for",
    ],
    whereWeWin: [
      "We bring the question, ThoughtSpot waits for one to be asked",
      "Multi-step adversarial reasoning instead of a single LLM answer",
      "Defended narrative with sources stamped, not a chart and a caption",
    ],
    killerLine: "ThoughtSpot returns an answer. We return a defended diagnosis.",
    recommendedPivot: { label: "Scenario war-room", layerKey: "scenario-warroom" },
    verdict: "we-typically-win",
  },
  {
    id: "dbt-build",
    competitor: "Build it in dbt with the data team",
    theirPitch: "We already have a data team and dbt; we can model this ourselves.",
    whereTheyWin: [
      "Teams with a mature data platform and bench capacity to spare",
      "Customers whose competitive moat is the model itself",
      "Edge cases too specific for any vendor product to solve cleanly",
    ],
    whereWeWin: [
      "Four-year head start on the reasoning chain, not just the transformations",
      "Adversarial pipeline, confidence scoring, and gap detection are not dbt-shaped problems",
      "The buy decision pays for itself off the 90-day diagnosis whether they buy or not",
    ],
    killerLine: "You could absolutely build this. The 90-day diagnosis pays for the buy-versus-build decision either way.",
    recommendedPivot: { label: "Engagement pipeline", layerKey: "engagement-pipeline" },
    verdict: "split",
  },
  {
    id: "consulting",
    competitor: "McKinsey, BCG, Bain",
    theirPitch: "Senior partners and a delivery team will diagnose the business in a 12-week engagement.",
    whereTheyWin: [
      "Strategy questions that need executive air-cover and board credibility",
      "Change-management mandates that need a tier-one logo on the page",
      "One-time set-piece engagements where the deliverable is the deck",
    ],
    whereWeWin: [
      "The diagnosis is the product, refreshed every Monday, not a slide pack from last quarter",
      "Confidence and evidence on every claim, not partner intuition",
      "Cost-per-diagnosis collapses after the first one, the firm starts from scratch every time",
    ],
    killerLine: "McKinsey ships the deck. We ship the substrate the deck used to live in.",
    recommendedPivot: { label: "Outcome track record", layerKey: "track-record" },
    verdict: "we-typically-win",
  },
];
