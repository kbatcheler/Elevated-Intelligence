import { useState } from "react";
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

export default function Architecture() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(ARCH_COMPONENTS.map(c => [c.key, true]))
  );
  const toggle = (k: string) => setExpanded(s => ({ ...s, [k]: !s[k] }));

  return (
    <div className="space-y-8 pb-12">
      <div>
        <div className="eyebrow text-[var(--coral)] mb-2">System · Intelligence architecture</div>
        <h1 className="font-serif text-[32px] leading-tight text-[var(--navy)]">Intelligence architecture</h1>
        <p className="font-serif italic text-[18px] text-[var(--slate-light)] mt-1">How does the system actually reason?</p>
      </div>

      <div className="card card-hero card-accent-navy">
        <div className="eyebrow text-[var(--navy)] mb-3">Stack overview</div>
        <p className="font-serif text-[18px] leading-[1.55] text-[var(--ink)]">
          Every diagnostic question is answered by a five-stage reasoning chain. Cortex Lens sees the data, Confounder
          searches for alternative explanations, Challenger constructs adversarial counter-arguments, Synthesist composes
          the user-facing narrative, and Evaluator scores the result and routes its own dead ends into the gap pipeline.
          The narrator panel you are reading right now is the Synthesist's output. The confidence bands on every layer
          header are the Evaluator's. You can watch a real question pass through all five stages below.
        </p>
      </div>

      {/* Flow diagram */}
      <div className="card card-accent-gold">
        <div className="font-sans font-semibold text-[16px] text-[var(--navy)] mb-6">The five-stage reasoning chain</div>
        <div className="flex items-stretch gap-2 overflow-x-auto">
          {ARCH_COMPONENTS.map((c, i) => (
            <div key={c.key} className="flex items-center shrink-0">
              <div className="w-[180px] p-4 rounded-sm border border-[var(--cream-dark)] bg-[var(--cream-light)]">
                <div className="flex items-center gap-2 text-[var(--navy)]"><IconFor kind={c.icon} /><div className="font-sans font-semibold text-[15px]">{c.name}</div></div>
                <div className="font-sans italic text-[11px] text-[var(--slate)] mt-1.5 leading-snug">{c.role}</div>
                <button
                  onClick={() => {
                    setExpanded(s => ({ ...s, [c.key]: true }));
                    document.getElementById(`sample-${c.key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="mt-3 inline-flex items-center gap-1 text-[11px] font-sans font-semibold text-[var(--coral)] hover:text-[var(--navy)]"
                >
                  View output <ArrowRight size={11} strokeWidth={1.5} />
                </button>
              </div>
              {i < ARCH_COMPONENTS.length - 1 && (
                <ArrowRight size={20} strokeWidth={1.5} className="mx-2 text-[var(--gold)] shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sample query panel */}
      <div className="card card-hero card-accent-coral">
        <div className="eyebrow text-[var(--coral)] mb-2">Live sample</div>
        <h2 className="font-serif text-[24px] text-[var(--navy)] leading-tight">Watch a question flow through the stack</h2>
        <p className="font-serif italic text-[18px] text-[var(--slate)] mt-2 mb-6">"{SAMPLE_QUESTION}"</p>

        <div className="space-y-3">
          {ARCH_COMPONENTS.map(c => (
            <div key={c.key} id={`sample-${c.key}`} className="border border-[var(--cream-dark)] rounded-sm">
              <button
                onClick={() => toggle(c.key)}
                className="w-full flex items-center justify-between p-4 bg-[var(--cream-light)] hover:bg-[var(--cream-dark)]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[var(--navy)]"><IconFor kind={c.icon} size={18} /></span>
                  <div className="text-left">
                    <div className="font-sans font-semibold text-[14px] text-[var(--navy)]">{c.name}</div>
                    <div className="font-sans italic text-[11px] text-[var(--slate-light)]">{c.role}</div>
                  </div>
                </div>
                {expanded[c.key]
                  ? <ChevronUp size={16} strokeWidth={1.5} className="text-[var(--slate)]" />
                  : <ChevronDown size={16} strokeWidth={1.5} className="text-[var(--slate)]" />}
              </button>
              {expanded[c.key] && (
                <div className="px-5 py-4 bg-[var(--paper)] border-t border-[var(--cream-dark)]">
                  <div className="font-sans text-[13px] text-[var(--slate)] leading-relaxed">{c.sampleOutput}</div>
                  <div className="eyebrow text-[var(--slate-light)] mt-3">{c.tokens.toLocaleString()} tokens · {c.ms}ms</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card card-accent-teal">
        <div className="font-sans font-semibold text-[16px] text-[var(--navy)] mb-2">What this means</div>
        <p className="font-serif text-[18px] leading-[1.55] text-[var(--ink)]">
          The narrative you read on every intelligence layer is the synthesis of all five components working in
          sequence — not an LLM summarising a dashboard. Confidence and gap detection are emergent properties of
          the chain operating correctly: when Confounder rules out alternatives and Challenger cannot break the
          diagnosis, Evaluator scores confidence high. When either stage leaves residual uncertainty, that
          uncertainty becomes a logged architectural gap. The user sees the result; the chain leaves an auditable
          trail behind it.
        </p>
      </div>
    </div>
  );
}
