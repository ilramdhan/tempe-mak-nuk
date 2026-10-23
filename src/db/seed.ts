/**
 * CLI entry: `pnpm db:seed`. Runs outside Next.js (tsx), so it builds its own
 * connection instead of importing `./client` (which is `server-only`).
 * Uses DIRECT_URL when available (session connection), else DATABASE_URL.
 */
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
import { assertSeedTarget } from "./seed-guard";
import { runSeed } from "./seed/index";

config({ path: [".env.local", ".env"], quiet: true });

async function main() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("Set DIRECT_URL or DATABASE_URL to run the seed.");

  assertSeedTarget(url, process.env);

  const sql = postgres(url, { prepare: false, max: 1 });
  try {
    await runSeed(drizzle(sql, { schema }));
    console.log("[seed] done.");
  } finally {
    await sql.end();
  }
}

main().catch((err: unknown) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
