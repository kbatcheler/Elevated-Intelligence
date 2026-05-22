import { X, Printer, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useNarrative, useCompany } from "../context/CompanyContext";
import { useApp } from "../context/AppContext";

// ----- "What changed since yesterday" deltas ---------------------------------
// Deterministic-per-company deltas to put a daily-pulse ribbon at the top of
// the brief. Reseed the same company → same deltas; switch companies → a
// different set. This makes the synthetic refresh cadence feel like a feature
// ("Different Day"), not a static mock.

// Fast non-crypto string hash (FNV-1a 32-bit). Stable across reloads.
function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
// Mulberry32 — small, fast, well-distributed seeded PRNG. We don't need
// cryptographic strength; we need "same input → same sequence" for stability.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Delta { trend: "up" | "down" | "watch"; text: string; }

// Each template is a function of a seeded RNG so numbers vary per company
// but stay stable for the same company. Templates use generic vocabulary
// (margin, pipeline, sentiment) that fits any seeded operating shape.
const DELTA_TEMPLATES: Array<(rng: () => number) => Delta> = [
  rng => ({ trend: "down",  text: `Margin gap widened ${15 + Math.floor(rng() * 35)}bps overnight — Pricing thesis strengthens.` }),
  rng => ({ trend: "up",    text: `Pipeline coverage ticked up to ${(2.5 + rng() * 0.8).toFixed(1)}× from ${(2.2 + rng() * 0.3).toFixed(1)}× yesterday.` }),
  rng => ({ trend: "watch", text: `Two new anomalies surfaced in Demand · variance now concentrated in ${3 + Math.floor(rng() * 5)} SKU families.` }),
  rng => ({ trend: "up",    text: `Sentiment recovered ${1 + Math.floor(rng() * 4)} points in the regional cluster after support team intervention.` }),
  rng => ({ trend: "down",  text: `DSO drifted ${1 + Math.floor(rng() * 3)}d further from target — ${1 + Math.floor(rng() * 3)} new credit holds recommended.` }),
  rng => ({ trend: "watch", text: `${4 + Math.floor(rng() * 6)} new evidence cards attached to the Pricing thesis · confidence band tightened.` }),
  rng => ({ trend: "up",    text: `Win rate ticked up ${1 + Math.floor(rng() * 3)}pp on the SMB segment overnight.` }),
  rng => ({ trend: "down",  text: `Attrition signal in DC Operations spiked ${2 + Math.floor(rng() * 4)}pp — third consecutive day above target.` }),
  rng => ({ trend: "watch", text: `Competitor promotional depth widened in ${2 + Math.floor(rng() * 3)} markets — Pricing layer requires review.` }),
  rng => ({ trend: "up",    text: `Working capital lockup released $${(0.4 + rng() * 0.8).toFixed(1)}M from receivables · cash position improved.` }),
];

function deriveDeltas(companyName: string): Delta[] {
  const rng = mulberry32(hash32(companyName));
  // Knuth shuffle a copy of the index array, take the first 3.
  const ix = DELTA_TEMPLATES.map((_, i) => i);
  for (let i = ix.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [ix[i], ix[j]] = [ix[j], ix[i]];
  }
  // Each template call advances rng, so its internal numbers are also seeded.
  return ix.slice(0, 3).map(i => DELTA_TEMPLATES[i](rng));
}

// Composed top-finding-per-layer brief. Hard-coded copy because this is a
// curated editorial product, not an auto-summary of the layer data.

interface BriefItem {
  layer: string;
  finding: string;
  impact: string;
  lever?: string;
}

const TOP_FINDINGS: BriefItem[] = [
  { layer: "business-performance",     finding: "Q3 closed 8% behind revenue plan and 380bps behind margin target. Cash held only because working capital tightened.", impact: "−$11M revenue · −380bps margin", lever: "Pricing is the fastest reversible lever." },
  { layer: "demand-intelligence",      finding: "$2.8M variance concentrated in DIY and Home Improvement. Three causes: competitor promo, Dallas/Phoenix stockouts, forecast drift.", impact: "−$2.8M Q3 · $1.45M predicted recovery" },
  { layer: "competitive-intelligence", finding: "Home Depot ran promo at 1.8× baseline depth in five SE markets. Market share fell 2.1pp YoY; win rate fell from 41% to 32%.", impact: "−2.1pp share · −9pp win rate" },
  { layer: "pricing-margin",           finding: "Margin compressed 240bps as match-not-beat policy on 24 top SKUs deepened. Volume preserved at the cost of margin.", impact: "−240bps · $1.2M recoverable in Q4" },
  { layer: "supply-chain",             finding: "Dallas + Phoenix 41 OOS days on top 5 SKUs in weeks 30–34. Labour shortfall projected next week — 11 unfilled DC shifts.", impact: "−$0.9M variance · throughput risk" },
  { layer: "customer-intelligence",    finding: "NPS down to 38 (from 41); detractor cluster localised to Phoenix metro. Order-ETA service calls +42% DoD.", impact: "−3 NPS · 12 named accounts at risk" },
  { layer: "finance",                  finding: "EBITDA closed $6.5M below plan. Bridge: $4.2M margin, $1.6M opex, $0.7M working capital.", impact: "−$6.5M EBITDA" },
  { layer: "receivables",              finding: "DSO at 47d (vs 32d target). $1.8M >60d. Greater Plains Co. 47d overdue ($420K) — credit hold recommended.", impact: "$1.8M >60d · 3 holds recommended" },
  { layer: "people-operations",        finding: "DC Operations attrition annualised at 24% (vs 12% target) — second consecutive week. 34 critical roles open.", impact: "+12pp attrition · 34 critical open" },
  { layer: "talent-hr",                finding: "Senior buyer role 84d open, blocking pricing reset. Offer-to-accept stage is the funnel bottleneck (comp gap 12%).", impact: "5 critical roles >80d open" },
  { layer: "brand-social",             finding: "Sentiment fell 6pts on emerging 'price gouging' narrative — 14 negative mentions/6h, regional cluster.", impact: "−6pts sentiment · cluster forming" },
  { layer: "sales-pipeline",           finding: "Win rate halved YoY (14% from 21%); cycle days +13d. Q4 coverage at 2.4× vs 3.1× target.", impact: "Q4 commit at risk · $2.1M slip" },
  { layer: "marketing-performance",    finding: "Email at 8.25× ROAS, Brand and Display under 2.0×. Reallocating $50K Brand→Email lifts Q4 ROAS to a modelled 3.4×.", impact: "Reallocation +$50K · +1.0× ROAS" },
];

export default function MorningBrief() {
  const { closeBrief } = useApp();
  const { profile, resolve } = useCompany();
  const { LAYERS } = useNarrative();
  const today = "Tuesday, 14 October 2026 · 06:42 CT";
  const layerByKey = Object.fromEntries(LAYERS.map(l => [l.key, l]));
  // Merge: profile overrides take precedence, falling back to the default Mercer copy.
  const mergedFindings = TOP_FINDINGS.map(f => ({ ...f, ...(profile.topFindings?.[f.layer] ?? {}) }));
  // Deterministic per-company deltas for the "Since yesterday" ribbon.
  const deltas = deriveDeltas(profile.name);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "rgba(15,26,51,0.55)" }} onClick={closeBrief}>
      {/* Toolbar */}
      <div className="h-[44px] shrink-0 flex items-center justify-between px-6 border-b border-[var(--navy-deep)]"
           style={{ background: "var(--navy)", color: "var(--cream)" }}
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="eyebrow text-[var(--gold-light)]">Morning brief</span>
          <span className="font-sans text-[12px] opacity-70">Print-ready · CEO read</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="flex items-center gap-2 text-[12px] hover:text-white opacity-80">
            <Printer size={14} strokeWidth={1.5} /> Print
          </button>
          <button onClick={closeBrief} className="text-[var(--gold-light)] hover:text-white">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Page */}
      <div className="flex-1 overflow-y-auto scroll-area py-10" onClick={(e) => e.stopPropagation()}>
        <article className="mx-auto w-[820px] max-w-[92vw] shadow-lg" style={{ background: "var(--paper)", border: "1px solid var(--cream-dark)" }}>
          <div className="px-14 py-12">
            {/* Masthead */}
            <header className="border-b-2 border-[var(--navy)] pb-5 mb-7">
              <div className="flex items-baseline justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: "var(--gold)" }} />
                  <span className="font-serif text-[20px] font-semibold text-[var(--navy)] tracking-tight">Different Day</span>
                  <span className="eyebrow text-[var(--gold)]">ELEVATED INTELLIGENCE</span>
                </div>
                <span className="font-sans text-[11px] text-[var(--slate)] tabular-nums">{today}</span>
              </div>
              <h1 className="font-serif text-[44px] leading-[1.02] text-[var(--navy)] font-semibold mt-5">The morning brief</h1>
              <p className="font-serif italic text-[18px] text-[var(--slate)] mt-1">
                {profile.name} · {profile.period} close-out · the one page the executive committee needs before 7am.
              </p>
            </header>

            {/* "What changed since yesterday" ribbon — leans into the
                 product's name. Deterministic per company; same company on
                 re-open shows the same deltas. */}
            <section className="mb-7 px-4 py-3 rounded-sm"
                     style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)", borderLeft: "3px solid var(--gold)" }}>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="eyebrow text-[var(--gold)]">Since yesterday</span>
                <span className="font-serif italic text-[12px] text-[var(--slate-light)]">overnight signal pulse · 3 of {DELTA_TEMPLATES.length} deltas surfaced</span>
              </div>
              <ul className="space-y-1.5">
                {deltas.map((d, i) => {
                  const Icon = d.trend === "up" ? TrendingUp : d.trend === "down" ? TrendingDown : AlertCircle;
                  const color = d.trend === "up" ? "var(--teal)" : d.trend === "down" ? "var(--coral)" : "var(--gold)";
                  return (
                    <li key={i} className="flex items-start gap-2.5 font-sans text-[13px] text-[var(--ink)] leading-snug">
                      <Icon size={13} strokeWidth={2} className="shrink-0 mt-[3px]" style={{ color }} />
                      <span>{d.text}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Lede */}
            <section className="mb-7">
              <p className="font-serif text-[20px] leading-[1.55] text-[var(--ink)] first-letter:font-serif first-letter:text-[64px] first-letter:font-semibold first-letter:float-left first-letter:leading-[0.85] first-letter:mr-2 first-letter:mt-1 first-letter:text-[var(--coral)]">
                {profile.executiveRead ?? resolve("Q3 closed eight percent behind plan and three hundred and eighty basis points behind margin target. The variance is not diffuse: three layers — Demand, Pricing, and Supply — account for almost the entire gap. Cash held only because working capital tightened. Of the three, Pricing is the fastest reversible lever this quarter.")}
              </p>
            </section>

            {/* Pull-quote */}
            <section className="my-7 py-5 border-y border-[var(--cream-dark)]">
              <blockquote className="font-serif italic text-[24px] leading-[1.35] text-[var(--navy)] text-center">
                "{profile.pullQuote ?? "Sixty percent of the revenue gap traces to Demand, sixty-five percent of the EBITDA gap traces to Pricing, and the system is ninety-seven percent confident those are the right two levers."}"
              </blockquote>
            </section>

            {/* Layered findings */}
            <section>
              <div className="eyebrow text-[var(--coral)] mb-3">Layer-by-layer findings</div>
              <div className="space-y-5">
                {mergedFindings.map((f, i) => {
                  const l = layerByKey[f.layer];
                  if (!l) return null;
                  return (
                    <div key={f.layer} className="grid grid-cols-12 gap-4 pb-5 border-b border-[var(--cream-dark)] last:border-0">
                      <div className="col-span-1">
                        <span className="font-serif text-[28px] font-semibold text-[var(--gold)] tabular-nums leading-none">
                          {(i + 1).toString().padStart(2, "0")}
                        </span>
                      </div>
                      <div className="col-span-7">
                        <div className="eyebrow text-[var(--slate-light)] mb-0.5">{l.group}</div>
                        <div className="font-serif text-[16px] font-semibold text-[var(--navy)] leading-tight mb-1">{l.title}</div>
                        <p className="font-serif text-[14px] leading-[1.55] text-[var(--ink)]">{resolve(f.finding)}</p>
                        {f.lever && (
                          <p className="font-serif italic text-[13px] text-[var(--coral)] mt-1">{resolve(f.lever)}</p>
                        )}
                      </div>
                      <div className="col-span-4 pl-3 border-l border-[var(--cream-dark)]">
                        <div className="eyebrow text-[var(--slate-light)] mb-1">Impact</div>
                        <div className="font-sans font-bold text-[13px] text-[var(--coral)] tabular-nums leading-snug">{resolve(f.impact)}</div>
                        <div className="eyebrow text-[var(--slate-light)] mt-3 mb-1">Confidence</div>
                        <div className="font-sans font-bold text-[15px] text-[var(--navy)] tabular-nums">{l.confidence}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Sign-off */}
            <footer className="mt-10 pt-5 border-t-2 border-[var(--navy)] flex items-center justify-between">
              <div>
                <div className="eyebrow text-[var(--slate-light)] mb-1">Issued by</div>
                <div className="font-sans text-[13px] text-[var(--navy)] font-semibold">Different Day · Intelligence stack</div>
                <div className="font-sans italic text-[11px] text-[var(--slate)] mt-0.5">{profile.sourceSystems} · 84% combined confidence</div>
              </div>
              <div className="text-right">
                <div className="eyebrow text-[var(--slate-light)] mb-1">Next brief</div>
                <div className="font-sans text-[13px] text-[var(--navy)] font-semibold">Wednesday, 15 October · 06:42 CT</div>
              </div>
            </footer>
          </div>
        </article>
      </div>
    </div>
  );
}
