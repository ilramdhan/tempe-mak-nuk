import "server-only";

import { sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn, PgTable } from "drizzle-orm/pg-core";

import type { Database } from "@/db/client";

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];

/** Set `sort = index` for each id in one UPDATE. `scope` restricts rows (e.g. same page). */
export async function applyOrder(
  tx: Tx,
  table: PgTable,
  idCol: AnyPgColumn,
  sortCol: AnyPgColumn,
  ids: readonly string[],
  scope?: SQL,
): Promise<number> {
  if (ids.length === 0) return 0;
  const cases = sql.join(
    ids.map((id, i) => sql`when ${sql.identifier(idCol.name)} = ${id}::uuid then ${i}`),
    sql` `,
  );
  const inList = sql.join(ids.map((id) => sql`${id}::uuid`), sql`, `);
  const where = scope
    ? sql`${sql.identifier(idCol.name)} in (${inList}) and ${scope}`
    : sql`${sql.identifier(idCol.name)} in (${inList})`;
  const res = await tx.execute(
    sql`update ${table} set ${sql.identifier(sortCol.name)} = case ${cases} else ${sql.identifier(sortCol.name)} end where ${where}`,
  );
  return res.count ?? 0;
}
