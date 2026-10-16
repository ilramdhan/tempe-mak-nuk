/**
 * Shared column helpers + RLS policy builders used by every domain schema file.
 *
 * RLS model (see drizzle/0000_rls_helpers.sql for the functions):
 * - `public.is_admin()`  → current auth user has a profiles row with role owner|editor.
 * - `public.has_role(r)` → current auth user's role is exactly `r`.
 * Public visitors (anon + authenticated) only get SELECT on publishable rows; every write
 * requires `is_admin()`. Server code connecting as `postgres` (Drizzle) bypasses RLS, so
 * Server Actions MUST still check session + role themselves.
 */
import { sql, type SQL } from "drizzle-orm";
import { pgPolicy, timestamp } from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());

export const timestamps = () => ({
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const isAdmin = sql`(select public.is_admin())`;

/** Full CRUD for admins (owner + editor). Also lets admins read drafts. */
export const adminAll = () =>
  pgPolicy("admin_all", {
    for: "all",
    to: authenticatedRole,
    using: isAdmin,
    withCheck: isAdmin,
  });

/** Public SELECT (anon + authenticated) restricted by `using` (default: every row). */
export const publicRead = (using: SQL = sql`true`) =>
  pgPolicy("public_read", {
    for: "select",
    to: [anonRole, authenticatedRole],
    using,
  });

/** The pair most tables use: public read of publishable rows + admin writes. */
export const standardPolicies = (using?: SQL) => [
  publicRead(using),
  adminAll(),
];
