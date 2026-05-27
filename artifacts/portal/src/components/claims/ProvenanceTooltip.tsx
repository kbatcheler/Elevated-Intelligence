import { useState, type ReactNode } from "react";
import { ExternalLink, ChevronDown, ChevronRight } from "lucide-react";
import type { VerifiedClaim, ModelledClaim } from "../../data/layers";

// Shared inner-content renderer for both pill and band tooltips. Kept in one
// place so the visual language (gold rule for verified, cream rule for
// modelled, footer affordances) stays consistent. The Radix Tooltip wrapper
// lives in the caller, this component only renders what goes inside
// TooltipContent.

const MODELLED_EXPLAINER =
  "This claim was not directly grounded in a web source during verification. " +
  "The system inferred it from related signals (analyst reports, peer disclosures, " +
  "public filings) and flagged it as modelled so the reader can weight it accordingly. " +
  "Confidence reflects how robust the inference is against the named basis.";

export function VerifiedTooltipBody({
  claim,
  onReportBroken,
}: {
  claim: VerifiedClaim;
  onReportBroken?: (url: string) => void;
}) {
  const [reported, setReported] = useState<Set<string>>(new Set());
  return (
    <div className="w-[360px] p-3 font-sans text-[12px] text-[var(--ink)]">
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[var(--gold)]">
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--gold)" }} />
        <span className="eyebrow text-[var(--gold)]">Verified · web-grounded</span>
        {claim.verified_by && (
          <span className="ml-auto text-[10px] italic text-[var(--slate-light)]">{claim.verified_by}</span>
        )}
      </div>
      <p className="font-serif italic text-[12px] leading-[1.45] text-[var(--slate)] mb-2.5">
        &ldquo;{claim.claim_text}&rdquo;
      </p>
      <div className="eyebrow text-[var(--slate-light)] mb-1.5">
        Sources ({claim.source_urls.length})
      </div>
      <ul className="space-y-1.5 max-h-[180px] overflow-y-auto">
        {claim.source_urls.map((url, i) => {
          const title = claim.source_titles?.[i] ?? hostnameOf(url) ?? `Source ${i + 1}`;
          const wasReported = reported.has(url);
          return (
            <li key={i} className="leading-snug">
              <a href={url} target="_blank" rel="noopener noreferrer"
                 className="flex items-start gap-1.5 text-[var(--navy)] hover:text-[var(--coral)] group">
                <ExternalLink size={11} strokeWidth={2} className="shrink-0 mt-[3px] opacity-60 group-hover:opacity-100" />
                <span className="flex-1 underline decoration-[var(--cream-dark)] underline-offset-2 group-hover:decoration-[var(--coral)]">
                  {title}
                </span>
              </a>
              {onReportBroken && (
                <div className="pl-[18px] mt-0.5">
                  {wasReported ? (
                    <span className="text-[10px] italic text-[var(--teal)]">Thanks, flagged for review.</span>
                  ) : (
                    <button type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onReportBroken(url);
                              setReported((prev) => new Set(prev).add(url));
                            }}
                            className="text-[10px] text-[var(--slate-light)] hover:text-[var(--coral)] underline decoration-dotted">
                      Report broken link
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ModelledTooltipBody({ claim }: { claim: ModelledClaim }) {
  const [explainerOpen, setExplainerOpen] = useState(false);
  const tier = confidenceTier(claim.confidence);
  return (
    <div className="w-[360px] p-3 font-sans text-[12px] text-[var(--ink)]">
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-[var(--cream-dark)]">
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: tier.color }} />
        <span className="eyebrow" style={{ color: tier.color }}>Modelled · {tier.label}</span>
        <span className="ml-auto font-sans font-bold tabular-nums text-[11px]" style={{ color: tier.color }}>
          {claim.confidence}% confidence
        </span>
      </div>
      <p className="font-serif italic text-[12px] leading-[1.45] text-[var(--slate)] mb-2.5">
        &ldquo;{claim.claim_text}&rdquo;
      </p>
      <div className="eyebrow text-[var(--slate-light)] mb-1">Basis</div>
      <p className="text-[12px] leading-snug text-[var(--ink)] mb-2.5">{claim.basis}</p>
      {claim.inferred_from && claim.inferred_from.length > 0 && (
        <>
          <div className="eyebrow text-[var(--slate-light)] mb-1">Inferred from</div>
          <ul className="space-y-0.5 mb-2.5">
            {claim.inferred_from.map((src, i) => (
              <li key={i} className="text-[11px] text-[var(--slate)] leading-snug pl-2 border-l-2 border-[var(--cream-dark)]">
                {src}
              </li>
            ))}
          </ul>
        </>
      )}
      <button type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExplainerOpen((v) => !v); }}
              className="flex items-center gap-1 text-[11px] text-[var(--slate-light)] hover:text-[var(--navy)]">
        {explainerOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        Why modelled?
      </button>
      {explainerOpen && (
        <p className="mt-2 text-[11px] italic leading-snug text-[var(--slate)]">
          {MODELLED_EXPLAINER}
        </p>
      )}
    </div>
  );
}

export function confidenceTier(confidence: number): { label: string; color: string; bg: string; border: string } {
  // Tiers per Phase 3 brief: 75-95 cream / 50-74 gold-soft / 30-49 coral.
  // Below 30 still renders as coral, but the upstream gate also drops sub-30
  // claims, so this is a safety net.
  if (confidence >= 75) return { label: "high", color: "var(--navy)", bg: "var(--cream-light)", border: "var(--cream-dark)" };
  if (confidence >= 50) return { label: "moderate", color: "var(--gold)", bg: "var(--cream-light)", border: "var(--gold-light)" };
  return { label: "low", color: "var(--coral)", bg: "var(--coral-faint)", border: "var(--coral)" };
}

function hostnameOf(url: string): string | null {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
}

// Re-exported for layout components that want to render an inline icon
// without bringing in the whole Tooltip primitive themselves.
export type { ReactNode };
