import type { ReactNode } from "react";
import type { VerifiedClaim, ModelledClaim } from "../../data/layers";
import VerifiedPill from "./VerifiedPill";
import ModelledBand from "./ModelledBand";

// Top-level wrapper. Given a `claim_path` ("narrative", "causes[0].detail",
// "metrics[2]") and the parent layer's two claim arrays, it finds the
// matching entry by exact path and renders {children}{pill|band|nothing}.
// Per Phase 3 brief: no "unsupported" affordance, plain text is fine when
// no claim matches. Verified takes precedence over modelled on the unlikely
// collision case.

export default function ClaimAnnotation({
  claimPath,
  verifiedClaims,
  modelledClaims,
  children,
  onReportBroken,
}: {
  claimPath: string;
  verifiedClaims?: VerifiedClaim[];
  modelledClaims?: ModelledClaim[];
  children: ReactNode;
  onReportBroken?: (payload: { sourceUrl: string; claimPath: string }) => void;
}) {
  const verified = verifiedClaims?.find((c) => c.claim_path === claimPath);
  if (verified) {
    return <>{children}<VerifiedPill claim={verified} onReportBroken={onReportBroken} /></>;
  }
  const modelled = modelledClaims?.find((c) => c.claim_path === claimPath);
  if (modelled) {
    return <>{children}<ModelledBand claim={modelled} /></>;
  }
  return <>{children}</>;
}

// Shared helper for header count strips and Morning Brief badges.
export function claimCounts(
  verifiedClaims?: VerifiedClaim[],
  modelledClaims?: ModelledClaim[],
): { verified: number; modelled: number; sources: number } {
  const verified = verifiedClaims?.length ?? 0;
  const modelled = modelledClaims?.length ?? 0;
  const urlSet = new Set<string>();
  for (const c of verifiedClaims ?? []) for (const u of c.source_urls) urlSet.add(u);
  return { verified, modelled, sources: urlSet.size };
}
