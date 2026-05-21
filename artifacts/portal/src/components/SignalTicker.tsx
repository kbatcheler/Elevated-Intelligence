import { useApp } from "../context/AppContext";
import { ArrowUpRight } from "lucide-react";

export default function SignalTicker({ onNavigate }: { onNavigate: (key: string) => void }) {
  const { signals } = useApp();
  const recent = signals.slice(0, 5);
  return (
    <div className="h-[32px] shrink-0 border-b border-[var(--cream-dark)] flex items-stretch text-[11px] overflow-hidden"
         style={{ background: "var(--paper)" }}>
      <div className="flex items-center gap-2 px-5 shrink-0 border-r border-[var(--cream-dark)]" style={{ background: "var(--cream-light)" }}>
        <span className="relative inline-flex">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--coral)" }} />
          <span className="absolute inset-0 h-1.5 w-1.5 rounded-full animate-ping" style={{ background: "var(--coral)", opacity: 0.5 }} />
        </span>
        <span className="eyebrow text-[var(--coral)]">Live signals</span>
      </div>
      <div className="flex-1 flex items-center overflow-hidden relative">
        <div className="flex items-center gap-6 px-5 whitespace-nowrap">
          {recent.map((s, i) => {
            const color =
              s.tone === "alert" ? "var(--coral)" :
              s.tone === "warn"  ? "var(--amber)" :
              s.tone === "good"  ? "var(--teal)"  :
                                   "var(--navy)";
            return (
              <button
                key={`${s.ts}-${i}`}
                onClick={() => onNavigate(s.layer)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0"
                style={{ opacity: i === 0 ? 1 : 0.55 - i * 0.08 }}
              >
                {i === 0 && (
                  <span className="font-sans font-bold text-[10px] px-1.5 py-0.5 rounded-sm tabular-nums"
                        style={{ background: color, color: "white" }}>NEW</span>
                )}
                <span className="font-sans tabular-nums text-[var(--slate-light)]">{s.ts}</span>
                <span className="h-1 w-1 rounded-full shrink-0" style={{ background: color }} />
                <span className="eyebrow text-[var(--slate-light)]">{s.source}</span>
                <span className="font-sans text-[var(--ink)] truncate max-w-[480px]" style={{ color }}>{s.text}</span>
                {s.delta && (
                  <span className="font-sans font-bold text-[10px] tabular-nums px-1.5 py-0.5 rounded-sm"
                        style={{ background: color + "1A", color }}>{s.delta}</span>
                )}
                <ArrowUpRight size={11} strokeWidth={1.5} className="text-[var(--slate-light)] opacity-60" />
              </button>
            );
          })}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none"
             style={{ background: "linear-gradient(to right, transparent, var(--paper))" }} />
      </div>
    </div>
  );
}
