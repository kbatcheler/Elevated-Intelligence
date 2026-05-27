import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { ModelledTooltipBody, confidenceTier } from "./ProvenanceTooltip";
import type { ModelledClaim } from "../../data/layers";

// Cream/gold-soft/coral side band rendered next to modelled text. Not
// clickable, no primary URL exists. Hovering reveals the basis, the
// inferred-from list, and the reusable "Why modelled?" explainer.

export default function ModelledBand({ claim }: { claim: ModelledClaim }) {
  const tier = confidenceTier(claim.confidence);
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <span
          role="note"
          aria-label={`Modelled claim, ${claim.confidence} percent confidence`}
          onClick={(e) => { e.stopPropagation(); }}
          className="inline-flex items-center gap-1 align-middle ml-1.5 px-1.5 py-px rounded-sm font-sans text-[10px] font-semibold tabular-nums leading-none whitespace-nowrap select-none cursor-help"
          style={{ background: tier.bg, color: tier.color, border: `1px solid ${tier.border}` }}
        >
          <span className="inline-block h-1 w-1 rounded-full" style={{ background: tier.color }} />
          <span>~{claim.confidence}%</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" sideOffset={6}
                      className="bg-[var(--paper)] text-[var(--ink)] p-0 shadow-lg border border-[var(--cream-dark)]">
        <ModelledTooltipBody claim={claim} />
      </TooltipContent>
    </Tooltip>
  );
}
