import { CheckCircle2, Circle, Clock3, ArrowRight, X as XIcon } from "lucide-react";
import { useApp, type CommittedAction } from "../context/AppContext";

const statusColor = (s: CommittedAction["status"]) =>
  s === "done" ? "var(--teal)" : s === "in-flight" ? "var(--amber)" : "var(--navy)";
const statusBg = (s: CommittedAction["status"]) =>
  s === "done" ? "var(--teal-faint)" : s === "in-flight" ? "var(--amber-faint)" : "#E8ECF4";

export default function CommittedTray({ onNavigate }: { onNavigate: (key: string) => void }) {
  const { committed, advanceAction, removeCommitted } = useApp();

  const counts = {
    committed: committed.filter(c => c.status === "committed").length,
    inFlight:  committed.filter(c => c.status === "in-flight").length,
    done:      committed.filter(c => c.status === "done").length,
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="eyebrow text-[var(--coral)] mb-2">Intelligence layer · System</div>
          <h1 className="font-serif text-[40px] leading-[1.05] text-[var(--navy)] font-semibold">Committed actions</h1>
          <p className="font-serif italic text-[20px] text-[var(--slate-light)] mt-1.5">What the business has agreed to do about it.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="Committed"    value={counts.committed} color="var(--navy)" />
        <Stat label="In-flight"    value={counts.inFlight}  color="var(--amber)" />
        <Stat label="Done"         value={counts.done}      color="var(--teal)" />
      </div>

      {committed.length === 0 ? (
        <div className="card text-center py-16">
          <div className="font-serif italic text-[18px] text-[var(--slate)]">
            No actions committed yet.
          </div>
          <div className="font-sans text-[12px] text-[var(--slate-light)] mt-2">
            From any layer, click <b className="text-[var(--navy)]">Commit</b> on a recommended action to add it here.
          </div>
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: "var(--cream-dark)" }}>
                <th className="eyebrow text-[var(--slate-light)] text-left py-2.5 px-5">Action</th>
                <th className="eyebrow text-[var(--slate-light)] text-left py-2.5 px-3">Layer</th>
                <th className="eyebrow text-[var(--slate-light)] text-left py-2.5 px-3">Owner</th>
                <th className="eyebrow text-[var(--slate-light)] text-left py-2.5 px-3">Due</th>
                <th className="eyebrow text-[var(--slate-light)] text-right py-2.5 px-3">Impact</th>
                <th className="eyebrow text-[var(--slate-light)] text-center py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {committed.map(c => (
                <tr key={c.id} className="border-t border-[var(--cream-dark)] align-top hover:bg-[var(--cream-light)]">
                  <td className="py-3 px-5">
                    <div className="font-sans font-semibold text-[12px] text-[var(--navy)] leading-snug">{c.title}</div>
                    <div className="font-sans italic text-[11px] text-[var(--slate)] leading-snug mt-0.5">{c.detail}</div>
                  </td>
                  <td className="py-3 px-3">
                    <button onClick={() => onNavigate(c.layer)} className="font-sans text-[11px] text-[var(--navy)] hover:text-[var(--coral)] underline decoration-dotted underline-offset-2">
                      {c.layerTitle}
                    </button>
                  </td>
                  <td className="py-3 px-3 font-sans text-[11px] text-[var(--slate)]">{c.owner}</td>
                  <td className="py-3 px-3 font-sans tabular-nums text-[11px] text-[var(--slate)]">{c.due}</td>
                  <td className="py-3 px-3 text-right font-sans font-bold text-[12px] text-[var(--teal)] tabular-nums">{c.impact}</td>
                  <td className="py-3 px-3 text-center">
                    <button onClick={() => advanceAction(c.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-sm font-sans font-semibold text-[10px] uppercase tracking-wider"
                            style={{ background: statusBg(c.status), color: statusColor(c.status) }}>
                      {c.status === "done" ? <CheckCircle2 size={11} strokeWidth={2} /> :
                       c.status === "in-flight" ? <Clock3 size={11} strokeWidth={2} /> :
                       <Circle size={11} strokeWidth={2} />}
                      {c.status}
                      {c.status !== "done" && <ArrowRight size={10} strokeWidth={2} className="ml-0.5" />}
                    </button>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button onClick={() => removeCommitted(c.id)} className="text-[var(--slate-light)] hover:text-[var(--coral)]">
                      <XIcon size={14} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card">
      <div className="eyebrow text-[var(--slate-light)]">{label}</div>
      <div className="font-serif font-semibold tabular-nums mt-1" style={{ fontSize: 44, lineHeight: 1, color }}>{value}</div>
    </div>
  );
}
