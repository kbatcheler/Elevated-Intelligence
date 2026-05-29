# Functional test master prompt

A reusable template for functional verification of a web app. Different from the release verification template (which covers everything from typecheck to security audit). This template focuses narrowly on functional behaviour: does the app do what a user expects it to do, across the happy path, the edges, the errors, and the auth boundaries.

Fill the bracketed placeholders. Paste into Replit. The agent walks every critical path through a test matrix and reports back with structured evidence.

---

# Functional verification: [APP_NAME]

## Context

App: [APP_NAME] at [BASE_URL]
Last change set: [optional, e.g. "Phase 3 UI surfacing"]
Test credentials: [optional, e.g. "admin / D1ffD4y"]
Test data state: [optional, e.g. "three seeded tenants"]

[Optional one-paragraph summary of what the agent should focus on if there are recent changes worth weighting in the testing.]

## Scope

This brief is functional verification only. Not security, not performance, not code quality. Just: does the app do what a user expects, end to end, across the matrix of test types per path.

Three phases. Run end to end. Each phase has acceptance. Stop only on a hard blocker or three consecutive failures of the same type (the systemic-issue signal).

## Phase 1: Critical path identification

Before testing, the agent identifies the critical user paths in the app. A critical path is a sequence of user actions that delivers core value. If the path is broken, the app is broken.

For [APP_NAME], identify between 5 and 10 critical paths. Each path should:
- Start at a clear entry point (login, landing page, deep link)
- End at a clear value-delivering state (data displayed, action completed, content created)
- Pass through at least one piece of business logic (not just navigation)

Examples of critical paths for different app types:
- For a SaaS dashboard: sign in, create a record, view the record, edit the record, delete the record
- For a marketplace: search a product, view product detail, add to cart, checkout, view order confirmation
- For an admin panel: sign in, list users, filter by role, change a user's permissions, audit log entry visible
- For a content platform: read article, share article, save to library, view library, remove from library

[OPTIONAL: list paths if you already know them. If you do, the agent skips identification and uses your list.]

[CRITICAL_PATH_1]
[CRITICAL_PATH_2]
[CRITICAL_PATH_3]
[CRITICAL_PATH_4]
[CRITICAL_PATH_5]

Output: write the path list to `docs/functional-test-paths.md` with one numbered section per path, each describing: the entry point, the steps, the success state. Stop after Phase 1 and confirm the path list with the human before continuing.

If paths were pre-listed in the brief, skip the stop-and-confirm step and proceed.

## Phase 2: Test matrix per path

For each critical path identified in Phase 1, run the following five test types in order. Move to the next path only when all five tests on the current path are recorded (passed or failed).

### Test type 1: Happy path

Walk the path as an average user would. No edge cases, no funny business. Each step should:
- Produce the expected next screen, state, or output
- Render any data correctly (no broken images, no `[object Object]`, no "undefined")
- Complete within a reasonable time (no spinner stuck >10s, no silent freeze)
- Confirm success at the end with a clear positive signal (success message, new state visible, redirect to expected page)

Record: PASS or FAIL, with the specific step that failed if applicable.

### Test type 2: Boundary conditions

Walk the same path but exercise the boundaries:
- Empty inputs where input is optional (verify graceful handling, not crashes)
- Maximum-length inputs in text fields (test the schema's max via the UI)
- Zero, one, and many records where lists are displayed
- Long text content that should wrap or truncate
- Very large numbers, very small numbers, negative numbers where applicable
- Special characters in text inputs (apostrophe, quote, ampersand, emoji, RTL languages)

Record: PASS or FAIL per boundary. Note any boundary that produces an unhelpful error message or a visual break.

### Test type 3: Error handling

Deliberately try to break the path:
- Submit forms with invalid data and confirm validation messages appear inline
- Submit forms with missing required fields and confirm clear "required" indicators
- Navigate to a URL that should not exist (deep link to a deleted record) and confirm a sensible 404 or "not found" state
- Simulate a network failure mid-path (devtools throttling to offline) and confirm the user gets a clear "connection lost" feedback, not a silent hang
- Click rapidly to test double-submit protection
- Refresh the page mid-flow and confirm the user lands in a coherent state (either resumed or clearly restarted)

Record: per error scenario, PASS if the app handles gracefully with clear user feedback, FAIL if the user sees a stack trace, a crash, an undefined state, or silence.

### Test type 4: Authorization variants

Walk the path under different auth states:
- Unauthenticated: confirm protected routes redirect to login or show appropriate gates
- Authenticated as the wrong role (if multi-role): confirm permission errors appear gracefully
- Authenticated as the right role: confirm the path works
- Session expired mid-path: confirm the user is re-prompted to log in cleanly

If [APP_NAME] is single-role or has no auth, note this and skip role variants. Still test the session-expired case if applicable.

Record: per auth state, PASS or FAIL.

### Test type 5: Persistence and state

Verify the path's state survives the user's expected interactions:
- After completing the path, refresh the page. Does the resulting state persist?
- Use the browser back button after each step. Does the app handle it cleanly?
- Open the path's final URL in a new tab while logged in. Does it load correctly?
- Log out and log back in. Does the state created by the path persist?
- If applicable: open the app in two browser tabs, perform a write in one, confirm the other reflects the change after refresh.

Record: per persistence scenario, PASS or FAIL.

## Phase 3: Cross-path integration

After all paths are tested in isolation, test the integrations between them. Identify 3 to 5 workflows that span multiple paths and walk each.

Example integrations:
- User creates a record (Path 1), then edits it (Path 2), then shares it (Path 3). Does the data flow correctly across?
- User signs up (Path A), receives a notification (Path B), responds to the notification (Path C). Does the chain complete?
- Admin sets a config (Path X), user encounters that config in their flow (Path Y). Does the config take effect?

For each integration:
- Walk the full sequence
- Confirm data flows correctly between paths
- Confirm no state is lost in transitions
- Confirm any side effects (emails, notifications, audit logs) fire as expected

Record: per integration, PASS or FAIL with notes.

## Acceptance

Acceptance has three parts:

1. **Path coverage**: every critical path has all 5 test types recorded.
2. **Pass rate**: every Happy Path test passes. Every Authorization test passes. The other three test types (Boundary, Error, Persistence) have at least 80% pass rate per path; any failures are categorized as MAJOR (visible to user, affects core value) or MINOR (edge case, workaround exists).
3. **Integration**: every cross-path workflow passes end to end.

If all three hit, report: "Functional verification complete for [APP_NAME]. Ready for [release / demo / handoff]."

If any failed: "Functional verification stalled. N critical paths have failures: [list]. Recommended fixes: [list]."

## Report format expected

Write the report to `docs/functional-verification-[ISO_DATE].md` and also output in chat.

```markdown
# Functional verification: [APP_NAME]

Date: [ISO date]
Tester: [agent or human]
Paths tested: [N]
Integrations tested: [M]

## Critical paths

### Path 1: [name]
- Entry: [where it starts]
- Success state: [where it ends]
- Happy path: PASS / FAIL [details]
- Boundary: PASS (N/M scenarios) [notes]
- Error handling: PASS (N/M scenarios) [notes]
- Authorization: PASS (N/M states tested) [notes]
- Persistence: PASS (N/M scenarios) [notes]

### Path 2: [name]
[same shape]

[...]

## Cross-path integration

### Integration 1: [description]
- Result: PASS / FAIL
- Notes: [data flow observations]

[...]

## Findings

### Major (visible to user, affects core value)
- [Path X, Test type Y, specific issue]
- [...]

### Minor (edge case, workaround exists)
- [Path X, Test type Y, specific issue]
- [...]

## Verdict
[Ready / Stalled]

## Outstanding
[Anything requiring human decision]
```

## Out of scope

Do not:
- Test for security vulnerabilities (separate brief)
- Test for performance under load (separate brief)
- Test code quality or run linters (release verification brief covers this)
- Refactor any code, even to fix a finding (functional verification reports, does not fix)
- Add new features
- Create new test data unless explicitly needed to walk a path
- Touch the database directly
- Skip a test type because "it should work". The point is to verify, not to assume

## Decisions pre-resolved (do not re-ask)

- Path identification stops for human confirmation; everything else runs without stopping unless three consecutive same-type failures occur.
- Major findings are visible to the user and affect core value delivery. Minor findings are edge cases with workarounds.
- Failures are reported, not fixed. The fix is a separate work item.
- Sequential testing: one path at a time, one test type at a time. No parallel test runs in shared state.
- If a path appears to work but the success state cannot be verified (no clear positive signal), record as FAIL with note "no positive confirmation visible to user."
- Network throttling for the network failure error case uses devtools "Offline" or 3G, not actual disconnection.
- Browser back button behaviour: returning to a step that no longer applies (record was deleted, etc.) should show a sensible state, not a crash. If unclear, record as MINOR.

Hit the acceptance bar. Write the report. Wait for human review of the findings before any code changes.

---

## How to use this template

1. Copy the section from `# Functional verification` through `Wait for human review`.
2. Fill the bracketed placeholders.
3. If you already know the critical paths, list them in Phase 1. Otherwise, leave the path list empty and the agent identifies them and stops for confirmation.
4. Paste into Replit, run, wait for the report.
5. Review the findings. Major findings become work items. Minor findings get logged. The verdict tells you if you can ship.

## When to use this template vs the release verification one

Use this when:
- You want to verify user-facing functionality specifically
- Changes are large enough that a quick smoke test is not enough
- The release is approaching but not imminent
- You want a structured catalogue of what works and what does not

Use the release verification template when:
- You are about to publish a release
- You want full coverage (typecheck, tests, security, docs, etc.) not just functional
- The architect review is part of the gate

Both templates can be run together for a major release. Run functional verification first to surface user-facing issues, fix them, then run release verification to confirm everything else is publish-ready.

## Patterns this template embeds

- **Path-by-path traversal** matches how an agent (and a human) actually use an app, makes the test matrix tractable.
- **Five test types per path** ensures consistent coverage; no path slips through with only happy path tested.
- **MAJOR / MINOR categorization** makes triage explicit and prevents "everything is critical" panic.
- **Pre-resolved decisions** keep the agent moving without clarifying questions.
- **Phase 1 stop point** only if paths are not pre-listed; otherwise the agent runs without interruption.
- **Sequential execution** prevents test contamination from shared state.
- **Honest verdict language** with "stalled" handling rather than vague "needs more work."
- **Structured report format** that's scannable in 60 seconds and actionable.

Adjust the matrix per app: if your app has no auth, drop test type 4. If your app has no persistent state, drop test type 5. If your app has neither, you probably do not need this template.
