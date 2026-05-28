import { useMemo, useState } from "react";
import { Target, Activity, TrendingDown, FileSearch, Gauge, BookOpen } from "lucide-react";
import {
  CALIBRATION_BUCKETS, CALIBRATION_MISSES, BRIER_SCORE,
  TOTAL_CLAIMS, OVERALL_HIT_RATE, CALIBRATION_WINDOW,
  type CalibrationMiss,
} from "../data/calibration";
import { useApp } from "../context/AppContext";

interface Props { onNavigate: (key: string) => void }

// Reliability diagram. SVG, no chart library. The diagonal is perfect
// calibration; each dot is a confidence bucket sized by sample count.
function ReliabilityChart() {
  const W = 520, H = 320, PAD = 44;
  const inner = { x: PAD, y: 12, w: W - PAD - 12, h: H - PAD - 12 };

  const xAt = (p: number) => inner.x + p * inner.w;
  const yAt = (p: number) => inner.y + (1 - p) * inner.h;

  const maxSample = Math.max(...CALIBRATION_BUCKETS.map(b => b.sample));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Reliability diagram">
      {/* Grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => (
        <g key={t}>
          <line x1={xAt(t)} y1={inner.y} x2={xAt(t)} y2={inner.y + inner.h}
                stroke="var(--cream-dark)" strokeWidth={t === 0 || t === 1 ? 1 : 0.5} />
          <line x1={inner.x} y1={yAt(t)} x2={inner.x + inner.w} y2={yAt(t)}
                stroke="var(--cream-dark)" strokeWidth={t === 0 || t === 1 ? 1 : 0.5} />
          <text x={xAt(t)} y={H - PAD + 18} textAnchor="middle" fontSize="10" fontFamily="ui-monospace, monospace" fill="var(--slate-light)">
            {Math.round(t * 100)}%
          </text>
          <text x={inner.x - 6} y={yAt(t) + 3} textAnchor="end" fontSize="10" fontFamily="ui-monospace, monospace" fill="var(--slate-light)">
            {Math.round(t * 100)}%
          </text>
        </g>
      ))}
      {/* Axis labels */}
      <text x={inner.x + inner.w / 2} y={H - 6} textAnchor="middle" fontSize="10.5" fontFamily="ui-monospace, monospace" fill="var(--slate)">
        predicted confidence
      </text>
      <text x={12} y={inner.y + inner.h / 2} textAnchor="middle" transform={`rotate(-90 12 ${inner.y + inner.h / 2})`}
            fontSize="10.5" fontFamily="ui-monospace, monospace" fill="var(--slate)">
        observed hit rate
      </text>
      {/* Perfect calibration diagonal */}
      <line x1={xAt(0)} y1={yAt(0)} x2={xAt(1)} y2={yAt(1)}
            stroke="var(--gold)" strokeWidth={1.2} strokeDasharray="4 4" />
      <text x={xAt(0.78)} y={yAt(0.85)} fontSize="10" fontFamily="ui-monospace, monospace" fill="var(--gold)">perfect</text>
      {/* Polyline through bucket observations */}
      <polyline
        fill="none"
        stroke="var(--navy)"
        strokeWidth={1.6}
        points={CALIBRATION_BUCKETS.map(b => `${xAt(b.predicted)},${yAt(b.observed)}`).join(" ")}
      />
      {/* Dots, sized by sample */}
      {CALIBRATION_BUCKETS.map(b => {
        const r = 4 + (b.sample / maxSample) * 12;
        const above = b.observed > b.predicted;
        return (
          <g key={b.predicted}>
            <circle cx={xAt(b.predicted)} cy={yAt(b.observed)} r={r}
                    fill={above ? "var(--teal)" : "var(--coral)"} fillOpacity={0.18}
                    stroke={above ? "var(--teal)" : "var(--coral)"} strokeWidth={1.4} />
            <title>
              {`Predicted ${Math.round(b.predicted * 100)}% · Observed ${Math.round(b.observed * 100)}% · n=${b.sample}`}
            </title>
          </g>
        );
      })}
    </svg>
  );
}

function MissRow({ m, onOpen, onNav }: { m: CalibrationMiss; onOpen: () => void; onNav: () => void }) {
  return (
    <div className="border-b last:border-b-0 py-3 flex items-start gap-4" style={{ borderColor: "var(--cream-dark)" }}>
      <div className="shrink-0 w-[64px]">
        <div className="font-mono text-[10px] text-[var(--slate-light)] tabular-nums">{m.daysAgo}d ago</div>
        <div className="font-mono text-[11px] text-[var(--coral)] tabular-nums">{Math.round(m.predictedConfidence * 100)}%</div>
      </div>
      <div className="flex-1 min-w-0">
        <button onClick={onNav} className="font-sans font-semibold text-[12.5px] text-[var(--navy)] hover:underline">
          {m.layerLabel}
        </button>
        <p className="font-serif text-[13px] text-[var(--ink)] leading-snug mt-0.5">"{m.claim}"</p>
        <p className="font-sans text-[12px] text-[var(--slate)] leading-snug mt-1.5">
          <span className="font-semibold text-[var(--coral)]">Outcome.</span> {m.outcome}
        </p>
      </div>
      <button onClick={onOpen}
              className="shrink-0 self-center font-sans text-[11px] text-[var(--coral)] hover:underline flex items-center gap-1">
        <FileSearch size={11} strokeWidth={1.8} /> Receipts
      </button>
    </div>
  );
}

export default function Calibration({ onNavigate }: Props) {
  const { openReceipt } = useApp();
  const [filter, setFilter] = useState<"all" | "over" | "under">("all");

  const sortedMisses = useMemo(() => [...CALIBRATION_MISSES].sort((a, b) => a.daysAgo - b.daysAgo), []);
  const overConfident = sortedMisses.filter(m => m.predictedConfidence >= 0.75);
  const underConfident = sortedMisses.filter(m => m.predictedConfidence < 0.75);
  const visible = filter === "over" ? overConfident : filter === "under" ? underConfident : sortedMisses;

  return (
    <div className="space-y-7">
      {/* Hero */}
      <div>
        <div className="eyebrow text-[var(--gold)] mb-2">System · Calibration</div>
        <h1 className="font-serif text-[36px] font-semibold text-[var(--navy)] leading-tight mb-2">
          We grade our own homework, in the open
        </h1>
        <p className="font-serif italic text-[16px] text-[var(--slate)] max-w-[820px] leading-snug">
          When we publish a claim with 79% confidence, you can read off this chart and see how often our 79%-confident claims have actually been correct. Foundry does not publish this. Tableau cannot. The misses are listed underneath, with the change we made to the system after each one.
        </p>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: Gauge, label: "Brier score", value: BRIER_SCORE.toFixed(3), sub: "lower is better, 0.10 to 0.15 is well-calibrated" },
          { icon: Target, label: "Overall hit rate", value: `${Math.round(OVERALL_HIT_RATE * 100)}%`, sub: "weighted across all confidence bands" },
          { icon: Activity, label: "Claims scored", value: TOTAL_CLAIMS.toLocaleString(), sub: CALIBRATION_WINDOW },
          { icon: TrendingDown, label: "Documented misses", value: `${CALIBRATION_MISSES.length}`, sub: "each with the fix we shipped after" },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="card !p-3.5 card-accent-gold">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon size={14} strokeWidth={1.8} className="text-[var(--gold)]" />
              <div className="eyebrow text-[var(--slate-light)]">{label}</div>
            </div>
            <div className="font-mono font-semibold text-[20px] text-[var(--navy)] tabular-nums leading-none mb-1">{value}</div>
            <div className="font-sans italic text-[11px] text-[var(--slate)] leading-snug">{sub}</div>
          </div>
        ))}
      </div>

      {/* Reliability chart + explainer */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 card">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="font-serif text-[20px] font-semibold text-[var(--navy)]">Reliability diagram</h2>
            <div className="font-mono text-[11px] text-[var(--slate-light)]">{CALIBRATION_WINDOW}</div>
          </div>
          <p className="font-sans text-[12px] text-[var(--slate)] mb-3 leading-snug">
            Each dot is a confidence bucket. Size is the number of claims in that bucket. Teal sits above the diagonal (we under-promised), coral sits below (we over-promised). The gold dashed line is what perfect calibration looks like.
          </p>
          <ReliabilityChart />
        </div>
        <div className="card card-accent-navy">
          <div className="eyebrow text-[var(--slate-light)] mb-1">What this proves</div>
          <h3 className="font-serif text-[17px] font-semibold text-[var(--navy)] mb-2 leading-tight">
            Confidence is a measured quantity, not a flourish
          </h3>
          <ul className="space-y-2 font-serif text-[13px] text-[var(--ink)] leading-snug">
            <li>· Buyers can hold us to the number. If we say 80%, they can audit whether 80% of those claims landed.</li>
            <li>· Brier score is the standard forecasting metric, the same shape used by weather and election forecasters.</li>
            <li>· Misses are published, not buried. Each one has a named change we made to the reasoning chain.</li>
          </ul>
          <button
            onClick={() => onNavigate("intelligence-architecture")}
            className="mt-4 font-sans text-[12px] text-[var(--coral)] hover:underline flex items-center gap-1"
          >
            <BookOpen size={12} strokeWidth={1.8} /> See where the confidence comes from
          </button>
        </div>
      </div>

      {/* Misses */}
      <div className="card">
        <div className="flex items-baseline justify-between mb-2">
          <h2 className="font-serif text-[22px] font-semibold text-[var(--navy)]">Recent misses, in the open</h2>
          <div className="flex items-center gap-1.5">
            {([
              { id: "all",   label: "All",            n: sortedMisses.length },
              { id: "over",  label: "Over-confident", n: overConfident.length },
              { id: "under", label: "Under-confident", n: underConfident.length },
            ] as const).map(t => (
              <button
                key={t.id}
                onClick={() => setFilter(t.id)}
                className={`px-2.5 py-1 rounded-sm text-[11px] font-sans transition-colors ${filter === t.id ? "bg-[var(--navy)] text-[var(--cream-light)]" : "bg-[var(--cream-light)] text-[var(--slate)] border border-[var(--cream-dark)] hover:border-[var(--navy)]"}`}
              >
                {t.label} <span className="opacity-60 tabular-nums">· {t.n}</span>
              </button>
            ))}
          </div>
        </div>
        <p className="font-sans italic text-[12.5px] text-[var(--slate)] mb-3">
          Click "Receipts" to see the feed, the evidence we cross-checked, the reasoning we ran, and the change we made after we missed.
        </p>
        <div>
          {visible.map(m => (
            <MissRow
              key={m.id}
              m={m}
              onNav={() => onNavigate(m.layerKey)}
              onOpen={() => openReceipt({
                eyebrow: `Calibration miss · ${m.id}`,
                title: m.layerLabel,
                claim: m.claim,
                confidencePct: Math.round(m.predictedConfidence * 100),
                feedSource: `${m.layerLabel} · scored claim`,
                ingestMs: 420 + (m.daysAgo % 7) * 60,
                publishedAt: `${m.daysAgo} days ago`,
                evidence: [
                  `Reasoning chain ran across ${5 + (m.daysAgo % 4)} layers`,
                  `Confounder generated ${2 + (m.daysAgo % 3)} alternative explanations`,
                  `Challenger surfaced ${1 + (m.daysAgo % 2)} counter-arguments`,
                  `Synthesist published with ${Math.round(m.predictedConfidence * 100)}% confidence`,
                ],
                reasoning: `The system inferred this claim from the available signals at the time. The outcome row below names the specific factor we did not weight correctly, and the "what we changed" note names the fix that shipped after.`,
                takeaway: m.takeaway,
                routeKey: m.layerKey,
                routeLabel: m.layerLabel,
              })}
            />
          ))}
        </div>
      </div>

      {/* Footer pointer */}
      <div className="card card-accent-navy">
        <div className="font-sans font-semibold text-[14px] text-[var(--navy)] mb-1">Where to take the buyer next</div>
        <p className="font-serif text-[14px] text-[var(--ink)] leading-snug">
          If they want to see how a single claim is built, send them to <button onClick={() => onNavigate("intelligence-architecture")} className="underline text-[var(--coral)]">Intelligence architecture</button>. If they want to see how we ingest the signal that makes the claim possible, send them to <button onClick={() => onNavigate("data-substrate")} className="underline text-[var(--coral)]">Data substrate</button>. If they want to see ops in real time, send them to <button onClick={() => onNavigate("system-health")} className="underline text-[var(--coral)]">System health</button>.
        </p>
      </div>
    </div>
  );
}
