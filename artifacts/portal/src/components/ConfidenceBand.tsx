import { useState } from "react";

export default function ConfidenceBand({ value, inputs }: { value: number; inputs?: string[] }) {
  const [open, setOpen] = useState(false);
  const x = Math.max(2, Math.min(58, (value / 100) * 60));
  const defaults = [
    "Real-time competitor pricing latency (4–7 days) — would lift confidence ~6pp",
    "Margin elasticity model refresh (pre-supply-shock) — would lift confidence ~4pp",
  ];
  const list = inputs && inputs.length ? inputs : defaults;
  return (
    <div className="relative inline-flex items-center gap-2"
         onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <div className="relative h-2 w-[60px] rounded-sm overflow-hidden border border-[var(--border)]">
        <div className="absolute inset-y-0 left-0 w-1/3" style={{ background: "var(--red-faint)" }} />
        <div className="absolute inset-y-0 left-1/3 w-1/3" style={{ background: "var(--amber-faint)" }} />
        <div className="absolute inset-y-0 right-0 w-1/3" style={{ background: "var(--teal-faint)" }} />
        <div className="absolute top-[-2px] h-3 w-[2px]" style={{ left: `${x}px`, background: "var(--navy)" }} />
      </div>
      <span className="text-[12px] font-sans font-semibold text-[var(--navy)]">{value}%</span>
      {open && (
        <div className="absolute z-30 left-0 top-7 w-[280px] card !p-3 shadow-none"
             style={{ background: "var(--paper)", border: "1px solid var(--border)" }}>
          <div className="eyebrow text-[var(--slate-light)] mb-1">What would change this confidence?</div>
          <ul className="space-y-1">
            {list.map((l, i) => (
              <li key={i} className="text-[12px] text-[var(--slate)] leading-snug flex gap-1.5">
                <span className="text-[var(--gold)] mt-1">•</span><span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
