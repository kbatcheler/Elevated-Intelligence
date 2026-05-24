import { useMemo, useState } from "react";
import { Sliders, RotateCcw, CheckSquare, AlertTriangle, Shield, Banknote, TrendingUp, Zap } from "lucide-react";
import { computeImpact, type Lever } from "../data/warroom";
import { useApp } from "../context/AppContext";
import { useNarrative, useIsDefaultProfile } from "../context/CompanyContext";
import { TRACK_RECORD } from "../data/trackRecord";

// Scenario presets, each snaps multiple levers at once so the operator can
// step through framed Q4 stories instead of moving sliders one at a time.
// Values are intentionally aggressive at the high end so the bridge moves
// visibly and the trade-offs (margin vs cash vs caution warnings) are loud.
type Preset = {
  id: string;
  label: string;
  blurb: string;
  Icon: any;
  values: Record<string, number>;
};

const PRESETS: Preset[] = [
  {
    id: "conservative",
    label: "Conservative recovery",
    blurb: "Hold pricing discipline, modest counter-promo, finish what's already started.",
    Icon: Shield,
    values: {
      "match-cap": 22, "counter-promo": 2, "phoenix-shifts": 11,
      "supplier-c": 4, "marketing-realloc": 50, "credit-holds": 3,
    },
  },
  {
    id: "margin-defence",
    label: "Margin defence",
    blurb: "Tighten the match-cap, suspend counter-promo, push the email reallocation hard.",
    Icon: TrendingUp,
    values: {
      "match-cap": 18, "counter-promo": 0, "phoenix-shifts": 11,
      "supplier-c": 4, "marketing-realloc": 100, "credit-holds": 3,
    },
  },
  {
    id: "aggressive-cash",
    label: "Aggressive cash",
    blurb: "Maximise working-capital release, accept the named-account churn risk.",
    Icon: Banknote,
    values: {
      "match-cap": 22, "counter-promo": 2, "phoenix-shifts": 11,
      "supplier-c": 4, "marketing-realloc": 50, "credit-holds": 8,
    },
  },
  {
    id: "growth-push",
    label: "Growth push",
    blurb: "Stack every revenue lever, counter-promo full, dual-source aggressively, reallocate hard.",
    Icon: Zap,
    values: {
      "match-cap": 26, "counter-promo": 4, "phoenix-shifts": 14,
      "supplier-c": 8, "marketing-realloc": 110, "credit-holds": 3,
    },
  },
];

// Pulls the most recent closed outcome from the track record for a given
// lever, matched by layer. TRACK_RECORD is authored in chronological order
// (oldest first), so we scan from the end to surface the latest comparable
//, that's what gives the "last time we moved this layer" claim its bite.
const historicalForLayer = (layer: string) => {
  for (let i = TRACK_RECORD.length - 1; i >= 0; i--) {
    const t = TRACK_RECORD[i];
    if (t.layer === layer && t.status !== "in-flight") return t;
  }
  return undefined;
};

const fmt = (n: number, prefix = "$") => {
  const sign = n >= 0 ? "+" : "−";
  return `${sign}${prefix}${Math.abs(n).toFixed(2)}M`;
};

export default function WarRoom({ onNavigate }: { onNavigate: (key: string) => void }) {
  const { LEVERS } = useNarrative();
  const { commitAction } = useApp();
  const [values, setValues] = useState<Record<string, number>>(
    () => Object.fromEntries(LEVERS.map(l => [l.id, l.defaultValue])),
  );
  const impact = useMemo(() => computeImpact(values), [values]);
  const allDefault = LEVERS.every(l => values[l.id] === l.defaultValue);

  const reset = () =>
    setValues(Object.fromEntries(LEVERS.map(l => [l.id, l.defaultValue])));

  const applyPreset = (p: Preset) => setValues(p.values);
  // A preset is "active" when every lever matches its stored value, so the
  // chip highlights only when the user is actually viewing that scenario.
  const activePresetId = PRESETS.find(p =>
    LEVERS.every(l => values[l.id] === (p.values[l.id] ?? l.defaultValue)),
  )?.id;
  // Presets are hand-authored against the Meridian Industrial lever IDs, they don't
  // apply to alternate narratives whose levers may have different keys or
  // counts. Only render the preset row when the narrative's lever set
  // matches what the presets target.
  const isDefault = useIsDefaultProfile();
  const presetsApply = isDefault && PRESETS[0]
    && Object.keys(PRESETS[0].values).every(k => LEVERS.some(l => l.id === k));

  const commitAll = () => {
    LEVERS.forEach(l => {
      const v = values[l.id];
      if (v === l.defaultValue) return;
      commitAction({
        layer: l.layer,
        layerTitle: l.layerLabel,
        title: `War-room: ${l.title} → ${v}${l.unit}`,
        detail: l.description,
        impact: `Set to ${v}${l.unit} from default ${l.defaultValue}${l.unit}`,
        owner: "Scenario war-room",
        due: "Pending review",
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="eyebrow text-[var(--coral)] mb-2">Scenario · Multi-lever planner</div>
          <h1 className="font-serif text-[40px] leading-[1.05] text-[var(--navy)] font-semibold">Scenario war-room</h1>
          <p className="font-serif italic text-[20px] text-[var(--slate-light)] mt-1.5">Stack every reversible lever. See the combined Q4 bridge update live, with confidence.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} disabled={allDefault}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-sm font-sans text-[11px] uppercase tracking-wider border border-[var(--cream-dark)] text-[var(--slate)] hover:text-[var(--navy)] hover:border-[var(--navy)] disabled:opacity-40">
            <RotateCcw size={12} strokeWidth={1.8} /> Reset to baseline
          </button>
          <button onClick={commitAll} disabled={allDefault}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-sm font-sans font-semibold text-[11px] uppercase tracking-wider disabled:opacity-40"
                  style={{ background: "var(--navy)", color: "var(--cream)", border: "1px solid var(--gold)" }}>
            <CheckSquare size={12} strokeWidth={1.8} /> Commit scenario to tray
          </button>
        </div>
      </div>

      {/* Scenario presets, one-click stacks of the six levers. Lets the
          operator step through framed Q4 stories before tweaking sliders.
          Only renders for narratives whose levers match the preset shape. */}
      {presetsApply && (
      <div className="card">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="eyebrow text-[var(--coral)] mb-1">Scenario presets</div>
            <div className="font-serif italic text-[13px] text-[var(--slate)] leading-snug">
              Snap all six levers to a framed stance. Then fine-tune any single slider below.
            </div>
          </div>
          <div className="font-sans text-[11px] text-[var(--slate-light)]">
            {activePresetId ? `Viewing: ${PRESETS.find(p => p.id === activePresetId)?.label}` : "Custom mix"}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {PRESETS.map(p => {
            const active = p.id === activePresetId;
            const PIcon = p.Icon;
            return (
              <button key={p.id} onClick={() => applyPreset(p)}
                      className="text-left p-3 rounded border transition-colors"
                      style={{
                        background:  active ? "var(--navy)" : "var(--cream-light)",
                        color:       active ? "var(--cream)" : "var(--navy)",
                        borderColor: active ? "var(--gold)" : "var(--cream-dark)",
                      }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <PIcon size={14} strokeWidth={1.6} style={{ color: active ? "var(--gold-light)" : "var(--coral)" }} />
                  <div className="font-sans font-semibold text-[12px]">{p.label}</div>
                </div>
                <div className={"font-sans italic text-[11px] leading-snug " + (active ? "text-[var(--cream-dark)]" : "text-[var(--slate)]")}>
                  {p.blurb}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      )}

      {/* Combined Q4 bridge */}
      <Bridge impact={impact} />

      {/* Levers */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-5 py-3 flex items-center justify-between border-b border-[var(--cream-dark)]"
             style={{ background: "var(--cream-dark)" }}>
          <div className="flex items-center gap-3">
            <Sliders size={14} strokeWidth={1.8} className="text-[var(--navy)]" />
            <span className="eyebrow text-[var(--navy)]">Reversible levers · all six</span>
          </div>
          <span className="font-sans italic text-[11px] text-[var(--slate)]">Each lever is operationally reversible inside 14 days</span>
        </div>
        <div className="divide-y divide-[var(--cream-dark)]">
          {LEVERS.map(l => (
            <LeverRow key={l.id} lever={l} value={values[l.id]}
                      onChange={(v) => setValues(s => ({ ...s, [l.id]: v }))}
                      onNavigate={onNavigate} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Bridge({ impact }: { impact: ReturnType<typeof computeImpact> }) {
  const positive = impact.ebitda >= 0;
  const color = positive ? "var(--teal)" : "var(--coral)";

  return (
    <div className="card card-accent-gold">
      <div className="grid grid-cols-12 gap-6 items-center">
        <div className="col-span-3">
          <div className="eyebrow text-[var(--slate-light)] mb-1">Combined Q4 EBITDA impact</div>
          <div className="font-serif font-bold text-[44px] tabular-nums leading-none" style={{ color }}>
            {fmt(impact.ebitda)}
          </div>
          <div className="font-sans italic text-[12px] text-[var(--slate)] mt-2">
            ± ${impact.uncertainty.toFixed(2)}M confidence band · 14d reversible
          </div>
        </div>

        {/* Visual bridge, colour by sign so a recovery is always teal, a regression always coral */}
        <div className="col-span-9">
          <div className="flex items-end h-[120px] gap-1">
            <BridgeBar label="Baseline" value={0} max={Math.max(2, Math.abs(impact.ebitda) + 0.5)} color="var(--slate-light)" />
            <BridgeBar label="Revenue stack"
                       value={impact.revenue * 0.18}
                       max={Math.max(2, Math.abs(impact.ebitda) + 0.5)}
                       color={impact.revenue >= 0 ? "var(--teal)" : "var(--coral)"} />
            <BridgeBar label="Margin stack"
                       value={impact.margin}
                       max={Math.max(2, Math.abs(impact.ebitda) + 0.5)}
                       color={impact.margin >= 0 ? "var(--teal)" : "var(--coral)"} />
            <BridgeBar label="Combined" value={impact.ebitda} max={Math.max(2, Math.abs(impact.ebitda) + 0.5)} color={color} emphasis />
          </div>
          <div className="grid grid-cols-4 mt-2 text-center">
            <BridgeFoot label="Baseline" value="$0M" />
            <BridgeFoot label="From revenue levers" value={fmt(impact.revenue * 0.18)} />
            <BridgeFoot label="From margin levers" value={fmt(impact.margin)} />
            <BridgeFoot label="Net Q4 EBITDA" value={fmt(impact.ebitda)} emphasis={color} />
          </div>
        </div>
      </div>

      {/* Additional dimensions */}
      <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-[var(--cream-dark)]">
        <Aux label="Revenue impact"  value={fmt(impact.revenue)}  detail="Combined top-line lift across all activated revenue levers" />
        <Aux label="Margin impact"   value={fmt(impact.margin)}   detail="Direct dollar margin from pricing-stack moves" />
        <Aux label="Cash impact"     value={fmt(impact.cash)}     detail="Working capital released or held by receivables stance" />
      </div>
    </div>
  );
}

function BridgeBar({ label, value, max, color, emphasis }: { label: string; value: number; max: number; color: string; emphasis?: boolean }) {
  const h = Math.max(4, (Math.abs(value) / max) * 100);
  return (
    <div className="flex-1 flex flex-col items-center justify-end" title={`${label}: ${fmt(value)}`}>
      <div style={{ height: `${h}%`, background: color, width: emphasis ? "70%" : "55%", minHeight: 4, opacity: emphasis ? 1 : 0.85 }} />
    </div>
  );
}

function BridgeFoot({ label, value, emphasis }: { label: string; value: string; emphasis?: string }) {
  return (
    <div>
      <div className="eyebrow text-[var(--slate-light)] mb-0.5">{label}</div>
      <div className="font-sans font-semibold text-[13px] tabular-nums" style={{ color: emphasis ?? "var(--navy)" }}>{value}</div>
    </div>
  );
}

function Aux({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div>
      <div className="eyebrow text-[var(--slate-light)] mb-1">{label}</div>
      <div className="font-serif font-semibold text-[22px] text-[var(--navy)] tabular-nums leading-none">{value}</div>
      <div className="font-sans italic text-[11px] text-[var(--slate)] mt-1.5 leading-snug">{detail}</div>
    </div>
  );
}

function LeverRow({ lever, value, onChange, onNavigate }: { lever: Lever; value: number; onChange: (v: number) => void; onNavigate: (k: string) => void }) {
  const isCaution = lever.cautionAbove !== undefined && value > lever.cautionAbove;
  const delta = value - lever.defaultValue;
  const impact = delta * lever.impactPerUnit;
  const directionColor =
    lever.direction === "margin" ? "var(--coral)" :
    lever.direction === "cash"   ? "var(--teal)"  :
                                   "var(--navy)";
  // Most recent comparable from the track record on the same layer, used as
  // a credibility anchor underneath the lever ("last time we moved this
  // layer it delivered X vs Y predicted").
  const prior = historicalForLayer(lever.layer);
  return (
    <div className="px-5 py-4 grid grid-cols-12 gap-4 items-center">
      {/* Lever ID + title */}
      <div className="col-span-4">
        <button onClick={() => onNavigate(lever.layer)}
                className="eyebrow text-[var(--slate-light)] hover:text-[var(--coral)] mb-1">
          {lever.layerLabel}
        </button>
        <div className="font-sans font-semibold text-[14px] text-[var(--navy)] leading-tight">{lever.title}</div>
        <p className="font-serif italic text-[12px] text-[var(--slate)] mt-1 leading-snug">{lever.description}</p>
      </div>

      {/* Slider */}
      <div className="col-span-5">
        <div className="flex items-center justify-between mb-1">
          <span className="font-sans italic text-[10px] text-[var(--slate-light)]">{lever.minLabel}</span>
          <span className="font-sans italic text-[10px] text-[var(--slate-light)]">{lever.maxLabel}</span>
        </div>
        <input
          type="range" min={lever.min} max={lever.max} step={lever.step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full accent-[var(--navy)]"
        />
        <div className="flex items-baseline justify-between mt-1">
          <span className="font-sans text-[10px] text-[var(--slate-light)]">{lever.min}{lever.unit}</span>
          <span className="font-sans font-bold text-[14px] tabular-nums text-[var(--navy)]">
            {value}{lever.unit}
          </span>
          <span className="font-sans text-[10px] text-[var(--slate-light)]">{lever.max}{lever.unit}</span>
        </div>
        {isCaution && (
          <div className="mt-2 flex items-start gap-1.5 font-sans italic text-[11px] text-[var(--amber)] leading-snug">
            <AlertTriangle size={11} strokeWidth={1.8} className="mt-[2px] shrink-0" />
            <span>{lever.cautionNote}</span>
          </div>
        )}
      </div>

      {/* Impact + historical comparable */}
      <div className="col-span-3 text-right">
        <div className="eyebrow text-[var(--slate-light)] mb-1">Δ vs baseline</div>
        <div className="font-sans font-bold text-[18px] tabular-nums leading-none" style={{ color: impact === 0 ? "var(--slate-light)" : directionColor }}>
          {impact === 0 ? "—" : fmt(impact)}
        </div>
        <div className="font-sans italic text-[10px] text-[var(--slate-light)] mt-1 uppercase tracking-wider">{lever.direction}</div>
        {prior && (
          <div className="mt-2 pt-2 border-t border-[var(--cream-dark)] text-[10px] leading-snug">
            <div className="font-sans uppercase tracking-wider text-[var(--slate-light)] mb-0.5">Last comparable · {prior.quarter}</div>
            <div className="font-sans text-[var(--slate)] italic">
              Predicted {prior.predicted}, delivered <span className="font-semibold not-italic" style={{ color: prior.status === "beat" || prior.status === "met" ? "var(--teal)" : prior.status === "missed" ? "var(--coral)" : "var(--amber)" }}>{prior.delivered}</span>.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
