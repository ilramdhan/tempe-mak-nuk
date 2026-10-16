import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { adminAll, publicRead, timestamps } from "./_shared";
import { productVariant } from "./enums";
import { media } from "./media";
import type { RichTextDoc, SeoMeta } from "./seo";

const productIsActive = (productId: unknown) =>
  sql`exists (select 1 from public.products p where p.id = ${productId} and p.is_active)`;

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    short: text("short"),
    description: jsonb("description").$type<RichTextDoc>(),
    variant: productVariant("variant").notNull(),
    /** "Mulai dari" price in whole IDR; null = hidden / ask via WA. */
    priceFrom: integer("price_from"),
    isActive: boolean("is_active").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    seo: jsonb("seo").$type<SeoMeta>().notNull().default({}),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("products_slug_key").on(t.slug),
    index("products_active_sort_idx").on(t.isActive, t.sort),
    publicRead(sql`${t.isActive}`),
    adminAll(),
  ],
);

export const productShapes = pgTable(
  "product_shapes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    sort: integer("sort").notNull().default(0),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("product_shapes_slug_key").on(t.slug),
    index("product_shapes_sort_idx").on(t.sort),
    publicRead(sql`${t.active}`),
    adminAll(),
  ],
);

export const productSizes = pgTable(
  "product_sizes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    weightGrams: integer("weight_grams"),
    dims: text("dims"),
    /** Whole IDR; null = price on request. */
    price: integer("price"),
    sort: integer("sort").notNull().default(0),
    active: boolean("active").notNull().default(true),
    ...timestamps(),
  },
  (t) => [
    index("product_sizes_sort_idx").on(t.sort),
    publicRead(sql`${t.active}`),
    adminAll(),
  ],
);

export const productShapeLinks = pgTable(
  "product_shape_links",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    shapeId: uuid("shape_id")
      .notNull()
      .references(() => productShapes.id, { onDelete: "cascade" }),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.shapeId] }),
    index("product_shape_links_shape_idx").on(t.shapeId),
    publicRead(productIsActive(t.productId)),
    adminAll(),
  ],
);

export const productSizeLinks = pgTable(
  "product_size_links",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sizeId: uuid("size_id")
      .notNull()
      .references(() => productSizes.id, { onDelete: "cascade" }),
    /** Per-product price override (IDR); null = use product_sizes.price. */
    price: integer("price"),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.sizeId] }),
    index("product_size_links_size_idx").on(t.sizeId),
    publicRead(productIsActive(t.productId)),
    adminAll(),
  ],
);

/** Nutrition facts per `per_grams` serving. `source` is mandatory (no unsourced claims). */
export const nutrition = pgTable(
  "nutrition",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    perGrams: integer("per_grams").notNull().default(100),
    energyKcal: numeric("energy_kcal", {
      precision: 7,
      scale: 2,
      mode: "number",
    }),
    proteinG: numeric("protein_g", { precision: 7, scale: 2, mode: "number" }),
    fatG: numeric("fat_g", { precision: 7, scale: 2, mode: "number" }),
    carbsG: numeric("carbs_g", { precision: 7, scale: 2, mode: "number" }),
    fiberG: numeric("fiber_g", { precision: 7, scale: 2, mode: "number" }),
    calciumMg: numeric("calcium_mg", {
      precision: 7,
      scale: 2,
      mode: "number",
    }),
    ironMg: numeric("iron_mg", { precision: 7, scale: 2, mode: "number" }),
    source: text("source").notNull(),
    sourceUrl: text("source_url"),
    ...timestamps(),
  },
  (t) => [
    uniqueIndex("nutrition_product_per_grams_key").on(t.productId, t.perGrams),
    publicRead(productIsActive(t.productId)),
    adminAll(),
  ],
);

export const productMedia = pgTable(
  "product_media",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.mediaId] }),
    index("product_media_media_idx").on(t.mediaId),
    index("product_media_product_sort_idx").on(t.productId, t.sort),
    publicRead(productIsActive(t.productId)),
    adminAll(),
  ],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductShape = typeof productShapes.$inferSelect;
export type NewProductShape = typeof productShapes.$inferInsert;
export type ProductSize = typeof productSizes.$inferSelect;
export type NewProductSize = typeof productSizes.$inferInsert;
export type ProductShapeLink = typeof productShapeLinks.$inferSelect;
export type ProductSizeLink = typeof productSizeLinks.$inferSelect;
export type Nutrition = typeof nutrition.$inferSelect;
export type NewNutrition = typeof nutrition.$inferInsert;
export type ProductMedia = typeof productMedia.$inferSelect;
