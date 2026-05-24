import type { LayerData } from "../../data/layers";
import {
  TrendingDown, TrendingUp, Minus, ArrowUp, ArrowDown,
  Users2, Wrench, Sparkles, Briefcase, ShoppingCart,
  Search, Mail, Smartphone, Tv, Handshake, Megaphone,
} from "lucide-react";
import Sparkline, { makeSeries } from "../Sparkline";
import AnimatedNumber from "../AnimatedNumber";
import { useCompany, useSwap, useDataset, useIsDefaultProfile } from "../../context/CompanyContext";

type HeroProps = { layer: LayerData };

const toneFg = (t: string) =>
  t === "bad"  ? "var(--coral)"
  : t === "warn" ? "var(--amber)"
  : t === "good" ? "var(--teal)"
                 : "var(--navy)";
const toneBg = (t: string) =>
  t === "bad"  ? "var(--coral-faint)"
  : t === "warn" ? "var(--amber-faint)"
  : t === "good" ? "var(--teal-faint)"
                 : "var(--cream-dark)";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Business performance, Executive scorecard, 2×2 status quadrants
// ─────────────────────────────────────────────────────────────────────────────

export function BusinessPerformanceHero({ layer }: HeroProps) {
  const seedBase = layer.key.charCodeAt(0);
  const isDefault = useIsDefaultProfile();
  return (
    <div className="card card-accent-coral !p-0 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--cream-dark)]"
           style={{ background: "var(--cream-dark)" }}>
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--coral)" }} />
          <span className="eyebrow text-[var(--coral)]">EXECUTIVE SCORECARD</span>
          <span className="font-sans text-[12px] text-[var(--slate)]">Q3 2026 · 14 sources</span>
        </div>
        {/* These three pills carry Meridian Industrial-specific scorecard numbers (8%
            behind plan, 380bps margin gap, Cash +$3.8M). For non-default
            profiles we suppress them, the per-metric "% vs plan" tags below
            are derived from each metric's tone and remain valid. */}
        {isDefault && (
          <div className="flex items-center gap-2">
            <span className="pill pill-coral">8% behind plan</span>
            <span className="pill pill-amber">380bps margin gap</span>
            <span className="pill pill-teal">Cash +$3.8M</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2">
        {layer.metrics.map((m, i) => {
          const isRight  = i % 2 === 1;
          const isBottom = i >= 2;
          const PLAN_PCT_BY_METRIC: Record<string, number> = {
            "Revenue": 92, "Operating margin": 75, "Cash position": 111, "Customer NPS": 93,
          };
          const planPct = PLAN_PCT_BY_METRIC[m.label] ?? 100;
          return (
            <div key={i}
                 className="p-6 relative"
                 style={{
                   borderLeft:   isRight  ? "1px solid var(--cream-dark)" : undefined,
                   borderTop:    isBottom ? "1px solid var(--cream-dark)" : undefined,
                 }}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="eyebrow text-[var(--slate-light)]">{m.label}</div>
                  <div className="font-sans italic text-[11px] text-[var(--slate-light)] mt-0.5">{m.sub}</div>
                </div>
                <span className="tag" style={{ background: toneBg(m.tone), color: toneFg(m.tone) }}>
                  {m.tone === "bad" ? <TrendingDown size={10} strokeWidth={2} className="inline mr-1" />
                   : m.tone === "good" ? <TrendingUp size={10} strokeWidth={2} className="inline mr-1" />
                   : <Minus size={10} strokeWidth={2} className="inline mr-1" />}
                  {planPct}% vs plan
                </span>
              </div>
              <div className="flex items-end gap-4 mt-3">
                <div className="font-sans font-semibold tabular-nums" style={{ fontSize: 44, lineHeight: 1, color: toneFg(m.tone) }}>
                  <AnimatedNumber value={m.value} />
                </div>
                <Sparkline data={makeSeries(seedBase + i * 13, 16, m.tone === "bad" ? -0.6 : m.tone === "good" ? 0.4 : 0)}
                           color={toneFg(m.tone)} width={140} height={36} />
              </div>
              <div className="h-1.5 rounded-full mt-4 overflow-hidden relative" style={{ background: "var(--cream-dark)" }}>
                <div className="h-full" style={{ width: `${Math.min(planPct, 100)}%`, background: toneFg(m.tone) }} />
                {planPct < 100 && (
                  <div className="absolute top-0 h-full border-l border-dashed border-[var(--navy)]"
                       style={{ left: "100%" }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Demand intelligence, Variance hero + channel breakdown ribbon
// ─────────────────────────────────────────────────────────────────────────────

const CHANNELS_RAW = [
  { name: "DIY",            delta: -23, val: "-$1.4M" },
  { name: "Home improvement", delta: -18, val: "-$0.9M" },
  { name: "Garden + outdoor", delta: +4,  val: "+$0.2M" },
  { name: "Hardware",       delta: -6,  val: "-$0.4M" },
  { name: "Pro trade",      delta: -2,  val: "-$0.2M" },
  { name: "Power tools",    delta: -11, val: "-$0.5M" },
];

export function DemandIntelligenceHero({ layer }: HeroProps) {
  const CHANNELS = useDataset("CHANNELS", CHANNELS_RAW);
  const max = Math.max(...CHANNELS.map(c => Math.abs(c.delta)));
  return (
    <div className="card card-accent-coral !p-0 overflow-hidden">
      <div className="grid grid-cols-12">
        <div className="col-span-5 p-6 flex flex-col justify-center" style={{ background: "var(--coral-faint)" }}>
          <div className="eyebrow text-[var(--coral)] mb-2">Q3 VARIANCE VS PLAN</div>
          <div className="font-serif font-semibold tabular-nums" style={{ fontSize: 88, lineHeight: 0.95, color: "var(--coral)" }}>
            <AnimatedNumber value={layer.metrics[0].value} />
          </div>
          <div className="font-serif italic text-[15px] text-[var(--ink)] mt-3 leading-snug">
            12.4% below plan · concentrated in two channels carrying 60% of the gap
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--coral)] border-opacity-30">
            <div className="flex-1">
              <div className="eyebrow text-[var(--slate-light)]">Forecast acc</div>
              <div className="font-sans font-bold text-[18px] text-[var(--amber)] tabular-nums">71%</div>
            </div>
            <div className="flex-1">
              <div className="eyebrow text-[var(--slate-light)]">Stockout days</div>
              <div className="font-sans font-bold text-[18px] text-[var(--coral)] tabular-nums">41</div>
            </div>
            <div className="flex-1">
              <div className="eyebrow text-[var(--slate-light)]">Period actual</div>
              <div className="font-sans font-bold text-[18px] text-[var(--navy)] tabular-nums">$19.8M</div>
            </div>
          </div>
        </div>
        <div className="col-span-7 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-sans font-semibold text-[15px] text-[var(--navy)]">Variance by channel · USD millions</div>
            <span className="pill pill-amber">2 channels carry 60%</span>
          </div>
          <ul className="space-y-3">
            {CHANNELS.map(c => {
              const pct = (Math.abs(c.delta) / max) * 100;
              const isNeg = c.delta < 0;
              return (
                <li key={c.name} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-3 font-sans text-[12px] font-semibold text-[var(--navy)]">{c.name}</div>
                  <div className="col-span-7 relative h-5">
                    <div className="absolute top-1/2 left-1/2 h-full w-px bg-[var(--slate-light)] opacity-40" />
                    <div className="absolute top-0 h-full rounded-sm"
                         style={{
                           width: `${pct / 2}%`,
                           [isNeg ? "right" : "left"]: "50%",
                           background: isNeg ? "var(--coral)" : "var(--teal)",
                           opacity: 0.85,
                         } as React.CSSProperties} />
                  </div>
                  <div className="col-span-1 text-right font-sans font-bold text-[12px] tabular-nums"
                       style={{ color: isNeg ? "var(--coral)" : "var(--teal)" }}>
                    {c.delta > 0 ? "+" : ""}{c.delta}%
                  </div>
                  <div className="col-span-1 text-right font-sans text-[11px] text-[var(--slate)] tabular-nums">{c.val}</div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Competitive intelligence, Head-to-head scoreboard
// ─────────────────────────────────────────────────────────────────────────────

const RIVALS_RAW = [
  { name: "Home Depot",  share: 38.7, move: +1.4, depth: 18, color: "#F96302" },
  { name: "Lowe's",      share: 21.4, move: +0.6, depth: 14, color: "#004990" },
  { name: "Tractor Supply", share: 8.2, move: +0.3, depth: 9,  color: "#CC0000" },
  { name: "Ace Hardware", share: 6.4, move: -0.2, depth: 11, color: "#E03A3E" },
  { name: "Menards",     share: 5.8, move: -0.1, depth: 12, color: "#226BB6" },
];

export function CompetitiveIntelligenceHero({ layer: _layer }: HeroProps) {
  const RIVALS = useDataset("RIVALS", RIVALS_RAW);
  const { profile } = useCompany();
  // Primary rival = highest-share competitor in the dataset. Defensive fallback
  // ensures a custom profile with an empty RIVALS list doesn't crash the hero.
  const topRival = [...RIVALS].sort((a, b) => b.share - a.share)[0]
    ?? { name: "Top competitor", share: 30, move: 0, depth: 0, color: "#1B2A4E" };
  // Our share comes from the profile (defaults to 14.3 for the Meridian Industrial baseline)
  // so new profiles can declare their own market position without code edits.
  const ourShare = profile.marketSharePct ?? 14.3;
  const usWidth = Math.round((ourShare / (ourShare + topRival.share)) * 100);
  return (
    <div className="space-y-4">
      <div className="card card-accent-coral !p-0 overflow-hidden">
        <div className="px-6 py-3 border-b border-[var(--cream-dark)] flex items-center justify-between"
             style={{ background: "var(--navy)" }}>
          <span className="eyebrow text-white opacity-80">HEAD-TO-HEAD · Q3 2026</span>
          <span className="font-sans text-[11px] text-white opacity-70">9 sources · syndicated panel + scraped pricing</span>
        </div>
        <div className="grid grid-cols-12 items-stretch">
          <div className="col-span-3 p-6 text-center" style={{ background: "var(--cream-dark)" }}>
            <div className="font-sans font-bold text-[12px] text-[var(--navy)] tracking-wider uppercase truncate">{profile.name}</div>
            <div className="font-serif font-semibold tabular-nums mt-2" style={{ fontSize: 56, lineHeight: 1, color: "var(--coral)" }}>{ourShare}%</div>
            <div className="font-sans italic text-[11px] text-[var(--slate)] mt-1">market share</div>
            <div className="inline-flex items-center gap-1 mt-3 px-2 py-1 rounded-sm font-sans font-bold text-[11px] tabular-nums"
                 style={{ background: "var(--coral-faint)", color: "var(--coral)" }}>
              <ArrowDown size={11} strokeWidth={2.5} /> 2.1pp YoY
            </div>
          </div>
          <div className="col-span-6 p-6 flex flex-col justify-center">
            <div className="eyebrow text-[var(--slate-light)] text-center mb-3">SHARE OF VOICE · ALL CHANNELS</div>
            <div className="flex items-center gap-3">
              <span className="font-sans text-[11px] font-bold text-[var(--coral)] tabular-nums">{ourShare}</span>
              <div className="flex-1 h-8 flex rounded-sm overflow-hidden">
                <div className="h-full flex items-center justify-end pr-2"
                     style={{ width: `${usWidth}%`, background: "var(--coral)" }}>
                  <span className="font-sans font-bold text-[10px] text-white">US</span>
                </div>
                <div className="h-full flex items-center justify-start pl-2"
                     style={{ width: `${100 - usWidth}%`, background: "var(--navy)" }}>
                  <span className="font-sans font-bold text-[10px] text-white uppercase truncate">{topRival.name}</span>
                </div>
              </div>
              <span className="font-sans text-[11px] font-bold text-[var(--navy)] tabular-nums">{topRival.share}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-[var(--cream-dark)] text-center">
              <div>
                <div className="eyebrow text-[var(--slate-light)]">Win rate</div>
                <div className="font-sans font-bold text-[20px] text-[var(--coral)] tabular-nums">32%</div>
                <div className="font-sans text-[10px] text-[var(--slate-light)]">down from 41%</div>
              </div>
              <div>
                <div className="eyebrow text-[var(--slate-light)]">Promo depth</div>
                <div className="font-sans font-bold text-[20px] text-[var(--amber)] tabular-nums">32%</div>
                <div className="font-sans text-[10px] text-[var(--slate-light)]">vs 18% baseline</div>
              </div>
              <div>
                <div className="eyebrow text-[var(--slate-light)]">Price index</div>
                <div className="font-sans font-bold text-[20px] text-[var(--navy)] tabular-nums">104</div>
                <div className="font-sans text-[10px] text-[var(--slate-light)]">vs peer = 100</div>
              </div>
            </div>
          </div>
          <div className="col-span-3 p-6 text-center" style={{ background: "var(--navy)" }}>
            <div className="font-sans font-bold text-[12px] text-white opacity-80 tracking-wider uppercase truncate">{topRival.name}</div>
            <div className="font-serif font-semibold tabular-nums mt-2" style={{ fontSize: 56, lineHeight: 1, color: "#FFE7C2" }}>{topRival.share}%</div>
            <div className="font-sans italic text-[11px] text-white opacity-70 mt-1">market share</div>
            <div className="inline-flex items-center gap-1 mt-3 px-2 py-1 rounded-sm font-sans font-bold text-[11px] tabular-nums"
                 style={{ background: "rgba(255,231,194,0.18)", color: "#FFE7C2" }}>
              <ArrowUp size={11} strokeWidth={2.5} /> 1.4pp YoY
            </div>
          </div>
        </div>
      </div>

      <div className="card card-accent-navy">
        <div className="flex items-center justify-between mb-3">
          <div className="font-sans font-semibold text-[14px] text-[var(--navy)]">Competitor share + Q3 move</div>
          <span className="eyebrow text-[var(--slate-light)]">Top 5 rivals · 80.5% combined share</span>
        </div>
        {RIVALS.map((r) => {
          const wPct = (r.share / 40) * 100;
          return (
            <div key={r.name} className="grid grid-cols-12 gap-3 items-center py-2 border-b border-[var(--cream-dark)] last:border-0">
              <div className="col-span-3 flex items-center gap-2">
                <span className="h-5 w-5 rounded-sm shrink-0" style={{ background: r.color }} />
                <span className="font-sans font-semibold text-[12px] text-[var(--navy)] truncate">{r.name}</span>
              </div>
              <div className="col-span-6">
                <div className="h-3 rounded-sm overflow-hidden" style={{ background: "var(--cream-dark)" }}>
                  <div className="h-full" style={{ width: `${wPct}%`, background: r.color }} />
                </div>
              </div>
              <div className="col-span-1 text-right font-sans font-bold text-[13px] text-[var(--navy)] tabular-nums">{r.share}%</div>
              <div className="col-span-1 text-right flex items-center justify-end gap-0.5 font-sans text-[11px] font-semibold tabular-nums"
                   style={{ color: r.move > 0 ? "var(--coral)" : "var(--teal)" }}>
                {r.move > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}{Math.abs(r.move)}pp
              </div>
              <div className="col-span-1 text-right font-sans text-[11px] text-[var(--slate)] tabular-nums">{r.depth}% promo</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Pricing & margin, SKU price ladder vs competitor markers
// ─────────────────────────────────────────────────────────────────────────────

const SKUS_RAW = [
  { name: "10\" cordless drill",       meridian: 119, hd: 99,  lowes: 109, walmart: 89,  margin: 18, tone: "bad" as const  },
  { name: "Garden soil 40lb bag",      meridian: 8.4, hd: 7.8, lowes: 8.2, walmart: 6.9, margin: 24, tone: "warn" as const },
  { name: "Pressure washer 2000psi",   meridian: 249, hd: 229, lowes: 239, walmart: 219, margin: 16, tone: "bad" as const  },
  { name: "Patio set, 4-piece",        meridian: 449, hd: 489, lowes: 469, walmart: 399, margin: 31, tone: "good" as const },
  { name: "LED shop light 4ft",        meridian: 34,  hd: 29,  lowes: 32,  walmart: 27,  margin: 21, tone: "warn" as const },
];

export function PricingMarginHero({ layer: _layer }: HeroProps) {
  const SKUS = useDataset("SKUS", SKUS_RAW);
  const { profile, resolve } = useCompany();
  const min = Math.min(...SKUS.flatMap(s => [s.meridian, s.hd, s.lowes, s.walmart]));
  const max = Math.max(...SKUS.flatMap(s => [s.meridian, s.hd, s.lowes, s.walmart]));
  const range = max - min;
  const pos = (v: number) => ((v - min) / range) * 100;
  const aboveCount = SKUS.filter(s => s.meridian > s.hd).length;
  const hdLabel = resolve("Home Depot");
  const lowesLabel = resolve("Lowe's");

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-8 card card-accent-coral">
        <div className="flex items-center justify-between mb-1">
          <div className="font-sans font-semibold text-[15px] text-[var(--navy)]">Price ladder · top 5 SKUs</div>
          <span className="pill pill-coral">{profile.name} above {hdLabel} on {aboveCount} of {SKUS.length}</span>
        </div>
        <div className="font-sans italic text-[11px] text-[var(--slate-light)] mb-4">{profile.name} ▲ · {hdLabel} ● · {lowesLabel} ◆ · Walmart ✕ · normalised across categories</div>
        <ul className="space-y-3">
          {SKUS.map(s => (
            <li key={s.name} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-3">
                <div className="font-sans font-semibold text-[12px] text-[var(--navy)] truncate">{s.name}</div>
                <div className="font-sans italic text-[10px] text-[var(--slate-light)]">margin {s.margin}%</div>
              </div>
              <div className="col-span-7 relative h-7">
                <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--cream-dark)]" />
                <Marker pos={pos(s.walmart)} symbol="✕" color="#888888" label={`$${s.walmart}`} />
                <Marker pos={pos(s.hd)}      symbol="●" color="#F96302" label={`$${s.hd}`} />
                <Marker pos={pos(s.lowes)}   symbol="◆" color="#004990" label={`$${s.lowes}`} />
                <Marker pos={pos(s.meridian)}  symbol="▲" color="var(--coral)" label={`$${s.meridian}`} big />
              </div>
              <div className="col-span-2 text-right">
                <div className="tag inline-block" style={{ background: toneBg(s.tone), color: toneFg(s.tone) }}>
                  {s.meridian > s.hd ? `+$${(s.meridian - s.hd).toFixed(s.meridian < 20 ? 1 : 0)} vs peer` : `−$${(s.hd - s.meridian).toFixed(0)} vs peer`}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="col-span-4 card card-accent-amber flex flex-col">
        <div className="eyebrow text-[var(--amber)] mb-2">MARGIN COMPRESSION · Q3</div>
        <div className="font-serif font-semibold tabular-nums" style={{ fontSize: 64, lineHeight: 1, color: "var(--coral)" }}>
          −240<span className="text-[28px] ml-1">bps</span>
        </div>
        <div className="font-serif italic text-[13px] text-[var(--ink)] mt-3 leading-snug">
          Promotional matching deepened by 14pp this quarter without recovering share.
        </div>
        <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-[var(--cream-dark)]">
          <div>
            <div className="eyebrow text-[var(--slate-light)]">Gross margin</div>
            <div className="font-sans font-bold text-[20px] text-[var(--coral)] tabular-nums">38.2%</div>
            <div className="font-sans text-[10px] text-[var(--slate-light)]">vs 40.6% Q2</div>
          </div>
          <div>
            <div className="eyebrow text-[var(--slate-light)]">Promo depth</div>
            <div className="font-sans font-bold text-[20px] text-[var(--amber)] tabular-nums">32%</div>
            <div className="font-sans text-[10px] text-[var(--slate-light)]">vs 18% baseline</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Marker({ pos, symbol, color, label, big }: { pos: number; symbol: string; color: string; label: string; big?: boolean }) {
  return (
    <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
         style={{ left: `${pos}%` }}>
      <div className="font-sans" style={{ color, fontSize: big ? 18 : 13, lineHeight: 1, fontWeight: big ? 700 : 500 }}>{symbol}</div>
      {big && <div className="font-sans font-bold text-[10px] tabular-nums mt-0.5" style={{ color }}>{label}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Sales pipeline, Horizontal funnel hero
// ─────────────────────────────────────────────────────────────────────────────

const STAGES_RAW = [
  { stage: "Lead",        deals: 1842, value: 124.0, conv: 100 },
  { stage: "Qualified",   deals: 624,  value: 84.2,  conv: 34 },
  { stage: "Discovery",   deals: 318,  value: 52.4,  conv: 17 },
  { stage: "Proposal",    deals: 142,  value: 31.8,  conv: 7.7 },
  { stage: "Negotiation", deals: 67,   value: 18.4,  conv: 3.6 },
  { stage: "Closed-Won",  deals: 24,   value: 8.2,   conv: 1.3 },
];

export function SalesPipelineHero({ layer: _layer }: HeroProps) {
  const STAGES = useDataset("STAGES", STAGES_RAW);
  const maxVal = STAGES[0].value;
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-9 card card-accent-navy">
        <div className="flex items-center justify-between mb-1">
          <div className="font-sans font-semibold text-[15px] text-[var(--navy)]">Trade pipeline funnel · last 90 days</div>
          <span className="pill pill-coral">$2.1M slip · Q4 commit at risk</span>
        </div>
        <div className="font-sans italic text-[11px] text-[var(--slate-light)] mb-4">Width = open value · stage-to-stage conversion below</div>
        <div className="flex items-stretch gap-1 h-[180px]">
          {STAGES.map((s, i) => {
            const w = (s.value / maxVal) * 100;
            const trapColor =
              i === 0 ? "#1B2A4E"
              : i === 1 ? "#26396A"
              : i === 2 ? "#3D4F84"
              : i === 3 ? "#C8A24A"
              : i === 4 ? "#D85A30"
              :           "#1D9E75";
            return (
              <div key={s.stage} className="flex-1 flex flex-col">
                <div className="flex-1 relative flex flex-col items-center justify-end">
                  <div className="w-full rounded-sm transition-all flex flex-col items-center justify-center px-1 py-2"
                       style={{ height: `${Math.max(w, 12)}%`, background: trapColor }}>
                    <div className="font-serif font-semibold text-white tabular-nums leading-none" style={{ fontSize: w > 50 ? 22 : 16 }}>
                      ${s.value.toFixed(1)}M
                    </div>
                    {w > 30 && <div className="font-sans text-[10px] text-white opacity-80 mt-1 tabular-nums">{s.deals.toLocaleString()} deals</div>}
                  </div>
                </div>
                <div className="text-center mt-2 pt-2 border-t border-[var(--cream-dark)]">
                  <div className="font-sans font-semibold text-[11px] text-[var(--navy)]">{s.stage}</div>
                  <div className="font-sans text-[10px] text-[var(--slate-light)] tabular-nums">{s.conv}% conv</div>
                  {i > 0 && (
                    <div className="font-sans text-[9px] text-[var(--coral)] tabular-nums mt-0.5">
                      ↓ {(((STAGES[i-1].value - s.value) / STAGES[i-1].value) * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="col-span-3 space-y-3">
        <div className="card card-accent-coral">
          <div className="eyebrow text-[var(--coral)]">WIN RATE</div>
          <div className="font-serif font-semibold tabular-nums mt-1" style={{ fontSize: 52, lineHeight: 1, color: "var(--coral)" }}>14%</div>
          <div className="font-sans italic text-[11px] text-[var(--slate)] mt-1">vs 21% Q2 · −7pp</div>
          <div className="h-1.5 rounded-full mt-3 overflow-hidden" style={{ background: "var(--cream-dark)" }}>
            <div className="h-full" style={{ width: "14%", background: "var(--coral)" }} />
          </div>
        </div>
        <div className="card card-accent-amber">
          <div className="eyebrow text-[var(--amber)]">AVG CYCLE</div>
          <div className="font-serif font-semibold tabular-nums mt-1" style={{ fontSize: 52, lineHeight: 1, color: "var(--amber)" }}>71<span className="text-[20px] ml-1">d</span></div>
          <div className="font-sans italic text-[11px] text-[var(--slate)] mt-1">vs 58d Q2 · +13 days</div>
        </div>
        <div className="card card-accent-teal">
          <div className="eyebrow text-[var(--teal)]">Q4 COVERAGE</div>
          <div className="font-serif font-semibold tabular-nums mt-1" style={{ fontSize: 52, lineHeight: 1, color: "var(--teal)" }}>2.4×</div>
          <div className="font-sans italic text-[11px] text-[var(--slate)] mt-1">vs 3.1× target</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Marketing performance, Channel donut + ROI per-channel table
// ─────────────────────────────────────────────────────────────────────────────

const MKT_CHANNELS_RAW = [
  { name: "Paid search", spend: 184, rev: 642, roas: 3.49, color: "#1B2A4E", icon: Search },
  { name: "Paid social", spend: 142, rev: 384, roas: 2.70, color: "#534AB7", icon: Smartphone },
  { name: "Display",     spend: 78,  rev: 124, roas: 1.59, color: "#BA7517", icon: Tv },
  { name: "Email",       spend: 24,  rev: 198, roas: 8.25, color: "#1D9E75", icon: Mail },
  { name: "Affiliate",   spend: 62,  rev: 184, roas: 2.97, color: "#C8A24A", icon: Handshake },
  { name: "Brand",       spend: 88,  rev: 142, roas: 1.61, color: "#D85A30", icon: Megaphone },
];

export function MarketingPerformanceHero({ layer: _layer }: HeroProps) {
  const MKT_CHANNELS = useSwap(MKT_CHANNELS_RAW);
  const total = MKT_CHANNELS.reduce((s, c) => s + c.spend, 0);
  // Donut maths
  const r = 64, stroke = 22, circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = MKT_CHANNELS.map(c => {
    const frac = c.spend / total;
    const len = frac * circ;
    const seg = { ...c, frac, len, dashOffset: offset };
    offset += len;
    return seg;
  });

  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-5 card card-accent-navy flex flex-col items-center justify-center">
        <div className="eyebrow text-[var(--slate-light)] self-start">CHANNEL MIX · Q3 SPEND</div>
        <svg width="200" height="200" viewBox="0 0 200 200" className="mt-2">
          <circle cx="100" cy="100" r={r} fill="none" stroke="var(--cream-dark)" strokeWidth={stroke} />
          {segs.map((s) => (
            <circle key={s.name} cx="100" cy="100" r={r} fill="none"
                    stroke={s.color} strokeWidth={stroke}
                    strokeDasharray={`${s.len} ${circ - s.len}`}
                    strokeDashoffset={-s.dashOffset}
                    transform="rotate(-90 100 100)" />
          ))}
          <text x="100" y="94" textAnchor="middle" className="font-sans font-bold" style={{ fontSize: 11, fill: "var(--slate-light)", letterSpacing: 1.2 }}>TOTAL SPEND</text>
          <text x="100" y="116" textAnchor="middle" className="font-serif font-semibold" style={{ fontSize: 28, fill: "var(--navy)" }}>${total}k</text>
        </svg>
        <div className="grid grid-cols-3 gap-2 mt-4 w-full">
          {MKT_CHANNELS.map(c => (
            <div key={c.name} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: c.color }} />
              <span className="font-sans text-[10px] text-[var(--slate)] truncate">{c.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="col-span-7 card card-accent-teal">
        <div className="flex items-center justify-between mb-1">
          <div className="font-sans font-semibold text-[15px] text-[var(--navy)]">Channel ROAS · revenue per $1 spend</div>
          <span className="pill pill-teal">Email 8.25× · re-invest</span>
        </div>
        <div className="font-sans italic text-[11px] text-[var(--slate-light)] mb-3">Brand and Display below 2.0× return, reallocation candidates</div>
        <ul className="space-y-2.5">
          {[...MKT_CHANNELS].sort((a, b) => b.roas - a.roas).map(c => {
            const tone = c.roas >= 3 ? "good" : c.roas >= 2 ? "warn" : "bad";
            const w = (c.roas / 10) * 100;
            const Icon = c.icon;
            return (
              <li key={c.name} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3 flex items-center gap-2">
                  <Icon size={14} strokeWidth={1.5} style={{ color: c.color }} />
                  <span className="font-sans font-semibold text-[12px] text-[var(--navy)]">{c.name}</span>
                </div>
                <div className="col-span-5">
                  <div className="h-3 rounded-sm overflow-hidden" style={{ background: "var(--cream-dark)" }}>
                    <div className="h-full" style={{ width: `${w}%`, background: toneFg(tone) }} />
                  </div>
                </div>
                <div className="col-span-1 text-right font-sans font-bold text-[14px] tabular-nums" style={{ color: toneFg(tone) }}>
                  {c.roas.toFixed(2)}×
                </div>
                <div className="col-span-3 text-right font-sans text-[10px] text-[var(--slate)] tabular-nums">
                  ${c.spend}k spend → ${c.rev}k rev
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. People and operations, 8-team breakdown grid
// ─────────────────────────────────────────────────────────────────────────────

const TEAMS_RAW = [
  { name: "DC Operations",    icon: Briefcase,   headcount: 412,  attrition: 24, target: 12, engagement: 58, open: 14 },
  { name: "Retail stores",    icon: ShoppingCart,headcount: 1240, attrition: 14, target: 14, engagement: 71, open: 6  },
  { name: "Customer service", icon: Users2,      headcount: 184,  attrition: 21, target: 12, engagement: 62, open: 4  },
  { name: "Technology + Data",icon: Wrench,      headcount: 96,   attrition: 17, target: 10, engagement: 64, open: 5  },
  { name: "Commercial",       icon: Sparkles,    headcount: 142,  attrition: 11, target: 9,  engagement: 74, open: 3  },
  { name: "Marketing",        icon: Megaphone,   headcount: 64,   attrition: 8,  target: 10, engagement: 81, open: 1  },
  { name: "Finance + Admin",  icon: Briefcase,   headcount: 78,   attrition: 6,  target: 8,  engagement: 79, open: 0  },
  { name: "People + HR",      icon: Users2,      headcount: 32,   attrition: 9,  target: 10, engagement: 83, open: 1  },
];

export function PeopleOperationsHero({ layer: _layer }: HeroProps) {
  const TEAMS = useSwap(TEAMS_RAW);
  const totalHead = TEAMS.reduce((s, t) => s + t.headcount, 0);
  const overAttrition = TEAMS.filter(t => t.attrition > t.target).length;
  return (
    <div className="card card-accent-coral !p-0 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--cream-dark)]"
           style={{ background: "var(--cream-dark)" }}>
        <div className="flex items-center gap-3">
          <span className="eyebrow text-[var(--coral)]">WORKFORCE STRESS MAP</span>
          <span className="font-sans text-[12px] text-[var(--slate)]">{totalHead.toLocaleString()} total headcount · 8 teams</span>
        </div>
        <div className="flex gap-2">
          <span className="pill pill-coral">{overAttrition} teams over attrition target</span>
          <span className="pill pill-amber">34 open critical roles</span>
        </div>
      </div>
      <div className="grid grid-cols-4">
        {TEAMS.map((t, i) => {
          const over = t.attrition > t.target;
          const eng = t.engagement;
          const Icon = t.icon;
          const isRight = (i + 1) % 4 === 0;
          const isBottom = i >= 4;
          return (
            <div key={t.name} className="p-4"
                 style={{
                   borderRight: isRight ? undefined : "1px solid var(--cream-dark)",
                   borderTop:   isBottom ? "1px solid var(--cream-dark)" : undefined,
                 }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-sm flex items-center justify-center"
                        style={{ background: over ? "var(--coral-faint)" : "var(--teal-faint)" }}>
                    <Icon size={14} strokeWidth={1.5} style={{ color: over ? "var(--coral)" : "var(--teal)" }} />
                  </span>
                  <div>
                    <div className="font-sans font-semibold text-[12px] text-[var(--navy)] leading-tight">{t.name}</div>
                    <div className="font-sans text-[10px] text-[var(--slate-light)] tabular-nums">{t.headcount.toLocaleString()} ppl · {t.open} open</div>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <span className="eyebrow text-[var(--slate-light)]">ATTRITION</span>
                  <span className="font-sans font-bold text-[14px] tabular-nums"
                        style={{ color: over ? "var(--coral)" : "var(--teal)" }}>{t.attrition}%</span>
                </div>
                <div className="h-1.5 rounded-full mt-1 overflow-hidden relative" style={{ background: "var(--cream-dark)" }}>
                  <div className="absolute top-0 h-full border-l border-dashed border-[var(--navy)]"
                       style={{ left: `${(t.target / 30) * 100}%` }} />
                  <div className="h-full" style={{ width: `${(t.attrition / 30) * 100}%`, background: over ? "var(--coral)" : "var(--teal)" }} />
                </div>
                <div className="font-sans text-[10px] text-[var(--slate-light)] mt-0.5 tabular-nums">target {t.target}%</div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <span className="eyebrow text-[var(--slate-light)]">ENGAGEMENT</span>
                  <span className="font-sans font-bold text-[14px] tabular-nums"
                        style={{ color: eng >= 75 ? "var(--teal)" : eng >= 65 ? "var(--amber)" : "var(--coral)" }}>{eng}</span>
                </div>
                <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: "var(--cream-dark)" }}>
                  <div className="h-full" style={{ width: `${eng}%`, background: eng >= 75 ? "var(--teal)" : eng >= 65 ? "var(--amber)" : "var(--coral)" }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

// HEROES, per-layer §6 hero card (the bespoke executive visualisation that
// closes each layer). To add a new hero:
//   1. Author the component above as `function MyLayerHero({ layer }: HeroProps)`
//   2. Register it here keyed by the layer.key it belongs to.
// Layer.tsx looks up HEROES[layer.key] for every tenant; if the key is
// missing, the hero section is silently skipped.
export const HEROES: Record<string, React.FC<HeroProps>> = {
  "business-performance":     BusinessPerformanceHero,
  "demand-intelligence":      DemandIntelligenceHero,
  "competitive-intelligence": CompetitiveIntelligenceHero,
  "pricing-margin":           PricingMarginHero,
  "sales-pipeline":           SalesPipelineHero,
  "marketing-performance":    MarketingPerformanceHero,
  "people-operations":        PeopleOperationsHero,
};
