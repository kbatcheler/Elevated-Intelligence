import { Check } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { VerifiedTooltipBody } from "./ProvenanceTooltip";
import type { VerifiedClaim } from "../../data/layers";

// Gold "✓ N" pill rendered next to verified text. Clickable: opens the first
// source URL in a new tab. Hovering for 300ms reveals the full tooltip with
// every source, titles, and a per-URL "Report broken link" affordance.

export default function VerifiedPill({
  claim,
  onReportBroken,
}: {
  claim: VerifiedClaim;
  onReportBroken?: (payload: { sourceUrl: string; claimPath: string }) => void;
}) {
  const sourceCount = claim.source_urls.length;
  const firstUrl = claim.source_urls[0];
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <a
          href={firstUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Verified by ${sourceCount} ${sourceCount === 1 ? "source" : "sources"}, open primary source`}
          onClick={(e) => { e.stopPropagation(); }}
          className="inline-flex items-center gap-0.5 align-middle ml-1.5 px-1.5 py-px rounded-sm font-sans text-[10px] font-semibold tabular-nums leading-none whitespace-nowrap select-none cursor-pointer hover:brightness-95 focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
          style={{
            background: "var(--gold)",
            color: "var(--navy-deep)",
            border: "1px solid var(--gold)",
          }}
        >
          <Check size={9} strokeWidth={3} />
          <span>{sourceCount}</span>
        </a>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" sideOffset={6}
                      className="bg-[var(--paper)] text-[var(--ink)] p-0 shadow-lg border border-[var(--cream-dark)]">
        <VerifiedTooltipBody
          claim={claim}
          onReportBroken={onReportBroken
            ? (url) => onReportBroken({ sourceUrl: url, claimPath: claim.claim_path })
            : undefined}
        />
      </TooltipContent>
    </Tooltip>
  );
}
