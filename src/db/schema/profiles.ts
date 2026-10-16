import { sql } from "drizzle-orm";
import { pgPolicy, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { authenticatedRole, authUid, authUsers } from "drizzle-orm/supabase";

import { isAdmin, timestamps } from "./_shared";
import { userRole } from "./enums";

const isOwner = sql`(select public.has_role('owner'))`;

/**
 * One row per Supabase auth user (created by the `on_auth_user_created` trigger,
 * first user ever → owner, everyone after → editor).
 */
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id")
      .primaryKey()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    role: userRole("role").notNull().default("editor"),
    displayName: text("display_name"),
    ...timestamps(),
  },
  () => [
    pgPolicy("profiles_read_own_or_admin", {
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = id or ${isAdmin}`,
    }),
    // Users may edit their own profile but not change their own role.
    pgPolicy("profiles_update_own", {
      for: "update",
      to: authenticatedRole,
      using: sql`${authUid} = id`,
      withCheck: sql`${authUid} = id and (select public.has_role(role::text))`,
    }),
    pgPolicy("profiles_owner_all", {
      for: "all",
      to: authenticatedRole,
      using: isOwner,
      withCheck: isOwner,
    }),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
