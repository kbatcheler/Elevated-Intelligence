# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

- **No em-dashes in user-facing prose or data.** Replace ` — ` with a comma or full stop (`, ` or `. `). Inside double-quoted strings, prefer the middot `·` as a separator. This applies to `artifacts/portal/src/data/**/*.ts`, narrator copy, hero panels, and any prose component. Source-code comments may keep em-dashes.

## Gotchas

- The portal renders the canonical Meridian Industrial diagnosis for every tenant; non-default profiles get a "Preview mode" banner in `App.tsx` (`PreviewModeBanner`). Do not silently hide hero/extras/track-record panels per tenant, name the preview state instead.
- `data/layers.ts` invariant: for each layer, the **pill** `actionsRecoveryUsd` summarises the `actions[]` impacts (recovery), NOT the `causes[]` impacts (gap size). Audits that diff pill vs causes will look wrong; that is by design.
- Every layer header reads `sources: FEEDS[layer.key].length` (DK-3). When you author a new feed for a layer, bump the count in `data/layers.ts`.
- Generation prompts (`api-server/src/lib/pipeline/prompts.ts`, `phase2-prompts.ts`) must NOT contain specific example figures (a literal bps value, margin %, etc.). The model copies/anchors to them, so every seeded tenant ends up with near-identical numbers (this caused a recurring "380bps" across all reports). Use format-only placeholders (`-NNNbps`, `-N%`) plus a compute-from-other-fields instruction instead.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
