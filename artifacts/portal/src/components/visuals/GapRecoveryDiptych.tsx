import type { LayerData } from "../../data/layers";
import { parseImpactUsdM, formatUsdM } from "../../lib/parseImpact";

// Gap vs Recovery diptych, full-width single-glance summary.
//
// Two stacked vertical bars on a shared scale: coral on the left summing
// every cause.impact that parses to a $ figure, teal on the right summing
// every action.impact that parses. Tells the whole "we're losing X, we can
// recover Y" story before the reader has to read any prose.
//
// Hidden when the layer has no parseable $ figures on either side, since
// some layers (qualitative diagnoses) have pp / percent / narrative-only
// impacts and fabricating a bar there would be misleading.

type Item = { label: string; value: number; idx: number };

export default function GapRecoveryDiptych({ layer }: { layer: LayerData }) {
  const losses: Item[] = layer.causes
    .map((c, i) => ({ label: c.title, value: parseImpactUsdM(c.impact), idx: i }))
    .filter((x): x is Item => x.value !== null && x.value > 0);
  const recoveries: Item[] = layer.actions
    .map((a, i) => ({ label: a.title, value: parseImpactUsdM(a.impact), idx: i }))
    .filter((x): x is Item => x.value !== null && x.value > 0);

  if (losses.length === 0 && recoveries.length === 0) return null;

  const lossTotal = losses.reduce((s, x) => s + x.value, 0);
  const recTotal = recoveries.reduce((s, x) => s + x.value, 0);
  const max = Math.max(lossTotal, recTotal, 1);
  const BAR_PX = 260;

  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-4">
        <div className="font-sans font-semibold text-[14px] text-[var(--navy)]">
          Gap vs recovery
        </div>
        <div className="font-sans text-[11px] text-[var(--slate-light)]">
          Estimated dollar impact, summed from cause and action statements
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <Column
          title="Loss in flight"
          subtitle={`${losses.length} ${losses.length === 1 ? "root cause" : "root causes"}`}
          accent="var(--coral)"
          accentSoft="var(--coral)"
          total={lossTotal}
          max={max}
          maxPx={BAR_PX}
          items={losses}
        />
        <Column
          title="Recovery on the table"
          subtitle={`${recoveries.length} ${recoveries.length === 1 ? "action" : "actions"}`}
          accent="var(--teal)"
          accentSoft="var(--teal)"
          total={recTotal}
          max={max}
          maxPx={BAR_PX}
          items={recoveries}
        />
      </div>

      <div className="mt-4 pt-3 border-t border-[var(--cream-dark)] font-sans italic text-[11px] text-[var(--slate-light)]">
        Net position:{" "}
        <span className="not-italic font-semibold tabular-nums" style={{
          color: recTotal >= lossTotal ? "var(--teal)" : "var(--coral)",
        }}>
          {recTotal >= lossTotal ? "+" : "-"}{formatUsdM(Math.abs(recTotal - lossTotal))}
        </span>{" "}
        {recTotal >= lossTotal
          ? "recoverable headroom against modelled loss"
          : "modelled loss exceeds recoverable actions"}.
      </div>
    </div>
  );
}

function Column({
  title, subtitle, accent, accentSoft, total, max, maxPx, items,
}: {
  title: string; subtitle: string; accent: string; accentSoft: string;
  total: number; max: number; maxPx: number; items: Item[];
}) {
  const totalPx = Math.max(8, Math.round((total / max) * maxPx));
  return (
    <div className="flex flex-col">
      <div className="flex items-baseline justify-between mb-2">
        <div className="eyebrow" style={{ color: accent }}>{title}</div>
        <div className="font-sans text-[10px] text-[var(--slate-light)]">{subtitle}</div>
      </div>
      <div className="flex items-end gap-4" style={{ height: maxPx + 8 }}>
        <div className="relative flex flex-col-reverse" style={{ width: 56, height: totalPx, borderRadius: 2, overflow: "hidden", border: `1px solid ${accent}` }}>
          {items.map((it, i) => {
            const segPx = (it.value / total) * totalPx;
            const opacity = 0.55 + (0.45 * (i / Math.max(1, items.length - 1)));
            return (
              <div
                key={it.idx}
                title={`${it.label} · ${formatUsdM(it.value)}`}
                style={{
                  height: segPx,
                  background: accentSoft,
                  opacity,
                  borderTop: i === 0 ? "none" : "1px solid var(--paper)",
                }}
              />
            );
          })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-sans font-semibold tabular-nums" style={{ fontSize: 30, lineHeight: 1, color: accent }}>
            {formatUsdM(total)}
          </div>
          <ul className="mt-2 space-y-1">
            {items.map((it) => (
              <li key={it.idx} className="flex items-baseline gap-2 text-[11px] text-[var(--slate)]">
                <span className="h-1 w-1 rounded-full shrink-0 mt-1" style={{ background: accent }} />
                <span className="flex-1 min-w-0 truncate">{it.label}</span>
                <span className="font-sans font-semibold tabular-nums shrink-0" style={{ color: accent }}>
                  {formatUsdM(it.value)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
