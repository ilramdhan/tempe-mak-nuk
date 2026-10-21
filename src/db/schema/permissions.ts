import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgPolicy,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { authenticatedRole, authUid } from "drizzle-orm/supabase";

import { isAdmin, timestamps } from "./_shared";
import { userRole } from "./enums";
import { profiles } from "./profiles";

const isOwner = sql`(select public.has_role('owner'))`;

/**
 * Dynamic RBAC (P8.14). Overrides on top of the code registry
 * (`src/features/permissions/registry.ts`). A missing row = registry default.
 * `permission` is a registry key (`<entity>.<action>`), validated in the Server Action.
 * Owners always have every permission, so in practice only `editor` rows are written.
 */
export const rolePermissions = pgTable(
  "role_permissions",
  {
    role: userRole("role").notNull(),
    permission: text("permission").notNull(),
    allowed: boolean("allowed").notNull(),
    updatedBy: uuid("updated_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (t) => [
    primaryKey({ columns: [t.role, t.permission] }),
    index("role_permissions_updated_by_idx").on(t.updatedBy),
    pgPolicy("role_permissions_admin_read", {
      for: "select",
      to: authenticatedRole,
      using: isAdmin,
    }),
    pgPolicy("role_permissions_owner_all", {
      for: "all",
      to: authenticatedRole,
      using: isOwner,
      withCheck: isOwner,
    }),
  ],
);

/** Per-user grant (`allowed = true`) or deny (`false`); wins over the role override. */
export const userPermissions = pgTable(
  "user_permissions",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    permission: text("permission").notNull(),
    allowed: boolean("allowed").notNull(),
    updatedBy: uuid("updated_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.permission] }),
    index("user_permissions_updated_by_idx").on(t.updatedBy),
    pgPolicy("user_permissions_read_own_or_owner", {
      for: "select",
      to: authenticatedRole,
      using: sql`${authUid} = ${t.userId} or ${isOwner}`,
    }),
    pgPolicy("user_permissions_owner_all", {
      for: "all",
      to: authenticatedRole,
      using: isOwner,
      withCheck: isOwner,
    }),
  ],
);

export type RolePermission = typeof rolePermissions.$inferSelect;
export type UserPermission = typeof userPermissions.$inferSelect;
