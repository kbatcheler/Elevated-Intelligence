// Pipeline dispatcher. Selects Phase 1 (single-pass Claude) or Phase 2
// (Perceive→Hypothesise→Challenge→Narrate→Score with Gemini confounder)
// based on the USE_PHASE2_PIPELINE env flag. Default is Phase 2.

import { db, tenantsTable, tenantPipelineRunsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger as rootLogger } from "../logger";
import { initialPhase1Stages, runPhase1Pipeline } from "./phase1";
import { initialPhase2Stages, runPhase2Pipeline } from "./phase2";
import { failRun } from "./runner-helpers";

function usePhase2(): boolean {
  // Default ON. Set USE_PHASE2_PIPELINE=false to fall back to Phase 1.
  return process.env.USE_PHASE2_PIPELINE !== "false";
}

/**
 * Start a pipeline run for the given tenant. Returns the new run id and kicks
 * off background work. Caller does not await the work; the run status is
 * tracked via tenant_pipeline_runs + tenants.status.
 */
export async function startPipeline(tenantId: string): Promise<string> {
  const phase2 = usePhase2();
  const log = rootLogger.child({ tenantId, phase: phase2 ? "phase2" : "phase1" });
  const initialStages = phase2 ? initialPhase2Stages() : initialPhase1Stages();
  const [inserted] = await db
    .insert(tenantPipelineRunsTable)
    .values({ tenantId, status: "running", stages: initialStages })
    .returning({ id: tenantPipelineRunsTable.id });
  if (!inserted) throw new Error("Failed to insert pipeline run row");
  const runId = inserted.id;
  await db.update(tenantsTable).set({ status: "seeding" }).where(eq(tenantsTable.id, tenantId));
  log.info({ runId }, "Pipeline run created, dispatching");
  // Fire-and-forget. Each phase swallows its own errors and writes them to
  // the runs row.
  const runner = phase2 ? runPhase2Pipeline : runPhase1Pipeline;
  void runner(tenantId, runId).catch(async (e) => {
    // Defense-in-depth: each phase already wraps its own body and calls
    // failRun on throw (architect finding #1). This catch is a last-resort
    // safety net so a thrown failRun (eg DB unavailable) still surfaces the
    // run as failed instead of leaving it stuck in `running`.
    const reason = e instanceof Error ? `${e.message}\n${e.stack ?? ""}` : String(e);
    log.error({ err: reason, runId }, "Pipeline runner threw unexpectedly");
    try {
      await failRun(runId, tenantId, `Dispatcher caught throw: ${reason}`);
    } catch (failErr) {
      log.error({ err: failErr instanceof Error ? failErr.message : String(failErr) }, "Dispatcher failRun also threw");
    }
  });
  return runId;
}
