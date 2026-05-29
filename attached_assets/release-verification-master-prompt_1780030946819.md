# Pre-release final review master prompt

A reusable template for the last verification pass before shipping a release. Fill the bracketed placeholders, paste into Replit, run end to end. The agent reports back with a single structured report you confirm before publish.

This template distills the patterns that work: pre-resolved decisions to stop the agent re-asking, explicit acceptance criteria per section, sequential execution, whack-a-mole caps, honest reporting, and a report format the human can scan in 60 seconds.

---

# Final release verification: [APP_NAME] [VERSION]

## Context

Releasing [APP_NAME] version [VERSION]. Last release was [PREVIOUS_VERSION] on [DATE]. This brief is a final verification pass before publish. No new features. No refactors unless required to fix a finding. The goal is evidence to make a confident go/no-go decision.

[Optional one-paragraph summary of what changed in this release, so the agent can scope its review to the diff that matters.]

## Scope

Ten sections below. Each has explicit acceptance. Run end to end. Stop on the first SEVERE finding and escalate before continuing. Three whack-a-mole cycles maximum on any single failing check before escalating. Report back with the structured format at the bottom.

Sequential execution only. Do not run test suites in parallel if they share state, do not run the agent in two terminal contexts.

## Section 1: Static analysis

Tasks:
- Run typecheck across all packages. Report any errors.
- Run linter. Report errors as blockers, warnings as informational.
- Run formatter check. Report files needing reformatting (do not auto-format unless [AUTO_FORMAT_OK] is true).
- Run production build. Capture build artifact sizes.
- Compare build size against previous release. Flag if growth exceeds [SIZE_GROWTH_THRESHOLD, e.g. 15%].

Acceptance:
- Typecheck clean across all packages
- Linter has zero errors
- Build succeeds
- Build size growth within threshold or growth is explained

## Section 2: Test suite

Tasks:
- Run unit tests. Report pass/fail counts and any failures with full output.
- Run integration tests if the suite exists. Same reporting.
- Run end-to-end tests if the suite exists. Same reporting.
- Note coverage percentage if tooling reports it. Compare against last known coverage.

Acceptance:
- All tests pass
- Zero coverage regression (or regression explained by removed dead code)
- No tests skipped without a documented reason

If tests fail and the failure is in code unrelated to this release, do not "fix" by skipping the test. Report the failure and stop.

## Section 3: Security review

Tasks:
- Grep the codebase for hardcoded secrets. Patterns to check: API keys (`sk_`, `pk_`, `AKIA`, `AIza`), private keys (`BEGIN PRIVATE`, `BEGIN RSA`), passwords assigned in source (`password\s*=\s*"`), tokens longer than 32 hex chars, AWS access keys, GitHub tokens (`ghp_`, `github_pat_`).
- Verify every protected API endpoint returns 401 to unauthenticated requests. Use curl with no credentials, capture status codes for each route.
- Verify CORS configuration. No wildcard origins on credentialed endpoints.
- Run dependency audit (`npm audit`, `pnpm audit`, equivalent). Report CRITICAL and HIGH vulnerabilities. Patch if patch is available and non-breaking.
- Confirm all secrets are loaded from environment variables, not source. Specifically check the `lib/config` or equivalent files.
- Check that error responses do not leak stack traces, internal paths, or schema details to clients in production builds.

Acceptance:
- Zero hardcoded secrets found
- All protected endpoints return 401 unauthenticated
- No CRITICAL dependency vulnerabilities (HIGH must be triaged, patched if trivial)
- All sensitive config in env vars
- Production error responses are sanitized

## Section 4: Functional walkthrough

Manually walk the critical user paths. For [APP_NAME], these are:

1. [CRITICAL_PATH_1, e.g. "User signs up, completes onboarding, lands on dashboard"]
2. [CRITICAL_PATH_2]
3. [CRITICAL_PATH_3]
4. [CRITICAL_PATH_4]
5. [CRITICAL_PATH_5]

For each path:
- Walk it cleanly in the live preview
- Verify expected outputs appear at each step
- Verify edge cases handled visibly: empty state, error state, loading state, slow network
- Capture a screenshot of the final state for the build report

Acceptance:
- All listed paths pass
- All edge cases for each path handled with visible UI feedback, not silent failures

## Section 5: Cross-platform and responsive (if applicable)

Tasks:
- Test the critical paths in Chrome, Safari, and Firefox (latest stable).
- Test at viewports: [LIST_VIEWPORTS, e.g. "1920px, 1280px, 768px, 375px"].
- Test keyboard navigation through the primary navigation and one form.
- Run basic screen reader pass (VoiceOver on Mac or NVDA on Windows) on the landing surface and primary navigation.

Acceptance:
- All critical paths work in all three browsers
- Layout holds at all listed viewports
- Keyboard navigation reaches all interactive elements
- Screen reader announces page changes and form labels

If [APP_NAME] is API-only or backend-only, skip this section and note it in the report.

## Section 6: Performance check (if applicable)

Tasks:
- Measure initial page load time (DOMContentLoaded + LargestContentfulPaint).
- Measure response time on the [PRIMARY_API_ENDPOINT] under typical load.
- Profile memory usage during a typical session, look for leaks across [N] interactions.
- Run the load test suite if one exists.

Acceptance:
- LCP under [LCP_THRESHOLD, e.g. "2.5s"] on a typical page
- API response p95 under [P95_THRESHOLD]
- No memory leak (RSS stable across repeated interactions)

If [APP_NAME] has no public-facing performance contract, skip this section and note it.

## Section 7: Documentation

Tasks:
- README is current with setup instructions. Walk a fresh-clone setup mentally; flag any step the README skips.
- CHANGELOG includes an entry for [VERSION] with the user-facing changes summarized.
- API docs (if applicable) reflect current endpoint signatures.
- Build report or release notes file is updated for this release.

Acceptance:
- README setup works for a new contributor
- CHANGELOG has the [VERSION] entry
- API docs match implementation
- Release notes exist and are accurate

## Section 8: Observability

Tasks:
- Verify error tracking is configured and capturing errors in production builds (Sentry, Rollbar, custom, whatever applies).
- Verify logs are structured (JSON or equivalent), not freeform print statements.
- Health check endpoint returns 200 with a non-trivial body confirming key dependencies (DB, external APIs) are reachable.
- Verify any business-critical metrics are being tracked (signups, errors per request, p95 latency).

Acceptance:
- Error tracking captures a deliberately-induced error in staging
- Logs are queryable in structured form
- Health check returns 200 with dependency status
- Business metrics flow to the dashboard

## Section 9: Database and infrastructure (if applicable)

Tasks:
- Migrations have been tested locally and in staging
- Rollback path is documented; test the rollback in staging
- Indexes exist on hot query paths
- Backup is configured and the most recent backup is recent (within [BACKUP_RECENCY_WINDOW])

Acceptance:
- Migrations apply cleanly forward and roll back cleanly
- Query performance on hot paths is within acceptable range
- Backup verified recent and restorable

## Section 10: Architect / code review

Run the architect (or equivalent automated code reviewer) across the diff since [PREVIOUS_VERSION]. Categorize findings:

- SEVERE: blocks release, must fix
- HIGH: should fix before release, escalate if cannot
- MODERATE: log for next release cycle
- LOW: note only, no action

Acceptance:
- Architect verdict PASS or better
- Zero SEVERE findings
- HIGH findings either fixed or escalated with explanation

## Final acceptance

All ten sections complete. Architect verdict PASS or better with zero SEVERE findings. Build clean. Tests pass. Walkthroughs all PASS.

If all hit, report back: "Release verification complete for [APP_NAME] [VERSION]. Ready to ship."

If any failed after three whack-a-mole cycles: "Release verification stalled at Section N. Issue: [description]. Recommended fix: [option A or B]. Awaiting decision."

## Report format expected

Write the report to `docs/release-verification-[VERSION].md` and also output the contents in the chat reply.

```markdown
# Release verification: [APP_NAME] [VERSION]

Date: [ISO date]
Reviewer: [agent identifier or human]
Previous release: [PREVIOUS_VERSION]

## Section 1: Static analysis
- Typecheck: [PASS / FAIL with details]
- Lint: [N errors, M warnings]
- Build: [PASS / FAIL, artifact sizes]
- Size delta vs [PREVIOUS_VERSION]: [+X% / -X%]

## Section 2: Tests
- Unit: [N/M passed]
- Integration: [N/M passed]
- E2E: [N/M passed]
- Coverage: [X% (delta: ±Y pp)]

## Section 3: Security
- Hardcoded secrets: [0 / N found - details]
- Auth gates: [N/M endpoints verified]
- CORS: [PASS / details]
- Dependency audit: [N critical, M high]
- Env vars: [clean / N issues]

## Section 4: Functional walkthrough
- [Path 1]: PASS / FAIL
- [Path 2]: PASS / FAIL
- [...]

## Section 5: Cross-platform
- Chrome: [PASS / details]
- Safari: [PASS / details]
- Firefox: [PASS / details]
- Viewports tested: [list]
- Keyboard nav: [PASS / FAIL]
- Screen reader: [PASS / FAIL]

## Section 6: Performance
- LCP: [Xs]
- API p95: [Xms]
- Memory: [stable / leak detected]

## Section 7: Documentation
- README: [current / outdated]
- CHANGELOG: [updated / missing]
- API docs: [current / outdated]
- Release notes: [written / missing]

## Section 8: Observability
- Error tracking: [PASS / FAIL]
- Structured logs: [PASS / FAIL]
- Health check: [PASS / FAIL]
- Business metrics: [PASS / FAIL]

## Section 9: Database
- Migrations: [PASS / FAIL]
- Rollback tested: [PASS / FAIL]
- Indexes: [verified / missing on path X]
- Backup: [verified / overdue]

## Section 10: Architect
- Verdict: [PASS / FAIL]
- Severe: [N - list]
- High: [N - list]
- Moderate: [N - list]
- Low: [N - list]

## Verdict
[Ready to ship / Stalled at Section N with issue X]

## Outstanding
[Anything requiring human judgment before publish]

## Notes
[Anything else worth flagging]
```

## Out of scope

Do not:
- Add new features
- Refactor code unless required to fix a SEVERE or HIGH finding
- Update dependencies unless required to patch a CRITICAL vulnerability
- Change architectural patterns
- Touch code unrelated to findings
- Run the agent in two contexts simultaneously
- Skip sections marked "if applicable" without noting the skip and the reason in the report

## Decisions pre-resolved (do not re-ask)

- SEVERE findings block release. HIGH findings block release. MODERATE log for next cycle. LOW note only.
- Three whack-a-mole cycles maximum on any failing check before escalating.
- Sequential test execution only.
- If a check fails and the failure is in code unrelated to this release, report and escalate. Do not silently work around.
- All env-controlled credentials must use the deployment platform's secrets manager, never source.
- The build report is the publish artifact. Human confirms publish based on the report.
- If three different unrelated findings surface in one section, that is the systemic-issue signal: escalate before continuing.

Hit the acceptance bar. Write the report. Wait for human confirmation before any release action.

---

## How to use this template

1. Copy the section from `# Final release verification` through `Wait for human confirmation before any release action`.
2. Replace every bracketed placeholder with the values for your app.
3. Delete any sections marked "(if applicable)" that do not apply, and note the deletion in the Context section.
4. Add domain-specific sections at the end if your app needs them (e.g. compliance, GDPR, accessibility audit).
5. Paste into Replit, run, wait for the report.
6. Read the report end to end before publish. The agent's job is to surface evidence. The release decision is human.

## Patterns this template embeds

- **Pre-resolved decisions** so the agent does not re-ask.
- **Explicit acceptance per section** so the agent knows when a section is done.
- **Whack-a-mole caps** so failure modes do not loop forever.
- **Out of scope section** so the agent does not scope-creep into refactors.
- **Sequential execution** so race conditions in tests do not corrupt the verdict.
- **Structured report format** so the human can scan in 60 seconds.
- **Honest verdict language** with explicit "stalled" handling rather than implicit "pass with caveats."
- **Severity categorization** so triage is clear at the report level.

These patterns came from shipping a multi-phase build with high stakes. They work because they remove ambiguity from the agent's side and add evidence to the human's side. Use them as defaults; adjust thresholds per app.
