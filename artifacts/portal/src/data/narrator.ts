export interface CrossInsight {
  icon: "link" | "alert" | "trend";
  title: string;
  body: string;
  targetLayer: string;
  targetField?: string; // e.g. "metric:0", "cause:1", "gap:2"
}
export interface NextStep { title: string; targetLayer: string; }
export interface NarratorContent {
  summary: string;
  cross: CrossInsight[];
  next: NextStep[];
}

export const NARRATOR: Record<string, NarratorContent> = {
  "business-performance": {
    summary:
      "Q3 closed 8% behind plan with margin off 380 basis points. The variance is not diffuse: three layers — demand, supply, pricing — account for almost the entire gap. Cash held only because working capital tightened. Pricing is the fastest reversible lever this quarter.",
    cross: [
      { icon: "link",  title: "60% of revenue gap traces to Demand", body: "Two channels — DIY and Home Improvement — carry most of the variance. Demand layer holds the diagnostic.", targetLayer: "demand-intelligence", targetField: "metric:0" },
      { icon: "alert", title: "Margin loss has a single root in Pricing",  body: "240bps margin decline aligns with promotional matching depth — Pricing layer quantifies the recovery.", targetLayer: "pricing-margin", targetField: "cause:0" },
    ],
    next: [
      { title: "Why did promo matching deepen by 14pp?", targetLayer: "pricing-margin" },
      { title: "What stockout pattern drove DIY?",        targetLayer: "supply-chain" },
      { title: "Where is share loss concentrated?",       targetLayer: "competitive-intelligence" },
    ],
  },
  "demand-intelligence": {
    summary:
      "Demand finished Q3 $2.8M behind plan. Three causes compound, and two of them are reversible by mid-November. Stockout pattern in this layer is the upstream cause of customer churn surfacing in Customer intelligence. The pricing layer holds the most leverage right now.",
    cross: [
      { icon: "link",  title: "Stockouts here drive Customer churn",         body: "Departing trade accounts saw 2.3x average OOS rate during weeks 30–34. Causal link is high confidence.", targetLayer: "customer-intelligence", targetField: "cause:0" },
      { icon: "alert", title: "Pricing matching is the demand drag's twin",  body: "Promo response defended units but lost margin without recovering share. Both layers share root cause.", targetLayer: "pricing-margin", targetField: "metric:1" },
    ],
    next: [
      { title: "Which Dallas / Phoenix SKUs lost most?", targetLayer: "supply-chain" },
      { title: "Will competitor promo persist into Q4?", targetLayer: "competitive-intelligence" },
      { title: "How fast can forecast retrain ship?",    targetLayer: "people-operations" },
    ],
  },
  "competitive-intelligence": {
    summary:
      "Share fell 2.1pp to 14.3% driven primarily by Home Depot private-label expansion in the Southeast and Lowe's price aggression in Texas. The story is asymmetric — concentrated in three families and three regions. Recovery requires either matched pricing or differentiation, not both.",
    cross: [
      { icon: "trend", title: "Ace availability advantage is our supply problem", body: "Ace captured switchers during weeks 30–34 OOS window. Supply chain layer fixes this directly.", targetLayer: "supply-chain", targetField: "metric:0" },
      { icon: "link",  title: "Brand sentiment decline tracks share loss",        body: "Sentiment cluster around availability echoes the same SE/TX geography as share loss.", targetLayer: "brand-social", targetField: "cause:0" },
    ],
    next: [
      { title: "Can we hold price on margin-protected lines?", targetLayer: "pricing-margin" },
      { title: "Which two product launches can pull forward?", targetLayer: "demand-intelligence" },
      { title: "Are we losing share inside loyal accounts?",   targetLayer: "customer-intelligence" },
    ],
  },
  "customer-intelligence": {
    summary:
      "Trade customer base is the leading indicator that worries us most. 18% churn is service-driven, not price-driven. Lost accounts had 2.3x average OOS rate. The supply chain layer holds most of the diagnostic, and customer recovery depends on supply chain recovery being visible inside 30 days.",
    cross: [
      { icon: "alert", title: "OOS pattern in Supply chain is the upstream cause", body: "Causality flows: supply → service quality → trade churn. Fix the source, not the symptom.", targetLayer: "supply-chain", targetField: "cause:0" },
      { icon: "link",  title: "73% of negative brand sentiment ties to this",      body: "Sentiment cluster correlates with same service issues. Recovery here brings sentiment with it.", targetLayer: "brand-social", targetField: "metric:0" },
    ],
    next: [
      { title: "Top 200 at-risk accounts — who owns each?",     targetLayer: "people-operations" },
      { title: "Can delivery SLA restore inside 30 days?",      targetLayer: "supply-chain" },
      { title: "What does pricing trust recovery look like?",   targetLayer: "pricing-margin" },
    ],
  },
  "brand-social": {
    summary:
      "Brand health softened across every measure. 73% of the negative sentiment cluster relates to product availability and delivery, not brand affinity — the supply chain story showing up in the brand layer. Recovery lags supply chain recovery by 4–6 weeks, so PR investment alongside operational recovery is justified now.",
    cross: [
      { icon: "link",  title: "Supply chain is the upstream cause here too",         body: "Stockouts in weeks 30–34 generated the regional press coverage now feeding sentiment.", targetLayer: "supply-chain", targetField: "metric:0" },
      { icon: "trend", title: "Search ranking loss correlates with content backlog", body: "Engineering attrition slowed the SEO content refresh; People layer surfaces the constraint.", targetLayer: "people-operations", targetField: "cause:2" },
    ],
    next: [
      { title: "Which press cycles can we get ahead of?",   targetLayer: "supply-chain" },
      { title: "What is the SEO content cadence we can run?", targetLayer: "marketing-performance" },
      { title: "Where does brand pull help share recovery?",  targetLayer: "competitive-intelligence" },
    ],
  },
  "supply-chain": {
    summary:
      "Supply chain is the operational source of most of the customer and brand decline. Supplier B delays compounded with Dallas DC capacity constraint during peak weeks 28–34. The story is two simultaneous constraints, not a single failure. Activating Supplier C is the largest single lever and is already in legal review.",
    cross: [
      { icon: "alert", title: "The 41 OOS days here drive the Demand variance", body: "The same root cause appears in three layers — Demand, Customer, Brand — propagated from this one.", targetLayer: "business-performance", targetField: "cause:1" },
      { icon: "link",  title: "DC labour shortage links to People layer",        body: "14 unfilled DC roles in peak weeks. Compensation review in two regions is in People layer.", targetLayer: "people-operations", targetField: "cause:0" },
    ],
    next: [
      { title: "When does Supplier C contract close?",     targetLayer: "people-operations" },
      { title: "How quickly can DC throughput rebuild?",   targetLayer: "people-operations" },
      { title: "Which top SKUs need lifted safety stock?", targetLayer: "demand-intelligence" },
    ],
  },
  "pricing-margin": {
    summary:
      "Promotional defence cost us 240bps of margin and bought back no share. Targeted reset on 50 SKUs recovers most of the margin without forfeiting share where share matters. Pricing here directly drove the EBITDA gap visible on Business performance. Highest-leverage Q4 intervention identified across all layers.",
    cross: [
      { icon: "alert", title: "Promo defence here drove the EBITDA gap",       body: "Margin protection via promo here directly drove the headline operating margin decline.", targetLayer: "business-performance", targetField: "metric:1" },
      { icon: "trend", title: "Competitor pricing intelligence is the gating data", body: "Without real-time competitor pricing, reset cadence is limited. Same gap shows on Competitive layer.", targetLayer: "competitive-intelligence", targetField: "gap:0" },
    ],
    next: [
      { title: "Which 19 SKUs should stay matched?",         targetLayer: "competitive-intelligence" },
      { title: "Can the elasticity model retrain by Nov 7?", targetLayer: "people-operations" },
      { title: "Trade pricing tier reactivation timing?",    targetLayer: "customer-intelligence" },
    ],
  },
  "sales-pipeline": {
    summary:
      "B2B pipeline is undercovered for Q4 forecast. Mid-funnel stall in deals over $100k and 12 large deal slippages tell a single story: enterprise approval cycles materially lengthened post-budget season. Coverage at 1.8x against a 2.5x need cannot make the forecast without targeted acceleration.",
    cross: [
      { icon: "link",  title: "Stalled deals concentrated in Mercer churn regions", body: "Mid-funnel stall and trade churn share the same TX and Mountain West geography.", targetLayer: "customer-intelligence", targetField: "cause:1" },
      { icon: "alert", title: "Win-rate erosion mirrors competitor activity",       body: "Lowe's intensity in TX overlaps directly with the 4 named-account losses.", targetLayer: "competitive-intelligence", targetField: "cause:1" },
    ],
    next: [
      { title: "Top 20 stalled deals — which are CRO-eligible?", targetLayer: "people-operations" },
      { title: "Pricing flexibility on the 8 large deals?",      targetLayer: "pricing-margin" },
      { title: "Trade segment buying-intent signal coverage?",   targetLayer: "marketing-performance" },
    ],
  },
  "marketing-performance": {
    summary:
      "Marketing efficiency deteriorated in Q3. Channel saturation in paid social, creative fatigue, and attribution gaps prevent reallocation. Reallocating spend toward retention and improving attribution coverage compound; either alone delivers half the recovery.",
    cross: [
      { icon: "link",  title: "Marketing pull-forward is in Business actions",   body: "Pulling Q4 marketing forward to defend share is a Business layer action with $0.6M projected.", targetLayer: "business-performance", targetField: "action:2" },
      { icon: "trend", title: "Creative bottleneck partly People-driven",        body: "Three senior data engineers lost in Q3 backlogged attribution build; same constraint surfaces here.", targetLayer: "people-operations", targetField: "cause:2" },
    ],
    next: [
      { title: "How fast can attribution layer ship?",          targetLayer: "people-operations" },
      { title: "Which retention channels absorb reallocation?", targetLayer: "customer-intelligence" },
      { title: "Brand pull lift on regional paid search?",      targetLayer: "brand-social" },
    ],
  },
  "people-operations": {
    summary:
      "Workforce stretch in operations roles correlates directly with service quality issues in Customer. Attrition concentrated in DC and customer service. 24 open critical roles span four DC regions plus central pricing. Recovery needs investment, not exhortation; compensation review in two DC regions is the highest-leverage move.",
    cross: [
      { icon: "alert", title: "DC attrition is the Supply chain throughput cap", body: "Dallas DC throughput dropped to 82% during the 14-role vacancy window — same root cause.", targetLayer: "supply-chain", targetField: "cause:1" },
      { icon: "link",  title: "Engineering loss slows pricing model retrain",    body: "Three senior data engineers lost in Q3 — same backlog blocks margin elasticity refresh.", targetLayer: "pricing-margin", targetField: "gap:1" },
    ],
    next: [
      { title: "Which 50 roles get retention bonus first?",  targetLayer: "supply-chain" },
      { title: "Pulse engagement programme timeline?",       targetLayer: "customer-intelligence" },
      { title: "Comp review approval path in TX + AZ?",       targetLayer: "supply-chain" },
    ],
  },
  "finance": {
    summary:
      "Cash closed Q3 ahead of plan by $3.8M, but the strength is working-capital tightening, not operational outperformance. EBITDA finished $6.5M behind plan, with Technology + Data and Operations overspending while Marketing and HR came in under. Two opex lines — cloud infrastructure and DC contract labour — account for almost all the variance and are both addressable in Q4. Reset the Technology budget envelope before Q4 board, not after.",
    cross: [
      { icon: "alert", title: "Receivables drag is the cash story", body: "$10.9M past 60-day terms — three of six largest debtors also appear as critical churn risk.", targetLayer: "receivables", targetField: "metric:1" },
      { icon: "link",  title: "DC contract labour traces to Talent", body: "Contract pickers covered the 14-role DC vacancy gap at 1.6x rate — close the roles, close the overspend.", targetLayer: "talent-hr", targetField: "cause:0" },
    ],
    next: [
      { title: "Which cloud platforms drive the +18% overrun?", targetLayer: "finance" },
      { title: "Can we restore dunning workflow this week?",    targetLayer: "receivables" },
      { title: "Critical role fill sequencing for Q4?",         targetLayer: "talent-hr" },
    ],
  },
  "receivables": {
    summary:
      "The receivables book swelled to $40.5M in Q3, with $10.9M past 60-day terms — a 41% rise on Q2. Deterioration is concentrated: six trade customers carry 62% of past-due value, and three of those six are also critical churn risks. Collections should be sequenced with account recovery, not run as a parallel adversarial workflow. Reactivating the dunning cadence and joint AM+finance calls on the top six is this week's move.",
    cross: [
      { icon: "alert", title: "Top debtors are top churn risks",     body: "Heritage Pro, Mountain West Trades and Kessler all carry open service tickets and unpaid invoices in parallel.", targetLayer: "customer-intelligence", targetField: "header" },
      { icon: "link",  title: "Service breach correlates with delay", body: "Accounts with Q3 SLA breaches paid 18 days slower on average — supply chain is upstream.", targetLayer: "supply-chain", targetField: "cause:0" },
    ],
    next: [
      { title: "Top 6 debtor recovery call sequence?", targetLayer: "receivables" },
      { title: "Restore automated dunning cadence?",   targetLayer: "receivables" },
      { title: "Joint workflow with Customer team?",   targetLayer: "customer-intelligence" },
    ],
  },
  "talent-hr": {
    summary:
      "Q4 delivery risk concentrates in 24 unfilled critical roles. Six have been open more than 60 days, all in Operations, Data Engineering and Commercial — the same functions whose gaps drive Q3 variance. Funnel conversion halved versus Q2; the failure point is sourcing quality and offer competitiveness, not late-stage drop-off. Targeted comp moves in two DC regions plus an executive search on the senior data engineering role would close 80% of the Q4 staffing risk.",
    cross: [
      { icon: "alert", title: "Open DC roles cap Supply throughput", body: "14 unfilled DC roles map directly to the throughput shortfall in Dallas — same root cause.", targetLayer: "supply-chain", targetField: "cause:1" },
      { icon: "link",  title: "Data engineering loss blocks Pricing", body: "Senior data engineer vacancy is the gating constraint on margin elasticity model retrain.", targetLayer: "pricing-margin", targetField: "gap:1" },
    ],
    next: [
      { title: "Comp review approval path TX + AZ?",        targetLayer: "talent-hr" },
      { title: "Which 6 roles to retain external search?",  targetLayer: "talent-hr" },
      { title: "Internal mobility candidates for 14 lateral moves?", targetLayer: "people-operations" },
    ],
  },
  "intelligence-architecture": {
    summary:
      "The architecture page makes the reasoning chain visible. Five named components — Cortex Lens, Confounder, Challenger, Synthesist, Evaluator — work together on every diagnostic question. The user-facing narrative is the synthesis of all five; confidence and gap detection are emergent properties of the chain working correctly.",
    cross: [
      { icon: "trend", title: "Confidence visible on every layer header", body: "Evaluator scores feed the confidence band on every layer header — including the one you saw last.", targetLayer: "business-performance" },
      { icon: "link",  title: "Gaps logged here become pipeline value",   body: "Each layer's 'Architectural gaps surfaced' card is sourced from Evaluator's dead-end pipeline.", targetLayer: "pricing-margin" },
    ],
    next: [
      { title: "Watch a question flow through the stack",        targetLayer: "intelligence-architecture" },
      { title: "How does Evaluator score confidence?",            targetLayer: "intelligence-architecture" },
      { title: "Which layer surfaced the most gaps in Q3?",       targetLayer: "pricing-margin" },
    ],
  },
};
