import "server-only";

import { and, inArray, isNotNull, lte, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

/**
 * Publicly visible content (mirrors the RLS `isLive` policy): published/scheduled with
 * published_at reached. Uses SQL now() so cached results stay correct until revalidated;
 * scheduled posts appear on the next revalidation (cacheLife 'hours').
 */
export function isLiveSql(status: AnyPgColumn, publishedAt: AnyPgColumn): SQL {
  return and(
    inArray(status, ["published", "scheduled"]),
    isNotNull(publishedAt),
    lte(publishedAt, sql`now()`),
  )!;
}
