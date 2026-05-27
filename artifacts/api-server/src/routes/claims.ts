// Phase 3.4 dead-link reporting endpoint. The portal calls this when a
// reader clicks "Report broken link" inside a VerifiedPill tooltip. The
// row is append-only and lightweight, an editorial signal for the
// pipeline team to revisit grounded sources that have gone stale.

import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { db, claimBrokenReportsTable } from "@workspace/db";
import { rateLimit } from "../middlewares/rateLimit";

const router: IRouter = Router();

// Cap any single client at 30 reports per minute. The affordance is
// one-click and the optimistic UI swallows the response, so a rogue tab
// could in theory POST in a tight loop without noticing failures.
const reportRateLimit = rateLimit({ perMinute: 30 });

const reportBrokenBody = z.object({
  tenantId: z.string().uuid().nullish(),
  layerKey: z.string().min(1).max(80),
  claimPath: z.string().min(1).max(200),
  sourceUrl: z.string().url().max(2000),
});

router.post("/claims/report-broken", reportRateLimit, async (req, res) => {
  const parsed = reportBrokenBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ issues: parsed.error.issues }, "report-broken: invalid body");
    res.status(400).json({ error: "invalid_body", detail: parsed.error.issues });
    return;
  }
  const { tenantId, layerKey, claimPath, sourceUrl } = parsed.data;
  const session = (req as unknown as { session?: { username?: string } }).session;
  const reportedBy = session?.username ?? "admin";

  const [row] = await db
    .insert(claimBrokenReportsTable)
    .values({ tenantId: tenantId ?? null, layerKey, claimPath, sourceUrl, reportedBy })
    .returning({ id: claimBrokenReportsTable.id });

  req.log.info({ id: row.id, layerKey, claimPath, tenantId }, "claim broken link reported");
  res.json({ ok: true, id: row.id });
});

export default router;
