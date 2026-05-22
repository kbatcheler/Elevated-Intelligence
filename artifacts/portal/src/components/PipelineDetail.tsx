import { Database, ChevronRight } from "lucide-react";
import { type DeepTable, type DeepRow } from "../data/pipelineDeep";
import { useNarrative, useIsDefaultProfile } from "../context/CompanyContext";

const toneColor = (t?: DeepRow["tone"]) =>
  t === "bad"  ? "var(--coral)"
  : t === "warn" ? "var(--amber)"
  : t === "good" ? "var(--teal)"
                 : "var(--slate)";

export default function PipelineDetail({ layerKey }: { layerKey: string }) {
  const { PIPELINE_DEEP } = useNarrative();
  const isDefault = useIsDefaultProfile();
  const deep = PIPELINE_DEEP[layerKey];
  if (!deep) return null;
  // Pipeline-deep fixtures are entirely Mercer-shaped (SKU codes, supplier
  // names, DC cities, "match Home Depot" copy). Suppress for any seeded
  // profile so we don't claim e.g. Apple is selling cordless drills.
  if (!isDefault) return null;

  return (
    <div className="card card-accent-gold !p-0 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3.5 flex items-center justify-between border-b border-[var(--cream-dark)]"
           style={{ background: "var(--cream-dark)" }}>
        <div className="flex items-center gap-3">
          <Database size={14} strokeWidth={1.8} className="text-[var(--gold)]" />
          <span className="eyebrow text-[var(--gold)]">{deep.eyebrow}</span>
        </div>
        <a href="https://demand.diffday.dev/discovery" target="_blank" rel="noreferrer"
           className="flex items-center gap-1 font-sans text-[11px] text-[var(--navy)] hover:text-[var(--coral)] transition-colors group">
          <span className="italic">Open in Demand by Different Day</span>
          <ChevronRight size={12} strokeWidth={1.8} className="group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      {/* Intro */}
      <div className="px-6 pt-5 pb-4">
        <p className="font-serif italic text-[14px] leading-[1.55] text-[var(--slate)]">{deep.intro}</p>
      </div>

      {/* Two tables stacked */}
      <div className="grid grid-cols-2 border-t border-[var(--cream-dark)]">
        <div className="border-r border-[var(--cream-dark)]">
          <Table t={deep.primary} />
        </div>
        <div>
          <Table t={deep.secondary} />
        </div>
      </div>

      {/* Model note */}
      <div className="px-6 py-4 flex items-start gap-4 border-t border-[var(--cream-dark)]"
           style={{ background: "var(--cream-light)" }}>
        <div className="shrink-0">
          <div className="eyebrow text-[var(--slate-light)] mb-1">{deep.modelNote.title}</div>
        </div>
        <p className="font-serif italic text-[13px] leading-[1.55] text-[var(--ink)] flex-1">{deep.modelNote.detail}</p>
      </div>
    </div>
  );
}

function Table({ t }: { t: DeepTable }) {
  return (
    <div className="p-5">
      <div className="mb-3">
        <div className="font-sans font-semibold text-[14px] text-[var(--navy)]">{t.title}</div>
        <div className="font-sans italic text-[11px] text-[var(--slate-light)] mt-0.5">{t.subtitle}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--cream-dark)]">
              {t.headers.map((h, i) => (
                <th key={i}
                    className={"py-1.5 eyebrow text-[var(--slate-light)] " + (i === 0 ? "text-left pr-2" : "text-right px-2")}
                    style={{ fontSize: 9 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {t.rows.map((r, i) => (
              <tr key={i} className="border-b border-[var(--cream-dark)]/60 last:border-0 hover:bg-[var(--cream-dark)]/30">
                {r.cols.map((c, j) => (
                  <td key={j}
                      className={"py-1.5 " + (j === 0 ? "text-left pr-2 font-sans text-[12px] text-[var(--navy)] font-semibold" : "text-right px-2 font-sans text-[12px] tabular-nums")}
                      style={j === r.cols.length - 1 && r.tone ? { color: toneColor(r.tone), fontWeight: 700 } : undefined}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-serif italic text-[11px] text-[var(--slate-light)] mt-3 leading-snug">{t.footnote}</p>
    </div>
  );
}
