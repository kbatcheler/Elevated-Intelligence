export default function Sparkline({
  data,
  color = "var(--navy)",
  width = 88,
  height = 24,
}: {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / span) * (height - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const lastX = (data.length - 1) * step;
  const lastY = height - ((data[data.length - 1] - min) / span) * (height - 2) - 1;
  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" opacity={0.85} />
      <circle cx={lastX} cy={lastY} r={2.2} fill={color} />
    </svg>
  );
}

export function makeSeries(seed: number, len = 12, drift = 0): number[] {
  const out: number[] = [];
  let v = 50 + (seed % 30);
  for (let i = 0; i < len; i++) {
    v += Math.sin(i * 0.7 + seed) * 4 + drift;
    out.push(v);
  }
  return out;
}
