# Functional test paths: Different Day portal (Elevated Intelligence)

Date: 2026-05-29
App: Different Day portal at the Replit dev/published domain
Auth: single role (shared `admin` login, cookie session). No multi-role variants.
Test data state: tenant library is server-backed. When empty, the app renders the EmptyLibrary "Seed a company" screen instead of the dashboard.

This file is the Phase 1 output of the functional verification brief: the critical paths to be walked in Phase 2. No testing has been run yet. Awaiting human confirmation of this list before proceeding.

---

## 1. Authentication / login gate

- **Entry point:** Portal URL while unauthenticated.
- **Steps:**
  1. Load the portal; the LoginGate ("Different Day internal access") is shown, dashboard is blocked.
  2. Enter username `admin` and the password.
  3. Submit.
- **Success state:** Session cookie set; the gate dismisses and the app renders either the dashboard shell (if tenants exist) or the EmptyLibrary screen (if the library is empty). `GET /api/auth/status` reports authenticated.

## 2. Seed a new company (tenant onboarding pipeline)

- **Entry point:** EmptyLibrary "Seed a company" button, or the header "Switch" button, or Cmd-K "Switch company / seed prospect" → CompanyPicker → "Seed a new company" tab.
- **Steps:**
  1. Open the CompanyPicker and switch to the seed tab.
  2. Enter a company name and homepage URL.
  3. Submit to `POST /api/tenants`; the CompanyBootSplash opens.
  4. Watch the 5 pipeline stages poll status (Ground, Profile, Layers N/14, Artifacts, Commit).
- **Success state:** Pipeline flips to `ready`, the final receipt (model, tokens, grounding) is shown, the splash auto-dismisses, and the dashboard loads with the new tenant in the header and 14 live layers in the sidebar.

## 3. Switch between saved tenants

- **Entry point:** Header company dropdown or "Switch" button → CompanyPicker "Saved tenants" tab.
- **Steps:**
  1. Open the picker.
  2. Select a different saved tenant.
- **Success state:** Dashboard re-renders with the selected tenant's profile in the header and that tenant's diagnosis across the layers. Non-default profiles show the "Preview mode" banner.

## 4. Read a layer diagnosis (core value path)

- **Entry point:** Sidebar layer item (e.g., Finance, Supply chain).
- **Steps:**
  1. Click a layer in the sidebar.
  2. Read the header (confidence, sources count), the analyst take, metrics, narrative.
  3. Inspect the "Data feeds powering this diagnosis" card and the evidence panel.
- **Success state:** Layer renders a coherent diagnosis with a non-zero sources count that matches the number of feeds, confidence band, metrics, and feed rows. No `undefined` / `[object Object]`.

## 5. Morning brief

- **Entry point:** Header "Morning brief" button or Cmd-K "Open morning brief".
- **Steps:** Open the brief; scroll the since-yesterday ribbon, executive read, and layer-by-layer findings.
- **Success state:** Newspaper-style brief renders fully with per-layer findings and V·M badges; closes cleanly back to the dashboard.

## 6. Board pack

- **Entry point:** Header "Board pack" button.
- **Steps:** Open the overlay; page through the scorecard, root causes, recovery levers, and track record.
- **Success state:** Multi-page board document renders end to end with KPIs and statuses; closes cleanly.

## 7. Intelligence brief

- **Entry point:** Header "Intelligence" (Sparkles) button or Cmd-K "Open intelligence brief".
- **Steps:** Open the brief; review company profile, timeline/leadership, and the triple-check verification panel.
- **Success state:** Research document renders with a "grounded on live fetch" badge; verification panel resolves; closes cleanly.

## 8. Anomaly inbox → drill into a layer

- **Entry point:** System Heartbeat trigger or Cmd-K "Open anomaly inbox".
- **Steps:**
  1. Open the inbox drawer.
  2. Review the prioritized anomaly cards.
  3. Click a card.
- **Success state:** The drawer lists anomalies with severity and deltas; clicking a card navigates to the originating layer with the relevant field highlighted.

## 9. Command palette navigation

- **Entry point:** Cmd-K (or Ctrl-K) anywhere in the app.
- **Steps:** Open the palette; run an action (brief, board, intel, inbox, switch, presenter, replay tour) and/or jump to a layer.
- **Success state:** The selected action runs or navigation lands on the chosen layer; palette closes.

## 10. System and analysis pages render

- **Entry point:** Sidebar "System" group items.
- **Steps:** Visit Sales playbook, Intelligence architecture, Data substrate, Calibration, System health, Battle cards, Engagement pipeline, Cross-layer map, Scenario war-room, Committed actions, Outcome track record.
- **Success state:** Each page renders its content (no blank panels, no crashes). Data substrate footer links reach Calibration, System health, and Battle cards. Receipts drawer opens from its affordances.

---

## Notes for Phase 2

- **Auth model is single-role.** Test type 4 (Authorization) covers: unauthenticated (gate blocks protected views), authenticated (paths work), and session-expired (clean re-prompt). Role-variant sub-tests are not applicable and will be marked N/A.
- **Persistence (test type 5)** is relevant for: login session, seeded tenants, active-tenant selection, presenter mode, and persona lens (all persisted). These survive refresh / re-login per design.
- Seeding a real tenant calls live model pipelines; Phase 2 will reuse already-seeded tenants where possible and only seed when a path requires it.
