import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import companiesRouter from "./companies";
import companyIdentifyRouter from "./companyIdentify";
import intelligenceRouter from "./intelligence";
import tenantsRouter from "./tenants";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Unguarded routes (must be mounted BEFORE requireAuth so the gate doesn't
// see them). Health is for the proxy/liveness probe; all /auth/* endpoints
// must be reachable without a session because the LoginGate calls
// /auth/status on every mount to decide whether to show the login card.
router.use(healthRouter);
router.use(authRouter);

// Phase 1 session gate. Every router mounted after this line requires a
// valid ei_session cookie.
router.use(requireAuth);

router.use(tenantsRouter);
router.use(companiesRouter);
router.use(companyIdentifyRouter);
router.use(intelligenceRouter);

export default router;
