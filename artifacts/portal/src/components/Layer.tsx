import { useState } from "react";
import { ArrowRight, FileSearch, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { LayerData, Tone } from "../data/layers";
import Chart from "./Chart";
import ConfidenceBand from "./ConfidenceBand";
import ChallengeModal from "./ChallengeModal";
import DataFeedsCard from "./DataFeedsCard";
import AnimatedNumber from "./AnimatedNumber";
import Sparkline, { makeSeries } from "./Sparkline";
import { EXTRAS } from "./extras";
import { HEROES } from "./heroes";
import TimeTravel from "./TimeTravel";
import CommitButton from "./CommitButton";
import WhatIfLevers from "./WhatIfLevers";
import NextSteps from "./NextSteps";
import PipelineDetail from "./PipelineDetail";
import DemandLink from "./DemandLink";
import { useApp } from "../context/AppContext";
import { EVIDENCE } from "../data/signals";
import { TIMELINES } from "../data/timetravel";

const toneColor = (t: Tone) =>
  t === "bad"  ? "var(--red)"
  : t === "warn" ? "var(--amber)"
  : t === "good" ? "var(--teal)"
                 : "var(--navy)";

const TrendIcon = ({ t }: { t: Tone }) =>
  t === "bad" ? <TrendingDown size={12} strokeWidth={2} />
  : t === "good" ? <TrendingUp size={12} strokeWidth={2} />
                 : <Minus size={12} strokeWidth={2} />;

const tagClass = (c: string) => "tag tag-" + c.toLowerCase();

export default function Layer({ layer, highlight }: { layer: LayerData; highlight?: string }) {
  const [open, setOpen] = useState(false);
  const { openEvidence, pulse, timeOffsetByLayer } = useApp();
  const isHi = (field: string) => highlight === field;
  const seedBase = layer.key.charCodeAt(0) + layer.key.charCodeAt(layer.key.length - 1);

  // Time-travel overrides
  const offset = timeOffsetByLayer[layer.key] ?? 0;
  const timeline = TIMELINES[layer.key];
  const snap = timeline ? timeline[2 - offset] : null;
  const isRewound = offset > 0;
  const displayConf = snap?.confidence ?? layer.confidence;
  const displayDiagnosedAt = snap?.diagnosedAt ?? layer.diagnosedAt;

  const showWhatIf = layer.key === "pricing-margin" || layer.key === "demand-intelligence";

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className={"flex items-start justify-between gap-6 " + (highlight === "header" ? "gold-underline" : "")}>
        <div>
          <div className="eyebrow text-[var(--coral)] mb-2">Intelligence layer · {layer.group}</div>
          <h1 className="font-serif text-[40px] leading-[1.05] text-[var(--navy)] font-semibold">{layer.title}</h1>
          <p className="font-serif italic text-[20px] text-[var(--slate-light)] mt-1.5">{layer.question}</p>
          <div className="mt-4 flex items-center gap-4 text-[12px] text-[var(--slate-light)]">
            <span className="flex items-center gap-1.5">
              <span className="relative inline-flex">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: isRewound ? "var(--amber)" : "var(--teal)" }} />
                <span className="absolute inset-0 h-1.5 w-1.5 rounded-full animate-ping" style={{ background: isRewound ? "var(--amber)" : "var(--teal)", opacity: 0.4 }} />
              </span>
              {isRewound ? "Rewound to " : "Diagnosed "}{displayDiagnosedAt}
            </span>
            <span className="opacity-40">·</span>
            <div className="flex items-center gap-1.5"><span>Confidence</span><ConfidenceBand value={displayConf} /></div>
            <span className="opacity-40">·</span>
            <span>{layer.sources} sources</span>
          </div>
          <div className="mt-3">
            <DemandLink layerKey={layer.key} />
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="btn-ghost mt-2">
          <FileSearch size={14} strokeWidth={1.5} /> Challenge this
        </button>
      </div>

      {/* Time-travel slider */}
      <TimeTravel layerKey={layer.key} />

      {/* Hero: custom per-layer treatment, or default metric strip */}
      {HEROES[layer.key] ? (() => { const H = HEROES[layer.key]; return <H layer={layer} />; })() : (
        <div className="grid grid-cols-4 gap-4">
          {layer.metrics.map((m, i) => {
            const evKey = `${layer.key}/${m.label}`;
            const hasEvidence = !!EVIDENCE[evKey];
            const isPulsing = pulse?.layer === layer.key && pulse.metric === m.label;
            const cls = "card " +
              (isHi(`metric:${i}`) || isPulsing ? "pulse-coral " : "") +
              (hasEvidence ? "cursor-pointer hover:border-[var(--navy)] transition-colors" : "");
            return (
              <div key={i}
                   onClick={hasEvidence ? () => openEvidence(layer.key, m.label) : undefined}
                   className={cls}>
                <div className="flex items-start justify-between">
                  <div className="eyebrow text-[var(--slate-light)]">
                    {m.label}
                    {hasEvidence && <span className="ml-1.5 inline-block h-1 w-1 rounded-full align-middle" style={{ background: "var(--gold)" }} />}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: toneColor(m.tone) }}>
                    <TrendIcon t={m.tone} />
                  </span>
                </div>
                <div className="font-sans font-semibold mt-2 tabular-nums" style={{ fontSize: 36, lineHeight: 1.05, color: toneColor(m.tone) }}>
                  <AnimatedNumber value={m.value} />
                </div>
                <div className="flex items-end justify-between mt-2 gap-3">
                  <div className="font-sans italic text-[11px] text-[var(--slate-light)]">{m.sub}</div>
                  <Sparkline data={makeSeries(seedBase + i * 17, 14, m.tone === "bad" ? -0.6 : m.tone === "good" ? 0.4 : 0)}
                             color={toneColor(m.tone)} />
                </div>
                {hasEvidence && (
                  <div className="mt-2 pt-2 border-t border-[var(--cream-dark)] eyebrow text-[var(--slate-light)] flex items-center gap-1">
                    Click for evidence <ArrowRight size={10} strokeWidth={1.8} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Domain-specific extras (unique per layer) */}
      {EXTRAS[layer.key] ? (() => { const E = EXTRAS[layer.key]; return <E />; })() : null}

      {/* What-if levers — Pricing and Demand */}
      {showWhatIf && <WhatIfLevers scenario={layer.key === "pricing-margin" ? "pricing" : "demand"} />}

      <div className="grid grid-cols-3 gap-6">
        {/* Left column: narrative + visualisation */}
        <div className="col-span-2 space-y-6">
          <div className="card card-hero card-accent-coral">
            <div className="eyebrow text-[var(--coral)] mb-3">Executive narrative</div>
            <p className="font-serif text-[19px] leading-[1.55] text-[var(--ink)]">
              {isRewound && snap ? snap.headline : layer.narrative}
            </p>
            {isRewound && (
              <div className="mt-3 pt-3 border-t border-[var(--cream-dark)] font-sans italic text-[11px] text-[var(--amber)]">
                Viewing the diagnosis as the system saw it {snap?.label.toLowerCase()}. Switch back to "Now" for the current view.
              </div>
            )}
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
                <li key={i} className={"pl-7 relative " + (isHi(`cause:${i}`) ? "pulse-coral !rounded-sm" : "")}>
                  <span className="absolute left-0 top-0 font-serif font-semibold text-[18px] text-[var(--gold)] leading-none">{i + 1}.</span>
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-sans font-semibold text-[14px] text-[var(--navy)]">{c.title}</div>
                    <div className="font-sans text-[12px] font-bold text-[var(--coral)] whitespace-nowrap tabular-nums">{c.impact}</div>
                  </div>
                  <div className="font-sans italic text-[12px] text-[var(--slate)] leading-snug mt-1">{c.detail}</div>
                </li>
              ))}
            </ol>
          </div>

          {/* Deep pipeline detail — only for the four operationally-deep layers */}
          <PipelineDetail layerKey={layer.key} />

          {/* Data feeds — the big new card */}
          <DataFeedsCard layerKey={layer.key} />
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
                  <span className="mt-1.5 inline-block h-2 w-2 rounded-full shrink-0" style={{ background: "var(--gold)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="font-sans font-semibold text-[13px] text-[var(--navy)] leading-snug">{a.title}</div>
                      <div className="font-sans text-[14px] font-bold text-[var(--teal)] whitespace-nowrap tabular-nums">{a.impact}</div>
                    </div>
                    <div className="font-sans italic text-[11px] text-[var(--slate-light)] leading-snug mt-0.5">{a.detail}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <CommitButton
                        layer={layer.key}
                        layerTitle={layer.title}
                        title={a.title}
                        detail={a.detail}
                        impact={a.impact}
                        idx={i}
                      />
                    </div>
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

      {/* Prescriptive next steps — every layer, full-width below the two-column grid */}
      <NextSteps layerKey={layer.key} layerTitle={layer.title} />

      {open && <ChallengeModal layer={layer} onClose={() => setOpen(false)} />}
    </div>
  );
}
