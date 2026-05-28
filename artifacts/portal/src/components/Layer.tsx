import { useState } from "react";
import { ArrowRight, FileSearch, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { LayerData, Tone } from "../data/layers";
import ClaimAnnotation, { claimCounts } from "./claims/ClaimAnnotation";
import { reportBrokenLink } from "../lib/reportBrokenLink";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import ConfidenceBand from "./ConfidenceBand";
import ConfidenceLadder from "./visuals/ConfidenceLadder";
import GapRecoveryDiptych from "./visuals/GapRecoveryDiptych";
import CauseWaterfall from "./visuals/CauseWaterfall";
import ChallengeModal from "./ChallengeModal";
import DataFeedsCard from "./DataFeedsCard";
import AnimatedNumber from "./AnimatedNumber";
import Sparkline, { makeSeries } from "./Sparkline";
import { EXTRAS } from "./extras";
import TimeTravel from "./TimeTravel";
import CommitButton from "./CommitButton";
import WhatIfLevers from "./WhatIfLevers";
import NextSteps from "./NextSteps";
import PipelineDetail from "./PipelineDetail";
import PeerBenchmark from "./PeerBenchmark";
import DemandLink from "./DemandLink";
import { useApp } from "../context/AppContext";
import { useNarrative, useSwap, useIsDefaultProfile, useCompany } from "../context/CompanyContext";
import { TIMELINES as TIMELINES_RAW, type Timeline } from "../data/timetravel";
import { scenarioForLayer } from "../data/scenarios";

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

export default function Layer({
  layer,
  highlight,
  onNavigate,
}: {
  layer: LayerData;
  highlight?: string;
  onNavigate?: (key: string, field?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { openEvidence, openWhy, pulse, timeOffsetByLayer } = useApp();
  const { PEERS, EVIDENCE } = useNarrative();
  const { activeTenant } = useCompany();
  const isDefaultProfile = useIsDefaultProfile();
  // TIMELINES contains Meridian Industrial-shaped "Diagnosis timeline" headlines
  // ("8% behind plan, 380bps margin gap …") that the vocab swap cannot
  // translate. For non-default profiles we suppress the timeline entirely
  //, TimeTravel below renders null when its layer key is absent, and
  // `snap` below stays null so layer.narrative is used as-is.
  const TIMELINES_SWAPPED = useSwap(TIMELINES_RAW);
  const TIMELINES: Record<string, Timeline> = isDefaultProfile ? TIMELINES_SWAPPED : {};
  const isHi = (field: string) => highlight === field;
  const seedBase = layer.key.charCodeAt(0) + layer.key.charCodeAt(layer.key.length - 1);

  // Time-travel overrides
  const offset = timeOffsetByLayer[layer.key] ?? 0;
  const timeline = TIMELINES[layer.key];
  const snap = timeline ? timeline[2 - offset] : null;
  const isRewound = offset > 0;
  const displayConf = snap?.confidence ?? layer.confidence;
  const displayDiagnosedAt = snap?.diagnosedAt ?? layer.diagnosedAt;

  const scenario = scenarioForLayer(layer.key);
  const showWhatIf = scenario != null;

  // Phase 3 annotation context: pulled out so every ClaimAnnotation below
  // stays compact. Default (Meridian Industrial) tenants have empty arrays
  // by design, the gold pills and cream bands only ever fire on
  // server-seeded tenants. `onReportBroken` fires the dead-link write
  // surface added in Phase 3.4 (best-effort, network errors swallowed).
  const vc = layer.verifiedClaims;
  const mc = layer.modelledClaims;
  const onReportBroken = ({ sourceUrl, claimPath }: { sourceUrl: string; claimPath: string }) => {
    void reportBrokenLink({
      layerKey: layer.key,
      claimPath,
      sourceUrl,
      tenantId: activeTenant?.id,
    });
  };

  // Reusable fragments so the four-act page flow stays scannable below.
  const narrativeCard = (
    <div className="card card-hero card-accent-coral">
      <div className="eyebrow text-[var(--coral)] mb-3">Executive narrative</div>
      <p className="font-serif text-[19px] leading-[1.55] text-[var(--ink)]">
        <ClaimAnnotation claimPath="narrative" verifiedClaims={vc} modelledClaims={mc} onReportBroken={onReportBroken}>
          {isRewound && snap ? snap.headline : layer.narrative}
        </ClaimAnnotation>
      </p>
      {isRewound && (
        <div className="mt-3 pt-3 border-t border-[var(--cream-dark)] font-sans italic text-[11px] text-[var(--amber)]">
          Viewing the diagnosis as the system saw it {snap?.label.toLowerCase()}. Switch back to "Now" for the current view.
        </div>
      )}
    </div>
  );

  const actionsCard = (
    <div className="card card-accent-teal">
      <div className="flex items-center justify-between mb-4">
        <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">Recommended actions</div>
        <span className="pill pill-teal">
          <ClaimAnnotation claimPath="headline_impact" verifiedClaims={vc} modelledClaims={mc} onReportBroken={onReportBroken}>
            {layer.actionsRecoveryUsd}
          </ClaimAnnotation>
        </span>
      </div>
      <ul className="space-y-4">
        {layer.actions.map((a, i) => (
          <li key={i} className={"flex items-start gap-3 " + (isHi(`action:${i}`) ? "pulse-coral !rounded-sm" : "")}>
            <span className="mt-1.5 inline-block h-2 w-2 rounded-full shrink-0" style={{ background: "var(--gold)" }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-sans font-semibold text-[13px] text-[var(--navy)] leading-snug min-w-0 flex-1">
                  <ClaimAnnotation claimPath={`actions[${i}].title`} verifiedClaims={vc} modelledClaims={mc} onReportBroken={onReportBroken}>
                    {a.title}
                  </ClaimAnnotation>
                </div>
                <div className="font-sans text-[13px] font-bold text-[var(--teal)] tabular-nums leading-snug text-right shrink-0 max-w-[45%] break-words">
                  <ClaimAnnotation claimPath={`actions[${i}].impact`} verifiedClaims={vc} modelledClaims={mc} onReportBroken={onReportBroken}>
                    {a.impact}
                  </ClaimAnnotation>
                </div>
              </div>
              <div className="font-sans italic text-[11px] text-[var(--slate-light)] leading-snug mt-0.5">
                <ClaimAnnotation claimPath={`actions[${i}].detail`} verifiedClaims={vc} modelledClaims={mc} onReportBroken={onReportBroken}>
                  {a.detail}
                </ClaimAnnotation>
              </div>
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
  );

  const metricStrip = (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--coral)" }} />
          <span className="eyebrow text-[var(--coral)]">Snapshot</span>
        </div>
        <span className="font-sans text-[11px] text-[var(--slate-light)]">
          Q3 2026 · {layer.sources} sources
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4">
      {layer.metrics.map((m, i) => {
        const evKey = `${layer.key}/${m.label}`;
        const hasEvidence = !!EVIDENCE[evKey];
        const isPulsing = pulse?.layer === layer.key && pulse.metric === m.label;
        // Every metric tile now opens the "Why this number?" inspector,
        // which itself routes to the raw evidence panel when available.
        // Keeps the existing "evidence dot" affordance but consolidates
        // the click to a single, more powerful drill-down.
        const cls = "card cursor-pointer hover:border-[var(--navy)] transition-colors " +
          (isHi(`metric:${i}`) || isPulsing ? "pulse-coral " : "");
        return (
          <div key={i}
               onClick={() => openWhy(layer.key, m.label)}
               role="button"
               tabIndex={0}
               onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openWhy(layer.key, m.label); } }}
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
              <ClaimAnnotation claimPath={`metrics[${i}]`} verifiedClaims={vc} modelledClaims={mc} onReportBroken={onReportBroken}>
                <AnimatedNumber value={m.value} />
              </ClaimAnnotation>
            </div>
            <div className="flex items-end justify-between mt-2 gap-3">
              <div className="font-sans italic text-[11px] text-[var(--slate-light)]">{m.sub}</div>
              <Sparkline data={makeSeries(seedBase + i * 17, 14, m.tone === "bad" ? -0.6 : m.tone === "good" ? 0.4 : 0)}
                         color={toneColor(m.tone)} />
            </div>
            <div className="mt-2 pt-2 border-t border-[var(--cream-dark)] eyebrow text-[var(--slate-light)] flex items-center justify-between gap-1">
              <span className="flex items-center gap-1">Why this number? <ArrowRight size={10} strokeWidth={1.8} /></span>
              {hasEvidence && <span className="font-sans text-[9px] text-[var(--gold)] uppercase tracking-wider">+ evidence</span>}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );

  const causesCard = (
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
              <div className="font-sans font-semibold text-[14px] text-[var(--navy)] min-w-0 flex-1">
                <ClaimAnnotation claimPath={`causes[${i}].title`} verifiedClaims={vc} modelledClaims={mc} onReportBroken={onReportBroken}>
                  {c.title}
                </ClaimAnnotation>
              </div>
              <div className="font-sans text-[12px] font-bold text-[var(--coral)] tabular-nums leading-snug text-right shrink-0 max-w-[45%] break-words">
                <ClaimAnnotation claimPath={`causes[${i}].impact`} verifiedClaims={vc} modelledClaims={mc} onReportBroken={onReportBroken}>
                  {c.impact}
                </ClaimAnnotation>
              </div>
            </div>
            <div className="font-sans italic text-[12px] text-[var(--slate)] leading-snug mt-1">
              <ClaimAnnotation claimPath={`causes[${i}].detail`} verifiedClaims={vc} modelledClaims={mc} onReportBroken={onReportBroken}>
                {c.detail}
              </ClaimAnnotation>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );

  const gapsCard = (
    <div className="card card-accent-coral">
      <div className="flex items-center justify-between mb-4">
        <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">Architectural gaps surfaced</div>
        <span className="pill pill-coral">{layer.gapsPipelineUsd}</span>
      </div>
      <ul className="space-y-3.5">
        {layer.gaps.map((g, i) => (
          <li key={i} className={"flex items-start justify-between gap-3 " + (isHi(`gap:${i}`) ? "pulse-coral !rounded-sm" : "")}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={tagClass(g.category)}>{g.category}</span>
                <span className="font-sans text-[11px] font-bold text-[var(--coral)] tabular-nums">+{g.confidenceLiftPp}pp confidence</span>
              </div>
              <div className="font-sans font-semibold text-[12px] text-[var(--navy)] mt-1.5">{g.title}</div>
              <div className="font-sans italic text-[11px] text-[var(--slate-light)] leading-snug mt-0.5">
                <ClaimAnnotation claimPath={`gaps[${i}].description`} verifiedClaims={vc} modelledClaims={mc} onReportBroken={onReportBroken}>
                  {g.detail}
                </ClaimAnnotation>
              </div>
              <div className="font-sans text-[11px] text-[var(--slate)] mt-1">
                Closed by <span className="font-semibold text-[var(--navy)]">{g.solution}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("engagement-pipeline", `gap:${layer.key}:${i}`)}
              className="font-sans text-[11px] text-[var(--navy)] hover:text-[var(--coral)] whitespace-nowrap mt-1 flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0"
              title="Open the engagement pipeline to route this gap to delivery"
            >
              Route to pipeline <ArrowRight size={12} strokeWidth={1.5} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  // Extras are still populated from hardcoded Meridian Industrial fixtures
  // (named suppliers, DC cities, competitor brands, SKUs etc). For any
  // non-default profile we hide them rather than render wrong-brand copy.
  // The Hero slot is now universal: every tenant gets the data-driven
  // metric snapshot from layer.metrics. Phase B will replace Extras with
  // a generic seeded-data renderer; see .local/session_plan.md.
  const isDefault = useIsDefaultProfile();
  const Extra = isDefault ? EXTRAS[layer.key] : undefined;

  return (
    <div className="space-y-6 pb-12">
      {/* ────────────────────────────────────────────────────────────────
          Header, orientation only
         ──────────────────────────────────────────────────────────────── */}
      <div className={"flex items-start justify-between gap-6 " + (highlight === "header" ? "gold-underline" : "")}>
        <div>
          <div className="eyebrow text-[var(--coral)] mb-2">Intelligence layer · {layer.group}</div>
          <h1 className="font-serif text-[40px] leading-[1.05] text-[var(--navy)] font-semibold max-w-[760px] break-words">{layer.title}</h1>
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
            {(() => {
              // Confidence-gap dual signal: today's confidence + the headroom
              // closing the named data gaps would unlock, capped at 95 so we
              // never imply mechanical certainty. The tooltip lists the gaps.
              const headroom = layer.gaps.reduce((s, g) => s + g.confidenceLiftPp, 0);
              const target = Math.min(95, displayConf + headroom);
              const tip = layer.gaps.map(g => `${g.title} (+${g.confidenceLiftPp}pp)`).join("\n");
              if (layer.gaps.length === 0 || target <= displayConf) {
                return <span>{layer.sources} sources</span>;
              }
              return (
                <>
                  <span title={tip} className="flex items-center gap-1 cursor-help">
                    <span className="font-sans font-semibold text-[var(--coral)]">Close {layer.gaps.length} {layer.gaps.length === 1 ? "gap" : "gaps"}</span>
                    <span className="opacity-60">→</span>
                    <span className="font-sans font-semibold text-[var(--navy)]">{target}% confidence</span>
                  </span>
                  <span className="opacity-40">·</span>
                  <span>{layer.sources} sources</span>
                </>
              );
            })()}
          </div>
          <div className="mt-3">
            <DemandLink layerKey={layer.key} />
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="btn-ghost mt-2">
          <FileSearch size={14} strokeWidth={1.5} /> Challenge this
        </button>
      </div>

      {/* Phase 3.3 provenance count strip. Only renders when Phase 2 produced
          at least one claim, the default Meridian Industrial tenant has
          empty arrays so the strip stays hidden and the page above it does
          not shift. */}
      <ClaimCountStrip
        verified={claimCounts(vc, mc).verified}
        modelled={claimCounts(vc, mc).modelled}
        sources={claimCounts(vc, mc).sources}
      />

      <TimeTravel layerKey={layer.key} />

      {/* ────────────────────────────────────────────────────────────────
          Analyst's take, the one-sentence lead, above §1.
          Hidden for non-default tenants: the analyst leads are written
          in Meridian Industrial-shaped language (named channels, named
          competitors, "$11M gap"…) that the vocab swap cannot translate.
          Same anti-leak principle as NEUTRAL_LAYER_NARRATIVE in
          CompanyContext.
         ──────────────────────────────────────────────────────────────── */}
      {isDefaultProfile && (
        <div className="card card-accent-gold">
          <div className="flex items-baseline gap-3">
            <div className="eyebrow text-[var(--gold)] shrink-0">Analyst's take</div>
            <p className="font-serif italic text-[16px] leading-[1.5] text-[var(--ink)]">
              <ClaimAnnotation claimPath="headline_finding" verifiedClaims={vc} modelledClaims={mc} onReportBroken={onReportBroken}>
                {layer.analystTake}
              </ClaimAnnotation>
            </p>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────
          §1 RECOMMENDATION, what to do (BLUF)
          Narrative + actions paired at the top, then committed next steps.
         ──────────────────────────────────────────────────────────────── */}
      <SectionHeading index="§1" label="Recommendation" sub="What to do, the call, with dollars attached" />
      {/* Narrative + actions sit side-by-side; NextSteps lives BELOW the grid
          at full width. Earlier we tucked NextSteps into the narrative column
          to absorb dead space, but at 2/3 width its three time-horizon cards
          collapsed to ~150px each and copy wrapped one word per line. Full
          width gives each horizon ~3× the room and the prose breathes. */}
      <div className="grid grid-cols-3 gap-6 items-start">
        <div className="col-span-2 space-y-4">
          {narrativeCard}
          <ConfidenceLadder layer={layer} />
        </div>
        <div>{actionsCard}</div>
      </div>
      <NextSteps layerKey={layer.key} layerTitle={layer.title} />

      {/* ────────────────────────────────────────────────────────────────
          §2 SITUATION, descriptive: where we stand right now
         ──────────────────────────────────────────────────────────────── */}
      <SectionHeading index="§2" label="Situation" sub="The numbers, what's happening, against plan and against peers" />
      {metricStrip}
      <GapRecoveryDiptych layer={layer} />
      {Extra && <Extra />}
      <CauseWaterfall layer={layer} />
      {PEERS[layer.key] && <PeerBenchmark layerKey={layer.key} />}

      {/* ────────────────────────────────────────────────────────────────
          §3 DIAGNOSIS, why: root causes and intervention modelling
         ──────────────────────────────────────────────────────────────── */}
      <SectionHeading
        index="§3"
        label={showWhatIf ? "Intervention tests" : "Root causes"}
        sub={showWhatIf
          ? "Why it's happening, with live levers to model the recovery"
          : "Why it's happening, the diagnosis behind the variance"}
      />
      {causesCard}
      {showWhatIf && scenario && <WhatIfLevers scenario={scenario} />}

      {/* ────────────────────────────────────────────────────────────────
          §4 DETAIL, drill-down, source proof, and what's missing
         ──────────────────────────────────────────────────────────────── */}
      <SectionHeading index="§4" label="Detail" sub="The proof, source data, drill-downs, and architectural gaps" />
      <PipelineDetail layerKey={layer.key} />
      <DataFeedsCard layerKey={layer.key} />
      {gapsCard}

      {open && <ChallengeModal layer={layer} onClose={() => setOpen(false)} />}
    </div>
  );
}

function ClaimCountStrip({ verified, modelled, sources }: { verified: number; modelled: number; sources: number }) {
  if (verified + modelled === 0) return null;
  return (
    <div className="flex items-center gap-2 font-sans text-[10px] font-semibold tracking-wider uppercase tabular-nums">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm cursor-help"
                style={{ background: "var(--gold)", color: "var(--navy-deep)" }}>
            <span>{verified}</span><span className="opacity-70">verified</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-[var(--paper)] text-[var(--ink)] border border-[var(--gold)] max-w-[280px] p-2.5 font-sans text-[11px] normal-case tracking-normal font-normal leading-snug">
          Web-grounded claims with at least one named source. Hover a gold pill on the page to inspect the source list and report a broken link.
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm cursor-help"
                style={{ background: "var(--cream-light)", color: "var(--slate)", border: "1px solid var(--cream-dark)" }}>
            <span>{modelled}</span><span className="opacity-70">modelled</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-[var(--paper)] text-[var(--ink)] border border-[var(--cream-dark)] max-w-[280px] p-2.5 font-sans text-[11px] normal-case tracking-normal font-normal leading-snug">
          Inferred claims. Each one names a basis and a confidence band so the reader can weight them. Hover a cream band on the page for the basis and the inferred-from list.
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm cursor-help text-[var(--slate-light)]"
                style={{ border: "1px solid var(--cream-dark)" }}>
            <span>{sources}</span><span className="opacity-70">sources</span>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-[var(--paper)] text-[var(--ink)] border border-[var(--cream-dark)] max-w-[280px] p-2.5 font-sans text-[11px] normal-case tracking-normal font-normal leading-snug">
          Unique source URLs cited across all verified claims on this layer.
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function SectionHeading({ index, label, sub }: { index: string; label: string; sub: string }) {
  return (
    <div className="pt-3 mt-2 border-t border-[var(--cream-dark)]">
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="font-serif font-semibold text-[13px] text-[var(--gold)] tabular-nums tracking-wide">{index}</span>
        <span className="eyebrow text-[var(--navy)]">{label}</span>
        <span className="font-serif italic text-[12px] text-[var(--slate-light)]">{sub}</span>
      </div>
    </div>
  );
}
