import type { LayerData, SupplementBlock, SupplementTone } from "../../data/layers";

const toneFg = (t: SupplementTone | undefined) =>
  t === "bad"  ? "var(--coral)"
  : t === "warn" ? "var(--amber)"
  : t === "good" ? "var(--teal)"
                 : "var(--slate)";

const toneBg = (t: SupplementTone | undefined) =>
  t === "bad"  ? "var(--coral-faint)"
  : t === "warn" ? "var(--amber-faint)"
  : t === "good" ? "var(--teal-faint)"
                 : "var(--cream-dark)";

const accentClass = (t: SupplementTone | undefined) =>
  t === "bad"  ? "card-accent-coral"
  : t === "warn" ? "card-accent-amber"
  : t === "good" ? "card-accent-teal"
                 : "card-accent-navy";

export default function SupplementBlocks({ layer }: { layer: LayerData }) {
  const blocks = layer.supplementBlocks?.blocks ?? [];
  if (blocks.length === 0) return null;
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((b, i) => <Block key={i} block={b} />)}
    </div>
  );
}

function Block({ block }: { block: SupplementBlock }) {
  switch (block.kind) {
    case "leaderboard": return <Leaderboard block={block} />;
    case "matrix":      return <Matrix block={block} />;
    case "timeline":    return <Timeline block={block} />;
    case "callout":     return <Callout block={block} />;
  }
}

function Header({ title, eyebrow, accent }: { title: string; eyebrow?: string; accent?: SupplementTone }) {
  return (
    <div
      className="px-5 py-3 flex items-center justify-between border-b border-[var(--cream-dark)]"
      style={{ background: "var(--cream-dark)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: toneFg(accent) }} />
        {eyebrow && <span className="eyebrow truncate" style={{ color: toneFg(accent) }}>{eyebrow}</span>}
        <span className="font-serif font-semibold text-[14px] text-[var(--navy)] truncate">{title}</span>
      </div>
    </div>
  );
}

function Leaderboard({ block }: { block: Extract<SupplementBlock, { kind: "leaderboard" }> }) {
  return (
    <div className={`card !p-0 overflow-hidden ${accentClass(undefined)}`}>
      <Header title={block.title} eyebrow={block.eyebrow} />
      <div className="divide-y divide-[var(--cream-dark)]">
        {block.rows.map((r, i) => (
          <div key={i} className="px-5 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-sans tabular-nums text-[11px] text-[var(--slate-light)] w-5 shrink-0">{i + 1}</span>
              <div className="min-w-0">
                <div className="font-sans font-semibold text-[13px] text-[var(--navy)] truncate">{r.label}</div>
                {r.sub && <div className="font-sans text-[11px] text-[var(--slate-light)] truncate">{r.sub}</div>}
              </div>
            </div>
            <div className="font-sans tabular-nums font-bold text-[14px] shrink-0" style={{ color: toneFg(r.tone) }}>{r.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Matrix({ block }: { block: Extract<SupplementBlock, { kind: "matrix" }> }) {
  return (
    <div className={`card !p-0 overflow-hidden ${accentClass(undefined)}`}>
      <Header title={block.title} eyebrow={block.eyebrow} />
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--cream-dark)] bg-[var(--paper)]">
              <th className="px-5 py-2 eyebrow text-[var(--slate-light)]"></th>
              {block.columns.map((c, i) => (
                <th key={i} className="px-3 py-2 eyebrow text-[var(--slate-light)] text-right tabular-nums">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((r, i) => (
              <tr key={i} className="border-b border-[var(--cream-dark)] last:border-0">
                <td className="px-5 py-2.5 font-sans font-semibold text-[12.5px] text-[var(--navy)]">{r.label}</td>
                {r.cells.map((cell, j) => (
                  <td key={j} className="px-3 py-2.5 font-sans tabular-nums text-[12.5px] text-right" style={{ color: toneFg(r.tone) }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Timeline({ block }: { block: Extract<SupplementBlock, { kind: "timeline" }> }) {
  return (
    <div className={`card !p-0 overflow-hidden ${accentClass(undefined)}`}>
      <Header title={block.title} eyebrow={block.eyebrow} />
      <ol className="px-5 py-4">
        {block.items.map((it, i) => (
          <li key={i} className="relative pl-6 pb-4 last:pb-0 border-l border-[var(--cream-dark)] ml-2">
            <span
              className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full"
              style={{ background: toneFg(it.tone), border: "2px solid var(--paper)" }}
            />
            <div className="font-sans text-[10px] uppercase tracking-wider mb-0.5" style={{ color: toneFg(it.tone) }}>
              {it.when}
            </div>
            <div className="font-sans font-semibold text-[13px] text-[var(--navy)] leading-snug">{it.headline}</div>
            {it.detail && (
              <div className="font-sans text-[12px] text-[var(--slate)] leading-snug mt-0.5">{it.detail}</div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Callout({ block }: { block: Extract<SupplementBlock, { kind: "callout" }> }) {
  return (
    <div className={`card !p-0 overflow-hidden ${accentClass(block.tone)}`} style={{ background: toneBg(block.tone) }}>
      <Header title={block.title} eyebrow={block.eyebrow} accent={block.tone} />
      <div className="px-5 py-4">
        <p className="font-serif text-[13.5px] leading-[1.55] text-[var(--ink)] max-w-[760px]">{block.body}</p>
        {block.bullets && block.bullets.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {block.bullets.map((b, i) => (
              <li key={i} className="font-sans text-[12.5px] text-[var(--slate)] leading-snug flex gap-2">
                <span className="shrink-0 mt-1.5 h-1 w-1 rounded-full" style={{ background: toneFg(block.tone) }} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
