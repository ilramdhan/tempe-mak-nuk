import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "@/lib/env";

import { buildDatabaseUrl } from "./build-url";
import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

type DbGlobal = { __tmnDb?: { db: Database; sql: postgres.Sql } };
const globalForDb = globalThis as unknown as DbGlobal;

function connect() {
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  const runtimeUrl = getServerEnv().DATABASE_URL;
  if (!runtimeUrl)
    throw new Error("DATABASE_URL is not set — cannot connect to Postgres.");
  // `next build` prerenders in many workers at once; one connection each keeps the total
  // under the session pooler's client limit.
  const url = isBuild ? buildDatabaseUrl(runtimeUrl) : runtimeUrl;
  // Supabase transaction pooler (port 6543) does not support prepared statements.
  const sql = postgres(url, {
    prepare: false,
    max: isBuild ? 1 : 5,
    // Never pipeline: Supabase's transaction pooler (6543) stalls when a connection receives a
    // second query while one is in flight, which hung the admin dashboard's parallel reads and
    // then every later request on that instance. 0 = one query per connection at a time; extra
    // queries wait in postgres-js's own queue for a free connection. (Runtime option of
    // postgres-js 3.x that its typings omit.)
    ...({ max_pipeline: 0 } as Record<string, unknown>),
    idle_timeout: 20,
    connect_timeout: 10,
  });
  // drizzle's jsonb column JSON.parses the driver value itself; postgres-js parsing it first
  // turns a stored JSON string like "6281…" into a number. Hand drizzle the raw text instead.
  for (const oid of [114, 3802])
    sql.options.parsers[oid] = (raw: string) => raw;
  return { sql, db: drizzle(sql, { schema }) };
}

/**
 * Lazy singleton. Nothing connects at import time, so `next build` works without a DB.
 * Cached on globalThis to survive dev HMR without leaking connections.
 */
export function getDb(): Database {
  globalForDb.__tmnDb ??= connect();
  return globalForDb.__tmnDb.db;
}

/** Raw postgres-js client (same pool as `getDb()`). */
export function getSql(): postgres.Sql {
  globalForDb.__tmnDb ??= connect();
  return globalForDb.__tmnDb.sql;
}
