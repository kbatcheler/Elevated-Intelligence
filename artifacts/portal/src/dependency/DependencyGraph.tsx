import { useEffect, useState } from "react";
import { MousePointer2, X, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";
import {
  DATA_GAPS,
  DIFFDAY_PRODUCTS,
  PRODUCT_BY_ID,
  ACCESS_PRODUCT_IDS,
  gapsForLayer,
  totalLayerUplift,
  topGaps,
  type DataGap,
  type ProductCategory,
} from "../data/deficiencies";
import { DIFFDAY_APPS, appsForProduct, type DiffDayApp } from "../data/appLibrary";

// Each node is a layer; edges express "X feeds the diagnosis in Y, weighted W"
// Positions are laid out in a clustered, hand-tuned 4-band arrangement so it
// reads like an editorial graphic, not a force-directed mess.

type Node = {
  key: string;
  label: string;
  band: "exec" | "market" | "ops" | "system";
  x: number;
  y: number;
  status: "good" | "warn" | "bad";
};

type Edge = { from: string; to: string; weight: number; note?: string };

const NODES: Node[] = [
  // Executive band, top
  { key: "business-performance", label: "Business perf",     band: "exec",   x: 360, y: 80,  status: "warn" },
  { key: "finance",              label: "Finance",           band: "exec",   x: 620, y: 80,  status: "bad" },
  // Market-facing band
  { key: "demand-intelligence",      label: "Demand",        band: "market", x: 130, y: 240, status: "bad" },
  { key: "competitive-intelligence", label: "Competitive",   band: "market", x: 310, y: 240, status: "bad" },
  { key: "customer-intelligence",    label: "Customer",      band: "market", x: 490, y: 240, status: "warn" },
  { key: "brand-social",             label: "Brand & Social",band: "market", x: 670, y: 240, status: "warn" },
  // Operational band
  { key: "supply-chain",         label: "Supply chain",      band: "ops",    x:  90, y: 420, status: "bad"  },
  { key: "pricing-margin",       label: "Pricing & margin",  band: "ops",    x: 230, y: 420, status: "warn" },
  { key: "sales-pipeline",       label: "Sales pipeline",    band: "ops",    x: 370, y: 420, status: "bad"  },
  { key: "marketing-performance",label: "Marketing perf",    band: "ops",    x: 510, y: 420, status: "warn" },
  { key: "people-operations",    label: "People & ops",      band: "ops",    x: 650, y: 420, status: "bad"  },
  // System / financial close band, bottom
  { key: "receivables",          label: "Receivables",       band: "system", x: 220, y: 580, status: "bad"  },
  // Contracts has zero entries in DATA_GAPS, its work shows up as causal edges into 3 other layers, not as unmet feeds. Status set to "good" so the node visual matches the absent badge.
  { key: "contract-management",  label: "Contracts",         band: "system", x: 410, y: 580, status: "good" },
  { key: "talent-hr",            label: "Talent & HR",       band: "system", x: 600, y: 580, status: "bad"  },
];

const EDGES: Edge[] = [
  // Up into Business performance & Finance
  { from: "demand-intelligence",      to: "business-performance", weight: 0.60, note: "60% of revenue gap" },
  { from: "pricing-margin",           to: "business-performance", weight: 0.45, note: "240bps margin slip" },
  { from: "supply-chain",             to: "business-performance", weight: 0.25, note: "Stockout drag" },
  { from: "pricing-margin",           to: "finance",              weight: 0.65, note: "Bridge: $4.2M" },
  { from: "people-operations",        to: "finance",              weight: 0.20, note: "Bridge: $1.6M opex" },
  { from: "receivables",              to: "finance",              weight: 0.20, note: "Working cap $0.7M" },
  { from: "sales-pipeline",           to: "business-performance", weight: 0.20 },

  // Cross-market
  { from: "competitive-intelligence", to: "demand-intelligence",  weight: 0.55, note: "HD promo intensity" },
  { from: "competitive-intelligence", to: "pricing-margin",       weight: 0.45 },
  { from: "brand-social",             to: "customer-intelligence",weight: 0.30, note: "Sentiment cluster" },
  { from: "customer-intelligence",    to: "sales-pipeline",       weight: 0.35 },

  // Ops cross-deps
  { from: "supply-chain",             to: "demand-intelligence",  weight: 0.40, note: "Stockout → variance" },
  { from: "supply-chain",             to: "customer-intelligence",weight: 0.30, note: "ETA → tickets" },
  { from: "marketing-performance",    to: "brand-social",         weight: 0.25 },
  { from: "marketing-performance",    to: "demand-intelligence",  weight: 0.30 },

  // System feeders
  { from: "talent-hr",                to: "people-operations",    weight: 0.55, note: "DC roles open" },
  { from: "talent-hr",                to: "pricing-margin",       weight: 0.25, note: "Senior buyer open" },
  { from: "people-operations",        to: "supply-chain",         weight: 0.45, note: "11 unfilled shifts" },
  { from: "receivables",              to: "sales-pipeline",       weight: 0.20 },

  // Contracts, quiet amplifier of three other layers' diagnoses. Supplier
  // paper amplifies the supply-chain damage; customer MSAs constrain the
  // receivables recovery; rate-card contracts contributed $1.4M to the
  // Finance opex variance. Surfaces in the side panel when isolated.
  { from: "contract-management",      to: "supply-chain",         weight: 0.30, note: "Supplier C agreement in 23-day legal review" },
  { from: "contract-management",      to: "receivables",          weight: 0.35, note: "Evergreen MSAs cap recovery levers" },
  { from: "contract-management",      to: "finance",              weight: 0.20, note: "DC labour rate-card auto-renew · $1.4M opex" },
];

const statusColor = (s: Node["status"]) =>
  s === "bad" ? "var(--coral)" : s === "warn" ? "var(--amber)" : "var(--teal)";
const statusFill = (s: Node["status"]) =>
  s === "bad" ? "var(--coral-faint)" : s === "warn" ? "var(--amber-faint)" : "var(--teal-faint)";

// Pastel chip color per product category, keeps the side panel readable when
// many product chips appear together.
const categoryStyle = (c: ProductCategory): { bg: string; border: string; fg: string } => {
  switch (c) {
    case "intelligence":   return { bg: "var(--coral-faint)",  border: "var(--coral)",  fg: "var(--coral)"  };
    case "orchestration":  return { bg: "var(--amber-faint)",  border: "var(--amber)",  fg: "var(--navy)"   };
    case "access":         return { bg: "var(--teal-faint)",   border: "var(--teal)",   fg: "var(--navy)"   };
    case "infrastructure": return { bg: "var(--cream-dark)",   border: "var(--slate-light)", fg: "var(--navy)" };
  }
};

type InsightCard = {
  key: string;
  icon: typeof TrendingUp;
  iconColor: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaKey: string;
  edge: { from: string; to: string };
};

const INSIGHT_CARDS: InsightCard[] = [
  {
    key: "demand-bizperf",
    icon: TrendingUp,
    iconColor: "var(--coral)",
    headline: "Demand carries 60% of the gap into Business performance",
    body: "The single heaviest edge in the system. Fix Demand and the headline number moves first.",
    ctaLabel: "View Demand intelligence",
    ctaKey: "demand-intelligence",
    edge: { from: "demand-intelligence", to: "business-performance" },
  },
  {
    key: "talent-people",
    icon: AlertTriangle,
    iconColor: "var(--amber)",
    headline: "Talent gates Supply, Pricing and People at the same time",
    body: "Three downstream layers all wait on the same constrained Talent and HR input.",
    ctaLabel: "View Talent and HR",
    ctaKey: "talent-hr",
    edge: { from: "talent-hr", to: "people-operations" },
  },
  {
    key: "pricing-finance",
    icon: ShieldCheck,
    iconColor: "var(--teal)",
    headline: "Pricing feeds 65% of the Finance bridge",
    body: "The largest single line in the EBITDA bridge runs from Pricing and margin into Finance, $4.2M.",
    ctaLabel: "View Finance",
    ctaKey: "finance",
    edge: { from: "pricing-margin", to: "finance" },
  },
];

const edgeKey = (e: { from: string; to: string }) => `${e.from}->${e.to}`;

// Inline labels for the heaviest edges, rendered at the curve midpoint as a cream-light pill.
const EDGE_LABELS: Record<string, string> = {
  "demand-intelligence->business-performance": "60% Demand to Bizperf",
  "pricing-margin->finance":                   "65% Pricing to Finance",
  "competitive-intelligence->demand-intelligence": "55% Competitive to Demand",
  "talent-hr->people-operations":              "55% Talent to People",
};

export default function DependencyGraph({ onNavigate }: { onNavigate: (key: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const [cardHighlight, setCardHighlight] = useState<{ from: string; to: string } | null>(null);
  const [edgeFilter, setEdgeFilter] = useState<"top" | "all">("top");
  const [annotateGaps, setAnnotateGaps] = useState(false);
  const [coachDismissed, setCoachDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("ei.depGraph.coachDismissed") === "1";
  });
  useEffect(() => {
    if (coachDismissed && typeof window !== "undefined") {
      window.localStorage.setItem("ei.depGraph.coachDismissed", "1");
    }
  }, [coachDismissed]);

  const showGaps = annotateGaps;
  const nodeMap = Object.fromEntries(NODES.map(n => [n.key, n]));

  // Top edges threshold tuned to land in the 6-9 range the brief asks for, gives 8 edges today.
  const visibleEdges = edgeFilter === "top" ? EDGES.filter(e => e.weight >= 0.40) : EDGES;

  const highlightKey = cardHighlight ? edgeKey(cardHighlight) : null;
  const highlightedNodes = cardHighlight ? new Set([cardHighlight.from, cardHighlight.to]) : null;

  const isEdgeLit = (e: Edge) => {
    if (highlightKey) return edgeKey(e) === highlightKey;
    return !hover || e.from === hover || e.to === hover;
  };
  const isNodeLit = (k: string) => {
    if (highlightedNodes) return highlightedNodes.has(k);
    return !hover || k === hover ||
      EDGES.some(e => (e.from === hover && e.to === k) || (e.to === hover && e.from === k));
  };

  const focused = hover ? nodeMap[hover] : null;
  const focusedIn  = focused ? EDGES.filter(e => e.to === focused.key) : [];
  const focusedOut = focused ? EDGES.filter(e => e.from === focused.key) : [];
  const focusedGaps = focused ? gapsForLayer(focused.key) : [];
  const focusedUplift = focused ? totalLayerUplift(focused.key) : 0;

  const totalGapCount = DATA_GAPS.length;
  const totalUplift = DATA_GAPS.reduce((s, g) => s + g.confidenceUplift, 0);
  // System-level confidence anchor for the summary card. The 81% figure is
  // the weighted average across the 14 layer confidences (see data/layers.ts);
  // the ceiling is the same 95% cap we apply per-layer in Layer.tsx.
  const systemConfidenceToday = 81;
  const systemConfidenceCap = 95;
  const systemTarget = Math.min(systemConfidenceCap, systemConfidenceToday + Math.round(totalUplift / 3));

  return (
    <div className="space-y-6 pb-12">
      <div>
        <div className="eyebrow text-[var(--coral)] mb-2">Intelligence layer · System</div>
        <h1 className="font-serif text-[40px] leading-[1.05] text-[var(--navy)] font-semibold">Cross-layer dependency graph</h1>
      </div>

      {/* System-level confidence dual-signal, the cross-layer analogue of
          the per-layer "Close N gaps → Y%" pill in Layer.tsx. */}
      <div className="card card-accent-coral">
        <div className="grid grid-cols-12 gap-6 items-center">
          <div className="col-span-3">
            <div className="eyebrow text-[var(--slate-light)] mb-1">System confidence today</div>
            <div className="font-serif font-semibold text-[var(--navy)] tabular-nums" style={{ fontSize: 48, lineHeight: 1 }}>
              {systemConfidenceToday}%
            </div>
            <div className="font-sans italic text-[11px] text-[var(--slate-light)] mt-1">weighted across 14 operating layers</div>
          </div>
          <div className="col-span-1 text-center font-serif text-[var(--slate-light)] text-[20px]">→</div>
          <div className="col-span-4">
            <div className="eyebrow text-[var(--coral)] mb-1">Close {totalGapCount} gaps to reach</div>
            <div className="font-serif font-semibold text-[var(--coral)] tabular-nums" style={{ fontSize: 48, lineHeight: 1 }}>
              {systemTarget}%
            </div>
            <div className="font-sans italic text-[11px] text-[var(--slate-light)] mt-1">
              +{Math.max(0, systemTarget - systemConfidenceToday)}pp recoverable headroom, capped at {systemConfidenceCap}% so we never imply mechanical certainty
            </div>
          </div>
          <div className="col-span-4 border-l border-[var(--cream-dark)] pl-5">
            <div className="font-serif italic text-[14px] text-[var(--ink)] leading-snug">
              Each gap below is a data feed, model, or workflow the system would route into delivery. The map tells you which layers feed which, the gap pills tell you what unlocks the next pp of confidence.
            </div>
            <button onClick={() => onNavigate("engagement-pipeline")}
                    className="mt-3 font-sans text-[12px] font-semibold text-[var(--coral)] hover:underline flex items-center gap-1">
              Route gaps to the engagement pipeline →
            </button>
          </div>
        </div>
      </div>

      {/* Cross-layer insights, promoted from sidebar to hero strip. Hovering a
          card isolates its edge in the graph below; clicking the CTA navigates. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {INSIGHT_CARDS.map(card => {
          const Icon = card.icon;
          const active = cardHighlight && edgeKey(cardHighlight) === edgeKey(card.edge);
          return (
            <div key={card.key}
                 onMouseEnter={() => setCardHighlight(card.edge)}
                 onMouseLeave={() => setCardHighlight(null)}
                 className={`card transition-shadow cursor-pointer ${active ? "ring-2 ring-[var(--coral)]" : ""}`}>
              <div className="flex items-start gap-2.5 mb-2">
                <Icon size={18} style={{ color: card.iconColor }} className="shrink-0 mt-0.5" />
                <div className="font-sans text-[13px] font-semibold text-[var(--navy)] leading-snug">{card.headline}</div>
              </div>
              <div className="font-sans italic text-[12px] text-[var(--slate)] leading-snug mb-3">{card.body}</div>
              <button onClick={() => onNavigate(card.ctaKey)}
                      className="font-sans text-[11px] font-semibold text-[var(--coral)] hover:underline uppercase tracking-wider">
                {card.ctaLabel} →
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="font-serif italic text-[20px] text-[var(--slate-light)]">
            How a diagnosis in one layer feeds the next, and where missing data feeds bound its confidence.
          </p>
          <div className="mt-3 text-[12px] text-[var(--slate-light)]">
            <span>{NODES.length} intelligence layers · {EDGES.length} causal dependencies · {totalGapCount} architectural gaps surfaced</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="font-sans uppercase tracking-wider text-[9px] text-[var(--slate-light)]">Show</span>
            <div className="flex items-center bg-[var(--cream-light)] border border-[var(--cream-dark)] rounded-full p-1">
              <button onClick={() => setEdgeFilter("top")}
                      className={`font-sans text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${edgeFilter === "top" ? "bg-[var(--navy)] text-[var(--cream)]" : "text-[var(--slate)] hover:text-[var(--navy)]"}`}>
                Top edges
              </button>
              <button onClick={() => setEdgeFilter("all")}
                      className={`font-sans text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${edgeFilter === "all" ? "bg-[var(--navy)] text-[var(--cream)]" : "text-[var(--slate)] hover:text-[var(--navy)]"}`}>
                All edges
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-sans uppercase tracking-wider text-[9px] text-[var(--slate-light)]">Annotate gaps</span>
            <div className="flex items-center bg-[var(--cream-light)] border border-[var(--cream-dark)] rounded-full p-1">
              <button onClick={() => setAnnotateGaps(false)}
                      className={`font-sans text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${!annotateGaps ? "bg-[var(--navy)] text-[var(--cream)]" : "text-[var(--slate)] hover:text-[var(--navy)]"}`}>
                Off
              </button>
              <button onClick={() => setAnnotateGaps(true)}
                      className={`font-sans text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${annotateGaps ? "bg-[var(--coral)] text-white" : "text-[var(--slate)] hover:text-[var(--navy)]"}`}>
                On
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="grid grid-cols-12">
          {/* Graph */}
          <div className="col-span-9 p-5 border-r border-[var(--cream-dark)]" style={{ background: "var(--cream-light)" }}>
            {!coachDismissed && (
              <div className="mb-3 flex items-center gap-2 text-[var(--slate-light)] italic font-sans text-[12px]">
                <MousePointer2 size={12} className="shrink-0" />
                <span>Hover any node to isolate its dependencies</span>
                <button onClick={() => setCoachDismissed(true)}
                        aria-label="Dismiss hint"
                        className="ml-1 text-[var(--slate-light)] hover:text-[var(--navy)]">
                  <X size={12} />
                </button>
              </div>
            )}
            <svg viewBox="-80 0 900 660" className="w-full h-auto" onMouseLeave={() => setHover(null)}>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--navy)" opacity="0.6" />
                </marker>
                <marker id="arrowLit" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--coral)" />
                </marker>
              </defs>

              {/* Band labels, rendered in negative-x space the viewBox extends into. */}
              {[
                { y: 80,  label: "EXECUTIVE" },
                { y: 240, label: "MARKET-FACING" },
                { y: 420, label: "OPERATIONAL" },
                { y: 580, label: "SYSTEM" },
              ].map(b => (
                <g key={b.label}>
                  <line x1="40" y1={b.y} x2="60" y2={b.y} stroke="var(--cream-dark)" strokeWidth="1" />
                  <text x="32" y={b.y + 4} textAnchor="end"
                        className="font-sans" style={{ fontSize: 10, letterSpacing: 1.4, fill: "var(--slate-light)" }}>
                    {b.label}
                  </text>
                </g>
              ))}

              {/* Edges */}
              {visibleEdges.map((e, i) => {
                const from = nodeMap[e.from], to = nodeMap[e.to];
                if (!from || !to) return null;
                const isHighlighted = highlightKey === edgeKey(e);
                const hoverLit = !highlightKey && hover !== null && (e.from === hover || e.to === hover);
                const lit = isHighlighted || hoverLit;
                const dimmed = (highlightKey && !isHighlighted) || (hover !== null && !highlightKey && !hoverLit);
                const stroke = lit ? "var(--coral)" : "var(--navy)";
                const opacity = dimmed ? (highlightKey ? 0.15 : 0.06) : lit ? 0.9 : 0.18;
                const width = 1 + e.weight * 4;
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                const curveOffset = (from.y === to.y) ? 0 : (to.x > from.x ? 12 : -12);
                const ctrlX = midX + curveOffset;
                return (
                  <path key={i}
                        d={`M ${from.x} ${from.y} Q ${ctrlX} ${midY} ${to.x} ${to.y}`}
                        stroke={stroke} strokeWidth={width} fill="none"
                        opacity={opacity}
                        markerEnd={lit ? "url(#arrowLit)" : "url(#arrow)"} />
                );
              })}

              {/* Per-gap annotation overlay, controlled by Annotate gaps toggle.
                  Each gap on a node renders as a short dashed coral spoke fanned above
                  the node, giving the graph a visible "gap density" texture. */}
              {annotateGaps && NODES.map(n => {
                const gaps = gapsForLayer(n.key);
                if (gaps.length === 0) return null;
                const count = gaps.length;
                const span = Math.min(80, 20 + count * 14);
                const startX = n.x - span / 2;
                const step = count > 1 ? span / (count - 1) : 0;
                return (
                  <g key={`gap-overlay-${n.key}`} style={{ pointerEvents: "none" }}>
                    {gaps.map((g, gi) => {
                      const x1 = count > 1 ? startX + gi * step : n.x;
                      return (
                        <line key={g.id}
                              x1={x1} y1={n.y - 22}
                              x2={x1} y2={n.y - 36}
                              stroke="var(--coral)" strokeWidth={1.25}
                              strokeDasharray="2 2" opacity={0.7} />
                      );
                    })}
                  </g>
                );
              })}

              {/* Inline labels for edges with weight >= 0.50 at the curve midpoint. */}
              {visibleEdges.filter(e => e.weight >= 0.50).map((e, i) => {
                const from = nodeMap[e.from], to = nodeMap[e.to];
                if (!from || !to) return null;
                const label = EDGE_LABELS[edgeKey(e)];
                if (!label) return null;
                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                const curveOffset = (from.y === to.y) ? 0 : (to.x > from.x ? 12 : -12);
                const labelX = midX + curveOffset * 0.5;
                const labelY = midY;
                const w = label.length * 5.4 + 10;
                const dimmed = highlightKey && highlightKey !== edgeKey(e);
                return (
                  <g key={`lbl-${i}`} opacity={dimmed ? 0.3 : 1} style={{ pointerEvents: "none" }}>
                    <rect x={labelX - w / 2} y={labelY - 7} width={w} height={14} rx={2}
                          fill="var(--cream-light)" stroke="var(--cream-dark)" strokeWidth={0.75} />
                    <text x={labelX} y={labelY + 3} textAnchor="middle"
                          className="font-sans" style={{ fontSize: 10, fontWeight: 600, fill: "var(--navy)" }}>
                      {label}
                    </text>
                  </g>
                );
              })}

              {/* Nodes */}
              {NODES.map(n => {
                const lit = isNodeLit(n.key);
                const isHover = hover === n.key;
                const nodeGaps = gapsForLayer(n.key);
                return (
                  <g key={n.key}
                     style={{ cursor: "pointer", opacity: lit ? 1 : 0.25 }}
                     onMouseEnter={() => setHover(n.key)}
                     onClick={() => onNavigate(n.key)}>
                    <rect x={n.x - 64} y={n.y - 20} width={128} height={40} rx={4}
                          fill={statusFill(n.status)}
                          stroke={isHover ? statusColor(n.status) : "var(--cream-dark)"}
                          strokeWidth={isHover ? 2 : 1} />
                    <circle cx={n.x - 52} cy={n.y} r={4} fill={statusColor(n.status)} />
                    <text x={n.x - 42} y={n.y + 4}
                          className="font-sans" style={{ fontSize: 12, fontWeight: 600, fill: "var(--navy)" }}>
                      {n.label}
                    </text>
                    {/* Data-gap badge, visible regardless of edge filter; Contracts genuinely has zero. */}
                    {nodeGaps.length > 0 && (
                      <g>
                        <circle cx={n.x + 56} cy={n.y - 16} r={9} fill="var(--coral)" stroke="white" strokeWidth={1.5} />
                        <text x={n.x + 56} y={n.y - 13} textAnchor="middle"
                              className="font-sans" style={{ fontSize: 10, fontWeight: 700, fill: "white" }}>
                          +{nodeGaps.length}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Side panel */}
          <div className="col-span-3 p-5">
            {focused ? (
              <div>
                <div className="eyebrow text-[var(--coral)] mb-1">Focused layer</div>
                <div className="font-serif text-[18px] text-[var(--navy)] font-semibold leading-tight">{focused.label}</div>
                <button onClick={() => onNavigate(focused.key)}
                        className="font-sans text-[11px] text-[var(--navy)] hover:text-[var(--coral)] underline decoration-dotted underline-offset-2 mt-1">
                  Open layer →
                </button>

                <div className="mt-5">
                  <div className="eyebrow text-[var(--slate-light)] mb-2">Feeds into ({focusedOut.length})</div>
                  {focusedOut.length === 0 && <div className="font-sans italic text-[11px] text-[var(--slate-light)]">Terminal layer.</div>}
                  {focusedOut.map((e, i) => (
                    <div key={i} className="py-1.5 border-b border-[var(--cream-dark)] last:border-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-sans text-[12px] font-semibold text-[var(--navy)]">{nodeMap[e.to]?.label}</span>
                        <span className="font-sans tabular-nums text-[10px] font-bold text-[var(--coral)]">{Math.round(e.weight * 100)}%</span>
                      </div>
                      {e.note && <div className="font-sans italic text-[10px] text-[var(--slate)]">{e.note}</div>}
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <div className="eyebrow text-[var(--slate-light)] mb-2">Fed by ({focusedIn.length})</div>
                  {focusedIn.length === 0 && <div className="font-sans italic text-[11px] text-[var(--slate-light)]">Source layer.</div>}
                  {focusedIn.map((e, i) => (
                    <div key={i} className="py-1.5 border-b border-[var(--cream-dark)] last:border-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-sans text-[12px] font-semibold text-[var(--navy)]">{nodeMap[e.from]?.label}</span>
                        <span className="font-sans tabular-nums text-[10px] font-bold text-[var(--coral)]">{Math.round(e.weight * 100)}%</span>
                      </div>
                      {e.note && <div className="font-sans italic text-[10px] text-[var(--slate)]">{e.note}</div>}
                    </div>
                  ))}
                </div>

                {showGaps && (
                  <div className="mt-5 pt-4 border-t border-[var(--cream-dark)]">
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="eyebrow text-[var(--coral)]">Unmet data feeds ({focusedGaps.length})</div>
                      {focusedUplift > 0 && (
                        <span className="font-sans tabular-nums text-[10px] font-bold text-[var(--teal)]" title="Recoverable headroom, sum of per-gap confidence lifts on this layer">+{focusedUplift}pp headroom</span>
                      )}
                    </div>
                    {focusedGaps.length === 0 && (
                      <div className="font-sans italic text-[11px] text-[var(--slate-light)]">No mapped gaps. Diagnosis is well-fed here.</div>
                    )}
                    {focusedGaps.map(g => <GapCard key={g.id} gap={g} />)}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Recoverable headroom dual-signal card, the prose home of the +Npp figure. */}
                <div className="pb-5 mb-5 border-b border-[var(--cream-dark)]">
                  <div className="eyebrow text-[var(--coral)] mb-1">Dual signal</div>
                  <div className="font-serif font-semibold text-[var(--gold)] tabular-nums leading-none" style={{ fontSize: 28 }}>
                    +{totalUplift}pp recoverable
                  </div>
                  <div className="font-serif italic text-[14px] text-[var(--slate)] leading-snug mt-1.5">
                    Across {totalGapCount} data gaps. Closes the headroom between today's average layer confidence and 99%.
                  </div>
                  <div className="font-sans text-[12px] text-[var(--slate)] leading-snug mt-2">
                    Recoverable headroom is the sum of confidence lifts across every architectural gap. It is not a layer-level figure. The Engagement pipeline page sequences the work.
                  </div>
                  <button onClick={() => onNavigate("engagement-pipeline")}
                          className="mt-2.5 font-sans text-[11px] font-semibold text-[var(--coral)] hover:underline">
                    Open Engagement pipeline →
                  </button>
                </div>

                <div className="eyebrow text-[var(--coral)] mb-2">Reading the graph</div>
                <p className="font-serif italic text-[13px] text-[var(--slate)] leading-snug">
                  Edge thickness shows the share of one layer's diagnosis that traces to another. Top edges hides anything below 0.30 weight.
                  {showGaps && " Coral badges count unmet data feeds; the side panel shows which DiffDay solution would close each one."}
                </p>
                <div className="mt-5 space-y-2.5">
                  <Legend color="var(--coral)" label="Critical state" />
                  <Legend color="var(--amber)" label="Warning state" />
                  <Legend color="var(--teal)"  label="Healthy state" />
                </div>

                <div className="mt-5 pt-4 border-t border-[var(--cream-dark)]">
                  <div className="eyebrow text-[var(--slate-light)] mb-2">Top data gaps · solution fit</div>
                  <div className="font-sans text-[10px] text-[var(--slate-light)] mb-2 leading-snug">
                    Highest-leverage feed gaps and the DiffDay solution that closes each.
                  </div>
                  {topGaps(5).map(g => <GapCard key={g.id} gap={g} compact />)}
                </div>

                {showGaps && (
                  <div className="mt-5 pt-4 border-t border-[var(--cream-dark)]">
                    <div className="eyebrow text-[var(--slate-light)] mb-2">Cross-cutting access layer</div>
                    <div className="font-sans text-[10px] text-[var(--slate-light)] mb-2 leading-snug">
                      How analysts consume everything above.
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {ACCESS_PRODUCT_IDS.map(id => {
                        const p = PRODUCT_BY_ID[id];
                        if (!p) return null;
                        return <ProductChip key={id} name={p.name} category={p.category} />;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Solution catalog (conceptual layer). Visible when the overlay is on.
          The 13 capability-style "solutions" the team frames around, these
          are how we talk about the platform internally and on the dependency
          graph. Each one is mapped to feed gaps above. */}
      {showGaps && (
        <div className="card">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="eyebrow text-[var(--coral)] mb-1">Solution capabilities</div>
              <div className="font-serif text-[20px] text-[var(--navy)] font-semibold leading-tight">
                {DIFFDAY_PRODUCTS.length} DiffDay solution capabilities, mapped to feed gaps in the graph above
              </div>
              <div className="font-sans italic text-[12px] text-[var(--slate-light)] mt-1">
                The conceptual layer. Below this card you'll see how each capability ships as one or more deployed apps in the live App Library.
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              {(["intelligence", "orchestration", "access", "infrastructure"] as ProductCategory[]).map(c => {
                const s = categoryStyle(c);
                return (
                  <div key={c} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.border }} />
                    <span className="font-sans uppercase tracking-wider text-[var(--slate-light)]">{c}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {DIFFDAY_PRODUCTS.map(p => {
              const s = categoryStyle(p.category);
              const usedBy = DATA_GAPS.filter(g => g.productFit.includes(p.id));
              const uplift = usedBy.reduce((a, g) => a + g.confidenceUplift, 0);
              const shippedAs = appsForProduct(p.id);
              return (
                <div key={p.id}
                     className="p-3 rounded border bg-[var(--cream-light)]"
                     style={{ borderColor: "var(--cream-dark)" }}>
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <div className="font-sans text-[12px] font-semibold text-[var(--navy)] leading-tight">{p.name}</div>
                    <span className="font-sans uppercase tracking-wider text-[9px] px-1.5 py-0.5 rounded"
                          style={{ background: s.bg, color: s.fg, border: `1px solid ${s.border}` }}>
                      {p.category}
                    </span>
                  </div>
                  <div className="font-sans italic text-[11px] text-[var(--slate)] leading-snug mb-2">{p.oneLiner}</div>
                  <div className="flex items-center justify-between text-[10px] mb-2">
                    <span className="font-sans text-[var(--slate-light)]">
                      {usedBy.length === 0
                        ? "Cross-cutting · consumption surface"
                        : `Plugs ${usedBy.length} ${usedBy.length === 1 ? "gap" : "gaps"}`}
                    </span>
                    {uplift > 0 && (
                      <span className="font-sans tabular-nums font-bold text-[var(--teal)]" title="Recoverable headroom across the gaps this capability addresses">+{uplift}pp headroom</span>
                    )}
                  </div>
                  {/* "Ships as", which real apps in the live library instantiate
                       this capability. Empty for cross-cutting access products. */}
                  {shippedAs.length > 0 && (
                    <div className="pt-2 border-t border-[var(--cream-dark)]">
                      <div className="font-sans uppercase tracking-wider text-[9px] text-[var(--slate-light)] mb-1">
                        Ships in {shippedAs.length} {shippedAs.length === 1 ? "app" : "apps"}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {shippedAs.map(app => (
                          <span key={app.id}
                                className="font-sans text-[9px] font-semibold px-1.5 py-0.5 rounded border bg-white"
                                style={{ borderColor: "var(--cream-dark)", color: "var(--navy)" }}
                                title={app.tagline}>
                            {app.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DiffDay App Library, the real deployed apps. Always visible (not
          gated on the data-gap overlay) because it's the ground-truth catalog
          a buyer sees on demo.diffday.dev. Grouped by industry domain so the
          21-app surface stays scannable. */}
      <div className="card">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="eyebrow text-[var(--teal)] mb-1">App library · ships today</div>
            <div className="font-serif text-[20px] text-[var(--navy)] font-semibold leading-tight">
              {DIFFDAY_APPS.length} DiffDay apps live on demo.diffday.dev
            </div>
            <div className="font-sans italic text-[12px] text-[var(--slate-light)] mt-1">
              The real deployed surface. Each app instantiates one or more of the {DIFFDAY_PRODUCTS.length} capabilities above for a specific industry context.
            </div>
          </div>
          <a href="https://demo.diffday.dev" target="_blank" rel="noopener noreferrer"
             className="font-sans text-[11px] font-semibold text-[var(--navy)] hover:text-[var(--coral)] underline decoration-dotted underline-offset-2 shrink-0">
            Visit demo.diffday.dev →
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {DIFFDAY_APPS.map(app => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AppCard({ app }: { app: DiffDayApp }) {
  return (
    <div className="p-3 rounded border bg-white flex flex-col" style={{ borderColor: "var(--cream-dark)" }}>
      <div className="flex items-start gap-2.5 mb-2">
        <div className="shrink-0 h-9 w-9 rounded flex items-center justify-center font-sans font-bold text-[12px]"
             style={{ background: "var(--navy)", color: "var(--cream)" }}>
          {app.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-sans text-[12px] font-semibold text-[var(--navy)] leading-tight truncate">{app.name}</div>
          <div className="font-sans italic text-[10px] text-[var(--slate-light)] leading-snug">{app.tagline}</div>
        </div>
      </div>
      <div className="font-sans text-[11px] text-[var(--slate)] leading-snug mb-2.5 flex-1">{app.description}</div>
      <div className="pt-2 border-t border-[var(--cream-dark)] space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "var(--teal)" }} />
          <span className="font-sans uppercase tracking-wider text-[9px] text-[var(--slate-light)]">{app.domain}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {app.capabilities.map(cid => {
            const p = PRODUCT_BY_ID[cid];
            if (!p) return null;
            return <ProductChip key={cid} name={p.name} category={p.category} />;
          })}
        </div>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      <span className="font-sans text-[var(--slate)]">{label}</span>
    </div>
  );
}

function GapCard({ gap, compact = false }: { gap: DataGap; compact?: boolean }) {
  return (
    <div className={`py-2 border-b border-[var(--cream-dark)] last:border-0 ${compact ? "" : ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-sans text-[11px] font-semibold text-[var(--navy)] leading-snug">{gap.feed}</span>
        <span className="font-sans tabular-nums text-[10px] font-bold text-[var(--coral)] shrink-0">+{gap.confidenceUplift}pp</span>
      </div>
      {!compact && (
        <div className="font-sans italic text-[10px] text-[var(--slate)] mt-0.5 leading-snug">Blocks: {gap.blocks}</div>
      )}
      <div className="flex flex-wrap gap-1 mt-1.5">
        {gap.productFit.map(pid => {
          const p = PRODUCT_BY_ID[pid];
          if (!p) return null;
          return <ProductChip key={pid} name={p.name} category={p.category} />;
        })}
      </div>
    </div>
  );
}

function ProductChip({ name, category }: { name: string; category: ProductCategory }) {
  const s = categoryStyle(category);
  return (
    <span className="font-sans text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: s.bg, color: s.fg, border: `1px solid ${s.border}` }}>
      {name}
    </span>
  );
}
