import { useEffect, useMemo } from "react";
import { X, GitBranch, AlertCircle, ArrowUpRight, TrendingDown, TrendingUp, Activity, FileSearch, Layers } from "lucide-react";
import { useApp } from "../context/AppContext";
import { useNarrative } from "../context/CompanyContext";
import type { LayerData, Tone } from "../data/layers";

// ----------------------------------------------------------------------------
// "Why this number?" inspector.
//
// Right-side panel that opens when the user clicks any metric tile in a
// layer. It traces the metric through the cause graph:
//
//   1. Identity (label, value, sub, tone, trend)
//   2. Drivers — the layer's own causes (the diagnosis the layer has built)
//   3. Cross-layer context — other layers whose metrics/causes mention any
//      token from this metric's label, surfaced as click-through chips
//   4. Counter-arguments — confidence band against alternative explanations
//   5. CTA to open the deeper evidence panel when raw evidence is attached
//
// Designed as additive surface: it does NOT replace the evidence panel,
// it routes to it. The point is to give an executive the "show me your
// work" answer in one panel without forcing them to drill across screens.
// ----------------------------------------------------------------------------

const toneColor = (t: Tone) =>
  t === "good" ? "var(--teal)" : t === "bad" ? "var(--coral)" : "var(--amber)";

// Tokenize a label like "Gross margin %" → ["gross", "margin"], stripped of
// punctuation and stopwords so we don't match on "the" / "of" / etc.
const STOP = new Set(["the", "and", "of", "a", "to", "in", "on", "for", "vs", "ytd", "qtd"]);
function tokens(label: string): string[] {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP.has(t));
}

// Find layers (other than `selfKey`) whose metric labels OR cause titles
// mention any token from the source metric's label. Capped at 4 to keep
// the panel scannable.
function findCrossLayer(layers: LayerData[], selfKey: string, metricLabel: string): LayerData[] {
  const toks = tokens(metricLabel);
  if (toks.length === 0) return [];
  const matches: LayerData[] = [];
  for (const layer of layers) {
    if (layer.key === selfKey) continue;
    const haystack = [
      ...layer.metrics.map(m => m.label.toLowerCase()),
      ...layer.causes.map(c => c.title.toLowerCase()),
    ].join(" | ");
    if (toks.some(t => haystack.includes(t))) {
      matches.push(layer);
      if (matches.length >= 4) break;
    }
  }
  return matches;
}

interface Props {
  /** Routes a cross-layer chip click to App's real navigation handler.
      We can't just call setActiveLayer from context: App keeps its own
      local `active` state and only writes context, never reads it.
      Without this prop the chip would silently no-op the visible view. */
  onNavigate: (key: string) => void;
}

export default function WhyInspector({ onNavigate }: Props) {
  const { why, closeWhy, openEvidence } = useApp();
  const { LAYERS, EVIDENCE } = useNarrative();

  // Esc to dismiss.
  useEffect(() => {
    if (!why) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeWhy(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [why, closeWhy]);

  // Resolve the current layer + metric (memoized so we don't re-scan
  // LAYERS on every render).
  const ctx = useMemo(() => {
    if (!why) return null;
    const layer = LAYERS.find(l => l.key === why.layer);
    if (!layer) return null;
    const metric = layer.metrics.find(m => m.label === why.metric);
    if (!metric) return null;
    const cross = findCrossLayer(LAYERS, why.layer, why.metric);
    const evidenceKey = `${why.layer}/${why.metric}`;
    const hasEvidence = !!EVIDENCE[evidenceKey];
    return { layer, metric, cross, hasEvidence };
  }, [why, LAYERS, EVIDENCE]);

  if (!why || !ctx) return null;

  const { layer, metric, cross, hasEvidence } = ctx;
  const TrendIcon = metric.tone === "good" ? TrendingUp : metric.tone === "bad" ? TrendingDown : Activity;

  return (
    <div className="fixed inset-0 z-40 flex justify-end" aria-modal="true" role="dialog"
         style={{ background: "rgba(15,26,51,0.35)" }}
         onClick={closeWhy}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="h-full w-[460px] max-w-[92vw] overflow-y-auto scroll-area shadow-2xl flex flex-col"
        style={{ background: "var(--cream)", borderLeft: "1px solid var(--cream-dark)" }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--cream-dark)] shrink-0" style={{ background: "var(--cream-light)" }}>
          <div className="flex items-start justify-between mb-1">
            <div className="eyebrow text-[var(--gold)]">Why this number?</div>
            <button onClick={closeWhy} aria-label="Close inspector"
                    className="text-[var(--slate-light)] hover:text-[var(--navy)] transition-colors -mt-0.5">
              <X size={16} strokeWidth={1.8} />
            </button>
          </div>
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <h3 className="font-serif font-semibold text-[18px] text-[var(--navy)] leading-tight">{metric.label}</h3>
            <span className="font-sans font-semibold tabular-nums text-[26px] leading-none" style={{ color: toneColor(metric.tone) }}>
              {metric.value}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendIcon size={12} strokeWidth={2} style={{ color: toneColor(metric.tone) }} />
            <span className="font-sans italic text-[12px] text-[var(--slate)] leading-snug">{metric.sub}</span>
          </div>
          <div className="mt-2 font-sans text-[10px] uppercase tracking-wider text-[var(--slate-light)]">
            Source layer: <span className="text-[var(--navy)] font-semibold">{layer.title}</span>
          </div>
        </div>

        {/* Drivers */}
        <section className="px-5 py-4 border-b border-[var(--cream-dark)]">
          <div className="flex items-center gap-1.5 mb-3">
            <Activity size={11} strokeWidth={2} className="text-[var(--coral)]" />
            <h4 className="eyebrow text-[var(--coral)]">Drivers · what the diagnosis attributes this to</h4>
          </div>
          {layer.causes.length === 0 ? (
            <p className="font-serif italic text-[12px] text-[var(--slate-light)]">No causes have been attributed yet.</p>
          ) : (
            <ul className="space-y-3">
              {layer.causes.slice(0, 4).map((c, i) => (
                <li key={i} className="rounded-sm p-3" style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)" }}>
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <div className="font-sans font-semibold text-[13px] text-[var(--navy)] leading-snug">{c.title}</div>
                    <div className="font-sans font-semibold text-[12px] tabular-nums shrink-0" style={{ color: toneColor("bad") }}>{c.impact}</div>
                  </div>
                  <p className="font-serif italic text-[12px] text-[var(--slate)] leading-relaxed">{c.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Cross-layer context */}
        <section className="px-5 py-4 border-b border-[var(--cream-dark)]">
          <div className="flex items-center gap-1.5 mb-3">
            <GitBranch size={11} strokeWidth={2} className="text-[var(--gold)]" />
            <h4 className="eyebrow text-[var(--gold)]">Cross-layer context</h4>
          </div>
          {cross.length === 0 ? (
            <p className="font-serif italic text-[12px] text-[var(--slate-light)]">
              No other layer signals are referencing this metric right now.
            </p>
          ) : (
            <>
              <p className="font-serif italic text-[11px] text-[var(--slate-light)] leading-snug mb-2.5">
                Other layers whose own signals reference the same concepts. Click to jump.
              </p>
              <div className="flex flex-col gap-1.5">
                {cross.map(l => (
                  <button key={l.key}
                          onClick={() => { onNavigate(l.key); closeWhy(); }}
                          className="group flex items-center justify-between gap-3 px-3 py-2 rounded-sm text-left transition-colors hover:bg-[var(--gold-faint)] hover:border-[var(--gold)]"
                          style={{ background: "var(--cream-light)", border: "1px solid var(--cream-dark)" }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Layers size={12} strokeWidth={1.8} className="text-[var(--slate-light)] group-hover:text-[var(--gold)] shrink-0" />
                      <span className="font-sans text-[12px] font-semibold text-[var(--navy)] truncate">{l.title}</span>
                      <span className="font-sans text-[10px] uppercase tracking-wider text-[var(--slate-light)] truncate">· {l.group}</span>
                    </div>
                    <ArrowUpRight size={11} strokeWidth={1.8} className="text-[var(--slate-light)] group-hover:text-[var(--gold)] shrink-0" />
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Counter-arguments */}
        {layer.counterArgs && layer.counterArgs.length > 0 && (
          <section className="px-5 py-4 border-b border-[var(--cream-dark)]">
            <div className="flex items-center gap-1.5 mb-3">
              <AlertCircle size={11} strokeWidth={2} className="text-[var(--slate)]" />
              <h4 className="eyebrow text-[var(--slate)]">Alternative explanations · tested and rejected</h4>
            </div>
            <ul className="space-y-2">
              {layer.counterArgs.slice(0, 3).map((c, i) => (
                <li key={i} className="rounded-sm px-3 py-2" style={{ background: "var(--cream-light)", border: "1px dashed var(--cream-dark)" }}>
                  <div className="flex items-baseline justify-between gap-3 mb-0.5">
                    <div className="font-sans text-[12px] text-[var(--navy)] leading-snug">{c.title}</div>
                    <div className="font-sans text-[10px] uppercase tracking-wider text-[var(--slate-light)] shrink-0">{c.ci}</div>
                  </div>
                  <p className="font-serif italic text-[11px] text-[var(--slate)] leading-relaxed">{c.detail}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Evidence CTA */}
        <section className="px-5 py-4 mt-auto shrink-0" style={{ background: "var(--cream-light)" }}>
          {hasEvidence ? (
            <button onClick={() => { openEvidence(why.layer, why.metric); closeWhy(); }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-sm font-sans text-[12px] font-semibold transition-colors hover:bg-[var(--navy-deep)]"
                    style={{ background: "var(--navy)", color: "var(--cream)" }}>
              <span className="flex items-center gap-2">
                <FileSearch size={13} strokeWidth={1.8} />
                Open raw evidence
              </span>
              <ArrowUpRight size={12} strokeWidth={2} />
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-sm font-sans text-[11px] italic text-[var(--slate-light)]"
                 style={{ background: "var(--cream)", border: "1px dashed var(--cream-dark)" }}>
              <FileSearch size={11} strokeWidth={1.8} />
              No raw evidence is attached to this metric.
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
