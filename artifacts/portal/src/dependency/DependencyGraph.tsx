import { useState } from "react";
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
  { key: "contract-management",  label: "Contracts",         band: "system", x: 410, y: 580, status: "warn" },
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

export default function DependencyGraph({ onNavigate }: { onNavigate: (key: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const [showGaps, setShowGaps] = useState(true);

  const nodeMap = Object.fromEntries(NODES.map(n => [n.key, n]));

  const isEdgeLit = (e: Edge) => !hover || e.from === hover || e.to === hover;
  const isNodeLit = (k: string) =>
    !hover || k === hover ||
    EDGES.some(e => (e.from === hover && e.to === k) || (e.to === hover && e.from === k));

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

      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="eyebrow text-[var(--coral)] mb-2 sr-only">·</div>
          <p className="font-serif italic text-[20px] text-[var(--slate-light)] mt-1.5">
            How a diagnosis in one layer feeds the next, and where missing data feeds bound its confidence.
          </p>
          <div className="mt-4 flex items-center gap-4 text-[12px] text-[var(--slate-light)]">
            <span>{NODES.length} nodes · {EDGES.length} weighted dependencies · hover to isolate</span>
            {showGaps && (
              <span>
                · {totalGapCount} data gaps ·{" "}
                <span className="text-[var(--teal)] font-semibold">+{totalUplift}pp recoverable headroom</span>
                <span className="text-[var(--slate-light)]"> (sum across gaps, not a layer-level confidence figure)</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[var(--cream-light)] border border-[var(--cream-dark)] rounded-full p-1">
          <button
            onClick={() => setShowGaps(false)}
            className={`font-sans text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors ${!showGaps ? "bg-[var(--navy)] text-[var(--cream)]" : "text-[var(--slate)] hover:text-[var(--navy)]"}`}
          >
            Causal
          </button>
          <button
            onClick={() => setShowGaps(true)}
            className={`font-sans text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors ${showGaps ? "bg-[var(--coral)] text-white" : "text-[var(--slate)] hover:text-[var(--navy)]"}`}
          >
            + Data gaps
          </button>
        </div>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="grid grid-cols-12">
          {/* Graph */}
          <div className="col-span-9 p-5 border-r border-[var(--cream-dark)]" style={{ background: "var(--cream-light)" }}>
            <svg viewBox="0 0 820 660" className="w-full h-auto" onMouseLeave={() => setHover(null)}>
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--navy)" opacity="0.6" />
                </marker>
                <marker id="arrowLit" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--coral)" />
                </marker>
              </defs>

              {/* Band labels */}
              {[
                { y: 80,  label: "EXECUTIVE" },
                { y: 240, label: "MARKET-FACING" },
                { y: 420, label: "OPERATIONAL" },
                { y: 580, label: "SYSTEM" },
              ].map(b => (
                <g key={b.label}>
                  <line x1="40" y1={b.y} x2="60" y2={b.y} stroke="var(--cream-dark)" strokeWidth="1" />
                  <text x="36" y={b.y + 4} textAnchor="end"
                        className="font-sans" style={{ fontSize: 9, letterSpacing: 1.4, fill: "var(--slate-light)" }}>
                    {b.label}
                  </text>
                </g>
              ))}

              {/* Edges */}
              {EDGES.map((e, i) => {
                const from = nodeMap[e.from], to = nodeMap[e.to];
                if (!from || !to) return null;
                const lit = isEdgeLit(e) && hover !== null;
                const dimmed = hover !== null && !isEdgeLit(e);
                const stroke = lit ? "var(--coral)" : "var(--navy)";
                const opacity = dimmed ? 0.06 : lit ? 0.85 : 0.18;
                const width = 1 + e.weight * 4;
                // Slight curve toward the centre of the canvas for readability
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
                    {/* Data-gap badge, only when overlay is on and node has gaps */}
                    {showGaps && nodeGaps.length > 0 && (
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
                <div className="eyebrow text-[var(--coral)] mb-2">Reading the graph</div>
                <p className="font-serif italic text-[13px] text-[var(--slate)] leading-snug">
                  Hover any layer to isolate its dependencies. Edge thickness shows the share of one layer's diagnosis that traces to another.
                  {showGaps && " Coral badges count unmet data feeds; the side panel shows which DiffDay solution would close each one."}
                </p>
                <div className="mt-5 space-y-2.5">
                  <Legend color="var(--coral)" label="Critical state" />
                  <Legend color="var(--amber)" label="Warning state" />
                  <Legend color="var(--teal)"  label="Healthy state" />
                </div>

                {showGaps ? (
                  <>
                    <div className="mt-5 pt-4 border-t border-[var(--cream-dark)]">
                      <div className="eyebrow text-[var(--slate-light)] mb-2">Top data gaps · solution fit</div>
                      <div className="font-sans text-[10px] text-[var(--slate-light)] mb-2 leading-snug">
                        Highest-leverage feed gaps and the DiffDay solution that closes each.
                      </div>
                      {topGaps(5).map(g => <GapCard key={g.id} gap={g} compact />)}
                    </div>

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
                  </>
                ) : (
                  <div className="mt-5 pt-4 border-t border-[var(--cream-dark)]">
                    <div className="eyebrow text-[var(--slate-light)] mb-2">Top traces (this quarter)</div>
                    {[
                      { txt: "60% of revenue gap → Demand",  to: "demand-intelligence" },
                      { txt: "65% of EBITDA gap → Pricing",  to: "pricing-margin" },
                      { txt: "55% of Demand drag → Competitive", to: "competitive-intelligence" },
                      { txt: "55% of People stress → Talent", to: "talent-hr" },
                    ].map((t, i) => (
                      <button key={i} onClick={() => setHover(t.to)}
                              className="block w-full text-left font-sans text-[11px] text-[var(--navy)] hover:text-[var(--coral)] py-1">
                        → {t.txt}
                      </button>
                    ))}
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
