import { useEffect, useState } from "react";
import { Eye, Search, ShieldAlert, BookOpen, Gauge, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { ARCH_COMPONENTS, SAMPLE_QUESTION, type ArchComponent } from "../data/architecture";

const IconFor = ({ kind, size = 20 }: { kind: ArchComponent["icon"]; size?: number }) => {
  const props = { size, strokeWidth: 1.5 };
  switch (kind) {
    case "eye":    return <Eye {...props} />;
    case "search": return <Search {...props} />;
    case "shield": return <ShieldAlert {...props} />;
    case "book":   return <BookOpen {...props} />;
    case "gauge":  return <Gauge {...props} />;
  }
};

function FlowDiagram({ activeIdx }: { activeIdx: number }) {
  const NODES = ARCH_COMPONENTS;
  const W = 1080, H = 200, NODE_W = 180, NODE_H = 90, GAP = (W - NODES.length * NODE_W) / (NODES.length - 1);
  const nodeX = (i: number) => i * (NODE_W + GAP);
  const cy = H / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="flowEdge" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#C8A24A" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#C8A24A" stopOpacity="1" />
          <stop offset="100%" stopColor="#C8A24A" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* edges */}
      {NODES.slice(0, -1).map((_, i) => {
        const x1 = nodeX(i) + NODE_W;
        const x2 = nodeX(i + 1);
        return (
          <g key={i}>
            <line x1={x1} y1={cy} x2={x2} y2={cy} stroke="#E5E2D8" strokeWidth={1.5} />
            {/* travelling pulse dot */}
            <circle r={3.5} fill="#C8A24A">
              <animate attributeName="cx" from={x1} to={x2} dur="2.4s" begin={`${i * 0.48}s`} repeatCount="indefinite" />
              <animate attributeName="cy" values={`${cy};${cy};${cy}`} dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0;1;1;0" dur="2.4s" begin={`${i * 0.48}s`} repeatCount="indefinite" />
            </circle>
          </g>
        );
      })}

      {/* nodes */}
      {NODES.map((n, i) => {
        const x = nodeX(i);
        const isActive = i === activeIdx;
        return (
          <g key={n.key} transform={`translate(${x}, ${cy - NODE_H / 2})`}>
            <rect width={NODE_W} height={NODE_H} rx={4}
                  fill={isActive ? "#1B2A4E" : "#FAF8F2"}
                  stroke={isActive ? "#C8A24A" : "#E5E2D8"}
                  strokeWidth={isActive ? 2 : 1} />
            {isActive && (
              <rect width={NODE_W} height={NODE_H} rx={4} fill="none" stroke="#C8A24A" strokeWidth={2} opacity={0.4}>
                <animate attributeName="stroke-width" values="2;4;2" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.6s" repeatCount="indefinite" />
              </rect>
            )}
            <text x={16} y={28} fill={isActive ? "#F4F1EA" : "#1B2A4E"}
                  fontFamily="Inter" fontSize={13} fontWeight={600}>{n.name}</text>
            <text x={16} y={48} fill={isActive ? "#E5C97B" : "#6B7280"}
                  fontFamily="Inter" fontSize={10} fontStyle="italic">{n.role}</text>
            <text x={16} y={72} fill={isActive ? "#E5C97B" : "#6B7280"}
                  fontFamily="Inter" fontSize={9} letterSpacing="1">
              {n.tokens.toLocaleString()} TOKENS · {n.ms}MS
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Architecture() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(ARCH_COMPONENTS.map(c => [c.key, true]))
  );

  useEffect(() => {
    const id = setInterval(() => setActiveIdx(i => (i + 1) % ARCH_COMPONENTS.length), 1600);
    return () => clearInterval(id);
  }, []);

  const toggle = (k: string) => setExpanded(s => ({ ...s, [k]: !s[k] }));
  const totalTokens = ARCH_COMPONENTS.reduce((s, c) => s + c.tokens, 0);
  const totalMs = ARCH_COMPONENTS.reduce((s, c) => s + c.ms, 0);

  return (
    <div className="space-y-8 pb-12">
      <div>
        <div className="eyebrow text-[var(--coral)] mb-2">System · Intelligence architecture</div>
        <h1 className="font-serif text-[40px] leading-[1.05] text-[var(--navy)] font-semibold">Intelligence architecture</h1>
        <p className="font-serif italic text-[20px] text-[var(--slate-light)] mt-1.5">How does the system actually reason?</p>
      </div>

      <div className="card card-hero card-accent-navy">
        <div className="eyebrow text-[var(--navy)] mb-3">Stack overview</div>
        <p className="font-serif text-[19px] leading-[1.55] text-[var(--ink)]">
          Every diagnostic question is answered by a five-stage reasoning chain. Cortex Lens sees the data, Confounder
          searches for alternative explanations, Challenger constructs adversarial counter-arguments, Synthesist composes
          the user-facing narrative, and Evaluator scores the result and routes its own dead ends into the gap pipeline.
          The narrator panel you are reading right now is the Synthesist's output. The confidence bands on every layer
          header are the Evaluator's. You can watch a real question pass through all five stages below.
        </p>
      </div>

      {/* Animated flow */}
      <div className="card card-accent-gold !p-6" style={{ background: "var(--cream-light)" }}>
        <div className="flex items-baseline justify-between mb-4">
          <div className="font-sans font-semibold text-[16px] text-[var(--navy)]">The five-stage reasoning chain · live</div>
          <div className="eyebrow text-[var(--slate-light)] tabular-nums">
            {totalTokens.toLocaleString()} tokens · {totalMs}ms · {ARCH_COMPONENTS.length} stages
          </div>
        </div>
        <FlowDiagram activeIdx={activeIdx} />
      </div>

      {/* Sample query panel */}
      <div className="card card-hero card-accent-coral">
        <div className="eyebrow text-[var(--coral)] mb-2">Live sample</div>
        <h2 className="font-serif text-[28px] text-[var(--navy)] leading-tight font-semibold">Watch a question flow through the stack</h2>
        <p className="font-serif italic text-[20px] text-[var(--slate)] mt-2 mb-6">"{SAMPLE_QUESTION}"</p>

        <div className="space-y-3">
          {ARCH_COMPONENTS.map((c, i) => (
            <div key={c.key} id={`sample-${c.key}`} className="border border-[var(--cream-dark)] rounded-sm overflow-hidden">
              <button
                onClick={() => toggle(c.key)}
                className="w-full flex items-center justify-between p-4 bg-[var(--cream-light)] hover:bg-[var(--cream-dark)]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-serif text-[18px] text-[var(--gold)] font-semibold w-5">{i + 1}.</span>
                  <span className="text-[var(--navy)]"><IconFor kind={c.icon} size={18} /></span>
                  <div className="text-left">
                    <div className="font-sans font-semibold text-[14px] text-[var(--navy)]">{c.name}</div>
                    <div className="font-sans italic text-[11px] text-[var(--slate-light)]">{c.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="eyebrow text-[var(--slate-light)] tabular-nums">{c.tokens.toLocaleString()} tok · {c.ms}ms</span>
                  {expanded[c.key]
                    ? <ChevronUp size={16} strokeWidth={1.5} className="text-[var(--slate)]" />
                    : <ChevronDown size={16} strokeWidth={1.5} className="text-[var(--slate)]" />}
                </div>
              </button>
              {expanded[c.key] && (
                <div className="px-5 py-4 bg-[var(--paper)] border-t border-[var(--cream-dark)]">
                  <div className="font-sans text-[13px] text-[var(--slate)] leading-relaxed">{c.sampleOutput}</div>
                  {i < ARCH_COMPONENTS.length - 1 && (
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] eyebrow text-[var(--gold)]">
                      passed to {ARCH_COMPONENTS[i + 1].name} <ArrowRight size={11} strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card card-accent-teal">
        <div className="font-sans font-semibold text-[16px] text-[var(--navy)] mb-2">What this means</div>
        <p className="font-serif text-[19px] leading-[1.55] text-[var(--ink)]">
          The narrative you read on every intelligence layer is the synthesis of all five components working in
          sequence — not an LLM summarising a dashboard. Confidence and gap detection are emergent properties of
          the chain operating correctly: when Confounder rules out alternatives and Challenger cannot break the
          diagnosis, Evaluator scores confidence high. When either stage leaves residual uncertainty, that
          uncertainty becomes a logged architectural gap routed to the Different Day engagement pipeline.
        </p>
      </div>
    </div>
  );
}
