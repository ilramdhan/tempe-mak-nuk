/**
 * Apply pending Drizzle migrations (drizzle/*.sql) with readable errors.
 *
 * `drizzle-kit migrate` connects via DIRECT_URL (db.<ref>.supabase.co:5432), which is IPv6-only and
 * blocked on some networks, and it fails silently ("exit code 1"). This runner uses DATABASE_URL
 * (pooler 6543, `prepare: false`) by default and prints the real error. Same journal table
 * (drizzle.__drizzle_migrations), so it is interchangeable with drizzle-kit.
 *
 * Usage: pnpm tsx --env-file=.env scripts/dev/migrate.mts [--direct] [--status]
 *   --direct  use DIRECT_URL instead of DATABASE_URL
 *   --status  only list which migrations in drizzle/meta/_journal.json are applied
 */
import { readFileSync } from "node:fs";

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const useDirect = process.argv.includes("--direct");
const statusOnly = process.argv.includes("--status");
const url = useDirect ? process.env.DIRECT_URL : process.env.DATABASE_URL;
if (!url)
  throw new Error(`${useDirect ? "DIRECT_URL" : "DATABASE_URL"} is not set`);

const host = new URL(url).host;
console.log(`Migrasi ke ${host} ...`);

const sql = postgres(url, {
  prepare: false,
  max: 1,
  connect_timeout: 15,
  onnotice: () => {},
});
try {
  if (statusOnly) {
    const journal = JSON.parse(
      readFileSync("drizzle/meta/_journal.json", "utf8"),
    ) as { entries: { tag: string; when: number }[] };
    const rows = await sql<
      { created_at: string }[]
    >`select created_at from drizzle.__drizzle_migrations`.catch(() => []);
    const done = new Set(rows.map((r) => Number(r.created_at)));
    for (const m of journal.entries)
      console.log(`${done.has(m.when) ? "✓" : "·"} ${m.tag}`);
    process.exit(0);
  }
  const db = drizzle(sql);
  const before =
    await sql`select count(*)::int as n from drizzle.__drizzle_migrations`.catch(
      () => [{ n: 0 }],
    );
  await migrate(db, { migrationsFolder: "drizzle" });
  const after =
    await sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
  const applied = after[0].n - before[0].n;
  console.log(
    applied > 0
      ? `Selesai: ${applied} migrasi baru diterapkan (total ${after[0].n}).`
      : `Tidak ada migrasi baru (total ${after[0].n}).`,
  );
} catch (e) {
  console.error("Migrasi gagal:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
