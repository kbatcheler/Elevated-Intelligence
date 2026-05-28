import type { LayerData } from "../../data/layers";
import { parseImpactUsdM, formatUsdM } from "../../lib/parseImpact";

// Cause waterfall, horizontal bar ranking.
//
// Replaces the empty `chartCard` slot. Renders every root cause whose
// impact parses to a $ figure as a horizontal coral bar, sorted descending,
// with the rank, label, and dollar value. Layers where causes are
// qualitative (no $ figure) render nothing and the slot disappears.

export default function CauseWaterfall({ layer }: { layer: LayerData }) {
  const items = layer.causes
    .map((c, i) => ({ label: c.title, value: parseImpactUsdM(c.impact), idx: i }))
    .filter((x): x is { label: string; value: number; idx: number } => x.value !== null && x.value > 0)
    .sort((a, b) => b.value - a.value);

  if (items.length === 0) return null;
  const max = items[0].value;
  const total = items.reduce((s, x) => s + x.value, 0);

  return (
    <div className="card card-accent-coral">
      <div className="flex items-baseline justify-between mb-4">
        <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">
          Loss composition
        </div>
        <div className="font-sans text-[11px] text-[var(--slate-light)] tabular-nums">
          {formatUsdM(total)} total, ranked by modelled impact
        </div>
      </div>

      <ul className="space-y-2.5">
        {items.map((it, rank) => {
          const widthPct = Math.max(2, (it.value / max) * 100);
          const sharePct = Math.round((it.value / total) * 100);
          return (
            <li key={it.idx} className="grid items-center gap-3"
                style={{ gridTemplateColumns: "20px minmax(0, 1.6fr) minmax(0, 2fr) 64px" }}>
              <span className="font-serif font-semibold text-[14px] text-[var(--gold)] tabular-nums text-right">
                {rank + 1}.
              </span>
              <span className="font-sans text-[12px] text-[var(--navy)] truncate" title={it.label}>
                {it.label}
              </span>
              <div className="relative h-5 rounded-sm overflow-hidden"
                   style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)" }}>
                <div className="h-full flex items-center justify-end pr-2"
                     style={{ width: `${widthPct}%`, background: "var(--coral)", opacity: 0.85 }}>
                  <span className="font-sans text-[10px] font-semibold text-[var(--paper)] tabular-nums">
                    {sharePct}%
                  </span>
                </div>
              </div>
              <span className="font-sans font-semibold text-[12px] text-[var(--coral)] tabular-nums text-right">
                {formatUsdM(it.value)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
