import { useState } from "react";
import { Sliders, RotateCcw } from "lucide-react";

type LeverSpec = {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  default: number;
  step?: number;
};

// Each scenario defines its levers + how they roll into a P&L outcome.
const PRICING_LEVERS: LeverSpec[] = [
  { key: "promo",  label: "Promo depth",         unit: "%",   min: 14, max: 36, default: 32 },
  { key: "match",  label: "Match policy SKUs",   unit: " SKUs", min: 0,  max: 80, default: 24 },
  { key: "price",  label: "Headline price index",unit: "",    min: 96, max: 110, default: 104 },
];

const DEMAND_LEVERS: LeverSpec[] = [
  { key: "promo",     label: "DIY promo lift",         unit: "%",  min: 0,  max: 25, default: 0 },
  { key: "inventory", label: "Inter-DC inventory move",unit: "%",  min: 0,  max: 30, default: 0 },
  { key: "retrain",   label: "Forecast retrain",       unit: "",   min: 0,  max: 1,  default: 0, step: 1 },
];

const fmt = (n: number) => (n >= 0 ? "+" : "−") + "$" + Math.abs(n).toFixed(2) + "M";

function pricingImpact(v: Record<string, number>) {
  // baseline: promo 32, match 24 SKUs, price index 104 → margin gap −$0M
  // dropping promo from 32 toward 22 recovers ~$0.14M per pp
  // reducing matched SKUs recovers $0.018M per SKU dropped
  // moving price index up by 1pt recovers $0.22M but risks share
  const margin = (32 - v.promo) * 0.14 + (24 - v.match) * 0.018 + (v.price - 104) * 0.22;
  // share impact: deeper promo = +share, higher price = -share
  const share = (v.promo - 32) * 0.04 - (v.price - 104) * 0.12 - (24 - v.match) * 0.005;
  // Q4 EBITDA = margin minus a fraction of share loss
  const ebitda = margin + share * 0.6;
  return { margin, share, ebitda };
}

function demandImpact(v: Record<string, number>) {
  // promo lift recovers DIY but compresses margin
  const revenue = v.promo * 0.06 + v.inventory * 0.04 + v.retrain * 0.30;
  const marginCost = v.promo * 0.025;
  const ebitda = revenue * 0.38 - marginCost;
  const stockoutDays = Math.max(0, 41 - v.inventory * 1.1 - v.retrain * 6);
  return { revenue, ebitda, stockoutDays };
}

export default function WhatIfLevers({ scenario }: { scenario: "pricing" | "demand" }) {
  const levers = scenario === "pricing" ? PRICING_LEVERS : DEMAND_LEVERS;
  const [values, setValues] = useState<Record<string, number>>(
    () => Object.fromEntries(levers.map(l => [l.key, l.default])),
  );
  const reset = () => setValues(Object.fromEntries(levers.map(l => [l.key, l.default])));

  const impact = scenario === "pricing" ? pricingImpact(values) : demandImpact(values);
  const isDirty = levers.some(l => values[l.key] !== l.default);

  return (
    <div className="card card-accent-gold">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Sliders size={14} strokeWidth={1.8} className="text-[var(--gold)]" />
          <div className="font-sans font-semibold text-[15px] text-[var(--navy)]">
            What-if · {scenario === "pricing" ? "pricing policy" : "demand recovery"}
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
        Move the levers · the system re-computes P&L impact using the elasticities this layer references.
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7 space-y-4">
          {levers.map(l => {
            const val = values[l.key];
            const pct = ((val - l.min) / (l.max - l.min)) * 100;
            const defPct = ((l.default - l.min) / (l.max - l.min)) * 100;
            const isRetrain = l.key === "retrain";
            return (
              <div key={l.key}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="font-sans font-semibold text-[12px] text-[var(--navy)]">{l.label}</span>
                  <span className="font-sans font-bold text-[13px] tabular-nums text-[var(--navy)]">
                    {isRetrain ? (val === 1 ? "Yes" : "No") : `${val}${l.unit}`}
                  </span>
                </div>
                <div className="relative">
                  <input type="range"
                         min={l.min} max={l.max} step={l.step ?? 1} value={val}
                         onChange={(e) => setValues(v => ({ ...v, [l.key]: Number(e.target.value) }))}
                         className="w-full appearance-none h-1.5 rounded-full cursor-pointer"
                         style={{
                           background: `linear-gradient(to right, var(--coral) ${pct}%, var(--cream-dark) ${pct}%)`,
                         }} />
                  <div className="absolute top-1/2 -translate-y-1/2 h-3 w-px bg-[var(--navy)] opacity-60 pointer-events-none"
                       style={{ left: `${defPct}%` }} />
                </div>
                <div className="flex justify-between font-sans text-[10px] text-[var(--slate-light)] tabular-nums mt-1">
                  <span>{l.min}{l.unit}</span>
                  <span className="italic">baseline {isRetrain ? (l.default === 1 ? "Yes" : "No") : `${l.default}${l.unit}`}</span>
                  <span>{l.max}{l.unit}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="col-span-5 pl-4 border-l border-[var(--cream-dark)] flex flex-col justify-center">
          <div className="eyebrow text-[var(--slate-light)] mb-2">Modelled Q4 impact</div>
          {scenario === "pricing" ? (
            <>
              <ImpactRow label="Margin"   value={fmt((impact as any).margin)} />
              <ImpactRow label="Share"    value={`${(impact as any).share >= 0 ? "+" : ""}${(impact as any).share.toFixed(2)}pp`} />
              <ImpactRow label="EBITDA"   value={fmt((impact as any).ebitda)} primary />
            </>
          ) : (
            <>
              <ImpactRow label="Revenue"   value={fmt((impact as any).revenue)} />
              <ImpactRow label="EBITDA"    value={fmt((impact as any).ebitda)} primary />
              <ImpactRow label="Stockout days"  value={`${Math.round((impact as any).stockoutDays)}d`} />
            </>
          )}
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

function ImpactRow({ label, value, primary }: { label: string; value: string; primary?: boolean }) {
  const neg = value.startsWith("−") || value.startsWith("-") && !value.startsWith("−0.00");
  const color = primary ? (neg ? "var(--coral)" : "var(--teal)") : "var(--navy)";
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-[var(--cream-dark)] last:border-0">
      <span className="eyebrow text-[var(--slate-light)]">{label}</span>
      <span className="font-sans font-bold tabular-nums" style={{ fontSize: primary ? 22 : 15, color }}>{value}</span>
    </div>
  );
}
