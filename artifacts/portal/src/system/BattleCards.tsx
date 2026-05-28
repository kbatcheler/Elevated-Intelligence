import { useState } from "react";
import { Swords, CheckCircle2, MinusCircle, ArrowUpRight, FileSearch, Quote } from "lucide-react";
import { BATTLE_CARDS, type BattleCard } from "../data/battleCards";
import { useApp } from "../context/AppContext";

interface Props { onNavigate: (key: string) => void }

const VERDICT_META: Record<BattleCard["verdict"], { color: string; label: string }> = {
  "we-typically-win":   { color: "var(--teal)",  label: "We typically win" },
  "split":              { color: "var(--amber)", label: "Split"            },
  "they-typically-win": { color: "var(--coral)", label: "They typically win" },
};

function Card({ c, onNavigate, onReceipts }: { c: BattleCard; onNavigate: (k: string) => void; onReceipts: () => void }) {
  const meta = VERDICT_META[c.verdict];
  return (
    <div className="card !p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="eyebrow text-[var(--slate-light)] mb-1">Versus</div>
          <h3 className="font-serif text-[22px] font-semibold text-[var(--navy)] leading-tight">{c.competitor}</h3>
        </div>
        <span className="pill shrink-0" style={{ background: meta.color, color: "var(--cream-light)", whiteSpace: "nowrap" }}>{meta.label}</span>
      </div>

      <div className="flex items-start gap-2 mb-4 pl-2 border-l-2" style={{ borderColor: "var(--cream-dark)" }}>
        <Quote size={11} strokeWidth={1.8} className="text-[var(--slate-light)] shrink-0 mt-1" />
        <p className="font-serif italic text-[13px] text-[var(--slate)] leading-snug">{c.theirPitch}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="eyebrow text-[var(--coral)] mb-1.5">Where they win</div>
          <ul className="space-y-1.5">
            {c.whereTheyWin.map((p, i) => (
              <li key={i} className="font-sans text-[12px] text-[var(--ink)] leading-snug flex gap-1.5">
                <MinusCircle size={11} strokeWidth={1.8} className="text-[var(--coral)] shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="eyebrow text-[var(--teal)] mb-1.5">Where we win</div>
          <ul className="space-y-1.5">
            {c.whereWeWin.map((p, i) => (
              <li key={i} className="font-sans text-[12px] text-[var(--ink)] leading-snug flex gap-1.5">
                <CheckCircle2 size={11} strokeWidth={1.8} className="text-[var(--teal)] shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-sm px-3 py-2.5 mb-3" style={{ background: "var(--navy)", color: "var(--cream-light)" }}>
        <div className="eyebrow text-[var(--gold-light)] mb-0.5">Killer line</div>
        <p className="font-serif text-[14px] leading-snug">"{c.killerLine}"</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => onNavigate(c.recommendedPivot.layerKey)}
          className="font-sans text-[12px] text-[var(--coral)] hover:underline flex items-center gap-1"
        >
          Pivot to {c.recommendedPivot.label} <ArrowUpRight size={12} strokeWidth={1.8} />
        </button>
        <button
          onClick={onReceipts}
          className="font-sans text-[11.5px] text-[var(--slate)] hover:text-[var(--coral)] hover:underline flex items-center gap-1"
        >
          <FileSearch size={11} strokeWidth={1.8} /> Verify this comparison
        </button>
      </div>
    </div>
  );
}

export default function BattleCards({ onNavigate }: Props) {
  const { openReceipt } = useApp();
  const [filter, setFilter] = useState<"all" | BattleCard["verdict"]>("all");

  const visible = filter === "all" ? BATTLE_CARDS : BATTLE_CARDS.filter(c => c.verdict === filter);

  return (
    <div className="space-y-7">
      {/* Hero */}
      <div>
        <div className="eyebrow text-[var(--gold)] mb-2">System · Battle cards</div>
        <h1 className="font-serif text-[36px] font-semibold text-[var(--navy)] leading-tight mb-2">
          The card for whatever they bring up
        </h1>
        <p className="font-serif italic text-[16px] text-[var(--slate)] max-w-[820px] leading-snug">
          One card per competitor or alternative the buyer is likely weighing us against. Where they genuinely win, we say so. Where we win, we name the buyer outcome, not the feature. Memorise the killer line; pivot on the recommended layer.
        </p>
      </div>

      {/* Differentiator strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Swords,        label: `${BATTLE_CARDS.length} comparisons`,   sub: "covers the most common buying threads" },
          { icon: CheckCircle2,  label: "No prices on any card",                 sub: "we sell time-to-value and posture" },
          { icon: Quote,         label: "Killer line per competitor",            sub: "memorise it, land it once, move on" },
          { icon: ArrowUpRight,  label: "Pivot route per competitor",            sub: "where to take the buyer after the line" },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="card !p-3.5 card-accent-gold">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon size={14} strokeWidth={1.8} className="text-[var(--gold)]" />
              <div className="font-sans font-semibold text-[13px] text-[var(--navy)] leading-tight">{label}</div>
            </div>
            <div className="font-sans italic text-[11.5px] text-[var(--slate)] leading-snug">{sub}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1.5">
        {([
          { id: "all" as const,                 label: "All",                  n: BATTLE_CARDS.length },
          { id: "we-typically-win" as const,    label: "We typically win",     n: BATTLE_CARDS.filter(c => c.verdict === "we-typically-win").length },
          { id: "split" as const,               label: "Split",                n: BATTLE_CARDS.filter(c => c.verdict === "split").length },
          { id: "they-typically-win" as const,  label: "They typically win",   n: BATTLE_CARDS.filter(c => c.verdict === "they-typically-win").length },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-2.5 py-1 rounded-sm text-[11.5px] font-sans transition-colors ${filter === t.id ? "bg-[var(--navy)] text-[var(--cream-light)]" : "bg-[var(--cream-light)] text-[var(--slate)] border border-[var(--cream-dark)] hover:border-[var(--navy)]"}`}
          >
            {t.label} <span className="opacity-60 tabular-nums">· {t.n}</span>
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 gap-4">
        {visible.map(c => (
          <Card
            key={c.id}
            c={c}
            onNavigate={onNavigate}
            onReceipts={() => openReceipt({
              eyebrow: `Battle card · ${c.competitor}`,
              title: `Why we said "${c.killerLine.slice(0, 60)}${c.killerLine.length > 60 ? "…" : ""}"`,
              claim: c.killerLine,
              confidencePct: c.verdict === "we-typically-win" ? 82 : c.verdict === "split" ? 60 : 48,
              feedSource: `Competitive intelligence · ${c.competitor}`,
              ingestMs: 280 + c.id.length * 8,
              publishedAt: "current quarter",
              evidence: [
                ...c.whereWeWin.map(p => `Win · ${p}`),
                ...c.whereTheyWin.map(p => `Concede · ${p}`),
              ],
              reasoning: `The verdict is a rolling judgement from the engagement pipeline, refreshed each quarter as we win and lose specific accounts. "${meta(c.verdict)}" is the modal outcome, not a guarantee on any given deal.`,
              routeKey: c.recommendedPivot.layerKey,
              routeLabel: c.recommendedPivot.label,
            })}
          />
        ))}
      </div>

      {/* Footer pointer */}
      <div className="card card-accent-navy">
        <div className="font-sans font-semibold text-[14px] text-[var(--navy)] mb-1">Where to take the buyer next</div>
        <p className="font-serif text-[14px] text-[var(--ink)] leading-snug">
          If they push on rigour, send them to <button onClick={() => onNavigate("calibration")} className="underline text-[var(--coral)]">Calibration</button>. If they push on integration depth, send them to <button onClick={() => onNavigate("data-substrate")} className="underline text-[var(--coral)]">Data substrate</button>. If they push on reasoning, send them to <button onClick={() => onNavigate("intelligence-architecture")} className="underline text-[var(--coral)]">Intelligence architecture</button>.
        </p>
      </div>
    </div>
  );
}

function meta(v: BattleCard["verdict"]) {
  return VERDICT_META[v].label;
}
