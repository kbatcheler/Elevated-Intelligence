import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useCompany } from "../context/CompanyContext";

// A 2.8-second splash that plays when a company profile is switched.
// Performative — gives the rep the "live ingestion" feel during a demo.

const STEPS = [
  { ms: 200,  label: "Pulling homepage + recent filings" },
  { ms: 600,  label: "Resolving competitor set + peer benchmarks" },
  { ms: 1000, label: "Mapping operational geography + named distribution centres" },
  { ms: 1500, label: "Threading recent news into anomaly inbox" },
  { ms: 2000, label: "Seeding all 13 intelligence layers" },
  { ms: 2500, label: "Computing scenario war-room baselines" },
];

export default function CompanyBootSplash() {
  const { bootSplash } = useCompany();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!bootSplash?.open) return undefined;
    setTick(0);
    const timers = STEPS.map((s, i) => setTimeout(() => setTick(i + 1), s.ms));
    return () => { timers.forEach(clearTimeout); };
  }, [bootSplash?.open, bootSplash?.profileName]);

  if (!bootSplash?.open) return null;

  return (
    <div role="status" aria-live="polite" aria-label="Seeding company intelligence"
         className="fixed inset-0 z-[70] flex items-center justify-center px-6"
         style={{ background: "rgba(15,26,51,0.92)" }}>
      <div className="w-[560px] max-w-full">
        <div className="text-center mb-7">
          <div className="eyebrow text-[var(--gold-light)] mb-2">Different Day · Elevated Intelligence</div>
          <h1 className="font-serif font-semibold text-[40px] leading-[1.05] text-[var(--cream)] mb-2">
            Seeding the framework for
          </h1>
          <div className="font-serif font-bold text-[44px] leading-tight" style={{ color: "var(--gold-light)" }}>
            {bootSplash.profileName}
          </div>
        </div>

        <ul className="space-y-2.5">
          {STEPS.map((s, i) => {
            const done = i < tick;
            const active = i === tick;
            return (
              <li key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-sm transition-opacity"
                  style={{
                    background: done ? "rgba(212,175,55,0.10)" : active ? "rgba(212,175,55,0.06)" : "rgba(255,255,255,0.02)",
                    opacity: done || active ? 1 : 0.45,
                    border: done ? "1px solid rgba(212,175,55,0.35)" : "1px solid rgba(255,255,255,0.08)",
                  }}>
                <span className="shrink-0">
                  {done
                    ? <CheckCircle2 size={16} strokeWidth={1.8} style={{ color: "var(--gold-light)" }} />
                    : active
                      ? <Loader2 size={16} strokeWidth={1.8} className="animate-spin" style={{ color: "var(--gold-light)" }} />
                      : <span className="block h-3 w-3 rounded-full" style={{ background: "rgba(255,255,255,0.18)", marginLeft: 2 }} />}
                </span>
                <span className={"font-sans text-[13px] " + (done ? "text-[var(--cream)]" : "text-[var(--cream)]/80")}>
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="text-center mt-7 font-serif italic text-[12px] text-[var(--cream)]/55">
          Synthetic seed data · the sales rep should review before the meeting
        </div>
      </div>
    </div>
  );
}
