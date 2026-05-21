import { useState } from "react";
import { X, RotateCw } from "lucide-react";
import type { LayerData } from "../data/layers";

export default function ChallengeModal({ layer, onClose }: { layer: LayerData; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [conf, setConf] = useState(layer.confidence);
  const rediagnose = () => {
    setLoading(true);
    setTimeout(() => {
      setConf(Math.min(96, layer.confidence + 4));
      setLoading(false);
    }, 1400);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ background: "rgba(15,26,51,0.45)" }}
         onClick={onClose}>
      <div className="w-[680px] max-w-[92vw] max-h-[86vh] overflow-y-auto scroll-area"
           style={{ background: "var(--cream)", border: "1px solid var(--navy)", borderRadius: 4 }}
           onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-8 pt-7 pb-3 border-b border-[var(--cream-dark)]">
          <div>
            <div className="eyebrow text-[var(--coral)] mb-1">Challenge the diagnosis</div>
            <h2 className="font-serif text-[24px] leading-tight text-[var(--navy)]">{layer.title}</h2>
            <p className="font-serif italic text-[15px] text-[var(--slate)] mt-1">
              The system's own counter-arguments to its primary diagnosis.
            </p>
          </div>
          <button onClick={onClose} className="text-[var(--slate-light)] hover:text-[var(--navy)]">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
        <div className="px-8 py-5 space-y-3">
          {layer.counterArgs.map((c, i) => (
            <div key={i} className="card !p-4 !border-[var(--cream-dark)]">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <div className="font-sans font-semibold text-[14px] text-[var(--navy)]">{c.title}</div>
                <span className="pill pill-amber">{c.ci}</span>
              </div>
              <div className="font-sans text-[12px] text-[var(--slate)] italic leading-snug">{c.detail}</div>
            </div>
          ))}
        </div>
        <div className="px-8 pb-7 pt-2 flex items-center justify-between border-t border-[var(--cream-dark)]">
          <div className="flex items-center gap-3">
            <span className="eyebrow text-[var(--slate-light)]">Current confidence</span>
            <span className="font-sans text-[15px] font-semibold text-[var(--navy)]">{conf}%</span>
          </div>
          <button onClick={rediagnose} className="btn-ghost" disabled={loading}>
            <RotateCw size={14} strokeWidth={1.5} className={loading ? "animate-spin" : ""} />
            {loading ? "Re-running stack…" : "Force re-diagnosis"}
          </button>
        </div>
      </div>
    </div>
  );
}
