// Stale-run reconciler. Runs once at server boot to mark any orphaned
// `running` pipeline runs as `failed`, and any tenants stuck in `seeding`
// without an active run as `failed`. Addresses the third-line-of-defense
// case where both in-process failRun attempts lost (eg DB outage during
// catch, or process killed mid-run by a workflow restart).
//
// Safe to run unconditionally on startup because we hold a single-process
// invariant: no pipeline run can be in-flight at the moment the server boots.

import { and, eq, inArray } from "drizzle-orm";
import { db, tenantsTable, tenantPipelineRunsTable } from "@workspace/db";
import { logger } from "../logger";
import { sealRunningStages } from "./runner-helpers";

const ORPHAN_REASON = "Run orphaned across server restart; marked failed by boot reconciler.";

export async function reconcileStaleRuns(): Promise<void> {
  try {
    // Select first so we can seal each run's in-flight stages (so the splash
    // doesn't show "Layers · in flight" on a run that died at restart), then
    // mark each failed individually with its sealed stages.
    const running = await db
      .select({ id: tenantPipelineRunsTable.id, tenantId: tenantPipelineRunsTable.tenantId, stages: tenantPipelineRunsTable.stages })
      .from(tenantPipelineRunsTable)
      .where(eq(tenantPipelineRunsTable.status, "running"));

    const completedAt = new Date();
    for (const run of running) {
      await db
        .update(tenantPipelineRunsTable)
        .set({
          status: "failed",
          completedAt,
          errorText: ORPHAN_REASON,
          stages: sealRunningStages(run.stages ?? [], ORPHAN_REASON),
        })
        .where(eq(tenantPipelineRunsTable.id, run.id));
    }
    const orphaned = running;

    if (orphaned.length > 0) {
      const tenantIds = Array.from(new Set(orphaned.map((r) => r.tenantId)));
      await db
        .update(tenantsTable)
        .set({ status: "failed" })
        .where(and(eq(tenantsTable.status, "seeding"), inArray(tenantsTable.id, tenantIds)));
      logger.warn(
        { runs: orphaned.length, runIds: orphaned.map((r) => r.id) },
        "Boot reconciler marked orphaned pipeline runs failed",
      );
    } else {
      logger.info("Boot reconciler: no orphaned pipeline runs");
    }
  } catch (e) {
    logger.error(
      { err: e instanceof Error ? e.message : String(e) },
      "Boot reconciler failed; orphaned runs may remain",
    );
  }
}
