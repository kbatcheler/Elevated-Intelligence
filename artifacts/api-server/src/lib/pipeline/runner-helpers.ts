// Shared pipeline helpers used by both Phase 1 and Phase 2 implementations.
// Extracted into its own file to break the runner.ts -> phase{1,2}.ts cycle.

import { eq } from "drizzle-orm";
import {
  db,
  tenantsTable,
  tenantPipelineRunsTable,
  type PipelineStage,
} from "@workspace/db";

// Per-run write-serialization queue. The `stages` jsonb column is updated via
// read-modify-write from up to LAYER_CONCURRENCY parallel layer workers (plus
// the top-level orchestrator). Without serialization, concurrent RMW would be
// last-write-wins and lose sub-stage progress for layers running in parallel.
// Architect finding #2 (2026-05-26): mutate all stages-jsonb writes through
// this queue.
const runWriteQueues = new Map<string, Promise<unknown>>();

export function serializeRunWrite<T>(runId: string, fn: () => Promise<T>): Promise<T> {
  const prev = runWriteQueues.get(runId) ?? Promise.resolve();
  const next = prev.then(fn, fn);
  runWriteQueues.set(runId, next);
  // Cleanup must not introduce an unhandled rejection if `next` rejects.
  // `.then(c, c)` settles regardless and the trailing `.catch(noop)` makes
  // the cleanup chain itself a no-throw promise.
  const cleanup = () => {
    if (runWriteQueues.get(runId) === next) runWriteQueues.delete(runId);
  };
  void next.then(cleanup, cleanup).catch(() => undefined);
  return next;
}

// Read-modify-write helper for the stages jsonb. Serialized per-run via
// serializeRunWrite so concurrent layer workers cannot lose each other's
// sub-stage progress.
export async function updateStage(
  runId: string,
  name: string,
  patch: Partial<PipelineStage>,
): Promise<void> {
  await serializeRunWrite(runId, async () => {
    const rows = await db
      .select({ stages: tenantPipelineRunsTable.stages })
      .from(tenantPipelineRunsTable)
      .where(eq(tenantPipelineRunsTable.id, runId))
      .limit(1);
    const current = rows[0]?.stages ?? [];
    const next: PipelineStage[] = current.map((s) =>
      s.name === name ? { ...s, ...patch } : s,
    );
    await db
      .update(tenantPipelineRunsTable)
      .set({ stages: next })
      .where(eq(tenantPipelineRunsTable.id, runId));
  });
}

export async function markRunning(runId: string, name: string): Promise<number> {
  const startedAt = Date.now();
  await updateStage(runId, name, { status: "running", startedAt: new Date(startedAt).toISOString() });
  return startedAt;
}

export async function markComplete(
  runId: string,
  name: string,
  startedAt: number,
  extra?: Partial<PipelineStage>,
): Promise<void> {
  const now = Date.now();
  await updateStage(runId, name, {
    status: "complete",
    completedAt: new Date(now).toISOString(),
    durationMs: now - startedAt,
    ...extra,
  });
}

export async function markFailed(
  runId: string,
  name: string,
  startedAt: number,
  reason: string,
): Promise<void> {
  const now = Date.now();
  await updateStage(runId, name, {
    status: "failed",
    completedAt: new Date(now).toISOString(),
    durationMs: now - startedAt,
    error: reason.slice(0, 800),
  });
}

export async function failRun(runId: string, tenantId: string, errorText: string): Promise<void> {
  const now = new Date();
  await db
    .update(tenantPipelineRunsTable)
    .set({ status: "failed", completedAt: now, errorText: errorText.slice(0, 2000) })
    .where(eq(tenantPipelineRunsTable.id, runId));
  await db
    .update(tenantsTable)
    .set({ status: "failed" })
    .where(eq(tenantsTable.id, tenantId));
}
