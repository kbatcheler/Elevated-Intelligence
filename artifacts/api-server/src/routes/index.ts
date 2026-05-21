import { Router, type IRouter } from "express";
import healthRouter from "./health";
import companiesRouter from "./companies";
import companyIdentifyRouter from "./companyIdentify";
import intelligenceRouter from "./intelligence";

const router: IRouter = Router();

router.use(healthRouter);
router.use(companiesRouter);
router.use(companyIdentifyRouter);
router.use(intelligenceRouter);

export default router;
