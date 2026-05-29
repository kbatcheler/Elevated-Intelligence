// Shared pipeline helpers used by both Phase 1 and Phase 2 implementations.
// Extracted into its own file to break the runner.ts -> phase{1,2}.ts cycle.

import { eq } from "drizzle-orm";
import {
  db,
  tenantsTable,
  tenantPipelineRunsTable,
  type PipelineStage,
  type LayerStageEntry,
  type PipelineSubStage,
} from "@workspace/db";

// When a run dies (failRun, or the boot reconciler), any stage still marked
// "running" is a lie: nothing is in flight any more. Without sealing it, the
// boot splash keeps showing e.g. "Layers · in flight · 0/14" next to the
// failure controls, which reads as a frozen overlay. This rewrites every
// non-terminal stage so the UI reflects the dead run: "running" stages (and
// their in-flight layer/sub-stage rows) become "failed"; "pending" stages are
// left as-is because they legitimately never started.
export function sealRunningStages(
  stages: PipelineStage[],
  errorText: string,
): PipelineStage[] {
  const note = errorText.slice(0, 800);
  const sealSub = (sub: PipelineSubStage): PipelineSubStage =>
    sub.status === "running" ? { ...sub, status: "failed", error: sub.error ?? note } : sub;
  const sealLayer = (ls: LayerStageEntry): LayerStageEntry =>
    ls.status === "running"
      ? { ...ls, status: "failed", error: ls.error ?? note, subStages: ls.subStages.map(sealSub) }
      : { ...ls, subStages: ls.subStages.map(sealSub) };
  return stages.map((s) => {
    const layerStages = s.layerStages ? s.layerStages.map(sealLayer) : s.layerStages;
    if (s.status === "running") {
      return { ...s, status: "failed", error: s.error ?? note, layerStages };
    }
    return layerStages === s.layerStages ? s : { ...s, layerStages };
  });
}

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
      .select({ stages: tenantPipelineRunsTable.stages, status: tenantPipelineRunsTable.status })
      .from(tenantPipelineRunsTable)
      .where(eq(tenantPipelineRunsTable.id, runId))
      .limit(1);
    // Once a run has left "running" (e.g. sealed by failRun or the boot
    // reconciler), a straggling worker must not mutate stages back to a
    // non-terminal state and resurrect the stale "in flight" splash.
    if (!rows[0] || rows[0].status !== "running") return;
    const current = rows[0].stages ?? [];
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
  // Seal the stages in the same serialized write queue so we don't race a
  // concurrent layer-worker sub-stage flush back to "running".
  await serializeRunWrite(runId, async () => {
    const rows = await db
      .select({ stages: tenantPipelineRunsTable.stages })
      .from(tenantPipelineRunsTable)
      .where(eq(tenantPipelineRunsTable.id, runId))
      .limit(1);
    const sealed = sealRunningStages(rows[0]?.stages ?? [], errorText);
    await db
      .update(tenantPipelineRunsTable)
      .set({ status: "failed", completedAt: now, errorText: errorText.slice(0, 2000), stages: sealed })
      .where(eq(tenantPipelineRunsTable.id, runId));
  });
  await db
    .update(tenantsTable)
    .set({ status: "failed" })
    .where(eq(tenantsTable.id, tenantId));
}
