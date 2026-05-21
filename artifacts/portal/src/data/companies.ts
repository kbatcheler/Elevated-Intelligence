// Company profile system. The portal's narrative is hydrated from a profile —
// branding, headline numbers, named entities (suppliers, competitors, DCs).
// A render-time `resolve()` swaps tokens through the deep layer narrative so a
// single set of layer copy can be re-skinned per company without rewriting.

export interface CompanyHeadlines {
  revenueActual: string;
  revenuePlan: string;
  revenueVarPct: string;
  revenueVarDollars: string;
  marginActual: string;
  marginTarget: string;
  marginVarBps: string;
  cashActual: string;
  cashVar: string;
  cashTone: "good" | "warn" | "bad";
  npsActual: number;
  npsDelta: string;
}

export interface CompanyFinding {
  finding: string;
  impact: string;
  lever?: string;
}

export interface CompanyRootCause {
  title: string;
  impact: string;
  body: string;
}

export interface CompanyRecoveryLever {
  title: string;
  horizon: string;
  recovery: string;
  owner: string;
  body: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  url: string;
  logoMonogram: string;        // 1-2 char monogram for the topbar avatar
  logoEmoji?: string;          // optional emoji glyph (sector cue)
  sector: string;
  hqCity: string;
  hqState?: string;
  revenueBand: string;
  parent?: string;
  ownership: string;
  founded?: number;

  // Display chrome
  period: string;              // "Q3 2026"
  channelLabel: string;        // "All channels"
  tagline: string;             // one-line elevator pitch
  accentColor?: string;        // optional brand accent override

  // Vocabulary — substring swaps applied at render time via resolve()
  // Empty for the default profile (Mercer): no swaps, copy renders as-is.
  vocab: Record<string, string>;

  headlines: CompanyHeadlines;

  // Narrative overrides shown in the brief and board pack
  executiveRead?: string;            // long-form lede
  pullQuote?: string;                // one-line emphasis line
  topFindings?: Partial<Record<string, CompanyFinding>>;  // keyed by layer key
  rootCauses?: CompanyRootCause[];
  recoveryLevers?: CompanyRecoveryLever[];
  combinedRecovery?: string;         // "$5.6M Q4"
  recoveryConfidence?: string;

  // Source/system context
  sourceSystems: string;             // e.g. "14 systems · 312 feeds"
  analyst: string;                   // e.g. "Katherine Boyd · Lead analyst"

  // Data tag
  isGenerated?: boolean;
  generatedAt?: string;
}

// ───────────────────────────────────────────────────────────────────────────
// MERCER GROUP — default profile. Identity vocab (no swaps).
// The hardcoded layer narrative everywhere in the codebase is the Mercer
// narrative, so this profile defines no overrides — everything renders as-is.
// ───────────────────────────────────────────────────────────────────────────
export const MERCER: CompanyProfile = {
  id: "mercer-group",
  name: "Mercer Group",
  url: "mercergroup.com",
  logoMonogram: "M",
  sector: "Hardware & garden retail",
  hqCity: "Charlotte", hqState: "NC",
  revenueBand: "$540M FY25",
  ownership: "Private · PE-owned (Ares Management)",
  founded: 1978,
  period: "Q3 2026",
  channelLabel: "All channels",
  tagline: "US hardware & garden retail · 218 stores · 14 metros",
  vocab: {},     // identity — no swaps
  headlines: {
    revenueActual: "$127M",   revenuePlan: "$138M",
    revenueVarPct: "−8%",     revenueVarDollars: "−$11M",
    marginActual: "11.3%",    marginTarget: "15.2%",
    marginVarBps: "−380bps",
    cashActual: "$41M",       cashVar: "+11% vs plan", cashTone: "good",
    npsActual: 38,            npsDelta: "−3 vs prior quarter",
  },
  sourceSystems: "14 systems · 312 feeds",
  analyst: "Katherine Boyd · Lead analyst",
};

// ───────────────────────────────────────────────────────────────────────────
// GUITAR CENTER — full re-skin. Token swaps + per-surface overrides.
// ───────────────────────────────────────────────────────────────────────────
export const GUITAR_CENTER: CompanyProfile = {
  id: "guitar-center",
  name: "Guitar Center",
  url: "guitarcenter.com",
  logoMonogram: "GC",
  logoEmoji: "🎸",
  sector: "Specialty music retail",
  hqCity: "Westlake Village", hqState: "CA",
  revenueBand: "$2.1B FY25",
  ownership: "Private · Ares Management (post-2020 restructure)",
  founded: 1959,
  period: "Q3 2026",
  channelLabel: "Retail + e-comm + Pro Coverage",
  tagline: "Specialty music retail · 295 stores · Reverb · Music & Arts",
  vocab: {
    "Mercer Group":           "Guitar Center",
    "Mercer":                 "Guitar Center",
    "hardware & garden retail":"specialty music retail",
    "US retail":              "Music retail",
    "Home Depot":             "Sweetwater",
    "Lowe's":                 "Amazon Music Gear",
    "Ace Hardware":           "Reverb (in-house)",
    "Tractor Supply":         "Sam Ash legacy buyers",
    "Ace":                    "Reverb",
    "cordless tools":         "electric guitars",
    "cordless drills":        "Stratocaster-class guitars",
    "cordless":               "premium-tier",
    "DIY":                    "consumer electric",
    "Home Improvement":       "Recording & live sound",
    "Phoenix DC":             "Kansas City DC",
    "Phoenix metro":          "Inland Empire metro",
    "Phoenix":                "Inland Empire",
    "Dallas":                 "Nashville",
    "Supplier B":             "Fender allocation",
    "Supplier C":             "PRS Guitars",
    "Garden":                 "Lessons & rentals",
    "garden":                 "lessons & rentals",
    "Kelly Services":         "Express Employment Pros",
    "Head of Pricing":        "Director of Pricing",
    "Pricing committee":      "Margin council",
    "trade accounts":         "Pro Coverage accounts",
    "trade segment":          "Pro Coverage segment",
    "Trade EPOS":             "Pro Coverage EPOS",
    "Trade marketing":        "Pro Coverage marketing",
    "Trade portal":           "Pro Coverage portal",
    "Greater Plains Co.":     "Memphis Performing Arts Cooperative",
    "J. Mendoza (DC Ops)":    "L. Okafor (DC Ops)",
    "M. Tanaka (Demand Planning)": "R. Beaumont (Demand Planning)",
    "Numerator":              "MI SalesTrak",
    "Circana":                "NAMM Insights",
    "Brandwatch":             "Sprout Social",
  },
  headlines: {
    revenueActual: "$498M",   revenuePlan: "$542M",
    revenueVarPct: "−8%",     revenueVarDollars: "−$44M",
    marginActual: "8.4%",     marginTarget: "12.2%",
    marginVarBps: "−380bps",
    cashActual: "$112M",      cashVar: "−6% vs plan", cashTone: "warn",
    npsActual: 31,            npsDelta: "−4 vs prior quarter",
  },
  executiveRead:
    "Q3 closed eight percent behind plan and three hundred and eighty basis points behind margin target. The variance is not diffuse: three layers — Demand, Pricing, and Supply — account for almost the entire gap. Sweetwater's pro-segment promo intensity in the Southeast pulled mid-tier electric volume out of our stores. Cash held only because working capital tightened. Of the three, Pricing is the fastest reversible lever this quarter.",
  pullQuote:
    "Sixty-two percent of the revenue gap traces to Demand, sixty-eight percent of the EBITDA gap traces to Pricing, and the system is ninety-six percent confident those are the right two levers.",
  topFindings: {
    "business-performance": {
      finding: "Q3 closed 8% behind revenue plan and 380bps behind margin target. Cash held only because working capital tightened.",
      impact: "−$44M revenue · −380bps margin",
      lever: "Pricing is the fastest reversible lever.",
    },
    "demand-intelligence": {
      finding: "$11.4M variance concentrated in mid-tier electric guitars and recording-gear cross-sell. Three causes: Sweetwater promo, Inland Empire/Nashville stockouts, forecast drift on the back-to-school window.",
      impact: "−$11.4M Q3 · $6.2M predicted recovery",
    },
    "competitive-intelligence": {
      finding: "Sweetwater ran free-shipping + 0% APR across mid-tier electric for 16 weeks in five SE markets. Mid-tier electric share fell 3.2pp YoY; pro-segment win rate fell from 44% to 28%.",
      impact: "−3.2pp share · −16pp win rate",
    },
    "pricing-margin": {
      finding: "Margin compressed 240bps as match-not-beat policy on 32 top electric SKUs deepened. Volume preserved at the cost of margin.",
      impact: "−240bps · $5.2M recoverable in Q4",
    },
    "supply-chain": {
      finding: "Inland Empire + Nashville 36 OOS days on top 5 electric SKUs in weeks 30–34. Labour shortfall projected next week — 9 unfilled DC shifts at Kansas City.",
      impact: "−$3.9M variance · throughput risk",
    },
    "customer-intelligence": {
      finding: "NPS down to 31 (from 35); detractor cluster localised to Inland Empire metro. Order-ETA service calls +52% DoD.",
      impact: "−4 NPS · 18 Pro Coverage accounts at risk",
    },
    "finance": {
      finding: "EBITDA closed $26.4M below plan. Bridge: $16.8M margin, $6.5M opex (lesson room utilisation), $3.1M working capital.",
      impact: "−$26.4M EBITDA",
    },
    "receivables": {
      finding: "DSO at 51d (vs 38d target). $4.2M >60d. Memphis Performing Arts Cooperative 52d overdue ($340K) — credit hold recommended.",
      impact: "$4.2M >60d · 3 holds recommended",
    },
    "people-operations": {
      finding: "DC Operations attrition annualised at 28% (vs 14% target) — second consecutive week. 22 critical roles open.",
      impact: "+14pp attrition · 22 critical open",
    },
    "talent-hr": {
      finding: "Senior buyer role 79d open, blocking the electric category reset. Offer-to-accept stage is the funnel bottleneck (comp gap 11%).",
      impact: "4 critical roles >70d open",
    },
    "brand-social": {
      finding: "Sentiment fell 8pts on emerging 'lesson program quality' narrative — 22 negative mentions/6h, Inland Empire cluster.",
      impact: "−8pts sentiment · cluster forming",
    },
    "sales-pipeline": {
      finding: "Pro Coverage win rate halved YoY (12% from 24%); cycle days +18d. Q4 coverage at 2.1× vs 3.0× target.",
      impact: "Q4 commit at risk · $7.8M slip",
    },
    "marketing-performance": {
      finding: "Email at 9.1× ROAS, Brand and Display under 1.8×. Reallocating $80K Brand→Email lifts Q4 ROAS to a modelled 3.6×.",
      impact: "Reallocation +$80K · +1.2× ROAS",
    },
  },
  rootCauses: [
    { n: 1, title: "Sweetwater free-shipping + 0% APR campaign",          impact: "−$24.8M",
      body: "Sweetwater ran sustained free-shipping plus 0% APR financing across mid-tier electric guitars for 16 consecutive weeks in five SE markets. MI SalesTrak panel confirms the cross-shop pattern; Guitar Center's match-not-beat policy locked us into matching the financing depth without matching the brand pull. The cohort that hurt most: the 32 top Stratocaster-class SKUs where mid-tier elasticity is highest." } as any,
    { n: 2, title: "Compound supply disruption — Fender + Kansas City DC", impact: "−$13.6M",
      body: "Fender's allocation team de-prioritised our Q3 mid-tier orders coincident with a Kansas City DC labour shortfall. Top-5 electric SKUs accumulated 36 OOS days in weeks 30–34 across Inland Empire and Nashville. Inventory did not partially offset the demand softness — it amplified it. Two simultaneous constraints, not one." } as any,
    { n: 3, title: "Margin defence via promotional matching",             impact: "−$5.6M",
      body: "Margin compressed 240bps as the match policy was applied reflexively against Sweetwater's 0% APR. Volume held; margin paid for it. This is the most reversible of the three causes — a single policy change closes the gap in three trading weeks." } as any,
  ].map(({ title, impact, body }) => ({ title, impact, body })),
  recoveryLevers: [
    { title: "Cap the electric-guitar promo match at 20% APR-equivalent",
      horizon: "This week", recovery: "$5.2M annualised", owner: "Director of Pricing",
      body: "Currently matching Sweetwater's 0% APR exactly (≈28% APR-equivalent depth). A 20% cap restores 4pp gross margin on the 32 SKUs driving the slip. Reversible inside 5 trading days." },
    { title: "Fill the 9 unfilled Kansas City DC shifts",
      horizon: "This week", recovery: "$3.4M variance", owner: "DC Operations",
      body: "Use the existing Express Employment MSA. 9 shifts × $38/hr fully loaded ≈ $14K weekly cost vs ≈$95K weekly throughput risk. Net-positive on day one." },
    { title: "Launch the SE-only mid-tier electric counter-promo",
      horizon: "Monday, 14 days", recovery: "$6.2M Q4", owner: "Pro Coverage marketing",
      body: "Targeted to Inland Empire/Nashville/Atlanta where Sweetwater is overweighted. Bounded to the 32 share-loss SKUs. Hard exit at day 14. Dependent on Pricing layer's margin floor sign-off (≥18% gross)." },
  ],
  combinedRecovery: "$22.4M Q4",
  recoveryConfidence: "Confidence 86% on the first $12M, 61% on the rest.",
  sourceSystems: "16 systems · 287 feeds",
  analyst: "Katherine Boyd · Lead analyst",
};

// ───────────────────────────────────────────────────────────────────────────
// SWEETGREEN — second hand-crafted profile, very different sector.
// ───────────────────────────────────────────────────────────────────────────
export const SWEETGREEN: CompanyProfile = {
  id: "sweetgreen",
  name: "Sweetgreen",
  url: "sweetgreen.com",
  logoMonogram: "SG",
  logoEmoji: "🥗",
  sector: "Fast-casual restaurant",
  hqCity: "Los Angeles", hqState: "CA",
  revenueBand: "$695M FY25",
  ownership: "Public · NYSE: SG",
  founded: 2007,
  period: "Q3 2026",
  channelLabel: "Restaurants + digital + outpost",
  tagline: "Fast-casual healthy bowls · 248 locations · digital-first",
  vocab: {
    "Mercer Group":           "Sweetgreen",
    "Mercer":                 "Sweetgreen",
    "hardware & garden retail":"fast-casual restaurant",
    "US retail":              "Restaurant operations",
    "Home Depot":             "Cava",
    "Lowe's":                 "Chipotle",
    "Ace Hardware":           "Just Salad",
    "Tractor Supply":         "Fresh&Co",
    "Ace":                    "Just Salad",
    "cordless tools":         "warm bowls",
    "cordless drills":        "harvest bowls",
    "cordless":               "premium-bowl",
    "DIY":                    "core menu",
    "Home Improvement":       "Catering & Outpost",
    "Phoenix DC":             "Austin commissary",
    "Phoenix metro":          "Austin metro",
    "Phoenix":                "Austin",
    "Dallas":                 "Houston",
    "Supplier B":             "Sumas Mountain Farms",
    "Supplier C":             "Lakeside Organics",
    "Garden":                 "Seasonal menu",
    "garden":                 "seasonal menu",
    "Kelly Services":         "Snagajob shift fill",
    "Head of Pricing":        "VP Pricing & Revenue",
    "Pricing committee":      "Menu-economics council",
    "trade accounts":         "Outpost catering accounts",
    "trade segment":          "Outpost segment",
    "Trade EPOS":             "Outpost POS",
    "Trade marketing":        "Outpost marketing",
    "Trade portal":           "Outpost portal",
    "Greater Plains Co.":     "Wells Fargo Catering",
    "J. Mendoza (DC Ops)":    "P. Aoki (Commissary Ops)",
    "M. Tanaka (Demand Planning)": "K. Patel (Demand Planning)",
    "Numerator":              "Black Box Intelligence",
    "Circana":                "Technomic",
    "stockout":               "86'd item",
    "stockouts":              "86'd items",
    "OOS":                    "86'd",
    "SKU":                    "menu item",
    "SKUs":                   "menu items",
  },
  headlines: {
    revenueActual: "$163M",   revenuePlan: "$179M",
    revenueVarPct: "−9%",     revenueVarDollars: "−$16M",
    marginActual: "13.8%",    marginTarget: "17.4%",
    marginVarBps: "−360bps",
    cashActual: "$84M",       cashVar: "+4% vs plan", cashTone: "good",
    npsActual: 42,            npsDelta: "−3 vs prior quarter",
  },
  executiveRead:
    "Q3 closed nine percent behind plan and three hundred and sixty basis points behind margin target. The variance is not diffuse: three layers — Demand, Supply, and Pricing — account for almost the entire gap. Cava's protein-bowl launch pulled lunch traffic in Austin and Houston while a romaine-supply gap from Sumas Mountain Farms created twenty-two days of 86'd seasonal items. Cash held only because we tightened working capital. Of the three, Pricing is the fastest reversible lever this quarter.",
  pullQuote:
    "Fifty-eight percent of the revenue gap traces to Demand, seventy-one percent of the four-wall margin gap traces to Pricing, and the system is ninety-five percent confident those are the right two levers.",
  topFindings: {
    "business-performance": {
      finding: "Q3 closed 9% behind revenue plan and 360bps behind four-wall margin target. Same-store sales down 2.8pp.",
      impact: "−$16M revenue · −360bps margin",
      lever: "Menu-economics reset is the fastest reversible lever.",
    },
    "demand-intelligence": {
      finding: "$9.2M variance concentrated in warm bowls and seasonal menu items. Three causes: Cava protein-bowl launch, Austin/Houston 86'd items, forecast drift on the back-to-office lunch window.",
      impact: "−$9.2M Q3 · $4.8M predicted recovery",
    },
    "competitive-intelligence": {
      finding: "Cava ran a sustained 2.1× protein-bowl marketing push in Austin and Houston. Lunch occasion share fell 3.4pp YoY; weekday lunch traffic fell from 1.42× to 1.08×.",
      impact: "−3.4pp share · −0.34× traffic ratio",
    },
    "pricing-margin": {
      finding: "Four-wall margin compressed 240bps as protein-add modifier price increases were held back while ingredient cost rose 6.1%. Volume held; margin paid for it.",
      impact: "−240bps · $2.4M recoverable in Q4",
    },
    "supply-chain": {
      finding: "Austin commissary + Houston commissary: 22 days of 86'd items on top-5 seasonal SKUs in weeks 30–34. Labour shortfall projected next week — 14 unfilled commissary shifts.",
      impact: "−$2.1M variance · throughput risk",
    },
    "customer-intelligence": {
      finding: "NPS down to 42 (from 45); detractor cluster localised to Austin metro. Order-accuracy complaints +38% week-over-week.",
      impact: "−3 NPS · 9 Outpost accounts at risk",
    },
    "finance": {
      finding: "EBITDA closed $11.8M below plan. Bridge: $7.4M four-wall margin, $2.8M G&A, $1.6M working capital.",
      impact: "−$11.8M EBITDA",
    },
    "receivables": {
      finding: "Outpost catering DSO at 41d (vs 28d target). $1.4M >60d. Wells Fargo Catering 38d overdue ($210K) — credit hold recommended.",
      impact: "$1.4M >60d · 4 holds recommended",
    },
    "people-operations": {
      finding: "Commissary attrition annualised at 31% (vs 18% target) — second consecutive week. 19 critical roles open.",
      impact: "+13pp attrition · 19 critical open",
    },
    "talent-hr": {
      finding: "Director of culinary innovation role 92d open, blocking the seasonal menu refresh. Offer-to-accept stage is the funnel bottleneck (comp gap 9%).",
      impact: "3 critical roles >80d open",
    },
    "brand-social": {
      finding: "Sentiment fell 5pts on emerging 'shrinkflation' narrative — 19 negative mentions/6h, Austin cluster.",
      impact: "−5pts sentiment · cluster forming",
    },
    "sales-pipeline": {
      finding: "Outpost catering win rate halved YoY (16% from 28%); cycle days +9d. Q4 coverage at 2.2× vs 3.0× target.",
      impact: "Q4 commit at risk · $2.4M slip",
    },
    "marketing-performance": {
      finding: "App-push at 11.2× ROAS, Brand and OOH under 1.4×. Reallocating $60K Brand→App-push lifts Q4 ROAS to a modelled 3.8×.",
      impact: "Reallocation +$60K · +1.4× ROAS",
    },
  },
  rootCauses: [
    { title: "Cava protein-bowl marketing intensity",                       impact: "−$8.4M",
      body: "Cava ran a sustained 2.1× baseline marketing push on its protein-bowl line for the last 11 weeks of Q3 in Austin and Houston. Black Box Intelligence panel confirms the lunch-occasion shift; Sweetgreen's value-perception index in those metros softened 4pts. The cohort that hurt most: the 18 top warm-bowl items where lunch occasion is most price-elastic." },
    { title: "Compound supply disruption — Sumas + Austin commissary",      impact: "−$4.6M",
      body: "Sumas Mountain Farms' romaine harvest came in 22% short of contracted volume coincident with an Austin commissary labour shortfall. Top-5 seasonal items accumulated 22 days of 86'd-status in weeks 30–34 across Austin and Houston. Throughput did not partially offset the demand softness — it amplified it. Two simultaneous constraints, not one." },
    { title: "Menu-economics under-pricing on protein modifiers",           impact: "−$2.8M",
      body: "Four-wall margin compressed 240bps as the team held back protein-modifier price increases while ingredient cost rose 6.1%. Same-store traffic held; margin paid for it. This is the most reversible of the three causes — a modifier price uplift closes the gap in two trading weeks." },
  ],
  recoveryLevers: [
    { title: "Lift protein-modifier prices by $0.50 on the top-12 items",
      horizon: "This week", recovery: "$2.4M annualised", owner: "VP Pricing & Revenue",
      body: "Currently absorbing the full ingredient-cost rise on modifiers. Lifting the modifier price by $0.50 (≈4% of average ticket) restores 3pp four-wall margin on the 12 protein-heavy items. Elasticity testing in Q2 showed <1% traffic impact. Reversible inside 5 trading days." },
    { title: "Fill the 14 unfilled Austin commissary shifts",
      horizon: "This week", recovery: "$1.8M variance", owner: "Commissary operations",
      body: "Use the existing Snagajob shift-fill platform. 14 shifts × $24/hr fully loaded ≈ $5.8K weekly cost vs ≈$48K weekly throughput risk. Net-positive on day one." },
    { title: "Launch the Austin/Houston counter-campaign on warm bowls",
      horizon: "Monday, 14 days", recovery: "$4.8M Q4", owner: "Outpost marketing",
      body: "App-push + in-store signage targeted to Austin/Houston where Cava is overweighted. Bounded to the 18 warm-bowl items. Hard exit at day 14. Dependent on Pricing layer's margin-floor sign-off (≥14% four-wall)." },
  ],
  combinedRecovery: "$9.0M Q4",
  recoveryConfidence: "Confidence 88% on the first $5M, 64% on the rest.",
  sourceSystems: "12 systems · 248 feeds",
  analyst: "Katherine Boyd · Lead analyst",
};

export const LIBRARY: CompanyProfile[] = [MERCER, GUITAR_CENTER, SWEETGREEN];

export const DEFAULT_PROFILE_ID = MERCER.id;

// ───────────────────────────────────────────────────────────────────────────
// resolve() — apply a profile's vocab swaps to a hardcoded string.
// Identity for the Mercer profile (empty vocab). Longest-key-first to avoid
// partial-overlap collisions (e.g. "Phoenix DC" must match before "Phoenix").
// ───────────────────────────────────────────────────────────────────────────
export function makeResolver(profile: CompanyProfile): (text: string) => string {
  const entries = Object.entries(profile.vocab).sort((a, b) => b[0].length - a[0].length);
  if (entries.length === 0) return (t: string) => t;
  return (text: string) => {
    let out = text;
    for (const [from, to] of entries) {
      // word-boundary safe-ish: only replace when the match is not adjacent to a word char.
      // Use a literal replace for performance and to avoid regex escaping fragility.
      // We do a simple loop with indexOf + boundary check.
      const lower = out.toLowerCase();
      const needle = from.toLowerCase();
      let from_i = 0;
      let acc = "";
      while (true) {
        const idx = lower.indexOf(needle, from_i);
        if (idx === -1) { acc += out.slice(from_i); break; }
        const before = idx === 0 ? "" : out[idx - 1];
        const after  = idx + needle.length >= out.length ? "" : out[idx + needle.length];
        const isWord = (c: string) => /[A-Za-z0-9]/.test(c);
        // require non-word boundary on both sides (or string edge) to count as a match
        const ok = !isWord(before) && !isWord(after);
        acc += out.slice(from_i, idx);
        if (ok) {
          acc += matchCase(out.slice(idx, idx + needle.length), to);
          from_i = idx + needle.length;
        } else {
          acc += out.slice(idx, idx + 1);
          from_i = idx + 1;
        }
      }
      out = acc;
    }
    return out;
  };
}

// Preserve the casing of the matched span (Title, UPPER, lower).
function matchCase(matched: string, replacement: string): string {
  if (matched === matched.toUpperCase() && matched.length > 1) return replacement.toUpperCase();
  if (matched[0] === matched[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}
