# Release verification: Different Day Portal (Elevated Intelligence) 2026.05.29

Date: 2026-05-29
Reviewer: Replit Agent (automated verification pass)
Previous release: d92cba2 ("Published your App", prior to the data-feeds + system-pages work)

> Scope note: this app has no semantic version or git tags. Version label `2026.05.29` is date-based. "Previous release" is the last published checkpoint before this release's changes (system health, calibration, battle cards, command palette, and per-layer data feeds + activity stream).
>
> Sections marked "if applicable" that do not map to this project (cross-platform browser matrix, formal load/perf contract, backup/rollback infra) are noted as SKIPPED with a reason rather than fabricated.

## Section 1: Static analysis
- Typecheck: PASS. `pnpm run typecheck` clean across all 4 workspace packages (api-server, portal, mockup-sandbox, scripts) plus composite libs.
- Lint: NONE CONFIGURED. No ESLint config in the repo, so there is no lint step to run. (Informational, not a blocker.)
- Formatter check: 184 files have Prettier style differences. NOT auto-fixed (AUTO_FORMAT_OK was not set). Informational only, no functional impact.
- Build: PASS. api-server bundles via esbuild (`dist/index.mjs` 2.4 MB incl. pino workers). Portal builds via Vite: `index.js` 917 KB (gzip 261 KB), `index.css` 77 KB (gzip 14 KB).
- Size delta vs d92cba2: NOT MEASURED. No recorded prior build sizes to diff against. Portal JS exceeds the 500 KB chunk warning (known, single-bundle SPA; not a regression introduced this release).

## Section 2: Tests
- Unit: NONE. No `*.test.*` / `*.spec.*` files exist in the repo.
- Integration: NONE.
- E2E: NONE.
- Coverage: N/A (no test tooling).
- Note: there is no automated test suite. Verification relied on typecheck, build, manual API probing, and architect review. Recommend adding at minimum a data-integrity invariant test (every `LAYER_KEYS` entry has feed rows; every activity `layer` is a valid key).

## Section 3: Security
- Hardcoded secrets: 1 FOUND — SEVERE. `artifacts/api-server/src/routes/auth.ts` contains literal `ADMIN_USERNAME = "admin"` and a literal `ADMIN_PASSWORD`. The code comment acknowledges this ("Phase 1: hardcoded credentials ... Phase 4 will move these to env vars"). Generic key/token/private-key scan was otherwise clean.
- Auth gates: PASS (4/4). Unauthenticated `GET /api/tenants`, `/api/claims`, `/api/companies`, `/api/intelligence/*` all return 401. Public `/api/healthz` and `/api/auth/status` return 200. Login happy path verified: valid creds -> 200 + cookie -> protected route 200; bad creds -> 401.
- CORS: WEAK (MODERATE). `app.use(cors())` allows all origins (wildcard). Mitigated because protected routes are cookie-gated and the cors default does not set `Allow-Credentials`, and production traffic is same-origin through the Replit proxy. Recommend restricting to known origins.
- Dependency audit: 0 critical, 0 high, 1 moderate. `qs` (via `express`) DoS GHSA-q8mj-m7cp-5q26, patched in >=6.15.2. Within acceptance (no critical/high). Resolvable by bumping the transitive `qs` / express patch.
- Env vars: MOSTLY CLEAN. `SESSION_SECRET` and `DATABASE_URL` are correctly read from env and fail-fast when missing. The single violation is the hardcoded admin login above.
- Production error responses: PASS. 500 handlers return generic messages ("... failed unexpectedly."); no stack traces, paths, or schema leaked. Dev-only diagnostics router is gated behind `NODE_ENV !== "production"`. Server logging is structured (pino); zero `console.*` in server code.

Additional auth findings from architect review:
- HIGH: session cookie set without `secure: true`. In non-TLS hops the session token can transit in the clear.
- HIGH: logout is client-side only. `revokeSession()` is a no-op and tokens are stateless with a 7-day TTL, so a stolen token stays valid until expiry.

## Section 4: Functional walkthrough
- Login gate (UI): PASS. App boots to the "Elevated Intelligence / Different Day internal access" login card with no console errors.
- Auth API round-trip: PASS (verified via curl): login -> session cookie -> protected endpoint 200; invalid credentials -> 401.
- Health endpoint: PASS. `GET /api/healthz` -> 200 `{"status":"ok"}`.
- Per-layer "Data feeds powering this diagnosis" (this release's headline change): VERIFIED at the data/wiring level. `CompanyContext` now returns `RAW_FEEDS` + `RAW_ACTIVITY_STREAM` (previously `{}` / `[]`); typecheck and architect confirm the regression is fixed and consumers render the populated shapes.
- Full authenticated UI click-through (System health, Calibration, Battle cards, Cmd-K, layer pages): NOT EXHAUSTIVELY WALKED in-browser this pass — the login gate blocks unattended screenshots and there is no e2e harness. Recommend a Playwright pass post-fix. (No blocker observed at the API/data layer.)

## Section 5: Cross-platform
- SKIPPED. No multi-browser (Chrome/Safari/Firefox) or device matrix available in this environment, and no automated cross-browser harness exists. The portal is a responsive React SPA with a documented mobile splash; full matrix testing is a human/CI step.

## Section 6: Performance
- SKIPPED (no formal contract). Informal: portal JS bundle 917 KB (261 KB gzip) — above Vite's 500 KB warning, single-chunk SPA. No p95/LCP SLA defined for this internal sales tool. Consider code-splitting if load time becomes a concern.

## Section 7: Documentation
- README/`replit.md`: CURRENT for run/operate, stack, and gotchas (DK-3 feed-count invariant documented). Adequate for a contributor.
- CHANGELOG: MISSING. No CHANGELOG file in the repo.
- API docs: contract-first via OpenAPI/codegen; in sync with implementation (typecheck green against generated zod/hooks).
- Release notes: this file. The prior `docs/build-report.md` (2026-05-25) covers an earlier pass.

## Section 8: Observability
- Error tracking: NOT CONFIGURED. No Sentry/Rollbar/equivalent. (Acceptable for internal tool; noted.)
- Structured logs: PASS. pino + pino-http with request serializers; zero freeform `console.*` in server.
- Health check: PASS. `/api/healthz` returns 200 with a schema-validated body. (Liveness only; does not assert DB reachability.)
- Business metrics: NOT TRACKED. No metrics pipeline. (Noted, not a blocker for this app class.)

## Section 9: Database
- Migrations: DEV-PUSH MODEL. Drizzle with `drizzle-kit push` (no versioned migration files / history). Schema lives in `lib/db/src/schema`. `DATABASE_URL` required, fail-fast if unset.
- Rollback tested: N/A. No migration history means no forward/back migration path to test; rollback would be a manual schema operation.
- Indexes: NOT AUDITED this pass.
- Backup: Managed by the Replit platform (automatic checkpoints). No app-level backup config.

## Section 10: Architect
- Verdict: FAIL.
- Severe: 1 — hardcoded admin credentials in `auth.ts`.
- High: 2 — session cookie missing `secure: true`; logout does not invalidate server-side tokens (no-op `revokeSession`, 7-day TTL).
- Moderate: 2 — wildcard CORS; layer "sources" counter reads `content.proof.items.length` in `projectLayer()` rather than `FEEDS[layerKey].length`, so the DK-3 documented invariant is not actually wired (potential inconsistency between the header count and the populated feed rows).
- Low: formatter drift (184 files), no CHANGELOG, portal bundle size warning.

## Verdict
NO-GO — STALLED at Section 3 (Security). One SEVERE finding (hardcoded admin credentials) blocks release. Two HIGH auth findings should also be resolved before publish.

## Outstanding (human decision required)
1. SEVERE: move admin credentials out of source into platform secrets, with fail-fast if unset. This is an auth change to your live gate, so I have not made it unilaterally — confirm and I will implement it (set `ADMIN_USERNAME` / `ADMIN_PASSWORD` as secrets, reject startup if missing).
2. HIGH: add `secure: true` to the session cookie in production and implement real logout/token revocation (or accept the documented stateless trade-off in writing).
3. MODERATE: decide whether to wire the layer "sources" count to `FEEDS[layerKey].length` (honor DK-3) or formally reconcile the two source models.

## Notes
- The headline change of this release (populating the empty per-layer data-feeds section and activity stream) is sound: typecheck clean, build clean, architect confirms the empty-state regression is fixed.
- No test suite exists; this verdict rests on static analysis, build, API probing, and architect review rather than automated tests.
- The hardcoded credential and weak session settings are pre-existing (not introduced by this release), but they block a production publish under this template's acceptance bar.
