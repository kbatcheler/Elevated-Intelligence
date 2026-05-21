import { X, Database, Activity, Calculator } from "lucide-react";
import { useApp } from "../context/AppContext";

const confColor = (c: number) =>
  c >= 90 ? "var(--teal)" : c >= 75 ? "var(--amber)" : "var(--coral)";

export default function EvidencePanel() {
  const { evidence, closeEvidence } = useApp();
  if (!evidence) return null;
  const e = evidence;
  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(15,26,51,0.35)" }} onClick={closeEvidence}>
      <div className="ml-auto h-full w-[640px] max-w-[96vw] flex flex-col"
           style={{ background: "var(--cream)", borderLeft: "1px solid var(--navy)" }}
           onClick={(ev) => ev.stopPropagation()}>
        <div className="px-7 py-5 border-b border-[var(--cream-dark)] flex items-start justify-between gap-3"
             style={{ background: "var(--paper)" }}>
          <div>
            <div className="eyebrow text-[var(--coral)] mb-1">Evidence behind the number</div>
            <h2 className="font-serif text-[24px] leading-tight text-[var(--navy)]">{e.metric}</h2>
            <div className="flex items-baseline gap-3 mt-1">
              <span className="font-serif font-semibold text-[36px] tabular-nums text-[var(--coral)] leading-none">{e.value}</span>
              <span className="font-sans italic text-[12px] text-[var(--slate)]">{e.layer.replace(/-/g, " ")}</span>
            </div>
          </div>
          <button onClick={closeEvidence} className="text-[var(--slate-light)] hover:text-[var(--navy)]">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-area">
          {/* Computed-as */}
          <section className="px-7 py-5 border-b border-[var(--cream-dark)]">
            <div className="eyebrow text-[var(--slate-light)] mb-2">Computed as</div>
            <p className="font-serif italic text-[14px] text-[var(--ink)] leading-snug">{e.computedAs}</p>
          </section>

          {/* Query */}
          <section className="px-7 py-5 border-b border-[var(--cream-dark)]">
            <div className="flex items-center gap-2 eyebrow text-[var(--slate-light)] mb-2">
              <Database size={11} strokeWidth={1.8} /> Reproducible query
            </div>
            <pre className="text-[12px] leading-[1.55] p-4 rounded-sm overflow-x-auto scroll-area"
                 style={{ background: "var(--navy-deep)", color: "#E5C97B", fontFamily: "ui-monospace, Menlo, monospace" }}>
{e.query}
            </pre>
          </section>

          {/* Calculation trace */}
          {e.calculation && e.calculation.length > 0 && (
            <section className="px-7 py-5 border-b border-[var(--cream-dark)]">
              <div className="flex items-center gap-2 eyebrow text-[var(--slate-light)] mb-3">
                <Calculator size={11} strokeWidth={1.8} /> Show the math
              </div>
              <ol className="space-y-2">
                {e.calculation.map((s, i) => {
                  const isFinal = i === e.calculation!.length - 1;
                  return (
                    <li key={i} className="flex items-start gap-3 py-2 px-3 rounded-sm"
                        style={{
                          background: isFinal ? "var(--gold-faint)" : "transparent",
                          borderLeft: isFinal ? "2px solid var(--gold)" : "2px solid var(--cream-dark)",
                        }}>
                      <div className="flex-1">
                        <div className={"font-sans text-[12px] leading-tight " + (isFinal ? "font-bold text-[var(--navy)]" : "font-semibold text-[var(--ink)]")}>
                          {s.step}
                        </div>
                        {s.note && (
                          <div className="font-serif italic text-[11px] text-[var(--slate)] mt-0.5 leading-snug">{s.note}</div>
                        )}
                      </div>
                      <div className={"font-sans tabular-nums shrink-0 " + (isFinal ? "text-[16px] font-bold text-[var(--coral)]" : "text-[13px] font-semibold text-[var(--navy)]")}>
                        {s.value}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          {/* Source rows */}
          <section className="px-7 py-5 border-b border-[var(--cream-dark)]">
            <div className="flex items-center justify-between mb-3">
              <div className="font-sans font-semibold text-[14px] text-[var(--navy)]">Source contributions</div>
              <span className="font-sans text-[11px] text-[var(--slate)]">{e.rows.length} sources</span>
            </div>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left border-b border-[var(--cream-dark)]">
                  <th className="eyebrow text-[var(--slate-light)] py-1.5 font-semibold">Source</th>
                  <th className="eyebrow text-[var(--slate-light)] py-1.5 font-semibold">Value</th>
                  <th className="eyebrow text-[var(--slate-light)] py-1.5 font-semibold text-right">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {e.rows.map((r, i) => (
                  <tr key={i} className="border-b border-[var(--cream-dark)] last:border-0 align-top">
                    <td className="py-2.5 pr-3">
                      <div className="font-sans font-semibold text-[12px] text-[var(--navy)]">{r.source}</div>
                      <div className="font-sans italic text-[10px] text-[var(--slate-light)] mt-0.5">{r.ts}</div>
                      {r.note && <div className="font-sans italic text-[10px] text-[var(--slate)] mt-1 leading-snug">{r.note}</div>}
                    </td>
                    <td className="py-2.5 pr-3 font-sans tabular-nums text-[12px] text-[var(--ink)] font-semibold">{r.value}</td>
                    <td className="py-2.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--cream-dark)" }}>
                          <div className="h-full" style={{ width: `${r.confidence}%`, background: confColor(r.confidence) }} />
                        </div>
                        <span className="font-sans font-bold text-[12px] tabular-nums" style={{ color: confColor(r.confidence) }}>{r.confidence}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Combined confidence */}
          <section className="px-7 py-5">
            <div className="card !p-4 card-accent-navy">
              <div className="flex items-center gap-2 eyebrow text-[var(--slate-light)] mb-1">
                <Activity size={11} strokeWidth={1.8} /> Combined confidence
              </div>
              <div className="flex items-baseline gap-3">
                <span className="font-serif font-semibold text-[36px] tabular-nums leading-none" style={{ color: confColor(e.combinedConfidence) }}>{e.combinedConfidence}%</span>
                <span className="font-sans italic text-[12px] text-[var(--slate)]">Weighted by source completeness and recency. Floor set by the lowest-confidence contributor on the critical path.</span>
              </div>
              <div className="h-2 rounded-full mt-3 overflow-hidden" style={{ background: "var(--cream-dark)" }}>
                <div className="h-full" style={{ width: `${e.combinedConfidence}%`, background: confColor(e.combinedConfidence) }} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
