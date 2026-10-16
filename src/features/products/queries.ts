import "server-only";

import { and, asc, eq, inArray } from "drizzle-orm";
import { cacheTag } from "next/cache";

import type { Database } from "@/db/client";
import {
  media,
  nutrition,
  productMedia,
  products,
  productShapeLinks,
  productShapes,
  productSizeLinks,
  productSizes,
  type Nutrition,
  type ProductVariant,
} from "@/db/schema";
import type { RichTextDoc, SeoMeta } from "@/db/schema/seo";
import { cachedRead } from "@/features/_shared/db";
import type { PublicMedia } from "@/features/media/queries";
import { tags } from "@/lib/cache-tags";

export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  short: string | null;
  variant: ProductVariant;
  priceFrom: number | null;
  sort: number;
  cover: PublicMedia | null;
};

export type ProductShapeOption = { id: string; slug: string; name: string; description: string | null };
export type ProductSizeOption = {
  id: string;
  name: string;
  weightGrams: number | null;
  dims: string | null;
  /** Effective price (per-product override ?? size price), whole IDR, null = ask via WA. */
  price: number | null;
};

export type ProductDetail = ProductSummary & {
  description: RichTextDoc | null;
  seo: SeoMeta;
  shapes: ProductShapeOption[];
  sizes: ProductSizeOption[];
  nutrition: Omit<Nutrition, "productId" | "createdAt" | "updatedAt">[];
  gallery: PublicMedia[];
  updatedAt: Date;
};

const mediaCols = {
  id: media.id,
  url: media.url,
  alt: media.alt,
  width: media.width,
  height: media.height,
  blurDataUrl: media.blurDataUrl,
};

async function coversFor(db: Database, productIds: string[]) {
  if (!productIds.length) return new Map<string, PublicMedia>();
  const rows = await db
    .select({ productId: productMedia.productId, sort: productMedia.sort, ...mediaCols })
    .from(productMedia)
    .innerJoin(media, eq(media.id, productMedia.mediaId))
    .where(inArray(productMedia.productId, productIds))
    .orderBy(asc(productMedia.sort));
  const map = new Map<string, PublicMedia>();
  for (const r of rows) {
    if (!map.has(r.productId))
      map.set(r.productId, { id: r.id, url: r.url, alt: r.alt, width: r.width, height: r.height, blurDataUrl: r.blurDataUrl });
  }
  return map;
}

/** Active products ordered by sort (for lists, teasers, order builder). */
export async function getProducts(): Promise<ProductSummary[]> {
  "use cache";
  cacheTag(tags.products);
  return cachedRead("products", "days", [], async (db) => {
    const rows = await db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        short: products.short,
        variant: products.variant,
        priceFrom: products.priceFrom,
        sort: products.sort,
      })
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.sort), asc(products.name));
    const covers = await coversFor(db, rows.map((r) => r.id));
    return rows.map((r) => ({ ...r, cover: covers.get(r.id) ?? null }));
  });
}

/** Subset by slug, preserving the given order (unknown/inactive slugs skipped). */
export async function getProductsBySlugs(slugs: readonly string[]): Promise<ProductSummary[]> {
  const all = await getProducts();
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  return slugs.map((s) => bySlug.get(s)).filter((p): p is ProductSummary => Boolean(p));
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheTag(tags.products, tags.product(slug));
  return cachedRead("product", "days", null, async (db) => {
    const [p] = await db
      .select()
      .from(products)
      .where(and(eq(products.slug, slug), eq(products.isActive, true)))
      .limit(1);
    if (!p) return null;
    const [shapes, sizes, nutr, gallery] = await Promise.all([
      db
        .select({ id: productShapes.id, slug: productShapes.slug, name: productShapes.name, description: productShapes.description })
        .from(productShapeLinks)
        .innerJoin(productShapes, eq(productShapes.id, productShapeLinks.shapeId))
        .where(and(eq(productShapeLinks.productId, p.id), eq(productShapes.active, true)))
        .orderBy(asc(productShapeLinks.sort), asc(productShapes.sort)),
      db
        .select({
          id: productSizes.id,
          name: productSizes.name,
          weightGrams: productSizes.weightGrams,
          dims: productSizes.dims,
          basePrice: productSizes.price,
          override: productSizeLinks.price,
        })
        .from(productSizeLinks)
        .innerJoin(productSizes, eq(productSizes.id, productSizeLinks.sizeId))
        .where(and(eq(productSizeLinks.productId, p.id), eq(productSizes.active, true)))
        .orderBy(asc(productSizeLinks.sort), asc(productSizes.sort)),
      db.select().from(nutrition).where(eq(nutrition.productId, p.id)).orderBy(asc(nutrition.perGrams)),
      db
        .select(mediaCols)
        .from(productMedia)
        .innerJoin(media, eq(media.id, productMedia.mediaId))
        .where(eq(productMedia.productId, p.id))
        .orderBy(asc(productMedia.sort)),
    ]);
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      short: p.short,
      variant: p.variant,
      priceFrom: p.priceFrom,
      sort: p.sort,
      description: p.description,
      seo: p.seo,
      updatedAt: p.updatedAt,
      cover: gallery[0] ?? null,
      gallery,
      shapes,
      sizes: sizes.map(({ basePrice, override, ...s }) => ({ ...s, price: override ?? basePrice })),
      nutrition: nutr.map((n) => ({
        id: n.id,
        perGrams: n.perGrams,
        energyKcal: n.energyKcal,
        proteinG: n.proteinG,
        fatG: n.fatG,
        carbsG: n.carbsG,
        fiberG: n.fiberG,
        calciumMg: n.calciumMg,
        ironMg: n.ironMg,
        source: n.source,
        sourceUrl: n.sourceUrl,
      })),
    };
  });
}

export type ProductOptions = {
  products: (ProductSummary & { shapeIds: string[]; sizes: { sizeId: string; price: number | null }[] })[];
  shapes: ProductShapeOption[];
  sizes: (ProductSizeOption & { sort: number })[];
};

/** Everything the order builder needs in one cached read. */
export async function getProductOptions(): Promise<ProductOptions> {
  "use cache";
  cacheTag(tags.products, tags.productOptions);
  const empty: ProductOptions = { products: [], shapes: [], sizes: [] };
  return cachedRead("product-options", "days", empty, async (db) => {
    const [list, shapes, sizes, shapeLinks, sizeLinks] = await Promise.all([
      db
        .select({
          id: products.id,
          slug: products.slug,
          name: products.name,
          short: products.short,
          variant: products.variant,
          priceFrom: products.priceFrom,
          sort: products.sort,
        })
        .from(products)
        .where(eq(products.isActive, true))
        .orderBy(asc(products.sort)),
      db
        .select({ id: productShapes.id, slug: productShapes.slug, name: productShapes.name, description: productShapes.description })
        .from(productShapes)
        .where(eq(productShapes.active, true))
        .orderBy(asc(productShapes.sort)),
      db
        .select({
          id: productSizes.id,
          name: productSizes.name,
          weightGrams: productSizes.weightGrams,
          dims: productSizes.dims,
          price: productSizes.price,
          sort: productSizes.sort,
        })
        .from(productSizes)
        .where(eq(productSizes.active, true))
        .orderBy(asc(productSizes.sort)),
      db.select().from(productShapeLinks).orderBy(asc(productShapeLinks.sort)),
      db.select().from(productSizeLinks).orderBy(asc(productSizeLinks.sort)),
    ]);
    const covers = await coversFor(db, list.map((p) => p.id));
    return {
      shapes,
      sizes,
      products: list.map((p) => ({
        ...p,
        cover: covers.get(p.id) ?? null,
        shapeIds: shapeLinks.filter((l) => l.productId === p.id).map((l) => l.shapeId),
        sizes: sizeLinks.filter((l) => l.productId === p.id).map((l) => ({ sizeId: l.sizeId, price: l.price })),
      })),
    };
  });
}

/** Slugs for generateStaticParams / sitemap. */
export async function getProductSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  "use cache";
  cacheTag(tags.products);
  return cachedRead("product-slugs", "days", [], (db) =>
    db
      .select({ slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(asc(products.sort)),
  );
}
