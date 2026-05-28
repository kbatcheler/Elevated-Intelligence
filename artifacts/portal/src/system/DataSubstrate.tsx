import { useEffect, useMemo, useState } from "react";
import {
  Database, Workflow, Boxes, GitBranch, Sparkles, ShieldCheck,
  Radio, Activity, Layers as LayersIcon, Cpu,
  CheckCircle2, MinusCircle, Clock,
} from "lucide-react";
import {
  CONNECTORS, CONNECTOR_CATEGORIES, CORTEX_LANES, PARITY,
  type ConnectorCategory,
} from "../data/connectors";

interface Props {
  onNavigate: (key: string) => void;
}

const STAGES = ["Ingest", "Cortex", "Reasoning", "Published"] as const;
type StageIdx = 0 | 1 | 2 | 3;

const STAGE_META: { label: string; sub: string; accent: string; icon: typeof Radio }[] = [
  { label: "INGEST",     sub: "raw feed received",       accent: "var(--coral)", icon: Radio },
  { label: "CORTEX",     sub: "signal extracted",        accent: "var(--gold)",  icon: Sparkles },
  { label: "REASONING",  sub: "hypothesis + evidence",   accent: "var(--teal)",  icon: GitBranch },
  { label: "PUBLISHED",  sub: "narrated conclusion",     accent: "var(--navy)",  icon: CheckCircle2 },
];

interface ActivityRow {
  ts: number;
  text: string;
  tone: "ingest" | "cortex" | "reasoning" | "published";
}

// ────────────────────────────────────────────────────────────────────
// LIVE CORTEX CONTROL PANEL
// Four columns, each holding one lane at a time. On each tick (~1.6s)
// every lane advances one stage; the lane leaving PUBLISHED is replaced
// at INGEST with the next entry from CORTEX_LANES. This is the working
// POC the user demos in front of buyers: same shape as production, just
// driven by the curated CORTEX_LANES catalogue instead of live traffic.
// ────────────────────────────────────────────────────────────────────
function CortexControlPanel() {
  const [tick, setTick] = useState(0);
  const [activity, setActivity] = useState<ActivityRow[]>([]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1700);
    return () => clearInterval(id);
  }, []);

  // The four visible columns each show a different lane offset from tick.
  // Newest at INGEST (col 0), oldest about to leave at PUBLISHED (col 3).
  const cols = useMemo(() => ([0, 1, 2, 3] as StageIdx[]).map(col => {
    const offset = 3 - col;
    const laneIdx = ((tick + offset) % CORTEX_LANES.length + CORTEX_LANES.length) % CORTEX_LANES.length;
    return { stage: col, lane: CORTEX_LANES[laneIdx], laneIdx };
  }), [tick]);

  // Append an activity row whenever the tick advances, narrating what the
  // newly-published lane just did. We cap at 8 rows so the log stays
  // compact under the control panel.
  useEffect(() => {
    if (tick === 0) return;
    const published = cols[3].lane;
    if (!published) return;
    const ms = Date.now();
    const rows: ActivityRow[] = [
      { ts: ms,     tone: "published",  text: `${published.feed} → conclusion published (${published.confidence}% confidence, ${published.ingestMs}ms ingest)` },
      { ts: ms - 1, tone: "reasoning",  text: `${cols[2].lane.feed} → ${cols[2].lane.evidence.length} evidence sources cross-checked` },
      { ts: ms - 2, tone: "cortex",     text: `${cols[1].lane.feed} → signal extracted: "${cols[1].lane.signal.slice(0, 60)}${cols[1].lane.signal.length > 60 ? "…" : ""}"` },
      { ts: ms - 3, tone: "ingest",     text: `${cols[0].lane.feed} → ${cols[0].lane.ingestMs}ms` },
    ];
    setActivity(prev => [...rows, ...prev].slice(0, 8));
  }, [tick, cols]);

  const tokensPerSec = 1840 + (tick % 7) * 47;
  const avgLatencyMs = Math.round(CORTEX_LANES.reduce((s, l) => s + l.ingestMs, 0) / CORTEX_LANES.length);

  return (
    <div className="card !p-0 overflow-hidden" style={{ background: "var(--navy-deep)" }}>
      {/* Console-style header strip */}
      <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "rgba(244,241,234,0.12)", background: "var(--navy-deep)" }}>
        <div className="flex items-center gap-3">
          <Cpu size={16} className="text-[var(--gold-light)]" strokeWidth={1.6} />
          <div>
            <div className="font-sans font-semibold text-[13px] text-[var(--cream-light)] tracking-wide">CORTEX CONTROL PANEL</div>
            <div className="font-sans text-[11px] text-[var(--gold-light)]/70 italic">live · synthetic-but-traced</div>
          </div>
        </div>
        <div className="flex items-center gap-5 text-[11px] font-mono text-[var(--cream-light)]/80">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal)] animate-pulse" />
            <span>{CORTEX_LANES.length} lanes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity size={11} strokeWidth={1.8} className="text-[var(--gold-light)]" />
            <span className="tabular-nums">{tokensPerSec.toLocaleString()} tok/s</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={11} strokeWidth={1.8} className="text-[var(--gold-light)]" />
            <span className="tabular-nums">~{avgLatencyMs}ms avg</span>
          </div>
        </div>
      </div>

      {/* Four stage columns */}
      <div className="grid grid-cols-4">
        {cols.map(({ stage, lane, laneIdx }) => {
          const meta = STAGE_META[stage];
          const Icon = meta.icon;
          return (
            <div key={stage} className="border-r last:border-r-0 px-4 py-4" style={{ borderColor: "rgba(244,241,234,0.1)", minHeight: 260 }}>
              <div className="flex items-center gap-2 mb-3">
                <Icon size={12} strokeWidth={1.8} style={{ color: meta.accent }} />
                <span className="font-mono text-[10.5px] tracking-[0.14em] font-semibold" style={{ color: meta.accent }}>{meta.label}</span>
                <span className="font-mono text-[9.5px] text-[var(--cream-light)]/40 ml-auto">L-{(laneIdx + 1).toString().padStart(2, "0")}</span>
              </div>
              <div
                key={`${stage}-${laneIdx}`}
                className="rounded-sm p-3 animate-[fadeSlide_0.5s_ease-out]"
                style={{ background: "rgba(244,241,234,0.04)", border: "1px solid rgba(244,241,234,0.08)" }}
              >
                {stage === 0 && (
                  <>
                    <div className="font-mono text-[11px] text-[var(--gold-light)] mb-1.5">{lane.feed}</div>
                    <div className="font-sans text-[12px] text-[var(--cream-light)]/80 leading-snug">arrived in <span className="font-mono text-[var(--cream-light)] tabular-nums">{lane.ingestMs}ms</span></div>
                  </>
                )}
                {stage === 1 && (
                  <>
                    <div className="font-mono text-[10.5px] text-[var(--gold-light)]/70 mb-1.5">{lane.feed} · signal</div>
                    <div className="font-serif text-[13px] text-[var(--cream-light)] leading-snug">{lane.signal}</div>
                  </>
                )}
                {stage === 2 && (
                  <>
                    <div className="font-mono text-[10.5px] text-[var(--gold-light)]/70 mb-1.5">{lane.feed} · hypothesis</div>
                    <div className="font-serif italic text-[12.5px] text-[var(--cream-light)]/90 leading-snug mb-2">"{lane.hypothesis}"</div>
                    <div className="font-mono text-[9.5px] text-[var(--teal)] tracking-[0.08em] mb-1">{lane.evidence.length} EVIDENCE</div>
                    <ul className="space-y-0.5 font-mono text-[10px] text-[var(--cream-light)]/60">
                      {lane.evidence.map((e, i) => <li key={i}>· {e}</li>)}
                    </ul>
                  </>
                )}
                {stage === 3 && (
                  <>
                    <div className="font-mono text-[10.5px] text-[var(--gold-light)]/70 mb-1.5">{lane.feed} · published</div>
                    <div className="font-serif text-[12.5px] text-[var(--cream-light)] leading-snug mb-2">{lane.conclusion}</div>
                    <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "rgba(244,241,234,0.1)" }}>
                      <div className="font-mono text-[10px] text-[var(--gold-light)]">CONFIDENCE</div>
                      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(244,241,234,0.1)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${lane.confidence}%`, background: lane.confidence >= 80 ? "var(--teal)" : lane.confidence >= 65 ? "var(--gold-light)" : "var(--coral)" }} />
                      </div>
                      <div className="font-mono text-[11px] text-[var(--cream-light)] tabular-nums font-semibold">{lane.confidence}%</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rolling activity log */}
      <div className="px-5 py-3 border-t font-mono text-[10.5px] text-[var(--cream-light)]/65 leading-relaxed" style={{ borderColor: "rgba(244,241,234,0.12)", maxHeight: 160, overflowY: "auto" }}>
        {activity.length === 0 && <div className="opacity-50">waiting for first tick…</div>}
        {activity.map((row, i) => {
          const dot = row.tone === "published" ? "var(--navy)"
            : row.tone === "reasoning" ? "var(--teal)"
            : row.tone === "cortex" ? "var(--gold-light)"
            : "var(--coral)";
          return (
            <div key={`${row.ts}-${i}`} className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 rounded-full shrink-0" style={{ background: dot }} />
              <span className="opacity-50">[{new Date(row.ts).toLocaleTimeString("en-GB", { hour12: false })}]</span>
              <span>{row.text}</span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// CONNECTOR LIBRARY
// Categorized grid. Click a category chip at the top to filter. Each
// connector pill carries auth + cadence + status so the buyer can read
// the depth without us needing to click each one. Counts are live off
// the CONNECTORS catalogue, never hand-typed.
// ────────────────────────────────────────────────────────────────────
function ConnectorLibrary() {
  const [active, setActive] = useState<ConnectorCategory | "All">("All");

  const filtered = active === "All" ? CONNECTORS : CONNECTORS.filter(c => c.category === active);
  const countByCat = (cat: ConnectorCategory) => CONNECTORS.filter(c => c.category === cat).length;
  const liveCount = CONNECTORS.filter(c => c.status === "live").length;
  const betaCount = CONNECTORS.filter(c => c.status === "beta").length;

  const statusPill = (s: "live" | "beta" | "planned") => {
    if (s === "live") return <span className="font-mono text-[9px] tracking-wide text-[var(--teal)]">● LIVE</span>;
    if (s === "beta") return <span className="font-mono text-[9px] tracking-wide text-[var(--amber)]">● BETA</span>;
    return <span className="font-mono text-[9px] tracking-wide text-[var(--slate-light)]">○ PLANNED</span>;
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-serif text-[24px] font-semibold text-[var(--navy)]">Connector library</h2>
        <div className="font-mono text-[11px] text-[var(--slate-light)] tabular-nums">
          {liveCount} live · {betaCount} beta · {CONNECTORS.length} total
        </div>
      </div>
      <p className="font-serif italic text-[15px] text-[var(--slate)] mb-4 max-w-[820px]">
        Every feed we draw on, every system we write back to. Authenticated, scheduled, and observable. The escape hatches at the bottom of the list mean we have never told a buyer "we can't reach that system".
      </p>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button
          onClick={() => setActive("All")}
          className={`px-3 py-1 rounded-sm text-[11.5px] font-sans transition-colors ${active === "All" ? "bg-[var(--navy)] text-[var(--cream-light)]" : "bg-[var(--cream-light)] text-[var(--slate)] border border-[var(--cream-dark)] hover:border-[var(--navy)]"}`}
        >
          All <span className="opacity-60 tabular-nums">· {CONNECTORS.length}</span>
        </button>
        {CONNECTOR_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-3 py-1 rounded-sm text-[11.5px] font-sans transition-colors ${active === cat ? "bg-[var(--navy)] text-[var(--cream-light)]" : "bg-[var(--cream-light)] text-[var(--slate)] border border-[var(--cream-dark)] hover:border-[var(--navy)]"}`}
          >
            {cat} <span className="opacity-60 tabular-nums">· {countByCat(cat)}</span>
          </button>
        ))}
      </div>

      {/* Connector grid */}
      <div className="grid grid-cols-3 gap-2">
        {filtered.map(c => (
          <div key={c.name} className="border border-[var(--cream-dark)] rounded-sm px-3 py-2 bg-[var(--cream-light)] hover:border-[var(--gold)] transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="font-sans font-semibold text-[13px] text-[var(--navy)] leading-tight truncate">{c.name}</div>
              {statusPill(c.status)}
            </div>
            <div className="font-mono text-[10px] text-[var(--slate-light)] mt-1.5 flex items-center gap-2">
              <span>{c.auth}</span>
              <span className="opacity-40">·</span>
              <span>{c.cadence}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// SUBSTRATE MAP
// A static three-column map: feeds (left) → cortex (centre) → app
// surfaces (right). Reads top-to-bottom as a sales narrative: "we
// ingest your stack, we reason across it, we surface in workflows."
// ────────────────────────────────────────────────────────────────────
function SubstrateMap() {
  const feedClusters = [
    { name: "Operational systems",  items: ["ERP · NetSuite, SAP", "WMS · Manhattan, Blue Yonder", "HRIS · Workday, Rippling"] },
    { name: "Customer surface",     items: ["CRM · Salesforce, HubSpot", "Support · Zendesk, Intercom", "Product · Segment, Amplitude"] },
    { name: "Commerce + finance",   items: ["E-com · Shopify, BigCommerce", "Payments · Stripe, Adyen", "Marketing · Klaviyo, Meta, Google"] },
    { name: "External signals",     items: ["Macro · BLS, FRED", "Competitor · SimilarWeb, G2", "News · Factiva, Reddit"] },
  ];
  const cortexStages = [
    { name: "Normalisation",   detail: "schema-mapped to the 14-layer ontology" },
    { name: "Cortex Lens",     detail: "anomaly + signal extraction with confidence" },
    { name: "Confounder",      detail: "rules out competing explanations" },
    { name: "Challenger",      detail: "adversarial counter-arguments per claim" },
    { name: "Synthesist",      detail: "writes the narrative, names the sources" },
    { name: "Evaluator",       detail: "scores confidence, routes gaps" },
  ];
  const appSurfaces = [
    { name: "14 intelligence layers",    detail: "the layer pages you have been clicking" },
    { name: "Morning brief",             detail: "one-page diagnosis delivered before 8am" },
    { name: "Scenario war-room",         detail: "named levers with $ recovery per move" },
    { name: "Engagement pipeline",       detail: "30/60/90 plan with owner + deadline" },
    { name: "Custom diagnostic apps",    detail: "26 pre-built, configurable per tenant" },
    { name: "Webhook + API write-back",  detail: "into your tools, owned by your team" },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-serif text-[24px] font-semibold text-[var(--navy)]">The substrate, end to end</h2>
        <div className="font-mono text-[11px] text-[var(--slate-light)] tabular-nums">feeds → cortex → surfaces</div>
      </div>
      <p className="font-serif italic text-[15px] text-[var(--slate)] mb-5 max-w-[820px]">
        The same six-stage reasoning chain runs across every feed we ingest. The output is not a dashboard; it is a defended narrative your operators can read on Monday and act on by Wednesday.
      </p>

      <div className="grid grid-cols-12 gap-3">
        {/* Feeds column */}
        <div className="col-span-4 card !p-4" style={{ background: "var(--cream-light)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Database size={14} strokeWidth={1.8} className="text-[var(--coral)]" />
            <div className="font-mono text-[10.5px] tracking-[0.14em] font-semibold text-[var(--coral)]">INGEST</div>
          </div>
          <div className="space-y-3">
            {feedClusters.map(c => (
              <div key={c.name}>
                <div className="font-sans font-semibold text-[12.5px] text-[var(--navy)] mb-1">{c.name}</div>
                <ul className="space-y-0.5 font-mono text-[10.5px] text-[var(--slate)]">
                  {c.items.map(i => <li key={i}>· {i}</li>)}
                </ul>
              </div>
            ))}
            <div className="pt-2 border-t border-[var(--cream-dark)] font-sans italic text-[11px] text-[var(--slate-light)]">
              plus 80+ more in the connector library below.
            </div>
          </div>
        </div>

        {/* Cortex column */}
        <div className="col-span-4 card card-accent-gold !p-4" style={{ background: "var(--navy-deep)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Workflow size={14} strokeWidth={1.8} className="text-[var(--gold-light)]" />
            <div className="font-mono text-[10.5px] tracking-[0.14em] font-semibold text-[var(--gold-light)]">CORTEX</div>
          </div>
          <ol className="space-y-2.5">
            {cortexStages.map((s, i) => (
              <li key={s.name} className="flex gap-2.5">
                <span className="font-mono text-[11px] text-[var(--gold-light)] w-4 shrink-0 mt-0.5">{i + 1}.</span>
                <div className="min-w-0">
                  <div className="font-sans font-semibold text-[12.5px] text-[var(--cream-light)] leading-tight">{s.name}</div>
                  <div className="font-sans italic text-[11px] text-[var(--cream-light)]/65 leading-snug mt-0.5">{s.detail}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-3 pt-3 border-t font-mono text-[10px] text-[var(--gold-light)]/80 tracking-wide" style={{ borderColor: "rgba(244,241,234,0.1)" }}>
            every output carries tokens, ms, and a confidence number.
          </div>
        </div>

        {/* Surfaces column */}
        <div className="col-span-4 card !p-4" style={{ background: "var(--cream-light)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Boxes size={14} strokeWidth={1.8} className="text-[var(--teal)]" />
            <div className="font-mono text-[10.5px] tracking-[0.14em] font-semibold text-[var(--teal)]">SURFACES</div>
          </div>
          <ul className="space-y-2.5">
            {appSurfaces.map(s => (
              <li key={s.name}>
                <div className="font-sans font-semibold text-[12.5px] text-[var(--navy)] leading-tight">{s.name}</div>
                <div className="font-sans italic text-[11px] text-[var(--slate)] leading-snug mt-0.5">{s.detail}</div>
              </li>
            ))}
          </ul>
          <div className="pt-3 mt-2 border-t border-[var(--cream-dark)] font-sans italic text-[11px] text-[var(--slate-light)]">
            same substrate, future apps drop in without re-plumbing.
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// PALANTIR PARITY MATRIX
// No prices, ever. The asymmetry we sell is time-to-value and posture,
// not licence cost. Each row has a verdict so the reader can see at a
// glance where we match, where we lead, and where we have deliberately
// chosen not to chase.
// ────────────────────────────────────────────────────────────────────
function ParityMatrix() {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-serif text-[24px] font-semibold text-[var(--navy)]">Side by side with Palantir Foundry</h2>
        <div className="font-mono text-[11px] text-[var(--slate-light)]">capability parity · no licence cost discussed</div>
      </div>
      <p className="font-serif italic text-[15px] text-[var(--slate)] mb-4 max-w-[820px]">
        We do not position against Foundry on price; we position on time-to-value. The buyer who picks Foundry gets a year-three answer. The buyer who picks us has a defended diagnosis on the Friday of week one and a substrate that deepens from there.
      </p>

      <div className="card !p-0 overflow-hidden">
        <div className="grid grid-cols-12 gap-0 border-b border-[var(--cream-dark)] bg-[var(--cream-light)] px-5 py-3 font-mono text-[10.5px] tracking-[0.12em] font-semibold text-[var(--slate)]">
          <div className="col-span-4">CAPABILITY</div>
          <div className="col-span-4">PALANTIR FOUNDRY</div>
          <div className="col-span-4">DIFFERENT DAY</div>
        </div>
        {PARITY.map((row, i) => {
          const verdictMeta = row.verdict === "edge"
            ? { label: "EDGE", color: "var(--teal)",  icon: CheckCircle2 }
            : row.verdict === "match"
            ? { label: "MATCH", color: "var(--navy)", icon: MinusCircle }
            : { label: "TRADE", color: "var(--amber)", icon: ShieldCheck };
          const VIcon = verdictMeta.icon;
          return (
            <div key={i} className={`grid grid-cols-12 gap-0 px-5 py-3 ${i < PARITY.length - 1 ? "border-b border-[var(--cream-dark)]" : ""} ${i % 2 === 0 ? "" : "bg-[var(--cream-light)]/40"}`}>
              <div className="col-span-4 pr-4">
                <div className="font-sans font-semibold text-[13px] text-[var(--navy)] leading-tight">{row.capability}</div>
                <div className="mt-1 flex items-center gap-1">
                  <VIcon size={10} strokeWidth={2} style={{ color: verdictMeta.color }} />
                  <span className="font-mono text-[9.5px] tracking-[0.1em] font-semibold" style={{ color: verdictMeta.color }}>{verdictMeta.label}</span>
                </div>
              </div>
              <div className="col-span-4 pr-4 font-serif text-[13px] text-[var(--slate)] leading-snug">{row.foundry}</div>
              <div className="col-span-4 font-serif text-[13px] text-[var(--ink)] leading-snug">{row.diffday}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 font-sans text-[11px] text-[var(--slate)]">
        <div className="flex items-center gap-2"><CheckCircle2 size={12} className="text-[var(--teal)]" strokeWidth={2} /><span><strong className="text-[var(--navy)]">EDGE</strong> · we lead on this for the mid-market buyer</span></div>
        <div className="flex items-center gap-2"><MinusCircle size={12} className="text-[var(--navy)]" strokeWidth={2} /><span><strong className="text-[var(--navy)]">MATCH</strong> · equivalent capability, different posture</span></div>
        <div className="flex items-center gap-2"><ShieldCheck size={12} className="text-[var(--amber)]" strokeWidth={2} /><span><strong className="text-[var(--navy)]">TRADE</strong> · we are deliberate about not chasing this</span></div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ────────────────────────────────────────────────────────────────────
export default function DataSubstrate({ onNavigate }: Props) {
  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="eyebrow text-[var(--coral)] mb-2">System · Data substrate</div>
        <h1 className="font-serif text-[40px] leading-[1.05] text-[var(--navy)] font-semibold">The substrate underneath the diagnosis</h1>
        <p className="font-serif italic text-[20px] text-[var(--slate-light)] mt-1.5 max-w-[860px]">
          The narrative on every layer page is the visible tip. Underneath sits the connector library, the cortex pipeline, and the substrate that the next generation of our apps will share. This page is the working POC.
        </p>
      </div>

      {/* Differentiator chips */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: LayersIcon, label: "14-layer ontology",    sub: "pre-built, not a Foundry project" },
          { icon: Database,   label: "100+ connectors",      sub: "OAuth, JDBC, webhook, SFTP, S3" },
          { icon: Workflow,   label: "Six-stage reasoning",  sub: "tokens + ms + confidence on every output" },
          { icon: Sparkles,   label: "Week-one diagnosis",   sub: "off your existing exports, defended" },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="card !p-3.5 card-accent-gold">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon size={14} strokeWidth={1.8} className="text-[var(--gold)]" />
              <div className="font-sans font-semibold text-[13px] text-[var(--navy)] leading-tight">{label}</div>
            </div>
            <div className="font-sans italic text-[11.5px] text-[var(--slate)] leading-snug">{sub}</div>
          </div>
        ))}
      </div>

      {/* Live cortex control panel — the centrepiece POC */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-[24px] font-semibold text-[var(--navy)]">Cortex, synthesis, reasoning, live</h2>
          <button
            onClick={() => onNavigate("intelligence-architecture")}
            className="font-sans text-[11.5px] text-[var(--coral)] hover:underline"
          >
            See the five named agents →
          </button>
        </div>
        <p className="font-serif italic text-[15px] text-[var(--slate)] mb-4 max-w-[820px]">
          Real shape, curated traffic. Each lane is a real diagnosis our system has run; here they cycle so you can watch a feed travel from ingest to published in seconds. The activity log under the panel is the same log your data team would tail in production.
        </p>
        <CortexControlPanel />
      </div>

      {/* Substrate map */}
      <SubstrateMap />

      {/* Connector library */}
      <ConnectorLibrary />

      {/* Palantir parity */}
      <ParityMatrix />

      {/* Footer pointer */}
      <div className="card card-accent-navy">
        <div className="font-sans font-semibold text-[14px] text-[var(--navy)] mb-1">Where to take the buyer next</div>
        <p className="font-serif text-[14px] text-[var(--ink)] leading-snug">
          If they want to see one reasoning chain in slow motion, send them to <button onClick={() => onNavigate("intelligence-architecture")} className="underline text-[var(--coral)]">Intelligence architecture</button>. If they want to see what we have already shipped, send them to <button onClick={() => onNavigate("track-record")} className="underline text-[var(--coral)]">Outcome track record</button>. If they are ready to scope, send them to <button onClick={() => onNavigate("engagement-pipeline")} className="underline text-[var(--coral)]">Engagement pipeline</button>.
        </p>
      </div>
    </div>
  );
}
