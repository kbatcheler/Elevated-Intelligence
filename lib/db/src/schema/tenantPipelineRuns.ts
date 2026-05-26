import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tenantsTable } from "./tenants";

export const pipelineRunStatusEnum = pgEnum("pipeline_run_status", [
  "running",
  "complete",
  "failed",
  "partial",
]);

export type PipelineStageStatus = "pending" | "running" | "complete" | "failed";

export type PipelineStage = {
  name: string;
  status: PipelineStageStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  error?: string;
  // Optional per-stage progress payload, e.g. { current: 3, total: 14 } for layers.
  progress?: { current: number; total: number };
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
