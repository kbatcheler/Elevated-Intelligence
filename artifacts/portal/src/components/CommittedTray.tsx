import { useMemo } from "react";
import { CheckCircle2, Circle, Clock3, ArrowRight, X as XIcon, Banknote, CalendarDays, Users, Activity } from "lucide-react";
import { useApp, type CommittedAction } from "../context/AppContext";

const statusColor = (s: CommittedAction["status"]) =>
  s === "done" ? "var(--teal)" : s === "in-flight" ? "var(--amber)" : "var(--navy)";
const statusBg = (s: CommittedAction["status"]) =>
  s === "done" ? "var(--teal-faint)" : s === "in-flight" ? "var(--amber-faint)" : "#E8ECF4";
const statusIcon = (s: CommittedAction["status"]) =>
  s === "done" ? CheckCircle2 : s === "in-flight" ? Clock3 : Circle;

// Pulls the leading dollar number out of strings like "$1.2M margin",
// "$0.5M cash" or "$1.1M ARR retained", used for the KPI roll-up only.
// Returns 0 if the impact is a non-dollar string (e.g. "+11 NPS").
const parseDollar = (impact: string): number => {
  const m = impact.match(/\$([0-9]+\.?[0-9]*)\s*M/i);
  return m ? parseFloat(m[1]) : 0;
};

// Bucket actions by how soon they need to land, derived from the due date.
// We don't need true date parsing here, the seed uses display strings, so
// we use a lightweight heuristic against a fixed "now" for the demo.
type Horizon = "in-flight" | "this-week" | "next-30" | "this-quarter" | "done";
const HORIZON_LABEL: Record<Horizon, string> = {
  "in-flight":    "In flight now",
  "this-week":    "Land this week",
  "next-30":      "Land next 30 days",
  "this-quarter": "Land this quarter",
  "done":         "Closed",
};
const HORIZON_ORDER: Horizon[] = ["in-flight", "this-week", "next-30", "this-quarter", "done"];

const horizonFor = (c: CommittedAction): Horizon => {
  if (c.status === "in-flight") return "in-flight";
  if (c.status === "done")      return "done";
  // Cheap month-name based bucketing, Oct = this week, Nov = next 30, Dec = this quarter.
  const due = c.due.toLowerCase();
  if (due.includes("oct")) return "this-week";
  if (due.includes("nov")) return "next-30";
  return "this-quarter";
};

export default function CommittedTray({ onNavigate }: { onNavigate: (key: string) => void }) {
  const { committed, advanceAction, removeCommitted } = useApp();

  // Roll-ups for the KPI strip and the status flow ribbon.
  const stats = useMemo(() => {
    const byStatus = { committed: 0, "in-flight": 0, done: 0 };
    let totalDollar = 0, inflightDollar = 0;
    const byOwner = new Map<string, number>();
    const byLayer = new Map<string, { title: string; count: number; dollars: number }>();
    committed.forEach(c => {
      byStatus[c.status]++;
      const d = parseDollar(c.impact);
      totalDollar += d;
      if (c.status === "in-flight") inflightDollar += d;
      byOwner.set(c.owner, (byOwner.get(c.owner) ?? 0) + d);
      const layerEntry = byLayer.get(c.layer) ?? { title: c.layerTitle, count: 0, dollars: 0 };
      layerEntry.count += 1; layerEntry.dollars += d;
      byLayer.set(c.layer, layerEntry);
    });
    return {
      byStatus, totalDollar, inflightDollar,
      ownerCount: byOwner.size,
      topLayer: Array.from(byLayer.entries()).sort((a, b) => b[1].dollars - a[1].dollars)[0],
    };
  }, [committed]);

  // Group the list by horizon for the main view, replaces the flat table.
  const grouped = useMemo(() => {
    const m = new Map<Horizon, CommittedAction[]>();
    committed.forEach(c => {
      const h = horizonFor(c);
      const arr = m.get(h) ?? [];
      arr.push(c); m.set(h, arr);
    });
    return HORIZON_ORDER
      .map(h => ({ horizon: h, items: m.get(h) ?? [] }))
      .filter(g => g.items.length > 0);
  }, [committed]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header + narrative framing */}
      <div className="flex items-start justify-between gap-6">
        <div className="max-w-[760px]">
          <div className="eyebrow text-[var(--coral)] mb-2">Intelligence layer · System</div>
          <h1 className="font-serif text-[40px] leading-[1.05] text-[var(--navy)] font-semibold">Committed actions</h1>
          <p className="font-serif italic text-[20px] text-[var(--slate-light)] mt-1.5">
            What the business has agreed to do about it, every recommendation that's been moved from advice to commitment, with named owners, due dates and predicted impact.
          </p>
        </div>
      </div>

      {/* KPI strip, replaces the count-only tiles with dollar weight + people + most-loaded layer. */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total committed value"
          value={`$${stats.totalDollar.toFixed(1)}M`}
          sub={`${committed.length} actions across ${stats.ownerCount} owners`}
          tone="coral"
          Icon={Banknote}
        />
        <KpiCard
          label="In flight right now"
          value={`${stats.byStatus["in-flight"]}`}
          sub={`$${stats.inflightDollar.toFixed(1)}M tracking to predicted`}
          tone="amber"
          Icon={Activity}
        />
        <KpiCard
          label="Landing this quarter"
          value={`${committed.length - stats.byStatus.done}`}
          sub={`${stats.byStatus.committed} committed + ${stats.byStatus["in-flight"]} in flight`}
          tone="navy"
          Icon={CalendarDays}
        />
        <KpiCard
          label="Most-loaded layer"
          value={stats.topLayer ? `${stats.topLayer[1].count}` : "—"}
          sub={stats.topLayer ? `${stats.topLayer[1].title} · $${stats.topLayer[1].dollars.toFixed(1)}M` : "no commitments yet"}
          tone="teal"
          Icon={Users}
        />
      </div>

      {committed.length === 0 ? (
        <div className="card text-center py-16">
          <div className="font-serif italic text-[18px] text-[var(--slate)]">
            No actions committed yet.
          </div>
          <div className="font-sans text-[12px] text-[var(--slate-light)] mt-2">
            From any layer, click <b className="text-[var(--navy)]">Commit</b> on a recommended action to add it here. Or open the <b className="text-[var(--navy)]">Scenario war-room</b> and commit a stacked scenario.
          </div>
        </div>
      ) : (
        <>
          {/* Status flow ribbon, committed → in-flight → done as a visual pipeline */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="eyebrow text-[var(--slate-light)] mb-1">Action flow</div>
                <div className="font-sans italic text-[12px] text-[var(--slate)]">Click any cell below to advance its status.</div>
              </div>
              <div className="font-sans text-[11px] text-[var(--slate-light)]">
                {Math.round((stats.byStatus.done / committed.length) * 100)}% closed this quarter
              </div>
            </div>
            <div className="flex h-7 rounded-sm overflow-hidden border border-[var(--cream-dark)]">
              <FlowBar status="committed"  count={stats.byStatus.committed}  total={committed.length} />
              <FlowBar status="in-flight"  count={stats.byStatus["in-flight"]} total={committed.length} />
              <FlowBar status="done"       count={stats.byStatus.done}       total={committed.length} />
            </div>
          </div>

          {/* Grouped by horizon, replaces the flat table */}
          <div className="space-y-5">
            {grouped.map(g => (
              <div key={g.horizon}>
                <div className="flex items-baseline justify-between mb-2 px-1">
                  <div className="eyebrow text-[var(--slate)]">{HORIZON_LABEL[g.horizon]}</div>
                  <div className="font-sans text-[11px] text-[var(--slate-light)]">
                    {g.items.length} {g.items.length === 1 ? "action" : "actions"}
                    {" · $"}
                    {g.items.reduce((s, c) => s + parseDollar(c.impact), 0).toFixed(1)}M
                  </div>
                </div>
                <div className="space-y-2">
                  {g.items.map(c => (
                    <ActionRow key={c.id} action={c}
                               onNavigate={onNavigate}
                               onAdvance={() => advanceAction(c.id)}
                               onRemove={() => removeCommitted(c.id)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, tone, Icon }:
  { label: string; value: string; sub: string; tone: "coral" | "amber" | "navy" | "teal"; Icon: any }) {
  const colors: Record<typeof tone, { fg: string; accent: string }> = {
    coral: { fg: "var(--coral)", accent: "card-accent-coral" },
    amber: { fg: "var(--amber)", accent: "" },
    navy:  { fg: "var(--navy)",  accent: "card-accent-navy" },
    teal:  { fg: "var(--teal)",  accent: "card-accent-teal" },
  };
  return (
    <div className={`card ${colors[tone].accent}`}>
      <div className="flex items-start justify-between">
        <div className="eyebrow text-[var(--slate-light)]">{label}</div>
        <Icon size={14} strokeWidth={1.6} style={{ color: colors[tone].fg, opacity: 0.6 }} />
      </div>
      <div className="font-serif font-semibold mt-2 tabular-nums" style={{ fontSize: 36, lineHeight: 1.05, color: colors[tone].fg }}>
        {value}
      </div>
      <div className="font-sans italic text-[12px] text-[var(--slate-light)] mt-1 leading-snug">{sub}</div>
    </div>
  );
}

function FlowBar({ status, count, total }: { status: CommittedAction["status"]; count: number; total: number }) {
  if (count === 0) return null;
  const pct = (count / total) * 100;
  return (
    <div className="h-full flex items-center justify-center font-sans font-bold text-[10px] uppercase tracking-wider"
         title={`${status}, ${count}`}
         style={{ width: `${pct}%`, background: statusColor(status), color: "white" }}>
      {count} {status}
    </div>
  );
}

function ActionRow({ action: c, onNavigate, onAdvance, onRemove }:
  { action: CommittedAction; onNavigate: (k: string) => void; onAdvance: () => void; onRemove: () => void }) {
  const Icon = statusIcon(c.status);
  return (
    <div className="card !p-0 overflow-hidden">
      <div className="grid grid-cols-12 gap-0">
        {/* Status rail */}
        <div className="col-span-1 flex items-center justify-center py-4"
             style={{ background: statusBg(c.status), color: statusColor(c.status) }}>
          <Icon size={18} strokeWidth={1.8} />
        </div>
        {/* Body */}
        <div className="col-span-7 p-4 border-r border-[var(--cream-dark)]">
          <button onClick={() => onNavigate(c.layer)}
                  className="eyebrow text-[var(--slate-light)] hover:text-[var(--coral)] underline-offset-2 hover:underline mb-1">
            {c.layerTitle}
          </button>
          <div className="font-sans font-semibold text-[13px] text-[var(--navy)] leading-snug">{c.title}</div>
          <p className="font-serif italic text-[12px] text-[var(--slate)] mt-1 leading-snug">{c.detail}</p>
        </div>
        {/* Owner + due */}
        <div className="col-span-2 p-4 border-r border-[var(--cream-dark)]">
          <div className="eyebrow text-[var(--slate-light)] mb-1">Owner</div>
          <div className="font-sans text-[11px] text-[var(--navy)] font-medium leading-snug">{c.owner}</div>
          <div className="eyebrow text-[var(--slate-light)] mt-3 mb-1">Due</div>
          <div className="font-sans tabular-nums text-[11px] text-[var(--slate)]">{c.due}</div>
        </div>
        {/* Impact + advance/remove */}
        <div className="col-span-2 p-4 flex flex-col items-end justify-between gap-3">
          <div className="text-right">
            <div className="eyebrow text-[var(--slate-light)] mb-1">Impact</div>
            <div className="font-sans font-bold text-[14px] tabular-nums text-[var(--teal)]">{c.impact}</div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onAdvance}
                    disabled={c.status === "done"}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-sm font-sans font-semibold text-[10px] uppercase tracking-wider disabled:opacity-40"
                    style={{ background: statusBg(c.status), color: statusColor(c.status) }}>
              {c.status === "done" ? "closed" : c.status}
              {c.status !== "done" && <ArrowRight size={10} strokeWidth={2} />}
            </button>
            <button onClick={onRemove} title="Remove from tray" aria-label="Remove from tray"
                    className="text-[var(--slate-light)] hover:text-[var(--coral)] p-1">
              <XIcon size={12} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
