import { useState, useEffect } from "react";
import { Monitor, ArrowRight } from "lucide-react";

// Mobile splash. The portal is a dense executive surface, optimised for a
// 13"+ laptop. Below 1024px we replace the whole app with a deliberate
// "open this on a laptop" frame, rather than serve a half-broken miniature.
// The override link writes localStorage.eiForceDesktop=1 so the visitor can
// power through if they want to.
export default function MobileSplash({ onOverride }: { onOverride: () => void }) {
  const handleOverride = () => {
    try { localStorage.setItem("ei.forceDesktop", "1"); } catch { /* noop */ }
    onOverride();
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
         style={{ background: "var(--navy)", color: "var(--cream)" }}>
      <div className="flex items-center gap-2.5 mb-8">
        <span className="h-2 w-2 rounded-full" style={{ background: "var(--gold)" }} />
        <span className="font-serif text-[22px] font-semibold tracking-tight">Different Day</span>
        <span className="font-sans text-[10px] tracking-[0.18em] uppercase text-[var(--gold-light)] ml-1">Elevated Intelligence</span>
      </div>

      <Monitor size={48} strokeWidth={1.2} className="text-[var(--gold)] mb-6" />

      <h1 className="font-serif text-[28px] font-semibold leading-tight text-center max-w-[420px]">
        This is a desk-and-coffee experience.
      </h1>
      <p className="font-serif italic text-[15px] text-[var(--cream)] opacity-80 mt-3 text-center max-w-[440px] leading-snug">
        Fourteen operating layers, a five-stage reasoning chain, and live what-if levers, all sized for the laptop you read morning briefs on, not the phone you scroll between meetings.
      </p>

      <div className="mt-8 px-5 py-4 rounded-sm" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)" }}>
        <div className="eyebrow text-[var(--gold-light)] mb-1">Recommended</div>
        <div className="font-sans text-[13px] text-[var(--cream)]">Open this on a laptop or 13"+ tablet in landscape.</div>
      </div>

      <button onClick={handleOverride}
              className="mt-8 group flex items-center gap-2 font-sans text-[12px] uppercase tracking-wider text-[var(--gold-light)] hover:text-[var(--cream)] transition-colors">
        I know, show me the portal anyway <ArrowRight size={12} strokeWidth={1.8} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
      <div className="font-sans italic text-[11px] text-[var(--cream)] opacity-50 mt-2">we'll remember the choice for this device</div>
    </div>
  );
}

// Hook: returns true when we should show the splash. Tracks viewport width
// and the localStorage override flag together so flipping either one
// re-renders the app.
export function useShouldShowMobileSplash(): [boolean, () => void] {
  const [override, setOverride] = useState<boolean>(() => {
    try { return localStorage.getItem("ei.forceDesktop") === "1"; } catch { return false; }
  });
  const [narrow, setNarrow] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < 1024 : false,
  );
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const clearOverride = () => setOverride(true);
  return [narrow && !override, clearOverride];
}
