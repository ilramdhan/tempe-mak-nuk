import {
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { standardPolicies, timestamps } from "./_shared";
import { profiles } from "./profiles";

/** Files in Supabase Storage. `alt` is mandatory (a11y + SEO). */
export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storagePath: text("storage_path").notNull(),
    url: text("url").notNull(),
    alt: text("alt").notNull(),
    width: integer("width"),
    height: integer("height"),
    mime: text("mime"),
    sizeBytes: integer("size_bytes"),
    blurDataUrl: text("blur_data_url"),
    createdBy: uuid("created_by").references(() => profiles.id, {
      onDelete: "set null",
    }),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("media_storage_path_key").on(t.storagePath),
    index("media_created_by_idx").on(t.createdBy),
    ...standardPolicies(),
  ],
);

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
