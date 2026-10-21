/**
 * Tiny fixed-window in-memory rate limiter keyed by an opaque string (e.g. hashed IP).
 *
 * SERVERLESS CAVEAT: state lives in one function instance's memory. On Vercel each instance
 * has its own map and instances are recycled, so this is a best-effort abuse brake, not a
 * guarantee. For stricter limits use a shared store (Vercel KV / Upstash / a Postgres table).
 */
export type RateLimiter = (key: string, now?: number) => boolean;

export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = 10_000,
}: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}): RateLimiter {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (key, now = Date.now()) => {
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      if (hits.size >= maxKeys) {
        // Drop expired entries; if still full, drop the oldest insertion.
        for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);
        if (hits.size >= maxKeys)
          hits.delete(hits.keys().next().value as string);
      }
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= limit) return false;
    entry.count++;
    return true;
  };
}
