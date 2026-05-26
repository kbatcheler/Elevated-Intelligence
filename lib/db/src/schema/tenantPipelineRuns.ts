import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const pipelineRunStatusEnum = pgEnum("pipeline_run_status", [
  "running",
  "complete",
  "failed",
  "partial",
]);

export type PipelineStageStatus = "pending" | "running" | "complete" | "failed" | "partial";

// Phase 2: each layer runs five sub-stages (Perceive, Hypothesise, Challenge,
// Narrate, Score). Tracked per-layer so the splash can show "Stripe :
// Pricing-margin : Challenge running" if we ever want that, and so the build
// report can render per-stage timing for every layer.
export type PipelineSubStageName =
  | "perceive"
  | "hypothesise"
  | "challenge"
  | "narrate"
  | "score";

export type PipelineSubStage = {
  name: PipelineSubStageName;
  status: PipelineStageStatus;
  durationMs?: number;
  error?: string;
};

export type LayerStageEntry = {
  layerKey: string;
  status: PipelineStageStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  subStages: PipelineSubStage[];
  error?: string;
};

export type PipelineStage = {
  name: string;
  status: PipelineStageStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  // Optional per-stage progress payload, e.g. { current: 3, total: 14 } for layers.
  progress?: { current: number; total: number };
  // Phase 2: present on the "layers" stage when the Phase 2 pipeline ran.
  // Each entry tracks the five sub-stages for that layer. Frontend Phase 1
  // splash code ignores this field; Phase 3 surfacing can render it.
  layerStages?: LayerStageEntry[];
  // Which Phase ran (used by the build report tooling).
  pipelinePhase?: "phase1" | "phase2";
};

export const tenantPipelineRunsTable = pgTable("tenant_pipeline_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenantsTable.id, { onDelete: "cascade" }),
  status: pipelineRunStatusEnum("status").notNull(),
  stages: jsonb("stages").notNull().$type<PipelineStage[]>().default([]),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  errorText: text("error_text"),
});

export type TenantPipelineRun = typeof tenantPipelineRunsTable.$inferSelect;
export type InsertTenantPipelineRun = typeof tenantPipelineRunsTable.$inferInsert;
