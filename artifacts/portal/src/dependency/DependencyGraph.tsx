import { useState } from "react";

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
  // Executive band — top
  { key: "business-performance", label: "Business perf",     band: "exec",   x: 360, y: 80,  status: "warn" },
  { key: "finance",              label: "Finance",           band: "exec",   x: 620, y: 80,  status: "bad" },
  // Market-facing band
  { key: "demand-intelligence",      label: "Demand",        band: "market", x: 130, y: 240, status: "bad" },
  { key: "competitive-intelligence", label: "Competitive",   band: "market", x: 310, y: 240, status: "bad" },
  { key: "customer-intelligence",    label: "Customer",      band: "market", x: 490, y: 240, status: "warn" },
  { key: "brand-social",             label: "Brand & Social",band: "market", x: 670, y: 240, status: "warn" },
  // Operational band
  { key: "supply-chain",         label: "Supply chain",      band: "ops",    x: 100, y: 420, status: "bad" },
  { key: "pricing-margin",       label: "Pricing & margin",  band: "ops",    x: 260, y: 420, status: "warn" },
  { key: "sales-pipeline",       label: "Sales pipeline",    band: "ops",    x: 410, y: 420, status: "bad" },
  { key: "marketing-performance",label: "Marketing perf",    band: "ops",    x: 560, y: 420, status: "warn" },
  { key: "people-operations",    label: "People & ops",      band: "ops",    x: 690, y: 420, status: "bad" },
  // System / financial close band — bottom
  { key: "receivables", label: "Receivables", band: "system", x: 280, y: 580, status: "bad" },
  { key: "talent-hr",   label: "Talent & HR", band: "system", x: 520, y: 580, status: "bad" },
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
];

const statusColor = (s: Node["status"]) =>
  s === "bad" ? "var(--coral)" : s === "warn" ? "var(--amber)" : "var(--teal)";
const statusFill = (s: Node["status"]) =>
  s === "bad" ? "var(--coral-faint)" : s === "warn" ? "var(--amber-faint)" : "var(--teal-faint)";

export default function DependencyGraph({ onNavigate }: { onNavigate: (key: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);

  const nodeMap = Object.fromEntries(NODES.map(n => [n.key, n]));

  const isEdgeLit = (e: Edge) => !hover || e.from === hover || e.to === hover;
  const isNodeLit = (k: string) =>
    !hover || k === hover ||
    EDGES.some(e => (e.from === hover && e.to === k) || (e.to === hover && e.from === k));

  const focused = hover ? nodeMap[hover] : null;
  const focusedIn  = focused ? EDGES.filter(e => e.to === focused.key) : [];
  const focusedOut = focused ? EDGES.filter(e => e.from === focused.key) : [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="eyebrow text-[var(--coral)] mb-2">Intelligence layer · System</div>
          <h1 className="font-serif text-[40px] leading-[1.05] text-[var(--navy)] font-semibold">Cross-layer dependency graph</h1>
          <p className="font-serif italic text-[20px] text-[var(--slate-light)] mt-1.5">How a diagnosis in one layer feeds the next.</p>
          <div className="mt-4 flex items-center gap-4 text-[12px] text-[var(--slate-light)]">
            <span>13 nodes · {EDGES.length} weighted dependencies · hover to isolate</span>
          </div>
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
              </div>
            ) : (
              <div>
                <div className="eyebrow text-[var(--coral)] mb-2">Reading the graph</div>
                <p className="font-serif italic text-[13px] text-[var(--slate)] leading-snug">
                  Hover any layer to isolate its dependencies. Edge thickness shows the share of one layer's diagnosis that traces to another.
                </p>
                <div className="mt-5 space-y-2.5">
                  <Legend color="var(--coral)" label="Critical state" />
                  <Legend color="var(--amber)" label="Warning state" />
                  <Legend color="var(--teal)"  label="Healthy state" />
                </div>
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
              </div>
            )}
          </div>
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
