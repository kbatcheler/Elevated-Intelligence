import { useEffect, useRef, useState } from "react";
import { X, RotateCw, ShieldCheck, AlertTriangle, Send, ChevronRight } from "lucide-react";
import type { LayerData } from "../data/layers";
import { useCompany, useSwap, useIsDefaultProfile } from "../context/CompanyContext";

type Tab = "counter" | "criteria" | "submit";

const CHANGE_CRITERIA_RAW: Record<string, { title: string; detail: string; current: string; target: string; met: boolean }[]> = {
  default: [
    { title: "Peer DIY softens to mirror our gap",      detail: "Tractor Supply or Ace post DIY −5% or worse in same regions.", current: "Both flat-to-up", target: "≤ −5%", met: false },
    { title: "Stockout days fall to target",            detail: "If OOS days top 5 SKUs drops to ≤ 10 and variance persists, supply explanation strengthens.", current: "41 days", target: "≤ 10 days", met: false },
    { title: "Forecast retrain closes < 30% of gap",    detail: "If we retrain and variance only narrows by < 30%, model degradation rejected as primary cause.", current: "Not retrained", target: "Retrain + measure", met: false },
    { title: "Competitor promo depth normalises",       detail: "If HD drops promo below 22% and our variance does not narrow, competitor theory weakens.", current: "32%", target: "≤ 22%", met: false },
  ],
};

export default function ChallengeModal({ layer, onClose }: { layer: LayerData; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>("counter");
  const [loading, setLoading] = useState(false);
  const [conf, setConf] = useState(layer.confidence);
  const [submitted, setSubmitted] = useState(false);
  const [challengeText, setChallengeText] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const rediagnose = () => {
    if (loading) return;
    setLoading(true);
    timerRef.current = setTimeout(() => {
      setConf(Math.min(96, layer.confidence + 4));
      setLoading(false);
      timerRef.current = null;
    }, 1400);
  };

  const CHANGE_CRITERIA = useSwap(CHANGE_CRITERIA_RAW);
  const { resolve } = useCompany();
  const isDefault = useIsDefaultProfile();
  // The default falsification criteria are Meridian Industrial-shaped (Tractor Supply, HD,
  // OOS days top 5 SKUs). For non-default profiles, show an empty list so the
  // wrong-brand criteria can't render.
  const criteria = isDefault ? (CHANGE_CRITERIA[layer.key] ?? CHANGE_CRITERIA.default) : [];
  const challengePlaceholder = isDefault
    ? resolve("e.g. The DIY variance is macro-driven, not Meridian Industrial-specific. Tractor Supply's Q3 print will show similar softness.")
    : "e.g. The variance is macro-driven, not company-specific. Peer prints this quarter will show similar softness.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ background: "rgba(15,26,51,0.45)" }}
         onClick={onClose}>
      <div className="w-[760px] max-w-[92vw] max-h-[88vh] overflow-hidden flex flex-col"
           style={{ background: "var(--cream)", border: "1px solid var(--navy)", borderRadius: 4 }}
           onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-8 pt-7 pb-3 border-b border-[var(--cream-dark)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="eyebrow text-[var(--coral)] mb-1">Challenge the diagnosis</div>
              <h2 className="font-serif text-[24px] leading-tight text-[var(--navy)]">{layer.title}</h2>
              <p className="font-serif italic text-[14px] text-[var(--slate)] mt-1">
                The system defends its position with the counter-arguments it already considered, and tells you what would change its mind.
              </p>
            </div>
            <button onClick={onClose} className="text-[var(--slate-light)] hover:text-[var(--navy)]">
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex items-center gap-1 mt-4">
            <TabBtn active={tab === "counter"} onClick={() => setTab("counter")}
                    icon={<ShieldCheck size={12} strokeWidth={2} />} label={`Counter-arguments · ${layer.counterArgs.length}`} />
            <TabBtn active={tab === "criteria"} onClick={() => setTab("criteria")}
                    icon={<AlertTriangle size={12} strokeWidth={2} />} label={`Falsification · ${criteria.length}`} />
            <TabBtn active={tab === "submit"} onClick={() => setTab("submit")}
                    icon={<Send size={12} strokeWidth={2} />} label="Submit your challenge" />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scroll-area px-8 py-5">
          {tab === "counter" && (
            <div className="space-y-3">
              <p className="font-serif italic text-[13px] text-[var(--slate)] mb-2">
                Each was tested against the available evidence. Confidence interval shows how likely each alternative is, given the data.
              </p>
              {layer.counterArgs.map((c, i) => (
                <div key={i} className="card !p-4 !border-[var(--cream-dark)]">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <div className="font-sans font-semibold text-[14px] text-[var(--navy)]">{c.title}</div>
                    <span className="pill pill-amber">{c.ci}</span>
                  </div>
                  <div className="font-sans text-[12px] text-[var(--slate)] italic leading-snug">{c.detail}</div>
                  <div className="mt-2 pt-2 border-t border-[var(--cream-dark)] flex items-center gap-2">
                    <span className="font-sans font-bold text-[10px] uppercase tracking-wider text-[var(--coral)]">Verdict</span>
                    <span className="font-sans text-[11px] text-[var(--slate)] italic">Rejected, evidence weight insufficient to displace primary diagnosis.</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "criteria" && (
            <div className="space-y-3">
              <p className="font-serif italic text-[13px] text-[var(--slate)] mb-2">
                These are the observations that would force the system to re-rank or reject its diagnosis. Each is monitored continuously.
              </p>
              {criteria.map((c, i) => (
                <div key={i} className="card !p-4 !border-[var(--cream-dark)]">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <div className="font-sans font-semibold text-[14px] text-[var(--navy)]">{c.title}</div>
                    <span className="pill" style={{ background: c.met ? "var(--coral-faint)" : "var(--cream-dark)", color: c.met ? "var(--coral)" : "var(--slate)" }}>
                      {c.met ? "MET" : "Not met"}
                    </span>
                  </div>
                  <div className="font-sans text-[12px] text-[var(--slate)] italic leading-snug">{c.detail}</div>
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-2 border-t border-[var(--cream-dark)] text-[11px]">
                    <div>
                      <div className="eyebrow text-[var(--slate-light)]">Current</div>
                      <div className="font-sans font-bold text-[var(--navy)] tabular-nums">{c.current}</div>
                    </div>
                    <div>
                      <div className="eyebrow text-[var(--slate-light)]">Would change mind at</div>
                      <div className="font-sans font-bold text-[var(--coral)] tabular-nums">{c.target}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "submit" && (
            <div className="space-y-4">
              {submitted ? (
                <div className="card card-accent-teal !p-5 text-center">
                  <div className="eyebrow text-[var(--teal)] mb-2">Challenge logged</div>
                  <div className="font-serif text-[16px] text-[var(--navy)]">Routed to the diagnosis stack, re-scored within 4 minutes.</div>
                  <div className="font-sans italic text-[11px] text-[var(--slate)] mt-2">
                    The next scoring cycle will surface your hypothesis as a candidate alternative and report back through the Narrator.
                  </div>
                </div>
              ) : (
                <>
                  <p className="font-serif italic text-[13px] text-[var(--slate)]">
                    State what you think the system has wrong. The challenge is logged, tested against the evidence, and re-scored on the next cycle.
                  </p>
                  <textarea
                    value={challengeText}
                    onChange={(e) => setChallengeText(e.target.value)}
                    placeholder={challengePlaceholder}
                    className="w-full h-32 p-3 rounded-sm font-serif italic text-[14px] leading-relaxed resize-none"
                    style={{ background: "var(--paper)", border: "1px solid var(--cream-dark)", color: "var(--ink)" }} />
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-[11px] text-[var(--slate-light)] italic">
                      Submission is logged to the audit trail with your user.
                    </span>
                    <button onClick={() => setSubmitted(true)}
                            disabled={challengeText.trim().length < 8}
                            className="btn-ghost disabled:opacity-40 disabled:cursor-not-allowed">
                      <Send size={12} strokeWidth={1.8} /> Submit challenge
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-3 flex items-center justify-between border-t border-[var(--cream-dark)]" style={{ background: "var(--cream-light)" }}>
          <div className="flex items-center gap-3">
            <span className="eyebrow text-[var(--slate-light)]">Current confidence</span>
            <span className="font-sans text-[18px] font-bold text-[var(--navy)] tabular-nums">{conf}%</span>
            {conf > layer.confidence && (
              <span className="pill pill-teal">+{conf - layer.confidence}pp after re-run</span>
            )}
          </div>
          <button onClick={rediagnose} className="btn-ghost" disabled={loading}>
            <RotateCw size={14} strokeWidth={1.5} className={loading ? "animate-spin" : ""} />
            {loading ? "Re-running stack…" : "Force re-diagnosis"}
            {!loading && <ChevronRight size={12} strokeWidth={2} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-sans text-[12px] font-semibold transition-colors"
            style={{
              background: active ? "var(--navy)" : "transparent",
              color: active ? "white" : "var(--slate)",
              border: active ? "1px solid var(--navy)" : "1px solid transparent",
            }}>
      {icon}
      {label}
    </button>
  );
}
