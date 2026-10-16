import "server-only";

import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "@/lib/env";

import * as schema from "./schema";

export type Database = PostgresJsDatabase<typeof schema>;

type DbGlobal = { __tmnDb?: { db: Database; sql: postgres.Sql } };
const globalForDb = globalThis as unknown as DbGlobal;

function connect() {
  const url = getServerEnv().DATABASE_URL;
  if (!url)
    throw new Error("DATABASE_URL is not set — cannot connect to Postgres.");
  // Supabase transaction pooler (port 6543) does not support prepared statements.
  const sql = postgres(url, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
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
