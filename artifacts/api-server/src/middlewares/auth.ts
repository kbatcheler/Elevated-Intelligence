import crypto from "node:crypto";
import type { Request, Response, NextFunction, RequestHandler } from "express";

// Phase 1: in-memory session store. Phase 4 will move this to Redis/DB.
// Sessions only live for the lifetime of the api-server process; restarting
// the server kicks everyone out, which is fine for the dev/staging hard-coded
// admin gate.
const validSessions = new Set<string>();

export const SESSION_COOKIE = "ei_session";

// 32 random bytes (256 bits) -> URL-safe base64. Unguessable for Phase 1.
export function createSession(): string {
  const token = crypto.randomBytes(32).toString("base64url");
  validSessions.add(token);
  return token;
}

export function revokeSession(token: string | undefined): void {
  if (token) validSessions.delete(token);
}

export function hasSession(token: string | undefined): boolean {
  return typeof token === "string" && validSessions.has(token);
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
