// Best-effort POST to /api/claims/report-broken. Network errors are
// swallowed because this is a one-shot user signal, not a transactional
// surface; the optimistic UI in VerifiedPill already shows "Thanks" the
// instant the user clicks, so a 500 mid-flight would be confusing to
// surface. The endpoint itself is added by Phase 3.4 (artifacts/api-server
// routes/claims.ts).

export interface ReportBrokenLinkInput {
  layerKey: string;
  claimPath: string;
  sourceUrl: string;
  tenantId?: string;
}

export async function reportBrokenLink(input: ReportBrokenLinkInput): Promise<void> {
  try {
    await fetch("/api/claims/report-broken", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    /* swallow, see header note */
  }
}
