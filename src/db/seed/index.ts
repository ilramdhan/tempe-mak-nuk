import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type * as schema from "../schema";

export type SeedDb = PostgresJsDatabase<typeof schema>;

/** Seed runner. Real seed data lands in P3.5; must stay idempotent (upserts). */
export async function runSeed(db: SeedDb): Promise<void> {
  void db;
  console.log("[seed] nothing to seed yet (P3.5).");
}
