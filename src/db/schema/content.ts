import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { adminAll, publicRead, standardPolicies, timestamps } from "./_shared";
import { categoryKind, contentStatus, recipeDifficulty } from "./enums";
import { media } from "./media";
import { products } from "./products";
import { profiles } from "./profiles";
import type { RichTextDoc, SeoMeta } from "./seo";

/** Publicly visible = published/scheduled with published_at already reached. */
const isLive = (status: unknown, publishedAt: unknown) =>
  sql`${status} in ('published', 'scheduled') and ${publishedAt} is not null and ${publishedAt} <= now()`;

/** Shared taxonomy for posts, recipes and FAQs (covers PLAN's `faq_categories` via kind='faq'). */
export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: categoryKind("kind").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    sort: integer("sort").notNull().default(0),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("categories_kind_slug_key").on(t.kind, t.slug),
    index("categories_kind_sort_idx").on(t.kind, t.sort),
    ...standardPolicies(),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    ...timestamps(),
  },
  (t) => [uniqueIndex("tags_slug_key").on(t.slug), ...standardPolicies()],
);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    content: jsonb("content").$type<RichTextDoc>(),
    coverMediaId: uuid("cover_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    authorId: uuid("author_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    status: contentStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    readingMinutes: smallint("reading_minutes"),
    seo: jsonb("seo").$type<SeoMeta>().notNull().default({}),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("posts_slug_key").on(t.slug),
    index("posts_status_published_at_idx").on(t.status, t.publishedAt),
    index("posts_cover_media_idx").on(t.coverMediaId),
    index("posts_category_idx").on(t.categoryId),
    index("posts_author_idx").on(t.authorId),
    publicRead(isLive(t.status, t.publishedAt)),
    adminAll(),
  ],
);

export const postTags = pgTable(
  "post_tags",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.tagId] }),
    index("post_tags_tag_idx").on(t.tagId),
    publicRead(
      sql`exists (select 1 from public.posts p where p.id = ${t.postId} and p.status in ('published', 'scheduled') and p.published_at is not null and p.published_at <= now())`,
    ),
    adminAll(),
  ],
);

export type RecipeIngredient = {
  item: string;
  qty?: string;
  note?: string;
  group?: string;
};
export type RecipeStep = { text: string; mediaId?: string | null };

export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    content: jsonb("content").$type<RichTextDoc>(),
    ingredients: jsonb("ingredients")
      .$type<RecipeIngredient[]>()
      .notNull()
      .default([]),
    steps: jsonb("steps").$type<RecipeStep[]>().notNull().default([]),
    prepMinutes: smallint("prep_minutes"),
    cookMinutes: smallint("cook_minutes"),
    servings: smallint("servings"),
    difficulty: recipeDifficulty("difficulty"),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    coverMediaId: uuid("cover_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    status: contentStatus("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    seo: jsonb("seo").$type<SeoMeta>().notNull().default({}),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("recipes_slug_key").on(t.slug),
    index("recipes_status_published_at_idx").on(t.status, t.publishedAt),
    index("recipes_product_idx").on(t.productId),
    index("recipes_category_idx").on(t.categoryId),
    index("recipes_cover_media_idx").on(t.coverMediaId),
    publicRead(isLive(t.status, t.publishedAt)),
    adminAll(),
  ],
);

export const faqs = pgTable(
  "faqs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    question: text("question").notNull(),
    /** Plain text / light markdown (rendered + sanitized; also used for FAQPage JSON-LD). */
    answer: text("answer").notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    sort: integer("sort").notNull().default(0),
    visible: boolean("visible").notNull().default(true),
    showOnHome: boolean("show_on_home").notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    index("faqs_category_sort_idx").on(t.categoryId, t.sort),
    index("faqs_visible_sort_idx").on(t.visible, t.sort),
    publicRead(sql`${t.visible}`),
    adminAll(),
  ],
);

export const testimonials = pgTable(
  "testimonials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** Role / segment, e.g. "Ibu MPASI", "Pemilik warung", "Katering". */
    role: text("role"),
    city: text("city"),
    quote: text("quote").notNull(),
    rating: smallint("rating"),
    mediaId: uuid("media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    verified: boolean("verified").notNull().default(false),
    visible: boolean("visible").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    /** True until replaced with a real, consented testimonial (UI labels it). */
    isPlaceholder: boolean("is_placeholder").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    index("testimonials_visible_sort_idx").on(t.visible, t.sort),
    index("testimonials_media_idx").on(t.mediaId),
    publicRead(sql`${t.visible}`),
    adminAll(),
  ],
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type PostTag = typeof postTags.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
export type Faq = typeof faqs.$inferSelect;
export type NewFaq = typeof faqs.$inferInsert;
export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;
