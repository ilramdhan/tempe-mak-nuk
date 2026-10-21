import "server-only";

import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { cacheTag } from "next/cache";

import type { Database } from "@/db/client";
import {
  categories,
  media,
  products,
  recipes,
  type RecipeDifficulty,
  type RecipeIngredient,
  type RecipeStep,
} from "@/db/schema";
import type { RichTextDoc, SeoMeta } from "@/db/schema/seo";
import { cachedRead } from "@/features/_shared/db";
import { isLiveSql } from "@/features/_shared/live";
import type { PublicMedia } from "@/features/media/queries";
import type { CategoryRef } from "@/features/posts/queries";
import { tags } from "@/lib/cache-tags";

export type RecipeSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  prepMinutes: number | null;
  cookMinutes: number | null;
  servings: number | null;
  difficulty: RecipeDifficulty | null;
  publishedAt: Date | null;
  category: CategoryRef | null;
  product: { slug: string; name: string } | null;
  cover: PublicMedia | null;
};

export type RecipeDetail = RecipeSummary & {
  content: RichTextDoc | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  seo: SeoMeta;
  updatedAt: Date;
};

const live = isLiveSql(recipes.status, recipes.publishedAt);

const cols = {
  id: recipes.id,
  slug: recipes.slug,
  title: recipes.title,
  excerpt: recipes.excerpt,
  prepMinutes: recipes.prepMinutes,
  cookMinutes: recipes.cookMinutes,
  servings: recipes.servings,
  difficulty: recipes.difficulty,
  publishedAt: recipes.publishedAt,
  categoryId: categories.id,
  categorySlug: categories.slug,
  categoryName: categories.name,
  productSlug: products.slug,
  productName: products.name,
  coverId: media.id,
  coverUrl: media.url,
  coverAlt: media.alt,
  coverWidth: media.width,
  coverHeight: media.height,
  coverBlur: media.blurDataUrl,
};
type Row = { [K in keyof typeof cols]: (typeof cols)[K]["_"]["data"] | null };

function toSummary(r: Row): RecipeSummary {
  return {
    id: r.id!,
    slug: r.slug!,
    title: r.title!,
    excerpt: r.excerpt,
    prepMinutes: r.prepMinutes,
    cookMinutes: r.cookMinutes,
    servings: r.servings,
    difficulty: r.difficulty,
    publishedAt: r.publishedAt,
    category: r.categoryId
      ? { id: r.categoryId, slug: r.categorySlug!, name: r.categoryName! }
      : null,
    product: r.productSlug
      ? { slug: r.productSlug, name: r.productName! }
      : null,
    cover: r.coverId
      ? {
          id: r.coverId,
          url: r.coverUrl!,
          alt: r.coverAlt!,
          width: r.coverWidth,
          height: r.coverHeight,
          blurDataUrl: r.coverBlur,
        }
      : null,
  };
}

function base(db: Database) {
  return db
    .select(cols)
    .from(recipes)
    .leftJoin(categories, eq(categories.id, recipes.categoryId))
    .leftJoin(products, eq(products.id, recipes.productId))
    .leftJoin(media, eq(media.id, recipes.coverMediaId));
}

/** Live recipes, newest first. Filters: category slug, product slug. */
export async function getRecipes(
  opts: {
    category?: string | null;
    product?: string | null;
    limit?: number;
  } = {},
): Promise<RecipeSummary[]> {
  "use cache";
  cacheTag(tags.recipes);
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  return cachedRead("recipes", "hours", [], async (db) => {
    const where = and(
      live,
      opts.category ? eq(categories.slug, opts.category) : undefined,
      opts.product ? eq(products.slug, opts.product) : undefined,
    );
    return (
      await base(db)
        .where(where)
        .orderBy(desc(recipes.publishedAt))
        .limit(limit)
    ).map(toSummary);
  });
}

export async function getRecipesBySlugs(
  slugs: readonly string[],
): Promise<RecipeSummary[]> {
  if (!slugs.length) return [];
  const list = await getRecipesBySlugsCached([...slugs]);
  const bySlug = new Map(list.map((r) => [r.slug, r]));
  return slugs
    .map((s) => bySlug.get(s))
    .filter((r): r is RecipeSummary => Boolean(r));
}

async function getRecipesBySlugsCached(
  slugs: string[],
): Promise<RecipeSummary[]> {
  "use cache";
  cacheTag(tags.recipes, ...slugs.slice(0, 50).map(tags.recipe));
  return cachedRead("recipes-by-slug", "hours", [], async (db) =>
    (await base(db).where(and(live, inArray(recipes.slug, slugs)))).map(
      toSummary,
    ),
  );
}

export async function getRecipeBySlug(
  slug: string,
): Promise<RecipeDetail | null> {
  "use cache";
  cacheTag(tags.recipes, tags.recipe(slug));
  return cachedRead("recipe", "hours", null, async (db) => {
    const [row] = await db
      .select({
        ...cols,
        content: recipes.content,
        ingredients: recipes.ingredients,
        steps: recipes.steps,
        seo: recipes.seo,
        updatedAt: recipes.updatedAt,
      })
      .from(recipes)
      .leftJoin(categories, eq(categories.id, recipes.categoryId))
      .leftJoin(products, eq(products.id, recipes.productId))
      .leftJoin(media, eq(media.id, recipes.coverMediaId))
      .where(and(live, eq(recipes.slug, slug)))
      .limit(1);
    if (!row) return null;
    return {
      ...toSummary(row),
      content: row.content,
      ingredients: row.ingredients,
      steps: row.steps,
      seo: row.seo,
      updatedAt: row.updatedAt,
    };
  });
}

export async function getRelatedRecipes(
  slug: string,
  limit = 3,
): Promise<RecipeSummary[]> {
  "use cache";
  cacheTag(tags.recipes);
  return cachedRead("related-recipes", "hours", [], async (db) => {
    const [cur] = await db
      .select({ categoryId: recipes.categoryId, productId: recipes.productId })
      .from(recipes)
      .where(eq(recipes.slug, slug))
      .limit(1);
    const list = (
      await base(db)
        .where(and(live, ne(recipes.slug, slug)))
        .orderBy(desc(recipes.publishedAt))
        .limit(30)
    ).map(toSummary);
    const same = cur?.categoryId
      ? list.filter((r) => r.category?.id === cur.categoryId)
      : [];
    return [...same, ...list.filter((r) => !same.includes(r))].slice(0, limit);
  });
}

export async function getRecipeSlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  "use cache";
  cacheTag(tags.recipes);
  return cachedRead("recipe-slugs", "hours", [], (db) =>
    db
      .select({ slug: recipes.slug, updatedAt: recipes.updatedAt })
      .from(recipes)
      .where(live)
      .orderBy(desc(recipes.publishedAt)),
  );
}

/** Sitemap rows: live recipes with their noindex flag. */
export async function listRecipesForSitemap(): Promise<
  { slug: string; updatedAt: Date; noindex: boolean }[]
> {
  "use cache";
  cacheTag(tags.recipes);
  return cachedRead("recipes-sitemap", "hours", [], async (db) =>
    (
      await db
        .select({
          slug: recipes.slug,
          updatedAt: recipes.updatedAt,
          seo: recipes.seo,
        })
        .from(recipes)
        .where(live)
    ).map((r) => ({
      slug: r.slug,
      updatedAt: r.updatedAt,
      noindex: r.seo?.noindex === true,
    })),
  );
}
