import { useEffect, useState } from "react";
import { ChevronDown, Eye } from "lucide-react";

// ----------------------------------------------------------------------------
// Persona lens.
//
// A dropdown in the header that lets the viewer "be" the CEO, CFO, COO, or
// Head of Sales for a moment. The active persona is read by App.tsx and
// used to prepend a "For you" group to the sidebar surfacing the layer keys
// this persona cares about most.
//
// We deliberately don't *hide* other layers, analysts still need full
// access. The lens just promotes what's relevant. Setting is persisted in
// localStorage so demos that come back the next day still see "their" view.
// ----------------------------------------------------------------------------

export type Persona = "ceo" | "cfo" | "coo" | "sales";

export interface PersonaDef {
  id: Persona;
  label: string;
  short: string;       // 2-3 char monogram for the toggle
  topLayerKeys: string[]; // ordered, top first
  blurb: string;       // short tagline shown in the dropdown
}

// Layer keys must match those in App.tsx NAV; if a key isn't a real layer
// in NAV it's silently ignored downstream so a typo can't crash the shell.
export const PERSONAS: Record<Persona, PersonaDef> = {
  ceo: {
    id: "ceo",
    label: "CEO",
    short: "CEO",
    topLayerKeys: ["business-performance", "scenario-warroom", "track-record", "committed-actions"],
    blurb: "The narrative, the recovery plan, the track record.",
  },
  cfo: {
    id: "cfo",
    label: "CFO",
    short: "CFO",
    topLayerKeys: ["finance", "pricing-margin", "receivables", "business-performance"],
    blurb: "Margin, working capital, cash discipline.",
  },
  coo: {
    id: "coo",
    label: "COO",
    short: "COO",
    topLayerKeys: ["supply-chain", "people-operations", "engagement-pipeline", "committed-actions"],
    blurb: "Throughput, people, what's actually moving.",
  },
  sales: {
    id: "sales",
    label: "Head of Sales",
    short: "SAL",
    topLayerKeys: ["sales-pipeline", "demand-intelligence", "customer-intelligence", "competitive-intelligence"],
    blurb: "Pipeline, demand, customer, competitor.",
  },
};

const STORAGE_KEY = "dd-persona-v1";

/** Read+write the persisted persona, falling back to null on first visit. */
export function usePersistedPersona(): [Persona | null, (p: Persona | null) => void] {
  const [persona, setPersonaState] = useState<Persona | null>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "ceo" || v === "cfo" || v === "coo" || v === "sales") return v;
    } catch { /* ignore */ }
    return null;
  });
  const setPersona = (p: Persona | null) => {
    setPersonaState(p);
    try {
      if (p == null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, p);
    } catch { /* ignore */ }
  };
  return [persona, setPersona];
}

interface ToggleProps {
  value: Persona | null;
  onChange: (p: Persona | null) => void;
}

export default function PersonaLensToggle({ value, onChange }: ToggleProps) {
  const [open, setOpen] = useState(false);

  // Close on Escape and on outside click.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const active = value ? PERSONAS[value] : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title="Switch the portal to a persona view"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm font-sans text-[11px] uppercase tracking-wider text-[var(--cream)] hover:bg-white/10 transition-colors"
        style={{ border: "1px solid rgba(212,175,55,0.4)" }}
      >
        <Eye size={12} strokeWidth={1.8} className="text-[var(--gold-light)]" />
        <span className="opacity-70">Lens:</span>
        <span className="font-semibold">{active ? active.short : "All"}</span>
        <ChevronDown size={11} strokeWidth={1.8} className="opacity-70" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 w-[260px] rounded-sm overflow-hidden"
               style={{ background: "var(--cream)", border: "1px solid var(--cream-dark)", boxShadow: "0 10px 30px rgba(15,26,51,0.25)" }}>
            <div className="px-3 py-2 border-b border-[var(--cream-dark)]" style={{ background: "var(--cream-light)" }}>
              <div className="eyebrow text-[var(--gold)]">Persona lens</div>
              <p className="font-serif italic text-[11px] text-[var(--slate)] leading-snug mt-0.5">
                Re-order the sidebar around what one role cares about.
              </p>
            </div>
            <ul>
              <li>
                <button onClick={() => { onChange(null); setOpen(false); }}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--cream-light)] transition-colors flex items-baseline justify-between gap-2">
                  <span className={"font-sans text-[13px] " + (value === null ? "font-semibold text-[var(--navy)]" : "text-[var(--slate)]")}>
                    All views
                  </span>
                  <span className="font-serif italic text-[10px] text-[var(--slate-light)]">no re-ordering</span>
                </button>
              </li>
              {(Object.values(PERSONAS)).map(p => {
                const isActive = value === p.id;
                return (
                  <li key={p.id}>
                    <button onClick={() => { onChange(p.id); setOpen(false); }}
                            className="w-full text-left px-3 py-2 hover:bg-[var(--cream-light)] transition-colors block"
                            style={isActive ? { background: "var(--cream-light)", borderLeft: "3px solid var(--gold)", paddingLeft: 9 } : undefined}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={"font-sans text-[13px] " + (isActive ? "font-semibold text-[var(--navy)]" : "text-[var(--slate)]")}>
                          {p.label}
                        </span>
                        <span className="font-sans text-[9px] uppercase tracking-wider text-[var(--gold)]">{p.short}</span>
                      </div>
                      <p className="font-serif italic text-[11px] text-[var(--slate-light)] leading-snug mt-0.5">{p.blurb}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
