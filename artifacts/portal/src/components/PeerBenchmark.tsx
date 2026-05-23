import { Users } from "lucide-react";
import { useCompany, useNarrative } from "../context/CompanyContext";

const toneColor = (t: "ahead" | "median" | "behind") =>
  t === "ahead" ? "var(--teal)" : t === "median" ? "var(--amber)" : "var(--coral)";

const toneLabel = (t: "ahead" | "median" | "behind") =>
  t === "ahead" ? "Ahead of median" : t === "median" ? "On median" : "Behind median";

export default function PeerBenchmark({ layerKey }: { layerKey: string }) {
  const { PEERS } = useNarrative();
  const { profile } = useCompany();
  const block = PEERS[layerKey];
  if (!block) return null;

  return (
    <div className="card !p-0 overflow-hidden card-accent-navy">
      <div className="px-5 py-3 flex items-center justify-between border-b border-[var(--cream-dark)]"
           style={{ background: "var(--cream-dark)" }}>
        <div className="flex items-center gap-3">
          <Users size={14} strokeWidth={1.8} className="text-[var(--navy)]" />
          <span className="eyebrow text-[var(--navy)]">Peer benchmarks</span>
          <span className="font-sans italic text-[11px] text-[var(--slate)]">{block.peerSet}</span>
        </div>
        <span className="font-sans italic text-[11px] text-[var(--slate-light)]">{block.asOf}</span>
      </div>
      <div className="divide-y divide-[var(--cream-dark)]">
        {block.metrics.map((m, i) => (
          <div key={i} className="px-5 py-4 grid grid-cols-12 gap-4 items-center">
            {/* Metric label */}
            <div className="col-span-3">
              <div className="font-sans font-semibold text-[13px] text-[var(--navy)] leading-tight">{m.metric}</div>
              <div className="font-sans text-[10px] uppercase tracking-wider mt-1" style={{ color: toneColor(m.tone) }}>{toneLabel(m.tone)}</div>
            </div>
            {/* Values */}
            <div className="col-span-3 grid grid-cols-3 gap-2 text-center">
              <ValueCell label={profile.name}  value={m.meridian}  emphasis tone={m.tone} />
              <ValueCell label="Median"  value={m.median} />
              <ValueCell label="Best"    value={m.best}   sublabel={m.bestLabel} />
            </div>
            {/* Position spectrum */}
            <div className="col-span-3 px-2">
              <div className="relative h-2 rounded-full" style={{ background: "var(--cream-dark)" }}>
                {/* Median tick */}
                <div className="absolute top-[-3px] h-2 w-px" style={{ left: "50%", background: "var(--slate-light)", height: 8 }} />
                {/* Best dot */}
                <div className="absolute top-[-3px] right-0 h-2 w-2 rounded-full" style={{ background: "var(--teal)" }} />
                {/* Active company marker */}
                <div className="absolute top-[-5px] h-3 w-3 rounded-full"
                     style={{ left: `calc(${m.position}% - 6px)`, background: toneColor(m.tone), border: "2px solid var(--paper)" }} />
              </div>
              <div className="flex justify-between mt-1 font-sans text-[9px] uppercase tracking-wider text-[var(--slate-light)]">
                <span>Worst</span><span>Median</span><span>Best</span>
              </div>
            </div>
            {/* Comment */}
            <div className="col-span-3">
              <p className="font-serif italic text-[12px] leading-snug text-[var(--slate)]">{m.comment}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ValueCell({ label, value, emphasis, tone, sublabel }: {
  label: string; value: string; emphasis?: boolean;
  tone?: "ahead" | "median" | "behind"; sublabel?: string;
}) {
  const color = emphasis && tone ? toneColor(tone) : "var(--ink)";
  return (
    <div>
      <div className="eyebrow text-[var(--slate-light)] mb-0.5" style={{ fontSize: 9 }}>{label}</div>
      <div className={"font-sans tabular-nums leading-tight " + (emphasis ? "text-[15px] font-bold" : "text-[13px] font-semibold")}
           style={{ color }}>{value}</div>
      {sublabel && <div className="font-sans italic text-[9px] text-[var(--slate-light)] mt-0.5 leading-tight">{sublabel}</div>}
    </div>
  );
}
