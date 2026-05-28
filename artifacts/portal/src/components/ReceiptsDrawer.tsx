import { useEffect } from "react";
import { X, Radio, Sparkles, GitBranch, CheckCircle2, ArrowUpRight, Lightbulb } from "lucide-react";
import { useApp } from "../context/AppContext";

// ----------------------------------------------------------------------------
// Receipts drawer.
//
// One global slide-in panel that any surface can open with a
// ReceiptPayload. The shape mirrors the four cortex stages plus a
// takeaway slot, so the drawer reads the same whether it was opened
// from the Cortex Control Panel, a Calibration miss row, or a
// battle-card "verify this" link. By centralising the layout we
// guarantee the buyer sees the same "show your work" pattern
// everywhere — no per-surface freestyling.
// ----------------------------------------------------------------------------

interface Props {
  onNavigate: (key: string) => void;
}

export default function ReceiptsDrawer({ onNavigate }: Props) {
  const { receipt, closeReceipt } = useApp();

  useEffect(() => {
    if (!receipt) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeReceipt(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [receipt, closeReceipt]);

  if (!receipt) return null;

  const conf = receipt.confidencePct;
  const confColor = conf >= 80 ? "var(--teal)" : conf >= 65 ? "var(--gold)" : "var(--coral)";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeReceipt}
        className="fixed inset-0 z-[60]"
        style={{ background: "rgba(15,26,51,0.45)" }}
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Receipts"
        className="fixed top-0 right-0 bottom-0 z-[61] flex flex-col"
        style={{
          width: "min(520px, 92vw)",
          background: "var(--cream-light)",
          borderLeft: "1px solid var(--cream-dark)",
          boxShadow: "-12px 0 28px rgba(15,26,51,0.18)",
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--cream-dark)", background: "var(--navy)" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--gold-light)] mb-1">{receipt.eyebrow}</div>
              <div className="font-serif text-[18px] text-[var(--cream)] leading-tight">{receipt.title}</div>
            </div>
            <button
              onClick={closeReceipt}
              aria-label="Close receipts"
              className="shrink-0 h-7 w-7 rounded-sm flex items-center justify-center text-[var(--cream)] hover:bg-white/10 transition-colors"
            >
              <X size={16} strokeWidth={1.8} />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="font-mono text-[10px] tracking-wide text-[var(--gold-light)]">CONFIDENCE</div>
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(244,241,234,0.12)" }}>
              <div className="h-full rounded-full" style={{ width: `${conf}%`, background: confColor }} />
            </div>
            <div className="font-mono text-[12px] text-[var(--cream)] tabular-nums font-semibold">{conf}%</div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 scroll-area">
          {/* Source */}
          <Section icon={Radio} accent="var(--coral)" label="SOURCE">
            <div className="font-mono text-[12px] text-[var(--navy)]">{receipt.feedSource}</div>
            <div className="font-mono text-[10.5px] text-[var(--slate-light)] mt-1">
              ingest <span className="tabular-nums text-[var(--slate)]">{receipt.ingestMs}ms</span>
              <span className="opacity-40 mx-2">·</span>
              published <span className="text-[var(--slate)]">{receipt.publishedAt}</span>
            </div>
          </Section>

          {/* Reasoning */}
          <Section icon={GitBranch} accent="var(--teal)" label="REASONING">
            <p className="font-serif text-[13.5px] text-[var(--ink)] leading-snug">{receipt.reasoning}</p>
          </Section>

          {/* Evidence */}
          <Section icon={Sparkles} accent="var(--gold)" label={`EVIDENCE · ${receipt.evidence.length}`}>
            <ul className="space-y-1.5">
              {receipt.evidence.map((e, i) => (
                <li key={i} className="font-mono text-[11.5px] text-[var(--slate)] leading-snug flex gap-2">
                  <span className="text-[var(--gold)] shrink-0">·</span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* Published */}
          <Section icon={CheckCircle2} accent="var(--navy)" label="PUBLISHED CONCLUSION">
            <p className="font-serif text-[14px] text-[var(--ink)] leading-snug italic">"{receipt.claim}"</p>
          </Section>

          {receipt.takeaway && (
            <Section icon={Lightbulb} accent="var(--amber)" label="WHAT WE CHANGED">
              <p className="font-serif text-[13px] text-[var(--ink)] leading-snug">{receipt.takeaway}</p>
            </Section>
          )}

          {receipt.routeKey && receipt.routeLabel && (
            <button
              onClick={() => { closeReceipt(); onNavigate(receipt.routeKey!); }}
              className="mt-2 w-full flex items-center justify-between px-3 py-2.5 rounded-sm border transition-colors hover:bg-[var(--cream-dark)]/40"
              style={{ borderColor: "var(--cream-dark)" }}
            >
              <span className="font-sans text-[12px] text-[var(--coral)]">Open {receipt.routeLabel}</span>
              <ArrowUpRight size={14} strokeWidth={1.6} className="text-[var(--coral)]" />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t font-mono text-[10px] tracking-wide text-[var(--slate-light)]" style={{ borderColor: "var(--cream-dark)" }}>
          press <span className="text-[var(--slate)]">Esc</span> to close
        </div>
      </aside>
    </>
  );
}

function Section({
  icon: Icon, accent, label, children,
}: { icon: typeof Radio; accent: string; label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={12} strokeWidth={1.8} style={{ color: accent }} />
        <span className="font-mono text-[10px] tracking-[0.14em] font-semibold" style={{ color: accent }}>{label}</span>
      </div>
      <div className="pl-5">{children}</div>
    </div>
  );
}
