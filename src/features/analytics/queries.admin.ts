import "server-only";

import { count, desc, gte, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { waClicks } from "@/db/schema";

/** Dashboard: WA clicks over the last `days` days — totals per kind, per source, per day (WIB). */
export async function getWaClickStats(days = 30) {
  const db = getDb();
  const since = sql`now() - make_interval(days => ${Math.min(Math.max(days, 1), 365)})`;
  const day = sql<string>`to_char(${waClicks.createdAt} at time zone 'Asia/Jakarta', 'YYYY-MM-DD')`;
  const [byKind, bySource, byDay] = await Promise.all([
    db.select({ kind: waClicks.kind, total: count() }).from(waClicks).where(gte(waClicks.createdAt, since)).groupBy(waClicks.kind),
    db
      .select({ source: waClicks.source, total: count() })
      .from(waClicks)
      .where(gte(waClicks.createdAt, since))
      .groupBy(waClicks.source)
      .orderBy(desc(count()))
      .limit(20),
    db.select({ day, total: count() }).from(waClicks).where(gte(waClicks.createdAt, since)).groupBy(day).orderBy(day),
  ]);
  return { total: byKind.reduce((s, r) => s + r.total, 0), byKind, bySource, byDay };
}
