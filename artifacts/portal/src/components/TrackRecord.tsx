import { useMemo, useState } from "react";
import { Award, TrendingUp, TrendingDown, Clock, MinusCircle } from "lucide-react";
import { summary, type TrackRecordEntry, type OutcomeStatus } from "../data/trackRecord";
import { useNarrative } from "../context/CompanyContext";

const STATUS_META: Record<OutcomeStatus, { label: string; color: string; icon: any }> = {
  beat:        { label: "Beat predicted",  color: "var(--teal)",  icon: TrendingUp },
  met:         { label: "Met predicted",   color: "var(--teal)",  icon: Award },
  partial:     { label: "Partial",         color: "var(--amber)", icon: MinusCircle },
  missed:      { label: "Missed",          color: "var(--coral)", icon: TrendingDown },
  "in-flight": { label: "In flight",       color: "var(--slate-light)", icon: Clock },
};

export default function TrackRecord({ onNavigate }: { onNavigate: (key: string) => void }) {
  const { TRACK_RECORD, LAYERS } = useNarrative();
  const [filter, setFilter] = useState<"all" | OutcomeStatus>("all");
  const s = useMemo(() => summary(), []);
  const layerLabel = useMemo(() => Object.fromEntries(LAYERS.map(l => [l.key, l.title])), [LAYERS]);

  const visible = TRACK_RECORD.filter(t => filter === "all" || t.status === filter);

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
            title={`${meta.label} — ${count}`}
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
          <div className="font-sans text-[11px] text-[var(--slate)] italic mt-2">Owner — {entry.owner}</div>
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
