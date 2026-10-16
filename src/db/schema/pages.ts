import { sql } from "drizzle-orm";
import {
  boolean,
  foreignKey,
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
import { navLocation, pageStatus } from "./enums";
import type { SeoMeta } from "./seo";

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    seo: jsonb("seo").$type<SeoMeta>().notNull().default({}),
    status: pageStatus("status").notNull().default("draft"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("pages_slug_key").on(t.slug),
    index("pages_status_idx").on(t.status),
    publicRead(sql`${t.status} = 'published'`),
    adminAll(),
  ],
);

/** Section blocks (JSON validated by Zod in features/pages, P3.3). */
export const pageSections = pgTable(
  "page_sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pageId: uuid("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    sort: integer("sort").notNull().default(0),
    visible: boolean("visible").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    index("page_sections_page_sort_idx").on(t.pageId, t.sort),
    publicRead(
      sql`${t.visible} and exists (select 1 from public.pages p where p.id = ${t.pageId} and p.status = 'published')`,
    ),
    adminAll(),
  ],
);

export const navItems = pgTable(
  "nav_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    location: navLocation("location").notNull(),
    label: text("label").notNull(),
    href: text("href").notNull(),
    parentId: uuid("parent_id"),
    sort: integer("sort").notNull().default(0),
    visible: boolean("visible").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    index("nav_items_location_sort_idx").on(t.location, t.sort),
    index("nav_items_parent_idx").on(t.parentId),
    foreignKey({
      name: "nav_items_parent_id_nav_items_id_fk",
      columns: [t.parentId],
      foreignColumns: [t.id],
    }).onDelete("cascade"),
    publicRead(sql`${t.visible}`),
    adminAll(),
  ],
);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    text: text("text").notNull(),
    href: text("href"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    index("announcements_active_window_idx").on(t.active, t.startsAt, t.endsAt),
    publicRead(
      sql`${t.active} and (${t.startsAt} is null or ${t.startsAt} <= now()) and (${t.endsAt} is null or ${t.endsAt} > now())`,
    ),
    adminAll(),
  ],
);

export const redirects = pgTable(
  "redirects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    from: text("from").notNull(),
    to: text("to").notNull(),
    permanent: boolean("permanent").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("redirects_from_key").on(t.from),
    // Public read: the proxy/middleware resolves redirects with the anon key.
    publicRead(),
    adminAll(),
  ],
);

export type Page = typeof pages.$inferSelect;
export type NewPage = typeof pages.$inferInsert;
export type PageSection = typeof pageSections.$inferSelect;
export type NewPageSection = typeof pageSections.$inferInsert;
export type NavItem = typeof navItems.$inferSelect;
export type NewNavItem = typeof navItems.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type Redirect = typeof redirects.$inferSelect;
export type NewRedirect = typeof redirects.$inferInsert;
