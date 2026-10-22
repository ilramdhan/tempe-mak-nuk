import "server-only";

import { cacheLife } from "next/cache";

import { getDb, type Database } from "@/db/client";

/**
 * Graceful-degradation wrapper for PUBLIC reads.
 *
 * When DATABASE_URL is missing (CI build with SKIP_ENV_VALIDATION) or the query fails,
 * `fallback` is returned and a warning is logged once per label, so `next build` and the
 * public site never crash on data access. Admin reads use getDb() directly and surface errors.
 */
const warned = new Set<string>();

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function warnOnce(label: string, message: string) {
  const key = label === "no-database" ? label : `${label}:${message}`;
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[data] ${label}: ${message} — using fallback.`);
}

/** Drizzle wraps driver errors as "Failed query: …"; the real reason lives in `cause`. */
export function describeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = error.cause;
  if (!cause) return error.message;
  const reason =
    cause instanceof Error
      ? [(cause as { code?: string }).code, cause.message]
          .filter(Boolean)
          .join(" ")
      : String(cause);
  return `${error.message.split("\n")[0]} — cause: ${reason}`;
}

export async function withDb<T>(
  label: string,
  fallback: T,
  run: (db: Database) => Promise<T>,
): Promise<{ data: T; degraded: boolean }> {
  if (!hasDatabase()) {
    warnOnce("no-database", "DATABASE_URL is not set");
    return { data: fallback, degraded: true };
  }
  try {
    return { data: await run(getDb()), degraded: false };
  } catch (error) {
    warnOnce(label, describeError(error));
    return { data: fallback, degraded: true };
  }
}

export type CacheProfile = "minutes" | "hours" | "days" | "weeks" | "max";

/**
 * Call INSIDE a "use cache" scope (after cacheTag). Runs the query and sets the cache
 * lifetime: `profile` on success, `minutes` (1h expiry) on fallback so a missing/unreachable
 * DB is retried soon instead of pinning empty data for days.
 */
export async function cachedRead<T>(
  label: string,
  profile: CacheProfile,
  fallback: T,
  run: (db: Database) => Promise<T>,
): Promise<T> {
  const { data, degraded } = await withDb(label, fallback, run);
  // Preset names are overloads; widen once here.
  (cacheLife as (profile: CacheProfile) => void)(
    degraded ? "minutes" : profile,
  );
  return data;
}
