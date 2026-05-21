import { Clock, RotateCcw } from "lucide-react";
import { useApp } from "../context/AppContext";
import { TIMELINES as TIMELINES_RAW, type Timeline } from "../data/timetravel";
import { useSwap } from "../context/CompanyContext";

export default function TimeTravel({ layerKey }: { layerKey: string }) {
  const { timeOffsetByLayer, setTimeOffset } = useApp();
  const TIMELINES = useSwap(TIMELINES_RAW);
  const timeline: Timeline | undefined = TIMELINES[layerKey];
  if (!timeline) return null;
  const offset = timeOffsetByLayer[layerKey] ?? 0;
  // offset: 0 = now (timeline[2]), 1 = -3d (timeline[1]), 2 = -7d (timeline[0])
  const snap = timeline[2 - offset];
  const isRewound = offset > 0;
  return (
    <div className="flex items-center gap-4 px-5 py-3 rounded-sm border"
         style={{
           background: isRewound ? "var(--amber-faint)" : "var(--cream-light)",
           borderColor: isRewound ? "var(--amber)" : "var(--cream-dark)",
         }}>
      <div className="flex items-center gap-2 shrink-0">
        <Clock size={14} strokeWidth={1.8} style={{ color: isRewound ? "var(--amber)" : "var(--slate)" }} />
        <span className="eyebrow" style={{ color: isRewound ? "var(--amber)" : "var(--slate-light)" }}>
          {isRewound ? "Rewound diagnosis" : "Diagnosis timeline"}
        </span>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {[2, 1, 0].map((o, idx) => {
          const sel = offset === o;
          const labels = ["−7d", "−3d", "Now"];
          return (
            <button key={o}
                    onClick={() => setTimeOffset(layerKey, o)}
                    className="px-2.5 py-1 rounded-sm font-sans text-[11px] font-semibold transition-colors"
                    style={{
                      background: sel ? (o === 0 ? "var(--navy)" : "var(--amber)") : "transparent",
                      color: sel ? "white" : "var(--slate)",
                      border: sel ? "1px solid transparent" : "1px solid var(--cream-dark)",
                    }}>
              {labels[idx]}
            </button>
          );
        })}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-sans font-semibold text-[12px] text-[var(--navy)] truncate">{snap.headline}</div>
        <div className="flex items-center gap-3 text-[10px] mt-0.5">
          <span className="font-sans italic text-[var(--slate-light)]">{snap.diagnosedAt}</span>
          <span className="font-sans tabular-nums" style={{ color: snap.confidence >= 80 ? "var(--teal)" : snap.confidence >= 70 ? "var(--amber)" : "var(--coral)" }}>
            <span className="eyebrow">Conf </span><b>{snap.confidence}%</b>
          </span>
          {snap.delta && <span className="font-sans italic text-[var(--teal)]">· {snap.delta}</span>}
        </div>
      </div>
      {isRewound && (
        <button onClick={() => setTimeOffset(layerKey, 0)}
                className="flex items-center gap-1 font-sans text-[11px] text-[var(--navy)] hover:text-[var(--coral)] shrink-0">
          <RotateCcw size={11} strokeWidth={1.8} /> Reset
        </button>
      )}
    </div>
  );
}
