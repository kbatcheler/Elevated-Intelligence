// Extracts a dollar magnitude (in millions) from a free-text impact string.
//
// Background: cause.impact / action.impact are produced by the LLM and arrive
// as anything from "$5M" to "Could add $40-70M in incremental international
// revenue". The visual components (diptych, waterfall) need a numeric value
// to draw bars; this is the shared parser they all use.
//
// Returns null when the string carries no $ figure (qualitative impacts, pp,
// percentages). Range strings ("$40-70M", "$30 - 60M") return the midpoint.
// When multiple figures appear, the FIRST is used since impact prose almost
// always leads with the headline number.

export function parseImpactUsdM(text: string | undefined | null): number | null {
  if (!text) return null;
  const m = text.match(/\$\s*([\d.]+)\s*(?:[\-–—]|to)\s*([\d.]+)\s*([KMB])\b/i)
        ?? text.match(/\$\s*([\d.]+)\s*([KMB])\b/i);
  if (!m) return null;
  const isRange = m.length === 4;
  const lo = parseFloat(m[1]);
  const hi = isRange ? parseFloat(m[2]) : lo;
  const unit = (isRange ? m[3] : m[2]).toUpperCase();
  if (!isFinite(lo) || !isFinite(hi)) return null;
  const mid = (lo + hi) / 2;
  const mult = unit === "B" ? 1000 : unit === "K" ? 0.001 : 1;
  return mid * mult;
}

export function formatUsdM(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}B`;
  if (value >= 10)   return `$${value.toFixed(0)}M`;
  if (value >= 1)    return `$${value.toFixed(1)}M`;
  return `$${Math.round(value * 1000)}K`;
}
