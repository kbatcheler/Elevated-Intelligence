# Portal codebase map — Phase 0 inventory

_Generated for the v2 build brief. Documents the actual current state of the codebase, with each Phase 1–6 item from the brief marked **DONE / PARTIAL / OPEN / DECISION**._

---

## 1. Intelligence layer pages

All 13 layers + the `talent-hr` entry are present in `artifacts/portal/src/data/layers.ts`. Each is a single `LayerData` record consumed by the shared `Layer.tsx` renderer.

| Key | Title | Group | Pipeline $ | Sources | Confidence |
|---|---|---|---|---|---|
| `business-performance` | Business performance | Executive | $2.4M | 14 | 87 |
| `finance` | Finance | Executive | $1.7M | 11 | 91 |
| `demand-intelligence` | Demand intelligence | Market-facing | $1.8M | 11 | 84 |
| `competitive-intelligence` | Competitive intelligence | Market-facing | $2.9M | 9 | 79 |
| `customer-intelligence` | Customer intelligence | Market-facing | $1.6M | 10 | 82 |
| `brand-social` | Brand and social | Market-facing | $1.2M | 8 | 76 |
| `supply-chain` | Supply chain | Operational | $2.2M | 12 | 89 |
| `pricing-margin` | Pricing and margin | Operational | $2.6M | 13 | 91 |
| `sales-pipeline` | Sales pipeline | Operational | $2.2M | 7 | 73 |
| `marketing-performance` | Marketing performance | Operational | $1.4M | 9 | 74 |
| `people-operations` | People and operations | Operational | $1.1M | 8 | 78 |
| `contract-management` | Contract management | Operational | (TBC) | (TBC) | (TBC) |
| `receivables` | Receivables and invoicing | Operational | $1.3M | 7 | 84 |
| `talent-hr` | Talent and HR | Operational | (TBC) | 9 | 79 |

**Layer data shape (single source of truth, layers.ts):**
- `metrics: Metric[]` (4 hero tiles per layer; `{label,value,sub,tone}`)
- `narrative`, `causes[]`, `chartTitle`, `chart`, `actions[]`, `actionsRecoveryUsd`
- `gaps: Gap[]` with `{category, title, detail}` — **does not yet carry `confidenceLiftPp` or `solution` per brief 1.3**
- `gapsPipelineUsd` (string), `counterArgs[]`

## 2. Shared layer renderer

`artifacts/portal/src/components/Layer.tsx` (322 lines) renders the canonical §1 / §2 / §3 / §4 page structure for every layer. Scorecard binding is direct (`m.value` rendered via `AnimatedNumber`) — no zero values can appear unless the underlying data has them. Heroes/Extras (`heroes/`, `extras/`) provide per-layer rich visuals; both are gated to the default Mercer profile (lines 228–231).

§4 footer composition: `PipelineDetail` → `DataFeedsCard` → `gapsCard`.

## 3. Data fixtures (`src/data/`)

| File | Purpose |
|---|---|
| `layers.ts` | All 13 layers' narrative + metrics + gaps + charts |
| `deficiencies.ts` | Detailed per-layer gap inventory used by `PipelineDetail` |
| `pipelineDeep.ts` | Per-layer source-data drill-downs |
| `feeds.ts` | Data feeds per layer (`status, cadence, lastSync, pipelineUsd`) |
| `architecture.ts` | 5-stage reasoning chain; tokens 4218+3104+2876+1942+1208 = **13,348**, latency 612+488+521+384+217 = **2,222ms** (reconciles ✓) |
| `narrator.ts` | Per-layer narrator panel content (summary, cross-insights, next steps) |
| `companies.ts` | Tenant profiles + multi-tenant swap dictionary |
| `warroom.ts` | Scenario lever definitions and `computeImpact` |
| `signals.ts` | Ticker stream + ANOMALIES inbox content |
| `nextSteps.ts` | Per-layer time-horizon cards |
| `trackRecord.ts` | Historical predicted-vs-delivered outcomes |
| `committedSeed.ts` | 12 pre-seeded Mercer committed actions |
| `chatBrain.ts` | Scripted Q&A for `ChatAssistant` |
| `timetravel.ts` | Diagnostic snapshots for the rewind control |

## 4. Top app shell

| Component | File | Wired? |
|---|---|---|
| Tenant pill | `CompanyPicker.tsx` | ✓ working dropdown, switches profile, persists |
| Top tabs | `App.tsx` L171–190 → `MorningBrief.tsx` (256L), `BoardPack.tsx` (362L), `IntelligenceBrief.tsx` (976L) | ✓ all three fully implemented, no stubs |
| System stats banner | `SystemHeartbeat.tsx` | ✓ computes live/stale/partial/missing from FEEDS dynamically |
| Anomaly inbox | `AnomalyInbox.tsx` reads `ANOMALIES` from `useNarrative()` | ✓ populated for default profile |
| Ask Different Day | `ChatAssistant.tsx` (350+ lines) | ✓ scripted Q&A wired via `chatBrain.ts` |
| Challenge button | `ChallengeModal.tsx` opens from each Layer header | ✓ working |
| Narrator panel | `narrator/Narrator.tsx` | ✓ right-rail per-layer |
| LENS dropdown | `App.tsx` references but currently shows "ALL" | ⚠ not wired to filter |
| SWITCH button | `App.tsx` L191 — opens CompanyPicker | ✓ working, but label is ambiguous |

## 5. System pages

| Page | Component | State |
|---|---|---|
| Intelligence architecture | `architecture/Architecture.tsx` | ✓ token + latency math reconciles |
| Engagement pipeline | `pipeline/EngagementPipeline.tsx` | ✓ computes from LAYERS+FEEDS, sorts, ship-plan card |
| Cross-layer map | `dependency/DependencyGraph.tsx` | ✓ working |
| Scenario war-room | `scenario/WarRoom.tsx` | ✓ presets + 6 sliders + bridge + historical anchors |
| Committed actions | `components/CommittedTray.tsx` | ✓ KPI strip + ribbon + horizon groups (seeded with 12) |
| Outcome track record | `components/TrackRecord.tsx` | ✓ quarterly trend + lessons banked + filters |

## 6. Multi-tenant infrastructure

`CompanyContext.tsx` is a fully-built swap layer:
- `useNarrative()` exposes `LAYERS, FEEDS, PEERS, EVIDENCE, ANOMALIES, ACTIVITY_STREAM, ...` re-shaped per active profile.
- For non-default profiles, `LAYERS/FEEDS` are auto-translated via a vocab swap dictionary; sensitive arrays (`PEERS, EVIDENCE, ANOMALIES`) are zeroed out so we never display wrong-brand copy.
- `DEFAULT_PROFILE_ID = MERCER.id` — Mercer (mid-market specialty hardware) is the default landing tenant. Apple-shape numbers are **not** in the codebase; the data is already mid-market scaled ($127M revenue, $42M cash, etc.).

---

## Brief → reality gap (Phase-by-phase audit)

### Phase 1 — Critical commercial bugs

| Item | Brief assumption | Actual state | Verdict |
|---|---|---|---|
| 1.1 Engagement Pipeline empty ($0.0M, 0 opportunities, 3 sprint windows at $0) | Brief says all zeros | `EngagementPipeline.tsx` computes total/gap-count/feed-count dynamically from LAYERS+FEEDS, renders 60+ rows, ShipPlan sequences top 12 into 3 windows. Predicted Q4 lift is **hardcoded "+9pp"** with no hover math. | **DONE except hover math (minor open)** |
| 1.2 Scorecard tiles show zeros | Brief says 0, $0.0B, 0%, 0 on most layers | `rg "value: \"0|value: \"\$0"` finds **zero hits** in layers.ts. All 13 layers carry real values. | **DONE** |
| 1.3 Architectural gaps footer is just a dollar number | Brief wants per-gap pp lift + named DiffDay solution | `gapsCard` in Layer.tsx already renders **named gaps with category, title, detail, route-to-pipeline action**. **Missing: `confidenceLiftPp` and `solution` fields per gap.** | **OPEN — extend Gap type + populate ~65 entries** |
| 1.4 Data feeds footer "0 sources, 0 live" | Brief says zeros + dangling em dash | `DataFeedsCard` already renders `{feeds.length} sources · {live} live · {issues.length} need work · Different Day pipeline ${pipeline}M`. No zeros. No dangling separator. | **DONE** |

### Phase 2 — Functional bugs

| Item | Brief assumption | Actual state | Verdict |
|---|---|---|---|
| 2.1 Top tabs non-functional | Identical className, no action | All 3 fully wired to large standalone components (MorningBrief/BoardPack/IntelligenceBrief); IntelligenceBrief alone is 976 lines | **DONE** |
| 2.2 Intervention simulator zero'd out | All sliders default 0, modelled impact $0 | `WhatIfLevers.tsx` has real defaults + live updates. **But only mounted on `pricing-margin` and `demand-intelligence`** (Layer.tsx L67). Brief wants it on all 8 operational layers. | **OPEN — extend WhatIfLevers to 6 more layers** |
| 2.3 System stats banner zeros | Brief says all zeros | `SystemHeartbeat` reads FEEDS dynamically, shows non-zero counts | **DONE** |
| 2.4 Anomaly inbox 0 today | Brief says 0 | `ANOMALIES` populated for default profile; inbox renders severity-bucketed list with deep links | **DONE** |

### Phase 3 — Demo tenant variants

- Brief assumes the default tenant is **Apple** ($99B revenue) and asks for a **second** tenant named "Meridian Industrial" at ~$180M.
- Reality: default tenant is already **Mercer** at $127M (mid-market specialty hardware). Multi-tenant infrastructure exists and the CompanyPicker switches between several profiles already. Apple is not in the current codebase.

**Verdict: DECISION REQUIRED.** Either (a) the brief is satisfied by treating Mercer as "the mid-market tenant" (which it already is), or (b) you literally want a third named "Meridian Industrial" profile added alongside Mercer. These are different products of work.

### Phase 4 — Strategic UX

| Item | Verdict |
|---|---|
| 4.1 "Powered by [Module]" callouts on every operational layer + clickable side panel with capability/contract value | **OPEN — new architecture** (module catalogue + slide-out panel). ~8 modules × layer mapping. |
| 4.2 Promote Intelligence Architecture: hero entry on Morning brief + first-visit animated overlay + bottom CTA | **OPEN** |
| 4.3 Confidence + gap dual signal on each layer header + Cross-layer map summary "close N gaps to reach Y%" | **OPEN** — depends on 1.3 (per-gap pp lift data) |
| 4.4 Narrator persona "Analyst's take" one-liner above §1 on every layer | **OPEN** — needs 13 takes + tenant-specific analyst |

### Phase 5 — Sections not yet audited

| Item | Verdict |
|---|---|
| 5.1 Scenario war-room | **DONE** (rebuilt + tested last session) |
| 5.2 Committed actions | **DONE** (rebuilt + tested last session) |
| 5.3 Outcome track record | **DONE** (rebuilt + tested last session) |
| 5.4 SWITCH button purpose | **PARTIAL** — currently opens CompanyPicker; brief wants perspective modes (Operator/Investor/Board). Decision required. |
| 5.4 LENS dropdown filtering | **OPEN** — currently shows "ALL" with no behaviour |
| 5.4 Challenge dialog | `ChallengeModal.tsx` exists, opens from layer header. **Audit only.** |
| 5.4 Ask Different Day chat | `ChatAssistant.tsx` with `chatBrain.ts` scripted responses already exists. **Audit only.** |

### Phase 6 — Polish

| Item | Verdict |
|---|---|
| Em dash sweep | **OPEN** — em dashes (`—`) appear in 20+ source files; copy needs rewriting per brief's hard rule |
| OG image / meta / favicon | Recent checkpoint: "Update website's social media sharing image" already shipped an OG image. Meta description + favicon **need verification**. |
| Mobile viewport (375px) | **OPEN — audit required**; portal is currently desktop-optimised (1200px max-width canvas, sidebar always visible) |
| Build report at `/docs/build-report.md` | **OPEN — terminal deliverable** |

---

## Honest summary

**The brief was written against an earlier snapshot.** Most of Phase 1, all of Phase 2 (except 2.2), all of Phase 5.1–5.3, and the architectural premise of Phase 3 are already addressed. The brief's most valuable remaining asks are:

1. **Phase 1.3** — extend the Gap data model with `confidenceLiftPp` + named `solution` (this is the data foundation for Phase 4.3 too)
2. **Phase 2.2** — bring WhatIfLevers to the 6 operational layers that don't have it
3. **Phase 4.1** — "Powered by [Module]" callouts + side panel (new architecture)
4. **Phase 4.3** — confidence/gap dual signal on every header + Cross-layer summary
5. **Phase 4.4** — Analyst's take above §1 on every layer
6. **Phase 5.4** — LENS dropdown behaviour + SWITCH semantics decision
7. **Phase 6** — em dash sweep + mobile audit + build report

Two product decisions are required before proceeding:

- **Tenant question (Phase 3):** Is Mercer the mid-market tenant the brief calls "Meridian Industrial"? Or do you want a third profile added literally named that?
- **SWITCH semantics (Phase 5.4):** Keep as company switcher, or refactor to Operator/Investor/Board perspective modes (and find a new home for company switching)?
