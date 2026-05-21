import { ChevronRight, Link as LinkIcon, AlertTriangle, TrendingDown } from "lucide-react";
import { type CrossInsight } from "../data/narrator";
import { useNarrative } from "../context/CompanyContext";

const Icon = ({ kind }: { kind: CrossInsight["icon"] }) =>
  kind === "alert" ? <AlertTriangle size={14} strokeWidth={1.5} className="text-[var(--coral)]" />
  : kind === "trend" ? <TrendingDown size={14} strokeWidth={1.5} className="text-[var(--amber)]" />
                     : <LinkIcon size={14} strokeWidth={1.5} className="text-[var(--navy)]" />;

export default function Narrator({
  layerKey,
  onNavigate,
}: {
  layerKey: string;
  onNavigate: (key: string, field?: string) => void;
}) {
  const { NARRATOR } = useNarrative();
  const content = NARRATOR[layerKey];
  if (!content) return null;
  return (
    <aside className="w-[320px] shrink-0 border-l border-[var(--border)] bg-[var(--paper)] flex flex-col h-full">
      <div className="h-[44px] flex items-center justify-between px-5"
           style={{ background: "var(--navy)", color: "var(--cream)" }}>
        <span className="eyebrow">Intelligence narrator</span>
        <span className="flex items-center gap-1.5 text-[11px] font-sans">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--teal)" }} />
          Live
        </span>
      </div>
      <div className="flex-1 overflow-y-auto scroll-area p-6 space-y-6">
        <section>
          <div className="eyebrow text-[var(--slate-light)] mb-2">System speaking</div>
          <p className="font-serif italic text-[15px] leading-[1.55] text-[var(--ink)]">
            {content.summary}
          </p>
        </section>

        <div className="h-px bg-[var(--cream-dark)]" />

        <section>
          <div className="eyebrow text-[var(--slate-light)] mb-3">Cross-layer insights</div>
          <div className="space-y-2.5">
            {content.cross.map((c, i) => (
              <button
                key={i}
                onClick={() => onNavigate(c.targetLayer, c.targetField)}
                className="text-left w-full p-3 rounded-sm border border-[var(--cream-dark)] hover:border-[var(--gold)] hover:bg-[var(--cream-light)] transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon kind={c.icon} />
                  <div className="font-sans font-semibold text-[12px] text-[var(--navy)] leading-snug">{c.title}</div>
                </div>
                <div className="font-sans text-[11px] text-[var(--slate)] italic leading-snug">{c.body}</div>
                <div className="mt-2 flex items-center gap-1 text-[10px] eyebrow text-[var(--coral)]">
                  View {c.targetLayer} <ChevronRight size={11} strokeWidth={1.5} />
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="h-px bg-[var(--cream-dark)]" />

        <section>
          <div className="eyebrow text-[var(--slate-light)] mb-3">What to look at next</div>
          <ul className="space-y-2">
            {content.next.map((n, i) => (
              <li key={i}>
                <button
                  onClick={() => onNavigate(n.targetLayer)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-sm border border-[var(--navy)] hover:bg-[var(--navy)] hover:text-[var(--cream)] transition-colors text-left group"
                >
                  <span className="font-sans text-[12px] text-[var(--navy)] group-hover:text-[var(--cream)] leading-snug">{n.title}</span>
                  <ChevronRight size={14} strokeWidth={1.5} className="text-[var(--navy)] group-hover:text-[var(--cream)] shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}
