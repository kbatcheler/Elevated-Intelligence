// Deep "pipeline detail", the data the Demand product would surface for the
// four operationally-deep layers. Surfaced in the portal as a "Pipeline detail"
// panel that sits between the narrative and the recommended-actions column.

export interface DeepRow {
  cols: string[];     // first col is label; remaining cols are values
  tone?: "good" | "warn" | "bad";
}

export interface DeepTable {
  title: string;
  subtitle: string;
  headers: string[];
  rows: DeepRow[];
  footnote: string;
}

export interface PipelineDeep {
  eyebrow: string;
  intro: string;
  primary: DeepTable;
  secondary: DeepTable;
  modelNote: { title: string; detail: string };
}

export const PIPELINE_DEEP: Record<string, PipelineDeep> = {
  // ───────────────────────────────────────────────────────────────────────────
  "demand-intelligence": {
    eyebrow: "FROM THE DEMAND PIPELINE",
    intro:
      "Underneath the variance number is a five-category, eight-DC forecast model with a 14-day rolling MAPE and a separate competitor-promo signal. Below is the slice driving Q3.",
    primary: {
      title: "Category-level forecast quality",
      subtitle: "Rolling 14-day MAPE vs plan share, Q3 2026",
      headers: ["Category", "Plan share", "Actual share", "MAPE 14d", "Drift vs Q2"],
      rows: [
        { cols: ["Home Improvement",   "28%", "21%", "13pp", "+5pp"], tone: "bad"  },
        { cols: ["DIY Power Tools",    "18%", "13%", "11pp", "+4pp"], tone: "bad"  },
        { cols: ["Garden + Outdoor",   "16%", "17%", "6pp",  "−1pp"], tone: "good" },
        { cols: ["Trade Hardware",     "14%", "15%", "5pp",  "flat"], tone: "good" },
        { cols: ["Cleaning + Consum.", "12%", "13%", "4pp",  "flat"], tone: "good" },
        { cols: ["Paint + Decorating", "8%",  "11%", "9pp",  "+2pp"], tone: "warn" },
        { cols: ["Other",              "4%",  "10%", "·",    "·"   ] },
      ],
      footnote: "Source: POS aggregator (47 stores, hourly) + Numerator panel + Blue Yonder model v4.2. Two categories carry the variance.",
    },
    secondary: {
      title: "Top 10 SKUs driving the variance",
      subtitle: "Ranked by absolute dollar gap to plan",
      headers: ["SKU", "Description", "Plan units", "Actual", "Gap $"],
      rows: [
        { cols: ["4128", "Cordless drill 18V, pro",         "12,400", "8,210", "−$420K"], tone: "bad"  },
        { cols: ["4131", "Circular saw kit, pro",           "8,200",  "5,640", "−$310K"], tone: "bad"  },
        { cols: ["6204", "Impact driver, trade",            "9,100",  "6,820", "−$280K"], tone: "bad"  },
        { cols: ["7821", "Trim router + bits",               "5,400",  "3,940", "−$210K"], tone: "bad"  },
        { cols: ["4129", "Cordless drill 18V, homeowner",   "14,200", "11,820","−$190K"], tone: "warn" },
        { cols: ["6210", "Hammer drill 20V",                 "6,800",  "5,440", "−$180K"], tone: "warn" },
        { cols: ["8104", "Reciprocating saw kit",            "4,200",  "3,180", "−$170K"], tone: "warn" },
        { cols: ["7305", "Cordless multi-tool",              "5,100",  "4,080", "−$140K"], tone: "warn" },
        { cols: ["4140", "Drill driver combo",               "3,800",  "2,960", "−$130K"], tone: "warn" },
        { cols: ["6215", "Angle grinder 4.5″",               "5,600",  "4,840", "−$110K"], tone: "warn" },
      ],
      footnote: "Combined gap on these 10 SKUs: $2.14M, 76% of the total variance. All 10 are in the DIY/Cordless promo overlap with Home Depot.",
    },
    modelNote: {
      title: "Demand model status",
      detail: "Last full retrain: March 2025, pre-supply-shock baseline. Recommended retrain cadence is weekly when MAPE drifts > 3pp. Current drift is 5pp on Home Improvement and the model has not been touched in two quarters.",
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  "supply-chain": {
    eyebrow: "FROM THE SUPPLY PIPELINE",
    intro:
      "OTD, fill rate and lead time per supplier, plus capacity per DC. Two issues sit underneath the headline stockout number: one supplier and one labour shortfall.",
    primary: {
      title: "Top supplier scorecard",
      subtitle: "Trailing 8 weeks · top-50 SKUs only",
      headers: ["Supplier", "OTD", "Fill rate", "Lead 14d", "Trend"],
      rows: [
        { cols: ["Supplier B, Cordless / DIY tools",   "78%", "84%", "21d", "Down 6pp"], tone: "bad"  },
        { cols: ["Supplier C, Alternative DIY (qual.)","94%", "98%", "14d", "Ready"   ], tone: "good" },
        { cols: ["Supplier D, Garden equipment",       "91%", "96%", "9d",  "Up 2pp"  ], tone: "good" },
        { cols: ["Supplier E, Paint",                  "88%", "94%", "12d", "Steady"  ], tone: "warn" },
        { cols: ["Supplier F, Hand tools",             "96%", "99%", "8d",  "Steady"  ], tone: "good" },
        { cols: ["Supplier G, Hardware",               "92%", "97%", "10d", "Steady"  ], tone: "good" },
        { cols: ["Supplier H, Consumables",            "93%", "98%", "10d", "Steady"  ], tone: "good" },
      ],
      footnote: "Supplier B drives most of the Q3 stockout pattern on the cordless range. Supplier C is fully qualified, contract in legal review, can ship within 14 days.",
    },
    secondary: {
      title: "DC operational view",
      subtitle: "Capacity, labour, throughput, this week",
      headers: ["DC", "Capacity util.", "Shifts filled", "Throughput", "Stockout days"],
      rows: [
        { cols: ["Phoenix",  "94%", "61%",  "82%", "23d"], tone: "bad"  },
        { cols: ["Dallas",   "91%", "73%",  "86%", "18d"], tone: "bad"  },
        { cols: ["Atlanta",  "88%", "92%",  "97%", "6d" ], tone: "warn" },
        { cols: ["Chicago",  "84%", "95%",  "98%", "2d" ], tone: "good" },
        { cols: ["Reno",     "79%", "97%",  "99%", "1d" ], tone: "good" },
        { cols: ["Newark",   "82%", "94%",  "98%", "3d" ], tone: "good" },
      ],
      footnote: "Phoenix is 39% short on filled shifts (vs ≥90% target). Throughput follows linearly. Pattern reproduces in Dallas at smaller scale.",
    },
    modelNote: {
      title: "Pipeline trigger",
      detail: "Alternative Supplier C is fully qualified with a contract in legal, 14-day activation. Combined with the Phoenix shift fix, the operational pipeline closes ~80% of the variance gap inside three weeks.",
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  "pricing-margin": {
    eyebrow: "FROM THE PRICING PIPELINE",
    intro:
      "SKU-level price index vs Home Depot, with elasticity coefficients from the Demand model. The match-and-bleed pattern is concentrated on 24 SKUs.",
    primary: {
      title: "Top SKUs by margin drag",
      subtitle: "Match depth vs current gross margin · top 10 of 24",
      headers: ["SKU", "Match depth", "Gross margin", "Elasticity", "Annualised drag"],
      rows: [
        { cols: ["4128 Cordless drill 18V pro",  "32%", "14%", "−0.71", "$310K"], tone: "bad"  },
        { cols: ["4131 Circular saw kit",        "30%", "15%", "−0.62", "$240K"], tone: "bad"  },
        { cols: ["6204 Impact driver trade",     "28%", "16%", "−0.58", "$210K"], tone: "bad"  },
        { cols: ["7821 Trim router + bits",      "26%", "17%", "−0.49", "$150K"], tone: "warn" },
        { cols: ["6210 Hammer drill 20V",        "26%", "17%", "−0.44", "$130K"], tone: "warn" },
        { cols: ["8104 Reciprocating saw",       "24%", "18%", "−0.41", "$110K"], tone: "warn" },
        { cols: ["4129 Cordless drill homeowner","24%", "18%", "−0.38", "$95K" ], tone: "warn" },
        { cols: ["7305 Cordless multi-tool",     "22%", "19%", "−0.35", "$78K" ], tone: "warn" },
        { cols: ["4140 Drill driver combo",      "20%", "20%", "−0.31", "$62K" ], tone: "warn" },
        { cols: ["6215 Angle grinder 4.5″",      "18%", "20%", "−0.28", "$54K" ], tone: "warn" },
      ],
      footnote: "Average elasticity on this cluster is −0.46. A 4pp match-cap lifts gross by ~3pp without a meaningful volume hit. Modelled annualised recovery $1.2M.",
    },
    secondary: {
      title: "Pricing pipeline state",
      subtitle: "Rule coverage and override rate by SKU group",
      headers: ["SKU group", "Rule coverage", "Auto-match", "Override rate", "Margin floor"],
      rows: [
        { cols: ["Top 50, cordless tools",  "100%", "100%", "0%",  "16%"], tone: "bad"  },
        { cols: ["Top 50, power tools",     "100%", "92%",  "8%",  "18%"], tone: "warn" },
        { cols: ["Top 50, garden",          "100%", "78%",  "22%", "24%"], tone: "good" },
        { cols: ["Top 50, paint",           "100%", "84%",  "16%", "22%"], tone: "good" },
        { cols: ["Tier 2, hand tools",      "92%",  "71%",  "29%", "26%"], tone: "good" },
        { cols: ["Tier 2, consumables",     "88%",  "82%",  "18%", "28%"], tone: "good" },
      ],
      footnote: "Cordless tools group has 0% override, match rule fires every time. That's exactly the cohort with the worst margin slip.",
    },
    modelNote: {
      title: "Pricing engine state",
      detail: "Current rule: 'match Home Depot exactly within 4h'. Proposed rule: 'never below 18% gross on top-50; elasticity-led elsewhere'. Recovery modelled at $1.2M in Q4.",
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  "sales-pipeline": {
    eyebrow: "FROM THE SALES PIPELINE",
    intro:
      "Stage-by-stage conversion, deal-level commit list and slipped-deal pattern. The Q4 commit number rests on seven deals, six of which are above $300K.",
    primary: {
      title: "Q4 commit deal stack",
      subtitle: "Top 10 deals · meddpicc-qualified",
      headers: ["Account", "ARR", "Stage", "Confidence", "Slip risk"],
      rows: [
        { cols: ["Vantage Trade Holdings",  "$840K", "Negotiation", "72%", "Low"   ], tone: "good" },
        { cols: ["Holdfast Hardware Group", "$610K", "Negotiation", "58%", "Medium"], tone: "warn" },
        { cols: ["Continental Building Co", "$520K", "Proposal",    "44%", "High"  ], tone: "bad"  },
        { cols: ["Mason+Co Trade",          "$480K", "Proposal",    "61%", "Medium"], tone: "warn" },
        { cols: ["Greater Plains Supply",   "$420K", "Verbal",      "78%", "Low"   ], tone: "good" },
        { cols: ["North Star Outfitters",   "$380K", "Negotiation", "55%", "Medium"], tone: "warn" },
        { cols: ["Atlas Builders Group",    "$340K", "Discovery",   "31%", "High"  ], tone: "bad"  },
        { cols: ["Westcrest Trades",        "$220K", "Verbal",      "82%", "Low"   ], tone: "good" },
        { cols: ["Lakeshore Hardware",      "$180K", "Negotiation", "67%", "Low"   ], tone: "good" },
        { cols: ["Phoenix Pro Supply",      "$160K", "Proposal",    "49%", "Medium"], tone: "warn" },
      ],
      footnote: "Commit total $4.15M. Risk-weighted: $2.34M. Two High-risk deals ($860K combined) carry most of the Q4 miss exposure.",
    },
    secondary: {
      title: "Funnel conversion · last 8 weeks",
      subtitle: "Stage-to-stage conversion vs same period last year",
      headers: ["Stage", "Deal count", "Conv. rate", "LY conv.", "Cycle days"],
      rows: [
        { cols: ["Inbound → Discovery",      "184", "61%", "68%", "3d" ], tone: "warn" },
        { cols: ["Discovery → Proposal",     "112", "48%", "55%", "9d" ], tone: "warn" },
        { cols: ["Proposal → Negotiation",   "54",  "44%", "58%", "14d"], tone: "bad"  },
        { cols: ["Negotiation → Verbal",     "24",  "67%", "72%", "11d"], tone: "warn" },
        { cols: ["Verbal → Closed-won",      "16",  "87%", "89%", "6d" ], tone: "good" },
      ],
      footnote: "The slip is concentrated at Proposal→Negotiation, directly downstream of the pricing-quote re-work pattern. Pricing layer's quote-tool fix sits on the critical path.",
    },
    modelNote: {
      title: "Pipeline-coverage view",
      detail: "Coverage at 2.4× looks adequate but six deals >$300K distort the ratio. Capping at $50K/deal gives a true 1.9×, with a structural Q1 hole now visible 10 weeks ahead.",
    },
  },
};
