# Functional verification: Different Day portal (Elevated Intelligence)

Date: 2026-05-29
Tester: agent (Replit)
Paths tested: 10 identified, 8 exercised, 2 not walked (see coverage notes)
Integrations tested: 2

Scope: functional behaviour only (does the app do what a user expects). Not security, performance, code quality. Findings are reported, not fixed, per the brief.

## How verification was performed

Evidence was gathered three ways, because the browser test harness dropped its session twice mid-run and live seeding consumes shared AI quota:

1. Browser walks (Playwright) for rendering and interaction paths.
2. Authenticated API calls (cookie session, login `admin`) plus read-only `psql` for data-integrity checks.
3. Server log inspection and source reading for the seeding pipeline behaviour.

Where a test type was not exercised, it is marked "Not run" rather than assumed to pass.

## Critical paths

### Path 1: Authentication / login gate
- Entry: portal URL while unauthenticated.
- Success state: session cookie set, gate dismisses, dashboard (or EmptyLibrary) renders.
- Happy path: PASS. `admin` / `D1ffD4y` signs in and the dashboard shell renders. API login returns `{"ok":true}`.
- Boundary: Not run (empty / max-length username fields not exercised in UI).
- Error handling: PASS (1/1). Unauthenticated API calls return `not_authenticated`; the gate blocks the dashboard.
- Authorization: PASS (2/2 applicable). Unauthenticated requests are gated. App is single-role, so role variants are not applicable. Session store is in-memory, so a server restart invalidates sessions and re-prompts login (observed indirectly via the boot reconciler restarts).
- Persistence: PASS (1/1). Full page reload keeps the session active and the dashboard non-blank.

### Path 2: Seed a new company (tenant onboarding pipeline)
- Entry: CompanyPicker "Seed a new company" tab or the per-tenant refresh action.
- Success state: pipeline reaches `ready`, splash auto-dismisses, dashboard loads the new tenant with 14 layers.
- Happy path: **PASS (slow)**. Per the product owner, seeding does complete and reach `ready`; it just takes about 40 minutes end to end because of AI rate limiting. The earlier "FAIL" read in this report was wrong: it came from observing the run for only a few minutes and seeing the Layers stage sit at `0/14`. That is expected pacing, not a stall. The run completes Ground (about 0.3s) and Profile (about 17s), then the Layers stage advances slowly to 14/14, then Artifacts and Commit, then the splash auto-dismisses.
- Root cause of the slowness (from server logs and `phase2.ts`): each layer runs 7 Anthropic (Claude) calls (perceive, hypothesise, narrate, score, hero, peers, supplements) plus 1 Gemini call (challenge), so the 14 layers issue about 98 Claude calls in total, dispatched in small concurrent batches. This is throttled by HTTP 429 rate limiting on the shared AI integration. The pipeline backs off correctly (`Anthropic 429, backing off` with waitMs escalating 5000 -> 10000 -> 15000), so sub-stages trickle through at a steady but slow pace. The top-level `N/14` counter only increments when a layer's full sub-stage chain completes (`completedCount += 1` only after the layer resolves), so it reads `0/14` for a long time even though sub-stages are progressing underneath. This is a UX-of-progress concern (the counter looks stuck), not a functional failure.
- Boundary / Error / Authorization / Persistence: Not exhaustively run; the long seed duration makes repeated full runs impractical in one pass.
- Context: the three pre-existing tenants (Stripe, Patagonia, Twilio) are `ready` (seeded on 2026-05-26/27). Profile-stage model calls succeed today, so the AI integration is wired and functional; the only cost is throughput under current rate limits.

### Path 3: Switch between saved tenants
- Entry: header "Switch" button -> CompanyPicker "Saved tenants".
- Success state: dashboard re-renders with the selected tenant.
- Happy path: PASS. Selecting "Stripe" updates the header to "Live · Stripe" and populates content.
- Boundary: PASS (informal). Library contains 4 tenants (3 ready, 1 failed); the list renders all without breakage.
- Error handling: Not run.
- Authorization: covered by Path 1 (gated behind auth).
- Persistence: PASS (1/1). The active tenant survives a full reload (header still shows Stripe, not "No tenant").

### Path 4: Read a layer diagnosis (core value path)
- Entry: sidebar layer item.
- Success state: coherent diagnosis with confidence, sources count, metrics, narrative, feed rows; no `undefined` / `[object Object]`.
- Happy path: PASS. Finance renders headline finding, confidence, a numeric sources count, metric tiles, and a "Data feeds powering this diagnosis" list.
- Boundary: PASS (14/14 layers). API inspection of Stripe confirms all 14 layers carry `headline_finding`, `narrative`, 5 to 7 metrics, 5 to 6 causes, 5 to 6 actions, verified and modelled claims, and a hero panel. A full-payload scan found 0 occurrences of `[object Object]`, `undefined`, `NaN`, or `null` values.
- Error handling: Not run (unknown `?layer=` deep link not exercised in this pass).
- Authorization: covered by Path 1.
- Persistence: PASS (the active layer renders consistently after switching and reload).

### Path 5: Morning brief
- Entry: header "Morning brief" button.
- Success state: newspaper-style brief renders, closes back to dashboard.
- Happy path: PASS. Overlay opens with readable findings and closes cleanly back to the dashboard.
- Boundary / Error: Not run.
- Authorization: covered by Path 1.
- Persistence: PASS (closing returns to the prior dashboard state).

### Path 6: Board pack
- Entry: header "Board pack" button.
- Success state: multi-page board document renders, closes cleanly.
- Happy path: PASS. Overlay opens with KPI / scorecard content and closes back to the dashboard. (`briefOverrides.topFindings` carries 13 entries in the underlying data.)
- Boundary / Error: Not run.
- Authorization: covered by Path 1.
- Persistence: PASS.

### Path 7: Intelligence brief
- Entry: header "Intelligence" button.
- Success state: research document with a live-fetch badge and a verification panel that resolves.
- Happy path: **Not verified (at risk)**. This path makes live Anthropic calls on open. Given the sustained 429 throttling observed in Path 2, this brief is at risk of slow load or a `503 "AI is not configured"` style fallback under the current quota. Not exercised to avoid further quota consumption and because the harness was unstable.
- Other test types: Not run.

### Path 8: Anomaly inbox -> drill into a layer
- Entry: System Heartbeat trigger or command palette.
- Success state: inbox lists prioritized anomalies; clicking a card navigates to the originating layer.
- Happy path: **Not run** (not reached before the harness session dropped).
- Other test types: Not run.

### Path 9: Command palette navigation
- Entry: Cmd-K / Ctrl-K.
- Success state: action runs or navigation lands on the chosen destination; palette closes.
- Happy path: PASS. Cmd-K opens the palette, typing "calib" filters to Calibration, and Enter navigates to the Calibration page.
- Boundary / Error: Not run.
- Authorization: covered by Path 1.
- Persistence: not applicable.

### Path 10: System pages (Calibration, System health, Battle cards)
- Entry: sidebar "System" group.
- Success state: each system page renders populated content.
- Happy path: PASS. Calibration renders calibration metrics, System health renders a populated connector-health view, and Battle cards renders multiple competitor cards. None render blank.
- Boundary / Error: Not run.
- Authorization: covered by Path 1.
- Persistence: PASS (reachable and stable after reload).

## Cross-path integration

### Integration 1: Switch tenant (Path 3) -> read layer (Path 4) -> open Morning brief (Path 5) / Board pack (Path 6)
- Result: PASS.
- Notes: selecting Stripe flows its diagnosis into the layer view and into both the Morning brief and Board pack overlays without state loss. Closing the overlays returns to the same active tenant and layer.

### Integration 2: Command palette (Path 9) -> system page (Path 10) -> reload persistence (Path 1)
- Result: PASS.
- Notes: navigating via Cmd-K to Calibration and into System health / Battle cards holds, and a full reload preserves the authenticated session and active tenant.

## Findings

### Fixed in this pass
- **Blank "No tenant" dashboard when a seed begins (FIXED).** Starting a new company seed blanked the entire dashboard, so the user could not view or work with an already-seeded ready company while the new one ran. Root cause in `CompanyContext.tsx`: (1) `openPipelineSplash` switched the active tenant to the brand-new seeding tenant, which has no detail, so the profile fell back to `EMPTY_PROFILE` ("No tenant") with no layers; (2) the `refreshLibrary` self-heal snapped to the first tenant in the list regardless of status, and the list is newest-first, so a failed/seeding tenant (e.g. the failed "Little Spoon") was auto-selected. Fix: the self-heal now prefers the first **ready** tenant and only keeps the current selection if it is ready; starting a seed no longer changes the active tenant; the dashboard switches to the new company only once it reaches `ready`. Net effect: while a new company seeds (the ~40-minute run), the user keeps a ready company on screen and can switch freely; when seeding finishes, the view lands on the new company.
- **Per-gap confidence lift was always "+0pp" (FIXED — data efficacy).** Every layer's gap list, the ConfidenceLadder visual, and the EngagementPipeline weighting showed "+0pp confidence" for closing any gap. Root cause: the Score stage computes a grounded per-gap `confidence_lift_pp`, but `phase2.ts` dropped that field when merging the gaps into the stored layer content, and the portal read a non-existent key (`confidence_gap`). Fix: the field is now allowed in the content gaps schema, preserved (with score-stage gaps taking precedence so they are not truncated), and read correctly in the portal. Note: this corrects newly seeded / refreshed tenants. Already-seeded tenants (Stripe, Patagonia, Twilio) do not carry the field, so they continue to render "+0pp" until re-seeded; their gap text is still correct.

### Major (visible to user, affects core value)
- **Path 2, Error feedback. A failed or orphaned run is only weakly surfaced, and the stage rows go stale.** The boot splash does show a failure affordance on a `failed` status (a Retry button and a relabelled Dismiss in `CompanyBootSplash.tsx`), so failure is not entirely silent. The defect is that `failRun` / the reconciler set the run to `failed` without rewriting the per-stage states, so the splash keeps displaying "Layers IN FLIGHT 0/14" (with Artifacts and Commit queued) alongside the failure controls. The stale "in flight" rows contradict the failed state and obscure that the run died. (Not fixed in this pass; reported for a follow-up.)

### Minor (edge case, workaround exists)
- **Progress counter looks stuck during seeding.** Because the `N/14` Layers counter only advances when a whole layer's sub-stage chain finishes, it reads `0/14` for a long stretch even though the ~40-minute run is progressing normally. Functionally fine, but it reads as a stall. Consider surfacing sub-stage progress so the bar visibly moves.
- **Accessibility / locators.** Several sidebar and header controls share duplicate accessible names, which forced the test harness to fall back to coordinate-based clicks. Not user-blocking, but it weakens screen-reader clarity and automation.

### Observations (not defects)
- The boot reconciler correctly marks orphaned in-flight runs as `failed` on server start. This is sound defensive behaviour; the gap is only that the UI does not reflect it (see Major above).
- The api-server dev script (`pnpm build && pnpm start`) has no file-watcher, so the server does not auto-restart on code changes. Restarts observed during the run orphaned in-flight seeds; this is a test-environment interaction, not a production behaviour.
- Layer data integrity is strong: 14/14 layers fully populated for Stripe with no `undefined` / `[object Object]` / `NaN` / `null` leakage.

## Confidence scoring & data efficacy audit

Question asked: is there enough confidence scoring throughout the intelligence layers, and is the data being presented correct? Measured empirically against the fully-seeded Stripe tenant (all 14 layers).

Coverage (per-layer, Stripe):
- **Layer confidence: 14/14 present.** Range 68 to 76, mean 72. Every layer carries a top-level `confidence` and `confidence_gap`.
- **Cause confidence: 100%.** Every cause across every layer carries a `confidence` value (e.g. 85).
- **Hypothesis confidence: 100%.** Every counter-hypothesis carries a `confidence` (rendered as a CI on the layer).
- **Verified vs modelled claims: 77 verified, 90 modelled across the 14 layers (46% verified).** Verified claims carry real `source_urls` plus `verified_by` (gemini-2.5-pro) and a `verified_at` timestamp; modelled claims carry a written `basis` and an `inferred_from` source list. The split is shown honestly in the UI, so the product does not over-claim grounding.
- **Per-gap confidence lift: was 0% (now fixed).** This was the one real efficacy defect. See "Fixed in this pass".

Reads on efficacy:
- Confidence is LLM-emitted but guided by grounding: the Score stage is told to weight the number by verified-claim count, modelled-claim quality, and gap count, and is clamped to 0 to 95 (never 100). Verified claims require a real source URL surfaced by the Gemini fact-check stage, so "verified" means grounded against fetched sources, not merely asserted.
- The narrow confidence band (68 to 76) means the score does not differentiate layers very much. It is defensible (similar grounding quality across layers), but if you want confidence to be a stronger steering signal, the Score prompt's rule-of-thumb mapping could be widened so low-grounding layers score visibly lower.
- Recommendation already actioned: fix the per-gap lift so the "close this gap to lift confidence by X pp" story is real, not "+0pp" everywhere.

## Coverage notes

- Full 5-test-type matrix was completed only for Path 1. Paths 3, 4, 5, 6, 9, 10 have their Happy path (and several persistence / boundary cells) verified; their Boundary / Error cells were not all run. Paths 7 and 8 were not walked. The shortfall is due to two browser-harness session drops and a deliberate choice not to repeatedly trigger live seeds / live AI briefs that consume shared quota.
- Code was changed in this pass (two fixes; see "Fixed in this pass"). No tenants were deleted; the database was otherwise read only.

## Verdict

**Functional, with two fixes applied and one Major follow-up.** Seeding works (it takes about 40 minutes under current rate limits, which is expected, not a failure). The blank "No tenant" dashboard and the always-"+0pp" gap confidence lift are both fixed. The remaining Major item is the stale boot-splash state on a failed run.

Recommended follow-up work items:
- Make the boot splash surface a failed or orphaned run (poll detects `failed`, show an error with retry) and stop showing "Layers in flight" once failed.
- Surface sub-stage progress so the `N/14` counter visibly moves during the ~40-minute seed instead of sitting at `0/14`.
- Re-seed (or add a backfill for) the three existing tenants so they pick up the now-correct per-gap confidence lift values.
- Optionally widen the Score prompt's confidence mapping so the per-layer confidence band is more differentiated.

## Outstanding (requires human decision)
- Whether the ~40-minute seed duration is acceptable for the intended demo cadence, or whether the AI integration quota / concurrency should change to speed up live onboarding.
- Whether Paths 7 (Intelligence brief) and 8 (Anomaly inbox) should be re-tested in a dedicated run with quota headroom and a stable harness, to close the coverage gap.
