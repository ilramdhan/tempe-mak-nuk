import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { adminAll, publicRead, timestamps } from "./_shared";
import { legalSlug, pageStatus } from "./enums";
import type { RichTextDoc } from "./seo";

/**
 * Versioned legal documents. Several versions per slug may exist; the public site shows
 * the highest published `version` whose `effective_at` has passed.
 * Cookie consent config is NOT here — it is the settings key `consent.config`.
 */
export const legalDocuments = pgTable(
  "legal_documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: legalSlug("slug").notNull(),
    title: text("title").notNull(),
    content: jsonb("content").$type<RichTextDoc>(),
    version: integer("version").notNull().default(1),
    effectiveAt: timestamp("effective_at", { withTimezone: true }),
    status: pageStatus("status").notNull().default("draft"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("legal_documents_slug_version_key").on(t.slug, t.version),
    index("legal_documents_status_idx").on(t.status, t.effectiveAt),
    publicRead(sql`${t.status} = 'published'`),
    adminAll(),
  ],
);

export type LegalDocument = typeof legalDocuments.$inferSelect;
export type NewLegalDocument = typeof legalDocuments.$inferInsert;
