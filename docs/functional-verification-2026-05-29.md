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
- Happy path: **FAIL**. Seeding does not reach `ready` in a reasonable window. The run completes Ground (about 0.3s) and Profile (about 17s) but then the Layers stage crawls and shows `0/14` for the entire observation window (over 6 minutes across runs).
- Root cause (from server logs and `phase2.ts`): each layer runs 7 Anthropic (Claude) calls (perceive, hypothesise, narrate, score, hero, peers, supplements) plus 1 Gemini call (challenge), so the 14 layers issue about 98 Claude calls in total, dispatched in small concurrent batches rather than all at once. This is throttled hard by HTTP 429 rate limiting on the shared AI integration. The pipeline backs off correctly (`Anthropic 429, backing off` with waitMs escalating 5000 -> 10000 -> 15000), so sub-stages trickle through one at a time at a crawl. The top-level `N/14` counter only increments when a layer's full sub-stage chain completes (`completedCount += 1` only after the layer resolves), so it reads `0/14` for a long time even though sub-stages are progressing underneath.
- Boundary / Error / Authorization / Persistence: Not run (blocked by the failing happy path).
- Context: the three pre-existing tenants (Stripe, Patagonia, Twilio) are `ready` because they were seeded on 2026-05-26/27, presumably when quota allowed. Profile-stage model calls succeed today, so the AI integration itself is wired and functional; the failure is throughput under current rate limits, not a missing key.

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

### Major (visible to user, affects core value)
- **Path 2, Happy path. Seeding a new company does not complete under current AI quota.** The Layers stage is throttled by sustained Anthropic 429 rate limiting and sits at `0/14` for minutes. A user trying to onboard a new prospect live (for example in a demo) will see the boot splash appear stuck. Existing tenants seeded on prior days are unaffected.
- **Path 2, Error feedback. A failed or orphaned run is only weakly surfaced, and the stage rows go stale.** The boot splash does show a failure affordance on a `failed` status (a Retry button and a relabelled Dismiss in `CompanyBootSplash.tsx`), so failure is not entirely silent. The defect is that `failRun` / the reconciler set the run to `failed` without rewriting the per-stage states, so the splash keeps displaying "Layers IN FLIGHT 0/14" (with Artifacts and Commit queued) alongside the failure controls. During the runs this read as a frozen overlay; the stale "in flight" rows contradict the failed state and obscure that the run died.
- **Path 3 / dashboard. Authenticated with tenants present but none active renders a blank "No tenant" dashboard.** When no tenant is active (for example after a seed fails), the shell renders with the header reading "No tenant" and a blank content area, instead of reliably selecting a ready tenant or showing the EmptyLibrary / picker prompt. EmptyLibrary renders only when `tenants.length === 0`; otherwise the dashboard shell renders and can be blank when no layer is resolved. Confirmed in `CompanyContext.tsx`: when the active tenant is `failed` / `seeding` the detail fetch is skipped, `detail` is null, and the profile falls back to `EMPTY_PROFILE` (`name: "No tenant"`) with `LAYERS: []`. The auto-select code comment says "snap to first ready tenant" but the implementation picks the first tenant regardless of status, so it can land on a non-ready tenant. Observed twice.

### Minor (edge case, workaround exists)
- **Accessibility / locators.** Several sidebar and header controls share duplicate accessible names, which forced the test harness to fall back to coordinate-based clicks. Not user-blocking, but it weakens screen-reader clarity and automation.

### Observations (not defects)
- The boot reconciler correctly marks orphaned in-flight runs as `failed` on server start. This is sound defensive behaviour; the gap is only that the UI does not reflect it (see Major above).
- The api-server dev script (`pnpm build && pnpm start`) has no file-watcher, so the server does not auto-restart on code changes. Restarts observed during the run orphaned in-flight seeds; this is a test-environment interaction, not a production behaviour.
- Layer data integrity is strong: 14/14 layers fully populated for Stripe with no `undefined` / `[object Object]` / `NaN` / `null` leakage.

## Coverage notes

- Full 5-test-type matrix was completed only for Path 1. Paths 3, 4, 5, 6, 9, 10 have their Happy path (and several persistence / boundary cells) verified; their Boundary / Error cells were not all run. Paths 7 and 8 were not walked. The shortfall is due to two browser-harness session drops and a deliberate choice not to repeatedly trigger live seeds / live AI briefs that consume shared quota.
- No code was changed. No new tenants were created beyond re-running the already-present "Little Spoon" seed, which the user pre-approved. The database was read only (no destructive writes).

## Verdict

**Stalled.** Acceptance is not met: the Path 2 (Seed a new company) happy path fails, and acceptance requires every happy path to pass. Two further Major findings affect the new-tenant and empty-active-tenant experience.

Critical paths with failures:
1. Path 2 (Seed a new company): does not complete under current AI rate limits.

Recommended work items (for a separate fix pass, not this brief):
- Address the Layers-stage throughput: reduce per-layer Claude concurrency further, add a global token-bucket / queue across layers, or surface partial progress so the counter moves.
- Make the boot splash surface a failed or orphaned run (poll detects `failed`, show an error with retry) instead of holding "in flight".
- When authenticated with tenants present but none active, auto-select a ready tenant or route to EmptyLibrary / the picker instead of rendering a blank "No tenant" dashboard.

## Outstanding (requires human decision)
- Whether the seeding throughput problem is acceptable for the intended demo cadence, or whether the AI integration quota / concurrency needs to change before relying on live onboarding.
- Whether Paths 7 (Intelligence brief) and 8 (Anomaly inbox) should be re-tested in a dedicated run with quota headroom and a stable harness, to close the coverage gap.
