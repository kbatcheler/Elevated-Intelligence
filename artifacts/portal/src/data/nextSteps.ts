// Prescriptive next-step playbook per layer. Now / Next 7 days / Next 30 days.
// Hand-tuned so every layer answers the executive question: "what do I do?"

export interface NextStep {
  title: string;
  detail: string;
  owner: string;
  effort: "1d" | "2d" | "1wk" | "2wk" | "1mo";
  outcome: string;
  depends?: string;
}

export interface NextStepsBlock {
  now: NextStep;
  week: NextStep;
  month: NextStep;
}

export const NEXT_STEPS: Record<string, NextStepsBlock> = {
  "business-performance": {
    now: {
      title: "Lock the Q4 lever stack tomorrow morning",
      detail: "Convene CEO, CFO, COO and Heads of Pricing + Demand. Endorse the three reversible levers in priority order: Pricing match-cap, DIY counter-promo, Phoenix DC staffing.",
      owner: "K. Boyd (Chief of Staff)", effort: "1d",
      outcome: "Three accountable owners assigned with named recovery targets totalling $5.6M for Q4.",
    },
    week: {
      title: "Stand up a weekly recovery cadence",
      detail: "30-minute Tuesday/Friday standup. Live dashboard on this portal. Each owner reports against the modelled recovery on the layer they own.",
      owner: "K. Boyd + CFO office", effort: "1wk",
      outcome: "Recovery trajectory becomes a board metric. Variance to plan visible within 24h of any new datapoint.",
    },
    month: {
      title: "Resequence FY27 plan around the structural findings",
      detail: "If Pricing match-cap holds and Demand recovers, lift FY27 margin guidance by 60bps. If they don't, the FY27 model needs a structural reset, not a tactical one.",
      owner: "CFO + FP&A", effort: "1mo",
      outcome: "FY27 plan published with the recovery levers embedded, not bolted on.",
    },
  },

  "demand-intelligence": {
    now: {
      title: "Trigger the first full forecast retrain since March",
      detail: "The DIY/Home Improvement model has not been retrained since March 2025, pre-supply-shock baseline. Run a full Blue Yonder retrain with the last 14 days of EPOS, weather and competitor-promo signals. MAPE on Home Improvement is at 13pp vs 8pp baseline.",
      owner: "M. Tanaka (Demand Planning)", effort: "2d",
      outcome: "Forecast bias resets; recovers an estimated $0.6M of the $2.8M Q3 variance through better Q4 buy quantities.",
    },
    week: {
      title: "Launch the SE-only DIY counter-promo (15% off, 14 days)",
      detail: "Targeted to Dallas/Phoenix/Atlanta metros where Home Depot is overweighted. Bounded to the 24 SKUs in the share-loss cluster. Hard exit at day 14.",
      owner: "R. Okafor (Trade Marketing)", effort: "1wk",
      outcome: "Modelled +$1.45M Q4 revenue recovery; competitive share decline arrested at 2.3pp.",
      depends: "Pricing layer signs off margin floor (gross ≥ 18%)",
    },
    month: {
      title: "Embed weather + competitor-promo in the standing forecast",
      detail: "Move from a manual quarterly retrain to a continuous feed-driven model. NOAA + scraper data enters the planning cycle automatically.",
      owner: "M. Tanaka + Data Platform", effort: "1mo",
      outcome: "Steady-state MAPE drops from 11pp to a target ≤7pp on the eight key categories.",
    },
  },

  "competitive-intelligence": {
    now: {
      title: "Confirm Home Depot's promo runtime end-date",
      detail: "Scraper shows 1.8× baseline depth in five SE markets, sustained two weeks. Triangulate with field intel and Numerator panel to confirm whether this is a quarter-end pulse or a structural shift.",
      owner: "S. Patel (Competitive Intel)", effort: "1d",
      outcome: "Counter-promo sizing and duration calibrated correctly. Avoids overshooting if HD pulls back in week 42.",
    },
    week: {
      title: "Re-baseline market-share targets for FY27",
      detail: "Two-channel concentration (HD + Lowe's) is now structural. Drop FY27 share target from 16.5% to 15.0%, shift growth narrative to category-share-of-wallet within active accounts.",
      owner: "Head of Strategy", effort: "1wk",
      outcome: "FY27 share narrative re-anchored. Avoids missing a more achievable goal that ties to the real growth lever.",
    },
    month: {
      title: "Stand up a continuous competitive-pricing feed into Pricing",
      detail: "The scraper currently feeds dashboards but not the pricing engine. Pipe HD/Lowe's/Ace prices directly into the match-cap rule, with manual override.",
      owner: "Pricing + Data Platform", effort: "1mo",
      outcome: "Margin defence becomes automatic at the SKU level instead of a weekly merch meeting.",
    },
  },

  "customer-intelligence": {
    now: {
      title: "Personal CEO outreach to the 12 named at-risk accounts",
      detail: "Phoenix-metro detractor cluster is concentrated in 12 trade accounts representing $4.2M ARR. Templated outreach + named recovery owner per account.",
      owner: "Head of Trade Sales", effort: "2d",
      outcome: "Detractor share in Phoenix metro held flat or improved; churn risk on $4.2M ARR contained.",
    },
    week: {
      title: "Resolve the order-ETA service issue at source",
      detail: "Five9 ticket spike (+42% DoD) traces directly to the Phoenix DC labour shortfall. Fix the inventory feed to the order-ETA promise engine.",
      owner: "Customer Ops + Supply Chain", effort: "1wk",
      outcome: "Service-call volume returns to baseline within 10 days; NPS detractor cluster dissolves.",
      depends: "Phoenix DC staffing back to ≥90% (Supply Chain)",
    },
    month: {
      title: "Add a trade-customer health score to the standing view",
      detail: "12-month repeat rate + ticket sentiment + ARR concentration combined into one rolling score per account. Feeds CRM and merch.",
      owner: "Customer Ops + Data", effort: "1mo",
      outcome: "Account churn becomes a leading rather than lagging indicator. Customer intelligence layer becomes prescriptive.",
    },
  },

  "brand-social": {
    now: {
      title: "Acknowledge the 'price gouging' cluster publicly within 24h",
      detail: "14 negative mentions in 6h is small but rising fast. A short, factual statement on regional pricing and a named customer-care contact dissolves these clusters reliably.",
      owner: "Head of Brand + Comms", effort: "1d",
      outcome: "Cluster fails to reach 50-mention escalation threshold; sentiment recovers within 5 days.",
    },
    week: {
      title: "Reallocate $50K from Brand to Email + paid Search",
      detail: "Brand display is at 1.8× ROAS, Email at 8.25×. Modelled lift on Q4 ROAS is +1.0×. No creative refresh needed for week-1 reallocation.",
      owner: "Head of Marketing", effort: "1wk",
      outcome: "Q4 blended ROAS lifts from 3.2× to a modelled 3.4×.",
    },
    month: {
      title: "Pre-position a Q4 trade narrative on supply reliability",
      detail: "Pre-empt any further 'price gouging' narratives by leading Q4 brand work with a 'reliable supply for serious trades' story. Counter-positions on the HD/Lowe's weakness.",
      owner: "Brand + Trade Marketing", effort: "1mo",
      outcome: "Inbound trade enquiries up; defensive narrative position established before competitors notice the opening.",
    },
  },

  "supply-chain": {
    now: {
      title: "Fill the 11 unfilled Phoenix DC shifts this week",
      detail: "Use the existing temp-labour MSA with Kelly Services. 11 shifts × $42/hr fully loaded ≈ $18.5K weekly cost vs ≈$120K throughput risk.",
      owner: "J. Mendoza (DC Ops)", effort: "1d",
      outcome: "Throughput restored to ≥95% within 5 days; downstream ETA promise engine recovers.",
    },
    week: {
      title: "Activate qualified Supplier C on the DIY cordless range",
      detail: "Contract in legal review; ship-ready in 14 days. Dual-source the four highest-velocity SKUs immediately to offset Supplier B's production delay; reduces stockout days target from 41 to ≤15.",
      owner: "Head of Supply Planning", effort: "1wk",
      outcome: "DIY OOS days top-5 SKUs drop from 41 to 15; recovers $0.9M of the $2.8M demand variance.",
    },
    month: {
      title: "Move Dallas + Phoenix to a 6-week safety stock policy on top-50 SKUs",
      detail: "Current policy is 3 weeks for both DCs. Cost of carry is ~$220K/qtr; cost of the Q3 stockout was ~$900K. Net-positive change.",
      owner: "Supply Planning + Finance", effort: "1mo",
      outcome: "Repeat-event risk eliminated on the SKUs driving 80% of the variance. Becomes a permanent structural fix, not a tactical save.",
    },
  },

  "pricing-margin": {
    now: {
      title: "Cap the cordless-tools promo match at 22% today",
      detail: "Current match is running at 28% (matching Home Depot exactly). Cap restores a 4pp gross margin on the 24 SKUs driving the slip, $1.2M annualised recovery.",
      owner: "Head of Pricing", effort: "1d",
      outcome: "Gross margin on cordless range recovers from 16% to ≥20% within one trading week.",
    },
    week: {
      title: "Run a controlled +2% price test on the 10 lowest-elasticity SKUs",
      detail: "These SKUs have elasticity coefficients above −0.4 (least price-sensitive per the Demand model). A modest +2% price lift sustains volume and recovers ~$0.4M margin in Q4.",
      owner: "Pricing + Demand Planning", effort: "1wk",
      outcome: "Validated elasticity bands; margin lift without meaningful volume penalty. Becomes the new operating envelope.",
    },
    month: {
      title: "Replace 'match Home Depot' with a margin-floor + elasticity rule",
      detail: "Current policy is reflexive and brittle. New policy: never go below 18% gross on top-50 SKUs; let elasticity model recommend the rest. CFO + Pricing committee sign-off.",
      owner: "Head of Pricing + CFO", effort: "1mo",
      outcome: "Match-and-bleed cycle ends; pricing becomes a margin lever rather than a defensive one.",
    },
  },

  "sales-pipeline": {
    now: {
      title: "Re-qualify the seven Q4 commit deals above $200K",
      detail: "These seven deals carry the entire Q4 commit number. Force a fresh meddpicc review and confirm decision-maker + economic buyer on each.",
      owner: "VP Sales", effort: "2d",
      outcome: "Q4 commit number becomes credible at 78% confidence vs current 51%.",
    },
    week: {
      title: "Activate trade-rep pricing-quote tool with new floor",
      detail: "Reps are quoting below floor on 14% of opportunities. New tool enforces the floor at quote-build time; aligned with Pricing layer's match-cap policy.",
      owner: "Sales Ops + Pricing", effort: "1wk",
      outcome: "Cycle days drop 7d (less mid-cycle re-quoting); win rate recovers 3pp toward the 21% baseline.",
    },
    month: {
      title: "Add a $50K cap to the Q4 pipeline coverage metric",
      detail: "Six deals above $300K distort the 2.4× coverage ratio. Capping the metric at $50K per deal gives a true 1.9×, flagging the real coverage hole one quarter ahead of plan.",
      owner: "Sales Ops + FP&A", effort: "1mo",
      outcome: "Q1 27 coverage hole flagged in October, not January. Demand-gen reallocation can land before Q1 starts.",
    },
  },

  "marketing-performance": {
    now: {
      title: "Pause Brand display spend on the two underperforming creatives",
      detail: "ROAS on creative variants C-014 and C-019 is 1.4× and 1.6×. Pausing redirects $18K/week into the Email channel where ROAS is 8.25×.",
      owner: "Performance Marketing Lead", effort: "1d",
      outcome: "Wasted spend stopped within 24h; redirected dollars start clearing within 72h.",
    },
    week: {
      title: "Stand up the $50K Brand→Email reallocation properly",
      detail: "Full reallocation modelled at +1.0× blended ROAS lift, +$50K in 14-day attributed revenue. Requires Email creative refresh (3 templates).",
      owner: "Marketing + Creative", effort: "1wk",
      outcome: "Q4 blended ROAS lifts from 3.2× to 3.4×; modelled $1.85M incremental revenue.",
    },
    month: {
      title: "Rebuild attribution model to MMM + 14-day window",
      detail: "Current attribution coverage is 64%, Brand spend is undercredited. New model with MMM overlay restores credibility and lets us defend Brand investment with data.",
      owner: "Marketing Analytics", effort: "1mo",
      outcome: "Attribution coverage to 90%+; Brand budget conversation in Q1 planning becomes evidence-led.",
    },
  },

  "people-operations": {
    now: {
      title: "Emergency 5% wage adjustment for DC Operations (this week)",
      detail: "DC Ops attrition annualised at 24% (vs 12% target), two weeks running. Comp gap is 8–11% vs Phoenix/Dallas market. 5% lift closes most of it.",
      owner: "CHRO + COO", effort: "2d",
      outcome: "Attrition annualised expected to fall to 18% within 30 days; stops the bleed before peak Q4 throughput.",
    },
    week: {
      title: "Open a Phoenix-area satellite hiring location",
      detail: "Current hiring is centralised at DC site. A satellite location 8 miles north taps a different labour pool and roughly doubles applicant flow.",
      owner: "Talent + Facilities", effort: "1wk",
      outcome: "Applicant flow ~2×; offer-to-accept window shortens by 6 days.",
    },
    month: {
      title: "Permanent shift-pattern redesign with 4×10 option",
      detail: "Survey data shows 4×10 schedules drive a 9pp lift in retention in DC environments. Pilot at Phoenix, then roll out if NPS for DC Ops holds.",
      owner: "COO + CHRO", effort: "1mo",
      outcome: "Structural retention lift of an estimated 7–9pp; eliminates the recurring attrition spike pattern.",
    },
  },

  "finance": {
    now: {
      title: "Refresh the Q4 cash-flow bridge with the new Pricing recovery",
      detail: "EBITDA is $6.5M below plan; Pricing match-cap and DIY counter-promo deliver $2.6M of in-quarter recovery. Bridge needs to reflect this before next week's board pack.",
      owner: "CFO + FP&A", effort: "2d",
      outcome: "Board sees a credible recovery path, not just a variance. Avoids triggering a covenant conversation.",
    },
    week: {
      title: "Tighten DSO with three named credit holds",
      detail: "Greater Plains Co. ($420K, 47d), Continental Trade ($210K, 51d), Mason+Co. ($180K, 44d). Combined $810K of working capital release.",
      owner: "Treasury + AR", effort: "1wk",
      outcome: "DSO drops from 47d to ~41d; $810K immediate working capital release.",
    },
    month: {
      title: "Stand up rolling-13-week cash forecast tied to layer signals",
      detail: "Current cash forecast is monthly and static. Tying it to live signals from Receivables, Pricing and Supply makes the EBITDA bridge real-time.",
      owner: "Treasury + Data", effort: "1mo",
      outcome: "Cash visibility shifts from monthly to weekly; no more end-of-quarter surprises.",
    },
  },

  "receivables": {
    now: {
      title: "Place credit holds on the three accounts over 45d",
      detail: "Greater Plains Co., Continental Trade, Mason+Co., collectively $810K. Templated hold + named AR contact for each.",
      owner: "AR Manager", effort: "1d",
      outcome: "Stops further accumulation; signals seriousness without legal escalation.",
    },
    week: {
      title: "Move the nine 31–60d accounts to weekly contact cadence",
      detail: "These accounts (totalling $187K) are the next cohort to drift past 60 days. Weekly contact cuts the conversion-to-60d rate by ~40%.",
      owner: "AR team", effort: "1wk",
      outcome: "Fewer than 30% of these accounts cross the 60-day line; $130K of working capital preserved.",
    },
    month: {
      title: "Renegotiate terms with the top 10 trade accounts (45→30 days)",
      detail: "Top 10 trade accounts hold $4.1M in receivables and currently sit on 45-day terms. Shifting to 30 with a 1% early-pay discount lands inside their incentive curve.",
      owner: "CFO + Sales", effort: "1mo",
      outcome: "Permanent DSO improvement of ~5d; ~$1.6M working capital release; downside risk on next cycle reduced.",
    },
  },

  "talent-hr": {
    now: {
      title: "Approve the comp uplift on the senior buyer role",
      detail: "84 days open. Offer-to-accept stage is the funnel bottleneck, comp gap is 12% vs market. Approve +15% on this single role to break the blocker.",
      owner: "CHRO + Head of Pricing", effort: "1d",
      outcome: "Role likely filled within 21 days; Pricing transformation roadmap unblocked.",
    },
    week: {
      title: "Restructure the five other critical roles for parallel close",
      detail: "Currently sequential. Splitting into parallel two-track close (intro week + offer week) takes ~14 days off each.",
      owner: "Talent acquisition lead", effort: "1wk",
      outcome: "Average time-to-fill on critical roles drops from 64d to 46d.",
    },
    month: {
      title: "Launch internal mobility program for DC supervisor pipeline",
      detail: "Current internal mobility is 8%. Stand up a named DC supervisor track sourced from top quartile DC Ops staff; addresses both attrition (retention) and time-to-fill.",
      owner: "CHRO + COO", effort: "1mo",
      outcome: "Internal supervisor pipeline lifts internal mobility to 18%; reduces dependency on external hire on the most failure-prone roles.",
    },
  },
};
