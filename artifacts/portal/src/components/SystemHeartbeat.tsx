import { useEffect, useState } from "react";
import { Radio, Clock, XCircle, Zap, AlertTriangle } from "lucide-react";
import { FEEDS, ACTIVITY_STREAM } from "../data/feeds";
import { LAYERS } from "../data/layers";

function aggregate() {
  let live = 0, stale = 0, partial = 0, missing = 0, manual = 0;
  Object.values(FEEDS).forEach(arr => {
    arr.forEach(f => {
      if (f.status === "live") live++;
      else if (f.status === "stale") stale++;
      else if (f.status === "partial") partial++;
      else if (f.status === "missing") missing++;
      else if (f.status === "manual") manual++;
    });
  });
  const totalAnomalies = LAYERS.reduce((s, l) => s + l.causes.length + l.gaps.length, 0);
  return { live, stale, partial, missing, manual, anomalies: totalAnomalies, total: live + stale + partial + missing + manual };
}

export default function SystemHeartbeat({ onNavigate }: { onNavigate: (key: string) => void }) {
  const stats = aggregate();
  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % ACTIVITY_STREAM.length), 3200);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const ev = ACTIVITY_STREAM[idx];
  const evColor =
    ev.tone === "alert" ? "var(--coral)" :
    ev.tone === "warn"  ? "var(--amber)" :
                           "var(--navy)";

  return (
    <div className="h-[36px] shrink-0 border-b border-[var(--cream-dark)] flex items-stretch text-[11px]"
         style={{ background: "var(--cream-light)" }}>
      <div className="flex items-center gap-5 px-6">
        <div className="flex items-center gap-1.5">
          <span className="relative inline-flex">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--teal)" }} />
            <span className="absolute inset-0 h-1.5 w-1.5 rounded-full animate-ping" style={{ background: "var(--teal)", opacity: 0.5 }} />
          </span>
          <span className="eyebrow text-[var(--slate-light)]">System</span>
          <span className="font-sans font-semibold text-[var(--navy)]">healthy</span>
        </div>
        <span className="opacity-30 text-[var(--slate)]">·</span>
        <span className="flex items-center gap-1.5 text-[var(--slate)]">
          <Radio size={11} strokeWidth={1.8} className="text-[var(--teal)]" />
          <span className="tabular-nums font-semibold text-[var(--navy)]">{stats.live}</span> live
        </span>
        <span className="flex items-center gap-1.5 text-[var(--slate)]">
          <Clock size={11} strokeWidth={1.8} className="text-[var(--amber)]" />
          <span className="tabular-nums font-semibold text-[var(--navy)]">{stats.stale}</span> stale
        </span>
        <span className="flex items-center gap-1.5 text-[var(--slate)]">
          <AlertTriangle size={11} strokeWidth={1.8} className="text-[var(--amber)]" />
          <span className="tabular-nums font-semibold text-[var(--navy)]">{stats.partial}</span> partial
        </span>
        <span className="flex items-center gap-1.5 text-[var(--slate)]">
          <XCircle size={11} strokeWidth={1.8} className="text-[var(--coral)]" />
          <span className="tabular-nums font-semibold text-[var(--navy)]">{stats.missing}</span> missing
        </span>
        <span className="flex items-center gap-1.5 text-[var(--slate)]">
          <Zap size={11} strokeWidth={1.8} className="text-[var(--coral)]" />
          <span className="tabular-nums font-semibold text-[var(--navy)]">{47 + (tick % 6)}</span> anomalies today
        </span>
      </div>
      <div className="flex-1 border-l border-[var(--cream-dark)] flex items-center overflow-hidden">
        <button
          key={idx}
          onClick={() => onNavigate(ev.layer)}
          className="flex items-center gap-3 px-6 w-full text-left hover:bg-[var(--cream-dark)]/40 transition-colors animate-[fadeSlide_0.4s_ease-out]"
        >
          <span className="font-sans tabular-nums text-[var(--slate-light)]">{ev.ts}</span>
          <span className="h-1 w-1 rounded-full shrink-0" style={{ background: evColor }} />
          <span className="font-sans text-[var(--ink)] truncate" style={{ color: evColor }}>{ev.text}</span>
          <span className="eyebrow text-[var(--slate-light)] ml-auto shrink-0">{ev.layer.replace(/-/g, " ")}</span>
        </button>
      </div>
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
