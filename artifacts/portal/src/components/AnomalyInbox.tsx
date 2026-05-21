import { X, AlertTriangle, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useNarrative } from "../context/CompanyContext";
import { type AnomalySeverity } from "../data/signals";

const sevColor = (s: AnomalySeverity) =>
  s === "critical" ? "var(--coral)" : s === "high" ? "var(--amber)" : s === "medium" ? "var(--navy)" : "var(--slate-light)";
const sevBg = (s: AnomalySeverity) =>
  s === "critical" ? "var(--coral-faint)" : s === "high" ? "var(--amber-faint)" : s === "medium" ? "#E8ECF4" : "var(--cream-dark)";

export default function AnomalyInbox({ onNavigate }: { onNavigate: (key: string) => void }) {
  const { ANOMALIES } = useNarrative();
  const { inboxOpen, closeInbox } = useApp();
  if (!inboxOpen) return null;

  const counts = {
    critical: ANOMALIES.filter(a => a.severity === "critical").length,
    high:     ANOMALIES.filter(a => a.severity === "high").length,
    medium:   ANOMALIES.filter(a => a.severity === "medium").length,
    low:      ANOMALIES.filter(a => a.severity === "low").length,
  };

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(15,26,51,0.35)" }} onClick={closeInbox}>
      <div className="ml-auto h-full w-[520px] max-w-[92vw] flex flex-col"
           style={{ background: "var(--cream)", borderLeft: "1px solid var(--navy)" }}
           onClick={(e) => e.stopPropagation()}>
        <div className="px-7 py-5 border-b border-[var(--cream-dark)]" style={{ background: "var(--navy)", color: "var(--cream)" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="eyebrow text-[var(--gold-light)] mb-1">Anomaly inbox · today</div>
              <h2 className="font-serif text-[22px] leading-tight text-[var(--cream)]">{ANOMALIES.length} anomalies surfaced</h2>
              <p className="font-serif italic text-[13px] text-[var(--gold-light)] mt-1">Auto-detected by 14 layers, ranked by severity and impact.</p>
            </div>
            <button onClick={closeInbox} className="text-[var(--gold-light)] hover:text-white">
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
          <div className="flex gap-3 mt-4 text-[11px]">
            <span className="px-2 py-1 rounded-sm font-sans font-bold tabular-nums" style={{ background: "rgba(216,90,48,0.25)", color: "#FFC8B0" }}>{counts.critical} critical</span>
            <span className="px-2 py-1 rounded-sm font-sans font-bold tabular-nums" style={{ background: "rgba(186,117,23,0.25)", color: "#F4D88A" }}>{counts.high} high</span>
            <span className="px-2 py-1 rounded-sm font-sans font-bold tabular-nums" style={{ background: "rgba(255,255,255,0.10)", color: "#D8DEF0" }}>{counts.medium} medium</span>
            <span className="px-2 py-1 rounded-sm font-sans font-bold tabular-nums" style={{ background: "rgba(255,255,255,0.05)", color: "#A8B0C8" }}>{counts.low} low</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scroll-area px-5 py-3 space-y-2">
          {ANOMALIES.map(a => (
            <button key={a.id}
                    onClick={() => { onNavigate(a.layer); closeInbox(); }}
                    className="w-full text-left card !p-4 hover:border-[var(--navy)] transition-colors group">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-sm shrink-0"
                      style={{ background: sevBg(a.severity), color: sevColor(a.severity) }}>
                  <AlertTriangle size={14} strokeWidth={1.8} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="font-sans font-bold text-[10px] uppercase tracking-wider tabular-nums"
                          style={{ color: sevColor(a.severity) }}>
                      {a.severity} · {a.id}
                    </span>
                    <span className="font-sans tabular-nums text-[10px] text-[var(--slate-light)]">{a.ts}</span>
                  </div>
                  <div className="font-sans font-semibold text-[13px] text-[var(--navy)] leading-snug">{a.title}</div>
                  <div className="font-sans italic text-[11px] text-[var(--slate)] leading-snug mt-1">{a.detail}</div>
                  <div className="flex items-center gap-3 mt-2 text-[10px]">
                    <span className="eyebrow text-[var(--slate-light)]">{a.layer.replace(/-/g, " ")}</span>
                    {a.delta && <span className="font-sans font-bold tabular-nums" style={{ color: sevColor(a.severity) }}>{a.delta}</span>}
                    {a.evidence && <span className="font-sans italic text-[var(--slate-light)]">· {a.evidence}</span>}
                    <span className="ml-auto flex items-center gap-1 font-sans text-[var(--navy)] opacity-0 group-hover:opacity-100 transition-opacity">
                      Open layer <ArrowRight size={11} strokeWidth={1.5} />
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
