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

export async function reconcileStaleRuns(): Promise<void> {
  try {
    const orphaned = await db
      .update(tenantPipelineRunsTable)
      .set({
        status: "failed",
        completedAt: new Date(),
        errorText: "Run orphaned across server restart; marked failed by boot reconciler.",
      })
      .where(eq(tenantPipelineRunsTable.status, "running"))
      .returning({ id: tenantPipelineRunsTable.id, tenantId: tenantPipelineRunsTable.tenantId });

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
