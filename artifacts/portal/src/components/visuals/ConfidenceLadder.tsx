import type { LayerData } from "../../data/layers";

// Confidence ladder, slim full-width strip.
//
// Visualises the same story the header inline text tells ("Confidence 72%,
// close 3 gaps → 85%") as a horizontal stack: base confidence (navy) +
// per-gap +pp lift segments (amber, gold, coral cycling) on a 0-100 track,
// with the achievable target marked. Capped at 95 so we never imply
// mechanical certainty, matching the header logic in Layer.tsx.
//
// Hidden when the layer reports zero gaps, since there's no ladder to climb.

export default function ConfidenceLadder({ layer }: { layer: LayerData }) {
  if (layer.gaps.length === 0) return null;
  const base = Math.max(0, Math.min(100, layer.confidence));
  const headroomRaw = layer.gaps.reduce((s, g) => s + Math.max(0, g.confidenceLiftPp), 0);
  const target = Math.min(95, base + headroomRaw);
  const headroom = target - base;
  if (headroom <= 0) return null;

  const segColors = ["var(--amber)", "var(--gold)", "var(--coral)", "var(--teal)"];
  let runningPp = 0;
  const segments = layer.gaps
    .map((g, i) => ({ g, i, pp: Math.max(0, g.confidenceLiftPp) }))
    .filter((s) => s.pp > 0)
    .map((s) => {
      const allowed = Math.max(0, Math.min(s.pp, headroom - runningPp));
      runningPp += allowed;
      return { ...s, allowed };
    })
    .filter((s) => s.allowed > 0);

  return (
    <div className="card card-accent-navy">
      <div className="flex items-baseline justify-between mb-3">
        <div className="font-sans font-semibold text-[14px] text-[var(--navy)]">
          Confidence ladder
        </div>
        <div className="font-sans text-[11px] text-[var(--slate-light)]">
          {base}% today, {target}% if we close {segments.length} {segments.length === 1 ? "gap" : "gaps"}
        </div>
      </div>

      <div className="relative h-7 rounded-sm overflow-hidden border border-[var(--cream-dark)]"
           style={{ background: "var(--cream-light)" }}>
        <div className="absolute inset-y-0 left-0 flex">
          <div style={{ width: `${base}%`, background: "var(--navy)" }} />
          {segments.map((s) => (
            <div
              key={s.i}
              style={{ width: `${s.allowed}%`, background: segColors[s.i % segColors.length], opacity: 0.85 }}
              title={`${s.g.title} (+${s.allowed.toFixed(0)}pp)`}
            />
          ))}
        </div>
        <div className="absolute inset-y-0 pointer-events-none"
             style={{ left: `${target}%`, width: 1, background: "var(--navy-deep, var(--navy))" }} />
        <div className="absolute top-0 -translate-x-1/2 font-sans text-[10px] font-semibold tabular-nums text-[var(--paper)] px-1.5 py-0.5 rounded-sm"
             style={{ left: `${base / 2}%`, background: "transparent" }}>
          <span style={{ color: "var(--paper)" }}>{base}%</span>
        </div>
        <div className="absolute -top-px font-sans text-[10px] font-semibold tabular-nums text-[var(--navy)] -translate-x-1/2"
             style={{ left: `${target}%` }}>
        </div>
      </div>

      <div className="flex justify-between mt-1 font-sans text-[10px] tabular-nums text-[var(--slate-light)]">
        <span>0</span>
        <span>50</span>
        <span className="font-semibold text-[var(--navy)]">target {target}%</span>
        <span>100</span>
      </div>

      <ul className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        {segments.map((s) => (
          <li key={s.i} className="flex items-start gap-2 text-[11px] text-[var(--slate)]">
            <span className="mt-1 inline-block h-2 w-2 rounded-sm shrink-0"
                  style={{ background: segColors[s.i % segColors.length] }} />
            <span className="flex-1 min-w-0">
              <span className="font-sans font-semibold text-[var(--navy)]">+{s.allowed.toFixed(0)}pp</span>{" "}
              <span className="text-[var(--slate-light)]">{s.g.title}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
