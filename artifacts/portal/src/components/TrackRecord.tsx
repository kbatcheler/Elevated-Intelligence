import { useMemo, useState } from "react";
import { Award, TrendingUp, TrendingDown, Clock, MinusCircle, AlertTriangle, type LucideIcon } from "lucide-react";
import { summary, type TrackRecordEntry, type OutcomeStatus } from "../data/trackRecord";
import { useNarrative, useIsDefaultProfile, useCompany } from "../context/CompanyContext";

const STATUS_META: Record<OutcomeStatus, { label: string; color: string; icon: LucideIcon }> = {
  beat:        { label: "Beat predicted",  color: "var(--teal)",  icon: TrendingUp },
  met:         { label: "Met predicted",   color: "var(--teal)",  icon: Award },
  partial:     { label: "Partial",         color: "var(--amber)", icon: MinusCircle },
  missed:      { label: "Missed",          color: "var(--coral)", icon: TrendingDown },
  "in-flight": { label: "In flight",       color: "var(--slate-light)", icon: Clock },
};

export default function TrackRecord({ onNavigate }: { onNavigate: (key: string) => void }) {
  const { TRACK_RECORD, LAYERS } = useNarrative();
  const isDefault = useIsDefaultProfile();
  const { profile } = useCompany();
  const [filter, setFilter] = useState<"all" | OutcomeStatus>("all");
  const s = useMemo(() => summary(), []);
  const layerLabel = useMemo(() => Object.fromEntries(LAYERS.map(l => [l.key, l.title])), [LAYERS]);

  // CC-3: track-record receipts are shared across every tenant. The entries
  // are hand-authored Meridian Industrial history, and Preview Mode surfaces
  // them explicitly as the canonical body of evidence behind the diagnosis
  // the tenant is previewing, rather than hiding the page behind an empty
  // state. `profile` / `isDefault` remain wired for a future per-tenant
  // override path but are intentionally unused here today.
  void profile; void isDefault;

  const visible = TRACK_RECORD.filter(t => filter === "all" || t.status === filter);

  // Quarterly roll-up, predicted vs delivered $ by quarter, plus a hit-rate.
  // Skips non-dollar entries (NPS-only, ROAS-only) so the bars stay comparable.
  const quarterly = useMemo(() => {
    const dollarOnly = TRACK_RECORD.filter(t =>
      t.id !== "tr-003" && t.id !== "tr-005" && t.id !== "tr-007" &&
      t.id !== "tr-008" && t.id !== "tr-010" && t.id !== "tr-012",
    );
    const quarters: Array<"Q1 2026" | "Q2 2026" | "Q3 2026"> = ["Q1 2026", "Q2 2026", "Q3 2026"];
    return quarters.map(q => {
      const all = TRACK_RECORD.filter(t => t.quarter === q);
      const closed = all.filter(t => t.status !== "in-flight");
      const hits = closed.filter(t => t.status === "beat" || t.status === "met").length;
      const dollars = dollarOnly.filter(t => t.quarter === q);
      return {
        quarter: q,
        predicted: +dollars.reduce((s, t) => s + t.predictedValue, 0).toFixed(2),
        delivered: +dollars.reduce((s, t) => s + t.deliveredValue, 0).toFixed(2),
        count: all.length,
        hitRate: closed.length ? Math.round((hits / closed.length) * 100) : 0,
      };
    });
  }, []);

  // Lessons drawn from misses and partials, automatic so the page stays in
  // sync with the underlying data; no separate hand-authored lessons file.
  const lessons = useMemo(
    () => TRACK_RECORD.filter(t => t.status === "missed" || t.status === "partial"),
    [],
  );

  const maxQuarterDollar = Math.max(...quarterly.map(q => Math.max(q.predicted, q.delivered)), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="eyebrow text-[var(--coral)] mb-2">Track record · System accountability</div>
        <h1 className="font-serif text-[40px] leading-[1.05] text-[var(--navy)] font-semibold">Outcome track record</h1>
        <p className="font-serif italic text-[20px] text-[var(--slate-light)] mt-1.5">Every recommendation we make is graded against what it delivered.</p>
      </div>

      {/* Headline metrics */}
      <div className="card card-accent-gold">
        <div className="grid grid-cols-5 divide-x divide-[var(--cream-dark)]">
          <Headline label="Recommendations closed" value={`${s.total - s.inFlight}`} sub={`of ${s.total} total`} />
          <Headline label="Hit rate"               value={`${s.hitRate}%`} sub="met or beat predicted" emphasis="var(--teal)" />
          <Headline label="Predicted dollars"      value={`$${s.totalPredictedDollar.toFixed(1)}M`} sub="across closed plays" />
          <Headline label="Delivered dollars"      value={`$${s.totalDeliveredDollar.toFixed(1)}M`}
                    sub={`${((s.totalDeliveredDollar / s.totalPredictedDollar - 1) * 100).toFixed(0)}% vs predicted`}
                    emphasis={s.totalDeliveredDollar >= s.totalPredictedDollar ? "var(--teal)" : "var(--coral)"} />
          <Headline label="In flight"              value={`${s.inFlight}`} sub="actions tracking now" emphasis="var(--amber)" />
        </div>
      </div>

      {/* Quarterly trend, predicted vs delivered, side-by-side bars */}
      <div className="card">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="eyebrow text-[var(--slate-light)] mb-1">Quarterly trend · predicted vs delivered</div>
            <div className="font-sans italic text-[12px] text-[var(--slate)]">
              Dollar-graded recommendations only. NPS, ROAS and pipeline-coverage plays are excluded so the bars stay comparable.
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {quarterly.map(q => (
            <div key={q.quarter} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="eyebrow text-[var(--navy)]">{q.quarter}</span>
                <span className="font-sans text-[11px] text-[var(--slate-light)]">
                  {q.count} {q.count === 1 ? "play" : "plays"} · {q.hitRate}% hit
                </span>
              </div>
              <div className="flex items-end gap-3 h-[88px]">
                <div className="flex-1 flex flex-col items-center justify-end">
                  <div className="font-sans tabular-nums text-[10px] text-[var(--slate)] mb-1">${q.predicted.toFixed(1)}M</div>
                  <div className="w-full rounded-t" style={{ height: `${(q.predicted / maxQuarterDollar) * 100}%`, background: "var(--slate-light)", minHeight: 4 }} />
                  <div className="font-sans uppercase tracking-wider text-[9px] text-[var(--slate-light)] mt-1">Predicted</div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-end">
                  <div className="font-sans tabular-nums text-[10px] font-semibold mb-1"
                       style={{ color: q.delivered >= q.predicted ? "var(--teal)" : "var(--coral)" }}>
                    ${q.delivered.toFixed(1)}M
                  </div>
                  <div className="w-full rounded-t"
                       style={{ height: `${(q.delivered / maxQuarterDollar) * 100}%`,
                                background: q.delivered >= q.predicted ? "var(--teal)" : "var(--coral)",
                                minHeight: 4 }} />
                  <div className="font-sans uppercase tracking-wider text-[9px] mt-1"
                       style={{ color: q.delivered >= q.predicted ? "var(--teal)" : "var(--coral)" }}>
                    Delivered
                  </div>
                </div>
              </div>
              <div className="text-center font-sans text-[11px] text-[var(--slate)] pt-1 border-t border-[var(--cream-dark)]">
                {q.delivered >= q.predicted
                  ? <span className="text-[var(--teal)] font-semibold">+${(q.delivered - q.predicted).toFixed(1)}M vs predicted</span>
                  : <span className="text-[var(--coral)] font-semibold">−${(q.predicted - q.delivered).toFixed(1)}M vs predicted</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Outcome distribution bar */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="eyebrow text-[var(--slate-light)] mb-1">Outcome distribution</div>
            <div className="font-sans italic text-[12px] text-[var(--slate)]">Click any bucket to filter the list below.</div>
          </div>
          <button onClick={() => setFilter("all")}
                  className={"px-3 py-1 rounded-sm font-sans text-[11px] uppercase tracking-wider border transition-colors " +
                    (filter === "all" ? "bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)]" : "text-[var(--slate)] border-[var(--cream-dark)] hover:border-[var(--navy)]")}>
            Show all
          </button>
        </div>
        <div className="flex h-6 rounded-sm overflow-hidden border border-[var(--cream-dark)]">
          <DistBar status="beat"     count={s.beat}     total={s.total} active={filter} onClick={setFilter} />
          <DistBar status="met"      count={s.met}      total={s.total} active={filter} onClick={setFilter} />
          <DistBar status="partial"  count={s.partial}  total={s.total} active={filter} onClick={setFilter} />
          <DistBar status="missed"   count={s.missed}   total={s.total} active={filter} onClick={setFilter} />
          <DistBar status="in-flight" count={s.inFlight} total={s.total} active={filter} onClick={setFilter} />
        </div>
        <div className="flex justify-between mt-2 font-sans text-[10px] uppercase tracking-wider text-[var(--slate-light)]">
          <Legend status="beat" />
          <Legend status="met" />
          <Legend status="partial" />
          <Legend status="missed" />
          <Legend status="in-flight" />
        </div>
      </div>

      {/* Lessons learned, derived from misses and partials. Makes the page
          honest: this is what we got wrong, and what we changed because of it. */}
      {filter === "all" && lessons.length > 0 && (
        <div className="card card-accent-coral">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="eyebrow text-[var(--coral)] mb-1">Lessons banked</div>
              <div className="font-serif text-[16px] text-[var(--navy)] font-semibold leading-tight">
                {lessons.length} plays that missed or partly missed, what we changed
              </div>
            </div>
            <div className="font-sans italic text-[11px] text-[var(--slate-light)]">Every miss becomes a gate or a rule</div>
          </div>
          <div className="space-y-2.5">
            {lessons.map(l => (
              <div key={l.id} className="flex items-start gap-3 pt-2 border-t border-[var(--cream-dark)] first:border-t-0 first:pt-0">
                <AlertTriangle size={14} strokeWidth={1.8} className="text-[var(--coral)] mt-1 shrink-0" />
                <div className="flex-1">
                  <button onClick={() => onNavigate(l.layer)}
                          className="font-sans font-semibold text-[12px] text-[var(--navy)] hover:text-[var(--coral)] underline-offset-2 hover:underline text-left leading-snug">
                    {l.title}
                  </button>
                  <p className="font-serif italic text-[12px] text-[var(--slate)] mt-1 leading-snug">{l.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entries */}
      <div className="space-y-3">
        {visible.map(entry => <Entry key={entry.id} entry={entry} layerLabel={layerLabel} onNavigate={onNavigate} />)}
        {visible.length === 0 && (
          <div className="card text-center font-serif italic text-[14px] text-[var(--slate)]">
            No entries in this category.
          </div>
        )}
      </div>
    </div>
  );
}

function Headline({ label, value, sub, emphasis }: { label: string; value: string; sub: string; emphasis?: string }) {
  return (
    <div className="px-5 py-3 first:pl-0 last:pr-0">
      <div className="eyebrow text-[var(--slate-light)] mb-1.5">{label}</div>
      <div className="font-serif font-semibold text-[28px] tabular-nums leading-none" style={{ color: emphasis ?? "var(--navy)" }}>{value}</div>
      <div className="font-sans italic text-[11px] text-[var(--slate)] mt-1.5">{sub}</div>
    </div>
  );
}

function DistBar({ status, count, total, active, onClick }: { status: OutcomeStatus; count: number; total: number; active: string; onClick: (s: OutcomeStatus) => void }) {
  const pct = (count / total) * 100;
  if (count === 0) return null;
  const meta = STATUS_META[status];
  return (
    <button onClick={() => onClick(status)}
            title={`${meta.label}, ${count}`}
            className="h-full flex items-center justify-center font-sans font-bold text-[10px] uppercase tracking-wider transition-opacity"
            style={{
              width: `${pct}%`,
              background: meta.color,
              color: "white",
              opacity: active === "all" || active === status ? 1 : 0.3,
            }}>
      {count}
    </button>
  );
}

function Legend({ status }: { status: OutcomeStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

function Entry({ entry, layerLabel, onNavigate }: { entry: TrackRecordEntry; layerLabel: Record<string,string>; onNavigate: (key: string) => void }) {
  const meta = STATUS_META[entry.status];
  const Icon = meta.icon;
  return (
    <div className="card !p-0 overflow-hidden">
      <div className="grid grid-cols-12">
        {/* Status rail */}
        <div className="col-span-1 py-5 px-3 flex flex-col items-center justify-center gap-2" style={{ background: meta.color, color: "white" }}>
          <Icon size={18} strokeWidth={1.8} />
          <span className="font-sans font-bold text-[9px] uppercase tracking-wider text-center leading-tight">{meta.label}</span>
        </div>
        {/* Body */}
        <div className="col-span-7 p-5 border-r border-[var(--cream-dark)]">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="eyebrow text-[var(--slate-light)]">{entry.quarter}</span>
            <span className="opacity-30">·</span>
            <button onClick={() => onNavigate(entry.layer)}
                    className="eyebrow text-[var(--navy)] hover:text-[var(--coral)] underline-offset-2 hover:underline">
              {layerLabel[entry.layer] ?? entry.layer}
            </button>
            <span className="opacity-30">·</span>
            <span className="font-sans italic text-[11px] text-[var(--slate-light)]">Closed {entry.closedAt}</span>
          </div>
          <div className="font-serif font-semibold text-[16px] text-[var(--navy)] leading-tight">{entry.title}</div>
          <p className="font-serif italic text-[13px] text-[var(--slate)] mt-2 leading-snug">{entry.note}</p>
          <div className="font-sans text-[11px] text-[var(--slate)] italic mt-2">Owner, {entry.owner}</div>
        </div>
        {/* Outcome */}
        <div className="col-span-4 p-5 grid grid-rows-3 gap-2" style={{ background: "var(--cream-light)" }}>
          <Metric label="We predicted" value={entry.predicted} />
          <Metric label="We delivered" value={entry.delivered} emphasis={meta.color} />
          <Metric label="Variance"     value={entry.variance}   italic />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, emphasis, italic }: { label: string; value: string; emphasis?: string; italic?: boolean }) {
  return (
    <div>
      <div className="eyebrow text-[var(--slate-light)]">{label}</div>
      <div className={"font-sans text-[12px] mt-0.5 " + (italic ? "italic text-[var(--slate)]" : "font-semibold")}
           style={{ color: emphasis ?? "var(--navy)" }}>{value}</div>
    </div>
  );
}
