import { useState } from "react";
import { ArrowRight, FileSearch } from "lucide-react";
import type { LayerData, Tone } from "../data/layers";
import Chart from "./Chart";
import ConfidenceBand from "./ConfidenceBand";
import ChallengeModal from "./ChallengeModal";

const toneColor = (t: Tone) =>
  t === "bad"  ? "var(--red)"
  : t === "warn" ? "var(--amber)"
  : t === "good" ? "var(--teal)"
                 : "var(--navy)";

const tagClass = (c: string) => "tag tag-" + c.toLowerCase();

export default function Layer({ layer, highlight }: { layer: LayerData; highlight?: string }) {
  const [open, setOpen] = useState(false);
  const isHi = (field: string) => highlight === field;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className={"flex items-start justify-between gap-6 " + (highlight === "header" ? "gold-underline" : "")}>
        <div>
          <div className="eyebrow text-[var(--coral)] mb-2">Intelligence layer · {layer.group}</div>
          <h1 className="font-serif text-[32px] leading-tight text-[var(--navy)]">{layer.title}</h1>
          <p className="font-serif italic text-[18px] text-[var(--slate-light)] mt-1">{layer.question}</p>
          <div className="mt-3 flex items-center gap-4 text-[12px] text-[var(--slate-light)]">
            <span>Diagnosed {layer.diagnosedAt}</span>
            <span className="opacity-40">·</span>
            <div className="flex items-center gap-1.5"><span>Confidence</span><ConfidenceBand value={layer.confidence} /></div>
            <span className="opacity-40">·</span>
            <span>{layer.sources} sources</span>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="btn-ghost mt-2">
          <FileSearch size={14} strokeWidth={1.5} /> Challenge this
        </button>
      </div>

      {/* Metric strip */}
      <div className="grid grid-cols-4 gap-4">
        {layer.metrics.map((m, i) => (
          <div key={i} className={"card " + (isHi(`metric:${i}`) ? "pulse-coral" : "")}>
            <div className="eyebrow text-[var(--slate-light)]">{m.label}</div>
            <div className="font-sans font-semibold mt-2" style={{ fontSize: 32, lineHeight: 1.1, color: toneColor(m.tone) }}>
              {m.value}
            </div>
            <div className="font-sans italic text-[11px] text-[var(--slate-light)] mt-1">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column: narrative + visualisation */}
        <div className="col-span-2 space-y-6">
          <div className="card card-hero card-accent-coral">
            <div className="eyebrow text-[var(--coral)] mb-3">Executive narrative</div>
            <p className="font-serif text-[18px] leading-[1.55] text-[var(--ink)]">{layer.narrative}</p>
          </div>

          <div className="card card-accent-navy">
            <div className="flex items-center justify-between mb-4">
              <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">{layer.chartTitle}</div>
              <div className="eyebrow text-[var(--slate-light)]">Q3 2026</div>
            </div>
            <Chart spec={layer.chart} />
          </div>

          <div className="card card-accent-amber">
            <div className="flex items-center justify-between mb-4">
              <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">Variance diagnosis</div>
              <span className="pill pill-coral">{layer.causes.length} root causes</span>
            </div>
            <ol className="space-y-4">
              {layer.causes.map((c, i) => (
                <li key={i} className={"pl-6 relative " + (isHi(`cause:${i}`) ? "pulse-coral !rounded-sm" : "")}>
                  <span className="absolute left-0 top-0 font-sans font-semibold text-[13px] text-[var(--navy-soft)]">{i + 1}.</span>
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-sans font-semibold text-[13px] text-[var(--navy)]">{c.title}</div>
                    <div className="font-sans text-[12px] font-semibold text-[var(--coral)] whitespace-nowrap">{c.impact}</div>
                  </div>
                  <div className="font-sans italic text-[12px] text-[var(--slate)] leading-snug mt-1">{c.detail}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right column: actions + gaps */}
        <div className="space-y-6">
          <div className="card card-accent-teal">
            <div className="flex items-center justify-between mb-4">
              <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">Recommended actions</div>
              <span className="pill pill-teal">{layer.actionsRecoveryUsd}</span>
            </div>
            <ul className="space-y-4">
              {layer.actions.map((a, i) => (
                <li key={i} className={"flex items-start gap-3 " + (isHi(`action:${i}`) ? "pulse-coral !rounded-sm" : "")}>
                  <span className="mt-1.5 inline-block h-2 w-2 rounded-full" style={{ background: "var(--gold)" }} />
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="font-sans font-semibold text-[13px] text-[var(--navy)] leading-snug">{a.title}</div>
                      <div className="font-sans text-[14px] font-bold text-[var(--teal)] whitespace-nowrap">{a.impact}</div>
                    </div>
                    <div className="font-sans italic text-[11px] text-[var(--slate-light)] leading-snug mt-0.5">{a.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="card card-accent-coral">
            <div className="flex items-center justify-between mb-4">
              <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">Architectural gaps surfaced</div>
              <span className="pill pill-coral">{layer.gapsPipelineUsd}</span>
            </div>
            <ul className="space-y-3.5">
              {layer.gaps.map((g, i) => (
                <li key={i} className={"flex items-start justify-between gap-3 " + (isHi(`gap:${i}`) ? "pulse-coral !rounded-sm" : "")}>
                  <div className="flex-1">
                    <span className={tagClass(g.category)}>{g.category}</span>
                    <div className="font-sans font-semibold text-[12px] text-[var(--navy)] mt-1.5">{g.title}</div>
                    <div className="font-sans italic text-[11px] text-[var(--slate-light)] leading-snug mt-0.5">{g.detail}</div>
                  </div>
                  <a className="font-sans text-[11px] text-[var(--navy)] hover:text-[var(--coral)] whitespace-nowrap mt-1 flex items-center gap-1 cursor-pointer">
                    Route to pipeline <ArrowRight size={12} strokeWidth={1.5} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {open && <ChallengeModal layer={layer} onClose={() => setOpen(false)} />}
    </div>
  );
}
