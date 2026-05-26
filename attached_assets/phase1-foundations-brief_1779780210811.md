# Phase 1: Foundations brief

Scope: replace hardcoded tenant content with a server-backed, multi-tenant database. Add a simple login gate. Stand up a basic per-tenant content pipeline (Claude-only, single-pass, ~3 minutes per seed). Remove Meridian Industrial, Guitar Center, and Sweetgreen permanently. Ship a working empty-library state and a seeding flow that produces functional content for any new tenant.

This is Phase 1 of four. Phase 2 will replace the single-pass pipeline with the five-stage Perceive → Hypothesise → Challenge (Gemini) → Narrate → Score pipeline. Phase 3 will surface the verified-vs-modelled split in the UI. Phase 4 will add operational tooling.

Five sub-phases below. Each has acceptance criteria. Run end to end. Typecheck must pass between sub-phases. If a sub-phase fails its acceptance, fix it before moving to the next.

## Architectural decisions, pre-resolved (do not re-ask)

- Single Postgres database. Existing Drizzle setup at `lib/db`.
- Tenants are global. Every authenticated user sees the same library. No row-level isolation.
- Auth is a simple session-cookie gate. Hardcoded credentials: username `admin`, password `D1ffD4y`. No Replit auth, no third-party SSO.
- Phase 1 pipeline is Claude-only single-pass. Gemini confounder lands in Phase 2. Do not add Gemini in Phase 1.
- Content generated in Phase 1 populates the `modelled_claims` track only. The `verified_claims` track ships empty for Phase 1 tenants and populates in Phase 2.
- No rate limiting. No cost gating.
- Boot splash on first connection always shows pipeline progress with a countdown timer when seeding.

## Sub-phase 1.1: Database schema

Add new tables via a Drizzle migration in `lib/db`. Name the migration file `00XX_phase1_tenants.sql` (number per the existing migration sequence).

### Tables

```typescript
// tenants: one row per company in the library
tenants {
  id: uuid primary key default uuidGenerate()
  name: text not null
  url: text not null
  sector: text
  hq_city: text
  hq_state: text
  revenue_band: text
  ownership: text
  founded: integer
  tagline: text
  status: enum('seeding', 'ready', 'failed', 'stale') not null default 'seeding'
  created_at: timestamp not null default now()
  updated_at: timestamp not null default now()
  created_by: text not null default 'admin'
  // last successful pipeline completion
  last_seeded_at: timestamp
  // when content should be considered stale (90 days from last_seeded_at)
  stale_after: timestamp
}

// tenant_profile: the company headline data (revenue, margin, NPS, etc)
// Separate row to keep tenants table small for list queries.
tenant_profile {
  tenant_id: uuid primary key references tenants(id) on delete cascade
  profile: jsonb not null  // CompanyProfile-shaped: headlines, logoMonogram, vocab, etc
  updated_at: timestamp not null default now()
}

// tenant_layers: one row per (tenant, layer) pair
tenant_layers {
  id: uuid primary key default uuidGenerate()
  tenant_id: uuid not null references tenants(id) on delete cascade
  layer_key: text not null  // 'business-performance', 'demand-intelligence', etc
  // the layer narrative bundle: narrative, causes, actions, hypotheses, proof, gaps
  content: jsonb not null
  // verified claims with source URLs. Phase 1 ships empty array, Phase 2 populates.
  verified_claims: jsonb not null default '[]'
  // modelled claims with confidence bands. Phase 1 populates this.
  modelled_claims: jsonb not null default '[]'
  generated_at: timestamp not null default now()
  generator_model: text not null
  // unique constraint: one row per (tenant, layer)
  unique(tenant_id, layer_key)
}

// tenant_artifacts: cross-layer map data, narrator content, scenarios, etc
// Each kind is one row per tenant.
tenant_artifacts {
  id: uuid primary key default uuidGenerate()
  tenant_id: uuid not null references tenants(id) on delete cascade
  kind: text not null  // 'morning_brief', 'board_pack', 'cross_layer_map', 'narrator', 'scenarios'
  content: jsonb not null
  generated_at: timestamp not null default now()
  unique(tenant_id, kind)
}

// tenant_pipeline_runs: audit log of every seed/refresh attempt
tenant_pipeline_runs {
  id: uuid primary key default uuidGenerate()
  tenant_id: uuid not null references tenants(id) on delete cascade
  status: enum('running', 'complete', 'failed', 'partial') not null
  // each stage: { name, status, started_at, completed_at, duration_ms, error }
  stages: jsonb not null default '[]'
  started_at: timestamp not null default now()
  completed_at: timestamp
  error_text: text
}
```

### Acceptance for 1.1

1. Migration runs cleanly in dev and creates all five tables.
2. Drizzle types generated and exported from `lib/db`.
3. Existing migrations are not modified.
4. `pnpm --filter @workspace/db run typecheck` passes.

## Sub-phase 1.2: Login gate

A simple session-cookie auth gate sits in front of every API endpoint and the frontend root route.

### Backend (`artifacts/api-server/src/routes`)

Add `auth.ts`:

- `POST /api/auth/login`: body `{username, password}`. If username equals `admin` and password equals `D1ffD4y` (constants, not env vars for Phase 1; we'll move to env in Phase 4), sign a session token (use `crypto.randomBytes(32)` and an in-memory `Set<string>` of valid sessions for Phase 1; Phase 4 moves to Redis or DB), set as HttpOnly cookie `ei_session`, return `{ok: true}`. Otherwise return 401 with `{ok: false, reason: 'invalid_credentials'}`.
- `POST /api/auth/logout`: clears the cookie and removes the session from the valid set. Returns `{ok: true}`.
- `GET /api/auth/status`: returns `{authenticated: boolean}` based on cookie presence and validity.

Add middleware `requireAuth` in `middlewares/auth.ts`:

- Checks the `ei_session` cookie against the valid session set.
- On miss: returns 401 with `{error: 'not_authenticated'}`.
- On hit: calls `next()`.

Apply `requireAuth` to every route in `routes/index.ts` EXCEPT `/api/auth/login` and `/api/health`.

### Frontend (`artifacts/portal/src`)

Add `components/LoginGate.tsx`:

- On mount, calls `GET /api/auth/status`. While loading, renders nothing (blank screen, prevents content flash).
- If authenticated, renders children.
- If not authenticated, renders a centered login card on dark navy background:
  - Headline (serif 28): "Elevated Intelligence"
  - Subhead (italic, slate light): "Different Day internal access"
  - Two text inputs (username, password) and a "Sign in" button.
  - On submit, POSTs to `/api/auth/login`. On 401, shows "Wrong username or password" beneath the form. On success, re-fetches `/api/auth/status` and reveals the app.
- Add a small "Sign out" link in the top header (next to the existing user display), POSTs to `/api/auth/logout` and reloads.

Wrap `<App />` in `<LoginGate>` at the entry point in `main.tsx`.

### Acceptance for 1.2

1. Hitting the URL with no session shows the login card. No app content is visible.
2. Logging in with admin / D1ffD4y reveals the app.
3. Logging in with wrong creds shows the error message and does not authenticate.
4. Sign out returns the user to the login card.
5. API calls without a session return 401 (verify with curl or browser devtools).
6. The session persists across page reloads.

## Sub-phase 1.3: Tenant CRUD API + basic Phase 1 pipeline

The API exposes tenant lifecycle operations. The pipeline is a single-pass Claude generator that produces functional content for all 14 layers plus artifacts.

### Backend routes (`routes/tenants.ts`)

All routes behind `requireAuth`.

- `GET /api/tenants`: returns `[{id, name, url, sector, status, last_seeded_at, stale_after}]` for all tenants. No layer content. Used by the picker.

- `GET /api/tenants/:id`: returns the full tenant: tenant row + profile + all layer rows + all artifact rows. Used by CompanyContext when a tenant is selected.

- `POST /api/tenants`: body `{name, url}`. Creates a tenant row with `status='seeding'`, returns `{id}` immediately, kicks off the pipeline asynchronously. The pipeline writes to `tenant_pipeline_runs` as it progresses and updates `tenants.status` on completion.

- `GET /api/tenants/:id/status`: returns the latest `tenant_pipeline_runs` row for this tenant. Used by the boot splash to render progress.

- `DELETE /api/tenants/:id`: deletes the tenant row. Cascade removes profile, layers, artifacts, pipeline runs.

- `POST /api/tenants/:id/refresh`: kicks off the pipeline again for an existing tenant, marking the existing layers as stale and overwriting them on completion.

### The Phase 1 pipeline (`lib/pipeline/phase1.ts`)

Single-pass Claude generator. The output is a structured JSON document validated against a schema before writing to the DB.

Pipeline stages (write to `tenant_pipeline_runs.stages` as they progress):

1. **`ground`**: Fetch the company homepage (reuse `lib/homepageContext.ts`). Capture: domain, bytes fetched, status, extracted text (first 8000 chars). Estimated duration: 2 to 5 seconds.

2. **`profile`**: Call Claude (`claude-sonnet-4-6`) with the homepage context plus the seed input. System prompt asks Claude to produce a structured CompanyProfile JSON: name, url, sector, hq_city, revenue_band estimate, ownership, founded, tagline, logoMonogram (1 or 2 chars from name), vocab map (named competitors, suppliers, regions appearing on their site). Validate against the CompanyProfile schema. Save to `tenant_profile`. Estimated duration: 20 to 40 seconds.

3. **`layers`**: One Claude call per layer, run in parallel (Promise.all). System prompt for each layer includes: the profile from step 2, the layer's schema (key, name, structural expectations), and instructions to populate the modelled track. Output schema per layer:
   ```typescript
   {
     narrative: string,            // §1 executive narrative paragraph
     headline_finding: string,     // one-line top finding
     headline_impact: string,      // dollar/percentage impact statement
     headline_lever: string,       // fastest reversible lever
     causes: [{ title, impact, detail, confidence }],   // ranked root causes
     actions: [{ title, detail, impact, timing, owner }],  // prescribed actions
     hypotheses: [{ statement, supportingSignals, alternativeExplanation, confidence }],
     proof: { items: [{ source, observation }] },
     gaps: [{ kind: 'DATA'|'SIGNAL'|'INTEG'|'MODEL'|'FLOW', description, closes }],
     metrics: [{ label, value, sub, tone: 'good'|'warn'|'bad'|'neutral' }],
     confidence: number,           // 0-100
     confidence_gap: number,       // pp lift available from closing gaps
   }
   ```
   The instruction to Claude is: "Generate plausible, sector-appropriate content for this layer. Treat all claims as modelled hypotheses based on public signals. Never refuse a layer for lack of data, produce the richest content you can, with confidence appropriately tuned downward when uncertain. Reference the company's actual sector, competitors, and entities (from the profile vocab) wherever possible. Use realistic dollar magnitudes based on the company's revenue band."
   Estimated duration: 60 to 90 seconds total (parallel).

4. **`artifacts`**: One Claude call to produce the cross-tenant artifacts (morning_brief, board_pack, cross_layer_map, narrator content, scenarios). Output schema per artifact follows existing data shapes in `artifacts/portal/src/data/`. Estimated duration: 30 to 45 seconds.

5. **`commit`**: Write all rows to DB in a transaction. Update `tenants.status = 'ready'`, set `last_seeded_at` and `stale_after = now() + 90 days`. Update `tenant_pipeline_runs.status = 'complete'`. Estimated duration: < 1 second.

Total pipeline target: 2 to 4 minutes per tenant in Phase 1. Phase 2 will lengthen this to 15 to 20 minutes when the five-stage pipeline lands.

### Validation

Each Claude output passes through Zod validation before commit. A validation failure on any layer or artifact:
- Logs the failure to `tenant_pipeline_runs.stages[i].error`
- Retries the Claude call once
- If still fails, marks that layer's `tenant_pipeline_runs.status = 'partial'`, writes a fallback content stub for the failed layer (so the UI doesn't break), and continues to the next stages.

The pipeline does not fully fail unless the `ground` or `profile` stages fail.

### Acceptance for 1.3

1. `POST /api/tenants` with `{name: "Test Co", url: "https://stripe.com"}` returns `{id}` within 1 second.
2. `GET /api/tenants/:id/status` returns progress updates as the pipeline runs.
3. After 2 to 4 minutes, the tenant's status becomes `ready` and 14 layer rows plus 5 artifact rows exist in the DB.
4. `GET /api/tenants/:id` returns the full tenant document with realistic, sector-appropriate content (not Meridian text with names swapped).
5. `DELETE /api/tenants/:id` removes the tenant and all its cascaded rows.
6. `POST /api/tenants/:id/refresh` re-runs the pipeline and overwrites existing rows.

## Sub-phase 1.4: Frontend migration

Move the CompanyContext from localStorage to server-backed. Remove all hardcoded narrative. Add the empty-library state and the seeding boot splash.

### Remove hardcoded profiles

In `artifacts/portal/src/data/companies.ts`:
- Delete the `MERIDIAN`, `GUITAR_CENTER`, `SWEETGREEN` const exports entirely. Delete their data.
- Delete the `LIBRARY` constant.
- Delete `DEFAULT_PROFILE_ID`.
- Keep the type definitions (`CompanyProfile`, `CompanyHeadlines`, `CompanyFinding`, etc).
- Keep `makeResolver` and `deepResolveWith` but they may become unused in Phase 1 (the LLM produces directly-renderable content now, no token swapping needed). Leave them in for Phase 2 use; mark as `@deprecated for Phase 1, may be removed in Phase 4`.

In `artifacts/portal/src/data/layers.ts`:
- Convert from a content file to a SCHEMA file. Keep the 14 layer keys, names, descriptions, section headers, chart axis configs, structural metadata.
- Delete all per-layer narrative, causes, actions, hypotheses, proof, gaps. That content now lives in `tenant_layers.content` per tenant.
- Export `LAYER_KEYS: string[]` and `LAYER_SCHEMA: Record<string, { name, description, chartAxisLabels, sectionHeaders }>` for consumption.

In other `data/*.ts` files (`feeds.ts`, `narrator.ts`, `nextSteps.ts`, `peers.ts`, `signals.ts`, `timetravel.ts`, `trackRecord.ts`, `warroom.ts`, `pipelineDeep.ts`, `committedSeed.ts`, `deficiencies.ts`, `chatBrain.ts`, `appLibrary.ts`, `architecture.ts`, `presenterTracks.ts`, `scenarios.ts`):
- Audit each. If the content is structural (system architecture descriptions, persona configs, presenter track copy that's product-meta not tenant-specific), KEEP IT.
- If the content is per-tenant narrative (e.g., specific Meridian numbers, Bunnings references), DELETE it. Replace with a thin loader that reads from the active tenant's artifacts.

### CompanyContext rewrite

`artifacts/portal/src/context/CompanyContext.tsx`:
- Replace the localStorage-based library with a React Query (or equivalent) hook that fetches `GET /api/tenants`.
- Active tenant is selected from the list. Store the active tenant ID in localStorage (`ei.activeTenantId`) so it persists across reloads, but the tenant DATA always comes from the server.
- Add a `useTenantDetail(id)` hook that fetches `GET /api/tenants/:id` when a tenant becomes active. Provides the full tenant profile, layers, and artifacts to consumers.
- `addTenant({name, url})` calls `POST /api/tenants`, returns the new id, sets it as active, kicks off the boot splash with pipeline progress.
- `removeTenant(id)` calls `DELETE /api/tenants/:id`, invalidates the query cache, snaps to first remaining tenant or to empty state.
- `refreshTenant(id)` calls `POST /api/tenants/:id/refresh`, opens the boot splash with progress.

### Empty library state

`artifacts/portal/src/components/EmptyLibrary.tsx`:
- When `library.length === 0`, this component fills the canvas.
- Dark navy background. Centered.
- Eyebrow: "ELEVATED INTELLIGENCE"
- Headline (serif 36): "No tenants yet."
- Subhead (italic serif 18, gold soft): "Seed a company to see what Different Day diagnoses for them. Three minutes per seed. The library is shared across the team."
- Primary CTA (gold button): "Seed a company". Opens the CompanyPicker in "add new" mode.
- The right narrator rail renders a brief placeholder: "No active tenant. Seed a company to begin."

### Boot splash with progress timer

`artifacts/portal/src/components/BootSplash.tsx` already exists for the library-switch case. Extend it to render the pipeline progress for new seeds and refreshes.

When a seed or refresh is in flight:
- Splash open.
- Headline: "Seeding [Tenant Name]"
- Sub-headline (italic): "Three minutes of prep so you walk in ready."
- A vertical list of pipeline stages: Ground → Profile → Layers (1 of 14, 2 of 14, ...) → Artifacts → Commit.
- Each stage has a status indicator (pending dot, in-progress spinner, complete check, failed cross).
- Below the stage list, a countdown timer: "Elapsed: 1:23 of approximately 3:00".
- Status polls `GET /api/tenants/:id/status` every 2 seconds.
- When status becomes `ready`, splash auto-dismisses after 1.5 seconds with a brief "Ready" confirmation, then reveals the tenant's Morning Brief page.
- When status becomes `failed`, splash shows the error and a "Retry" button that calls refresh.

### CompanyPicker updates

`artifacts/portal/src/components/CompanyPicker.tsx`:
- The list of tenants comes from `useLibrary()` (server-backed). Show loading skeleton while fetching.
- "Seed new" form takes `name` and `url`. Submits to `addTenant()`.
- Delete button on every tenant row (no exception for "seeded" since none exist now).
- Delete confirmation modal: "Delete [Tenant Name] from the library? This removes it for everyone on the team. Cannot be undone."
- Refresh button on every tenant row: triggers `refreshTenant()` with the boot splash.

### Layer.tsx and other consumers

Audit every page that reads from the old `LAYERS`, `FEEDS`, `NARRATOR`, etc imports. Replace with reads from the active tenant's layers and artifacts.

Common pattern:
```typescript
// Before
import { LAYERS } from "../data/layers";
const layer = LAYERS.find(l => l.key === layerKey);

// After
const { activeTenant } = useCompany();
const layer = activeTenant?.layers.find(l => l.layer_key === layerKey);
```

Loading and error states:
- While the tenant is loading, show a centered spinner with "Loading [Tenant Name]" text.
- If a specific layer is missing (pipeline produced fewer than 14 layers due to validation failures), show a card on that layer page: "This layer was not generated successfully. Refresh the tenant to retry."

### Acceptance for 1.4

1. With no tenants in the database, the app shows the EmptyLibrary state. No phantom Meridian content anywhere.
2. Seeding a new tenant via the picker opens the boot splash and shows live pipeline progress.
3. Once seeding completes, the user lands on the new tenant's Morning Brief with content that is sector-appropriate and references the actual company.
4. Switching between tenants works cleanly. No spillover.
5. Refresh on an existing tenant works.
6. Delete on a tenant works and snaps to the next tenant or to the empty state.
7. No references to `MERIDIAN`, `GUITAR_CENTER`, `SWEETGREEN`, or `LIBRARY` remain in the codebase. Verify with grep.
8. Typecheck passes clean.

## Sub-phase 1.5: Cleanup, screenshots, build report

### Cleanup

- Search for any remaining hardcoded tenant references in copy, comments, tests. Remove or generalise.
- Search for any usage of the deprecated `makeResolver` and `deepResolveWith`. Note in comments that they're inactive in Phase 1.
- Verify all 14 system pages render correctly on a freshly seeded tenant. Specifically check Cross-layer map, Engagement Pipeline, Intelligence Architecture, Sales Playbook, Scenario War-room, Committed Actions, Outcome Track Record. Each must read from `tenant_artifacts` and not from a hardcoded source.

### Test the full flow

Seed three tenants of different sectors to verify the pipeline produces genuinely different content for each. Suggested test tenants:
- `Stripe` (fintech, B2B SaaS)
- `Patagonia` (consumer goods, retail)
- `Twilio` (B2B SaaS, dev tools)

For each, verify:
- Morning Brief mentions actual sector context (e.g. Stripe's payment processing, Patagonia's outdoor apparel)
- Competitors named in `vocab` are real (e.g. Adyen for Stripe, REI for Patagonia)
- Dollar magnitudes match a realistic revenue band for that company
- All 14 layers render with sector-appropriate content

### Screenshots

Capture to `artifacts/portal/docs/screenshots/phase1/`:
- `01-login.jpg`: the login card
- `02-empty-library.jpg`: the empty state
- `03-seed-progress.jpg`: boot splash mid-pipeline
- `04-stripe-morning-brief.jpg`: a freshly seeded Stripe tenant's morning brief
- `05-stripe-pricing-layer.jpg`: the same tenant's pricing layer (verifies content depth)
- `06-three-tenants-picker.jpg`: the picker with three seeded tenants

### Build report

Write `docs/build-report-phase1.md` documenting:
- What changed (schema, API, frontend)
- What's deferred to Phase 2 (5-stage pipeline, Gemini confounder, verified track)
- Pipeline duration measured across the three test seeds
- Any layers or artifacts where the pipeline produced weaker content than others (note for Phase 2 prompt tuning)
- Confirmation of acceptance criteria for each sub-phase

### Acceptance for 1.5

1. Three distinct test tenants seeded successfully, each with sector-appropriate content.
2. All six screenshots captured.
3. Build report committed.
4. No grep hits for removed constants.
5. Full typecheck passes.
6. `pnpm run build` succeeds.

## Final acceptance for Phase 1

Run the following manual flow and confirm each step:

1. Open the app in an incognito window. Login card appears. Sign in with admin / D1ffD4y.
2. Empty library state appears. Click "Seed a company".
3. Enter name "Tesla", URL "https://tesla.com". Submit.
4. Boot splash opens. Pipeline runs through 5 stages. Timer counts up. Completes in 2 to 4 minutes.
5. Splash auto-dismisses. Tesla's Morning Brief appears. Content references electric vehicles, charging networks, named competitors (Rivian, Ford EV, etc), realistic revenue band for Tesla.
6. Click into Pricing and Margin layer. Content is Tesla-specific (Model 3/Y pricing strategy, gross margin trajectory, etc).
7. Click into Demand Intelligence layer. Content references EV demand signals, regional adoption, charging infrastructure.
8. Click the Cross-layer map. Nodes are present. Edges are present. Insights reference Tesla, not Meridian.
9. Open the picker. Tesla appears. Click "Seed new" and add a second tenant (say, "Shopify", "https://shopify.com"). Repeat seed flow. New tenant appears in picker.
10. Switch between Tesla and Shopify. Content swaps cleanly. No Tesla content visible on Shopify.
11. Delete Tesla. Confirm modal. Tesla disappears from picker. Snap to Shopify.
12. Delete Shopify. Library is empty. Empty state reappears.
13. Sign out. Login card returns.

If every step passes, Phase 1 is complete. Move to Phase 2.

## Out of scope (do not attempt in Phase 1)

- Gemini confounder integration
- Web search for fact verification beyond the homepage fetch
- Source URL pills in the UI
- The verified vs modelled visual split (UI level)
- Per-claim provenance tooltips
- Admin tooling beyond the basic delete/refresh
- User accounts beyond the single admin login
- Email notifications when seeds complete
- Real-time pipeline progress via WebSockets (polling is fine for Phase 1)

## Decisions pre-resolved (do not re-ask)

- Hardcoded credentials `admin` / `D1ffD4y` in source. We'll move to env vars in Phase 4.
- Single-pass Claude pipeline. The output JSON schema is fixed; the agent should not redesign it.
- 14 layer keys are the existing set. Do not add or remove layers in Phase 1.
- Content goes into `modelled_claims` only for Phase 1. `verified_claims` ships empty.
- No multi-user sessions. One shared admin login, multiple browsers can be logged in concurrently.
- Library is global. No per-user isolation.
- Delete is permanent. No soft-delete or trash bin in Phase 1.

Hit the acceptance bar. Then ping for Phase 2.
