import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgPolicy,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { anonRole, authenticatedRole } from "drizzle-orm/supabase";

import { adminAll, createdAt, isAdmin } from "./_shared";
import { waClickKind } from "./enums";
import { profiles } from "./profiles";

/** Anonymous WhatsApp CTA click events — NO personal data (no IP, UA, names, numbers). */
export const waClicks = pgTable(
  "wa_clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: createdAt(),
    source: text("source").notNull(),
    variant: text("variant"),
    kind: waClickKind("kind").notNull().default("general"),
  },
  (t) => [
    index("wa_clicks_created_at_idx").on(t.createdAt),
    index("wa_clicks_kind_created_at_idx").on(t.kind, t.createdAt),
    pgPolicy("wa_clicks_public_insert", {
      for: "insert",
      to: [anonRole, authenticatedRole],
      withCheck: sql`char_length(${t.source}) between 1 and 200 and (${t.variant} is null or char_length(${t.variant}) <= 100)`,
    }),
    adminAll(),
  ],
);

/**
 * Admin change log. Written by the server (Drizzle connects as `postgres`, bypassing RLS);
 * via the API, admins can only SELECT — rows are never updated/deleted from the client.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    diff: jsonb("diff").$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [
    index("audit_log_actor_idx").on(t.actorId),
    index("audit_log_entity_idx").on(t.entity, t.entityId),
    index("audit_log_created_at_idx").on(t.createdAt),
    pgPolicy("audit_log_admin_select", {
      for: "select",
      to: authenticatedRole,
      using: isAdmin,
    }),
  ],
);

export type WaClick = typeof waClicks.$inferSelect;
export type NewWaClick = typeof waClicks.$inferInsert;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
