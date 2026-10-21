import "server-only";

import type { CategoryKind } from "@/db/schema";
import { listPostsForAdmin } from "@/features/posts/queries.admin";
import { listProductsForAdmin } from "@/features/products/queries.admin";
import { listRecipesForAdmin } from "@/features/recipes/queries.admin";
import {
  listCategoriesForAdmin,
  listTagsForAdmin,
} from "@/features/taxonomy/queries.admin";

import type { ContentRow } from "../components/content-table";
import type { Option } from "../components/types";
import { visibilityOf } from "./publish";

/** Run a loader, falling back to `[]` (e.g. no DB in CI builds). */
export async function safe<T>(
  label: string,
  fn: () => Promise<T[]>,
): Promise<T[]> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[admin/konten] ${label} failed:`, error);
    return [];
  }
}

export async function loadCategoryOptions(
  kind: CategoryKind,
): Promise<Option[]> {
  const rows = await safe("categories", () => listCategoriesForAdmin(kind));
  return rows.map((c) => ({ value: c.id, label: c.name }));
}

export async function loadTagOptions(): Promise<Option[]> {
  const rows = await safe("tags", listTagsForAdmin);
  return rows.map((t) => ({ value: t.id, label: t.name }));
}

export async function loadProductOptions(): Promise<Option[]> {
  const rows = await safe("products", listProductsForAdmin);
  return rows.map((p) => ({
    value: p.id,
    label: `${p.name}${p.isActive ? "" : " (nonaktif)"}`,
  }));
}

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export async function loadPostRows(): Promise<{
  rows: ContentRow[];
  categories: Option[];
}> {
  const [posts, categories] = await Promise.all([
    safe("posts", () => listPostsForAdmin()),
    loadCategoryOptions("post"),
  ]);
  const name = new Map(categories.map((c) => [c.value, c.label]));
  const now = new Date();
  return {
    categories,
    rows: posts.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      visibility: visibilityOf(p.status, p.publishedAt, now),
      publishedAt: iso(p.publishedAt),
      categoryId: p.categoryId,
      categoryName: (p.categoryId && name.get(p.categoryId)) || "",
      updatedAt: p.updatedAt.toISOString(),
    })),
  };
}

export async function loadRecipeRows(): Promise<{
  rows: ContentRow[];
  categories: Option[];
}> {
  const [recipes, categories, products] = await Promise.all([
    safe("recipes", () => listRecipesForAdmin()),
    loadCategoryOptions("recipe"),
    loadProductOptions(),
  ]);
  const name = new Map(categories.map((c) => [c.value, c.label]));
  const product = new Map(products.map((p) => [p.value, p.label]));
  const now = new Date();
  return {
    categories,
    rows: recipes.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      visibility: visibilityOf(r.status, r.publishedAt, now),
      publishedAt: iso(r.publishedAt),
      categoryId: r.categoryId,
      categoryName: (r.categoryId && name.get(r.categoryId)) || "",
      updatedAt: r.updatedAt.toISOString(),
      extra: (r.productId && product.get(r.productId)) || undefined,
    })),
  };
}
