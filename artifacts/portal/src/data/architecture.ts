export interface ArchComponent {
  key: string;
  name: string;
  role: string;
  icon: "eye" | "search" | "shield" | "book" | "gauge";
  description: string;
  sampleOutput: string;
  tokens: number;
  ms: number;
}

export const ARCH_COMPONENTS: ArchComponent[] = [
  {
    key: "cortex",
    name: "Cortex Lens",
    role: "The perception layer.",
    icon: "eye",
    description:
      "Ingests, normalises, and joins data across the client's systems and our products. Identifies anomalies, patterns, and statistical signals worth investigating. Outputs a structured 'observation set' for the downstream models. Without Cortex Lens, the system cannot see.",
    sampleOutput:
      "Observed 41 OOS days on top-5 SKUs concentrated in DFW + Phoenix (weeks 30–34). Competitor promo intensity 1.8x baseline in 5 SE markets. Forecast error 13pp on Home Improvement. Trade segment churn 18% vs 11% baseline, departing accounts show 2.3x OOS exposure. Pricing index 102 vs target 105 with promo intensity 32% (+14pp). Cross-signal correlation: OOS pattern leads churn signal by 21–28 days, leads brand sentiment by 28–42 days.",
    tokens: 4218,
    ms: 612,
  },
  {
    key: "confounder",
    name: "Confounder",
    role: "The hidden variable model.",
    icon: "search",
    description:
      "Asks 'what else could explain this?' on every diagnostic hypothesis. Searches for confounding variables, alternative causes, and statistical artefacts. Outputs a ranked list of confounding factors that the primary diagnosis must rule out before being accepted.",
    sampleOutput:
      "Possible confounders ranked by impact: (1) Regional weather — ruled out, +$0.1M contribution only. (2) Seasonal shift in DIY — partial, -$0.3M. (3) Supplier price change — none in period. (4) Macro retail contraction — peer benchmarks flat-to-up. (5) Brand-led demand erosion — sentiment lags demand by 4–6 weeks, ruling out reverse causality. None of the confounders alone explains more than 11% of the variance; combined they account for <18%.",
    tokens: 3104,
    ms: 488,
  },
  {
    key: "challenger",
    name: "Challenger",
    role: "The adversarial reasoner.",
    icon: "shield",
    description:
      "Generates competing hypotheses to the primary diagnosis and stress-tests them. Constructs the strongest counter-argument. Forces the system to defend its conclusions rather than accept the first plausible answer.",
    sampleOutput:
      "Counter-hypothesis A: macro contraction in trade segment. Tested against trade segment performance — rejected at 91% confidence; trade orders flat YoY across the period. Counter-hypothesis B: brand event driving the demand decline. Tested against sentiment timeline — rejected; sentiment lagged demand by 4–6 weeks. Counter-hypothesis C: single-month August outlier. Rejected — variance persists at 9.3% in September. Primary diagnosis survives all three challenges.",
    tokens: 2876,
    ms: 521,
  },
  {
    key: "synthesist",
    name: "Synthesist",
    role: "The narrative composer.",
    icon: "book",
    description:
      "Takes outputs from Cortex Lens, Confounder, and Challenger and composes the final diagnostic narrative, prescription, and gap detection. This is the layer that 'speaks' to the user.",
    sampleOutput:
      "Q3 demand finished $2.8M behind plan, with the variance concentrated in the DIY channel and Home Improvement category. Three compounding causes account for almost all of it: competitor promotional intensity, a portfolio stockout pattern in Dallas and Phoenix distribution centres, and forecast model degradation that has not been retrained since March. Of the three, the pricing response is the fastest to reverse. Recommended actions surface in the Demand layer; the architectural gaps that constrained this diagnosis route to the Evaluator gap pipeline.",
    tokens: 1942,
    ms: 384,
  },
  {
    key: "evaluator",
    name: "Evaluator",
    role: "The confidence and gap scoring layer.",
    icon: "gauge",
    description:
      "Scores the final diagnosis on confidence, identifies where the reasoning chain hit dead ends, and routes those dead ends into the gap detection pipeline. Evaluator is also responsible for the confidence score visible in every layer header.",
    sampleOutput:
      "Confidence 87%. Reasoning chain hit three dead ends, all logged to pipeline: (1) Competitor pricing data has 4–7 day lag, blocking day-of decisions [DATA gap]. (2) Margin elasticity model not refreshed since pre-supply-shock [MODEL gap]. (3) No automated OOS-to-PO trigger, manual reorder dependency [WORKFLOW gap]. Dead ends do not invalidate the diagnosis; they bound its precision.",
    tokens: 1208,
    ms: 217,
  },
];

export const SAMPLE_QUESTION = "Why is Q3 demand $2.8M behind plan?";
