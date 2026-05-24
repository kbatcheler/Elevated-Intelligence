import { useState } from "react";
import { Sliders, RotateCcw } from "lucide-react";
import type { Scenario } from "../data/scenarios";
import { computeImpact } from "../data/scenarios";

// Formatters per output unit. Each output knows its own unit so the same
// component renders dollars, percentage points, percent, and days without
// per-layer special-casing.
function fmtOutput(value: number, unit: "USD_M" | "PP" | "PCT" | "DAYS"): { text: string; tone: "good" | "bad" | "neutral" } {
  if (unit === "USD_M") {
    const sign = value >= 0 ? "+" : "−";
    return { text: `${sign}$${Math.abs(value).toFixed(2)}M`, tone: value >= 0 ? "good" : "bad" };
  }
  if (unit === "PP") {
    const sign = value >= 0 ? "+" : "";
    return { text: `${sign}${value.toFixed(2)}pp`, tone: value > 0 ? "good" : value < 0 ? "bad" : "neutral" };
  }
  if (unit === "PCT") {
    return { text: `${value.toFixed(0)}%`, tone: "neutral" };
  }
  // DAYS, fewer = better
  return { text: `${Math.max(0, Math.round(value))}d`, tone: value < 30 ? "good" : value < 50 ? "neutral" : "bad" };
}

export default function WhatIfLevers({ scenario }: { scenario: Scenario }) {
  const [values, setValues] = useState<Record<string, number>>(
    () => Object.fromEntries(scenario.levers.map(l => [l.id, l.default])),
  );
  const reset = () => setValues(Object.fromEntries(scenario.levers.map(l => [l.id, l.default])));
  const isDirty = scenario.levers.some(l => values[l.id] !== l.default);
  const impact = computeImpact(scenario, values);

  return (
    <div className="card card-accent-gold">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Sliders size={14} strokeWidth={1.8} className="text-[var(--gold)]" />
          <div className="font-sans font-semibold text-[15px] text-[var(--navy)]">
            What-if · {scenario.title}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <button onClick={reset} className="flex items-center gap-1 font-sans text-[11px] text-[var(--slate)] hover:text-[var(--navy)]">
              <RotateCcw size={11} strokeWidth={1.8} /> Reset
            </button>
          )}
          <span className="pill" style={{ background: isDirty ? "var(--amber-faint)" : "var(--cream-dark)", color: isDirty ? "var(--amber)" : "var(--slate)" }}>
            {isDirty ? "Scenario active" : "Baseline"}
          </span>
        </div>
      </div>
      <div className="font-sans italic text-[11px] text-[var(--slate-light)] mb-4">
        Move the levers, the system re-computes impact using the elasticities this layer references. Baseline recovery anchor: ${scenario.baselineRecovery.toFixed(2)}M.
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7 space-y-4">
          {scenario.levers.map(l => {
            const val = values[l.id];
            const pct = ((val - l.min) / (l.max - l.min)) * 100;
            const defPct = ((l.default - l.min) / (l.max - l.min)) * 100;
            const isBoolean = l.min === 0 && l.max === 1 && (l.step ?? 1) === 1;
            return (
              <div key={l.id}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-sans font-semibold text-[12px] text-[var(--navy)]">{l.label}</span>
                  <span className="font-sans font-bold text-[13px] tabular-nums text-[var(--navy)]">
                    {isBoolean ? (val === 1 ? "Yes" : "No") : `${val}${l.unit}`}
                  </span>
                </div>
                <div className="relative">
                  <input type="range"
                         min={l.min} max={l.max} step={l.step ?? 1} value={val}
                         onChange={(e) => setValues(v => ({ ...v, [l.id]: Number(e.target.value) }))}
                         className="w-full appearance-none h-1.5 rounded-full cursor-pointer"
                         style={{
                           background: `linear-gradient(to right, var(--coral) ${pct}%, var(--cream-dark) ${pct}%)`,
                         }} />
                  <div className="absolute top-1/2 -translate-y-1/2 h-3 w-px bg-[var(--navy)] opacity-60 pointer-events-none"
                       style={{ left: `${defPct}%` }} />
                </div>
                <div className="flex justify-between font-sans text-[10px] text-[var(--slate-light)] tabular-nums mt-1">
                  <span>{l.min}{l.unit}</span>
                  <span className="italic" title={l.helpText}>baseline {isBoolean ? (l.default === 1 ? "Yes" : "No") : `${l.default}${l.unit}`}</span>
                  <span>{l.max}{l.unit}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="col-span-5 pl-4 border-l border-[var(--cream-dark)] flex flex-col justify-center">
          <div className="eyebrow text-[var(--slate-light)] mb-2">Modelled Q4 impact</div>
          <ImpactRow label={scenario.outputs.primaryLabel}   value={fmtOutput(impact.primary,   scenario.outputs.primaryUnit)}   primary />
          <ImpactRow label={scenario.outputs.secondaryLabel} value={fmtOutput(impact.secondary, scenario.outputs.secondaryUnit)} />
          <ImpactRow label={scenario.outputs.tertiaryLabel}  value={fmtOutput(impact.tertiary,  scenario.outputs.tertiaryUnit)} />
          <div className="mt-4 pt-3 border-t border-[var(--cream-dark)]">
            <div className="font-sans italic text-[10px] text-[var(--slate-light)] leading-snug">
              Modelled via the elasticities cited in this layer's narrative. Treat as directional, not committed.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImpactRow({ label, value, primary }: { label: string; value: { text: string; tone: "good" | "bad" | "neutral" }; primary?: boolean }) {
  const color = primary
    ? (value.tone === "bad" ? "var(--coral)" : value.tone === "good" ? "var(--teal)" : "var(--navy)")
    : "var(--navy)";
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-[var(--cream-dark)] last:border-0">
      <span className="eyebrow text-[var(--slate-light)]">{label}</span>
      <span className="font-sans font-bold tabular-nums" style={{ fontSize: primary ? 22 : 15, color }}>{value.text}</span>
    </div>
  );
}
