import crypto from "node:crypto";
import type { Request, Response, NextFunction, RequestHandler } from "express";

// Stateless signed-cookie session.
//
// Why not an in-memory Set? Sessions used to live in `validSessions` on this
// module, which meant every api-server restart (dev rebuild, deployment,
// crash) wiped every authenticated user and broke any in-flight client poll
// with a 401 — most painfully during the multi-minute tenant seeding job.
// Signed tokens carry their own proof of authenticity in the cookie value,
// so the server can verify them after any restart without persisting state.
//
// Trade-off: a pure stateless token cannot be revoked server-side. For the
// admin gate this is acceptable: tokens expire after TOKEN_TTL_MS, and
// /auth/logout still clears the cookie on the client. If we ever need
// server-side revocation we can layer a small DB-backed deny-list on top.

export const SESSION_COOKIE = "ei_session";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days, matches login cookie maxAge

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error("SESSION_SECRET is missing or too short; refusing to sign sessions");
  }
  return s;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSession(): string {
  const payload = Buffer.from(JSON.stringify({ iat: Date.now() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function revokeSession(_token: string | undefined): void {
  // Stateless tokens cannot be revoked server-side. The /auth/logout route
  // clears the cookie on the client, which is sufficient for the admin gate.
}

export function hasSession(token: string | undefined): boolean {
  if (typeof token !== "string" || token.length === 0) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0 || dot === token.length - 1) return false;

  const payload = token.slice(0, dot);
  const provided = token.slice(dot + 1);
  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return false;
  }

  // Constant-time signature comparison
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;

  // Expiry check
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { iat?: unknown };
    if (typeof decoded.iat !== "number") return false;
    if (Date.now() - decoded.iat > TOKEN_TTL_MS) return false;
  } catch {
    return false;
  }

  return true;
}

export const requireAuth: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  const token = cookies?.[SESSION_COOKIE];
  if (!hasSession(token)) {
    res.status(401).json({ error: "not_authenticated" });
    return;
  }
  next();
};
