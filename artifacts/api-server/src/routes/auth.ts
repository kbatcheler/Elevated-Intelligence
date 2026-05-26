import { Router, type IRouter } from "express";
import {
  SESSION_COOKIE,
  createSession,
  hasSession,
  revokeSession,
} from "../middlewares/auth";

// Phase 1: hardcoded credentials per the brief.
// Phase 4 will move these to env vars.
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "D1ffD4y";

const router: IRouter = Router();

router.post("/auth/login", (req, res) => {
  const body = (req.body ?? {}) as { username?: unknown; password?: unknown };
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    res.status(401).json({ ok: false, reason: "invalid_credentials" });
    return;
  }

  const token = createSession();
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // 7 days. Process restart invalidates sessions anyway (in-memory store).
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ ok: true });
});

router.post("/auth/logout", (req, res) => {
  const cookies = (req as typeof req & { cookies?: Record<string, string> }).cookies;
  const token = cookies?.[SESSION_COOKIE];
  revokeSession(token);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
});

router.get("/auth/status", (req, res) => {
  const cookies = (req as typeof req & { cookies?: Record<string, string> }).cookies;
  const token = cookies?.[SESSION_COOKIE];
  res.json({ authenticated: hasSession(token) });
});

export default router;
