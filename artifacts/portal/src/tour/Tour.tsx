import { useEffect, useState } from "react";
import { ArrowRight, X, Sparkles } from "lucide-react";
import { useSwap } from "../context/CompanyContext";

// Six-step welcome walkthrough. Editorial cards in the centre — no spotlight,
// no DOM-anchoring fragility. Each step has a one-line synopsis and a longer
// paragraph that explains the concept. First-visit only via localStorage.

interface Step {
  eyebrow: string;
  title: string;
  body: string;
  hint?: string;
}

const STEPS_RAW: Step[] = [
  {
    eyebrow: "Welcome",
    title: "This is the framework, not the report.",
    body: "Different Day decomposes a business into 13 intelligence layers — each with one question it answers, a confidence band, and a set of recommended next steps. Underneath, the operational depth lives in Demand by Different Day for demand, supply, pricing and sales.",
  },
  {
    eyebrow: "How to read a layer",
    title: "Question · diagnosis · confidence · next steps.",
    body: "Every layer asks one question. The answer carries a confidence band (gold = high-confidence; coral = needs work). Below it sits the diagnosis, the data feeds that power it, and a three-horizon prescriptive playbook — what to do today, this week, this month.",
    hint: "Click any number with a gold dot to see the math behind it.",
  },
  {
    eyebrow: "Cross-layer intelligence",
    title: "Findings travel between layers.",
    body: "The system reads every layer in context with every other. The Phoenix DC labour shortfall in Supply explains the order-ETA spike in Customer; the Pricing match-cap recovers margin lost via Demand's counter-promo. Open the cross-layer map (System group) to see the full flow.",
  },
  {
    eyebrow: "Ask anything",
    title: "Natural-language access to the whole stack.",
    body: "The 'Ask Different Day' button (bottom-right) takes any executive question — what's the headline, where should I start, what if we cut price by 5%, show me Phoenix — and answers with citations, follow-ups, and the ability to jump you straight into the relevant layer.",
  },
  {
    eyebrow: "Commit and track",
    title: "Every recommendation is held to its prediction.",
    body: "Hit 'Commit' on any next step and it lands in the action tray. Past committed actions live in the Track record page (System group) with predicted vs delivered outcomes. The system is accountable for what it recommends.",
  },
  {
    eyebrow: "Scenario thinking",
    title: "Stack levers in the war-room.",
    body: "The Scenario war-room lets you stack every reversible lever — pricing, demand, supply, marketing, receivables — and see the combined Q4 EBITDA bridge update live, with a confidence band. Commit the whole scenario in one click.",
  },
];

const STORAGE_KEY = "differentday.tourCompleted.v1";

export default function Tour() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        timer = setTimeout(() => setOpen(true), 800);
      }
    } catch {
      // ignore storage errors
    }
    return () => { if (timer) clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft" && i > 0) setI(i - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, i]);

  const finish = () => {
    try { window.localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setOpen(false);
  };

  const STEPS = useSwap(STEPS_RAW);
  const next = () => { if (i < STEPS.length - 1) setI(i + 1); else finish(); };

  if (!open) return null;
  const step = STEPS[i];
  const isLast = i === STEPS.length - 1;

  return (
    <div role="dialog" aria-modal="true" aria-label="Welcome tour"
         className="fixed inset-0 z-[60] flex items-center justify-center px-6"
         style={{ background: "rgba(15,26,51,0.65)" }}>
      <div className="w-[640px] max-w-full rounded-sm overflow-hidden"
           style={{ background: "var(--paper)", border: "1px solid var(--gold)", boxShadow: "0 24px 80px rgba(15,26,51,0.45)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3"
             style={{ background: "var(--navy)", color: "var(--cream)" }}>
          <div className="flex items-center gap-2.5">
            <Sparkles size={15} strokeWidth={1.8} className="text-[var(--gold-light)]" />
            <span className="font-serif font-semibold text-[14px]">Welcome to Different Day</span>
          </div>
          <button onClick={finish} aria-label="Skip tour"
                  className="text-[var(--gold-light)] hover:text-white text-[12px] uppercase tracking-wider font-sans">
            Skip tour <X size={14} strokeWidth={1.5} className="inline ml-1 -mt-[1px]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-10 py-10">
          <div className="eyebrow text-[var(--coral)] mb-3">{step.eyebrow}</div>
          <h2 className="font-serif font-semibold text-[32px] leading-[1.1] text-[var(--navy)] mb-5">
            {step.title}
          </h2>
          <p className="font-serif text-[16px] leading-[1.6] text-[var(--ink)]">{step.body}</p>
          {step.hint && (
            <p className="font-serif italic text-[13px] text-[var(--slate)] mt-4 pl-4 border-l-2 border-[var(--gold)]">
              {step.hint}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-4 flex items-center justify-between border-t border-[var(--cream-dark)]"
             style={{ background: "var(--cream-light)" }}>
          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {STEPS.map((_, idx) => (
              <button key={idx} onClick={() => setI(idx)}
                      aria-label={`Go to step ${idx + 1}`}
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: idx === i ? 28 : 8,
                        background: idx === i ? "var(--navy)" : idx < i ? "var(--gold)" : "var(--cream-dark)",
                      }} />
            ))}
            <span className="ml-3 font-sans italic text-[11px] text-[var(--slate-light)] tabular-nums">{i + 1} / {STEPS.length}</span>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2">
            {i > 0 && (
              <button onClick={() => setI(i - 1)}
                      className="px-3 py-1.5 rounded-sm font-sans text-[11px] uppercase tracking-wider text-[var(--slate)] hover:text-[var(--navy)]">
                Back
              </button>
            )}
            <button onClick={next}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-sm font-sans font-semibold text-[11px] uppercase tracking-wider"
                    style={{ background: "var(--navy)", color: "var(--cream)" }}>
              {isLast ? "Get started" : "Next"} <ArrowRight size={12} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
