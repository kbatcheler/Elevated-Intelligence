import type { Request, Response, NextFunction } from "express";

// Minimal in-memory token-bucket rate limiter, keyed by client IP.
// Designed to guard expensive LLM-proxy routes from cost-abuse without
// pulling in a new dependency. Suitable for single-process dev/demo
// deployments; for multi-instance prod, swap for a shared store.

interface Bucket { tokens: number; updatedAt: number }

interface Options {
  /** Sustained rate in requests per minute. */
  perMinute: number;
  /** Burst capacity. Defaults to `perMinute`. */
  burst?: number;
}

export function rateLimit({ perMinute, burst }: Options) {
  const cap = burst ?? perMinute;
  const refillPerMs = perMinute / 60_000;
  const buckets = new Map<string, Bucket>();

  // Periodically evict stale buckets so we don't leak memory under many IPs.
  const sweepMs = 10 * 60_000;
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) {
      if (now - b.updatedAt > sweepMs) buckets.delete(k);
    }
  }, sweepMs);
  if (typeof sweep.unref === "function") sweep.unref();

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const key = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    const existing = buckets.get(key);
    const bucket: Bucket = existing ?? { tokens: cap, updatedAt: now };
    // Refill based on elapsed time
    const elapsed = now - bucket.updatedAt;
    bucket.tokens = Math.min(cap, bucket.tokens + elapsed * refillPerMs);
    bucket.updatedAt = now;
    if (bucket.tokens < 1) {
      const retrySec = Math.ceil((1 - bucket.tokens) / refillPerMs / 1000);
      res.setHeader("Retry-After", String(retrySec));
      res.status(429).json({ error: `Too many requests — try again in ~${retrySec}s.` });
      return;
    }
    bucket.tokens -= 1;
    buckets.set(key, bucket);
    next();
  };
}
