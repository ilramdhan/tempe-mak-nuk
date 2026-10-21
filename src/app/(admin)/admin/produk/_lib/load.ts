import "server-only";

import {
  getProductForAdmin,
  listProductsForAdmin,
  listShapesForAdmin,
  listSizesForAdmin,
} from "@/features/products/queries.admin";

import type { ProductDraft } from "./form-state";

export type ShapeRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort: number;
  active: boolean;
};
export type SizeRow = {
  id: string;
  name: string;
  weightGrams: number | null;
  dims: string | null;
  price: number | null;
  sort: number;
  active: boolean;
};
export type ProductListItem = {
  id: string;
  slug: string;
  name: string;
  variant: "classic" | "skinless";
  priceFrom: number | null;
  isActive: boolean;
  sort: number;
};
export type NutritionRow = {
  id: string;
  perGrams: number;
  energyKcal: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  fiberG: number | null;
  calciumMg: number | null;
  ironMg: number | null;
  source: string;
  sourceUrl: string | null;
};

async function safe<T>(label: string, fn: () => Promise<T[]>): Promise<T[]> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[admin/produk] ${label} failed:`, error);
    return [];
  }
}

export async function loadProductList(): Promise<ProductListItem[]> {
  const rows = await safe("products", listProductsForAdmin);
  return rows.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    variant: p.variant,
    priceFrom: p.priceFrom,
    isActive: p.isActive,
    sort: p.sort,
  }));
}

export async function loadOptions() {
  const [shapes, sizes] = await Promise.all([
    safe("shapes", listShapesForAdmin),
    safe("sizes", listSizesForAdmin),
  ]);
  return {
    shapes: shapes.map<ShapeRow>((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      sort: s.sort,
      active: s.active,
    })),
    sizes: sizes.map<SizeRow>((s) => ({
      id: s.id,
      name: s.name,
      weightGrams: s.weightGrams,
      dims: s.dims,
      price: s.price,
      sort: s.sort,
      active: s.active,
    })),
  };
}

export async function loadProductForEdit(id: string): Promise<{
  id: string;
  name: string;
  slug: string;
  draft: ProductDraft;
  nutrition: NutritionRow | null;
} | null> {
  const p = await getProductForAdmin(id);
  if (!p) return null;
  const n =
    p.nutrition.find((x) => x.perGrams === 100) ?? p.nutrition[0] ?? null;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    draft: {
      slug: p.slug,
      name: p.name,
      short: p.short ?? "",
      description: (p.description as ProductDraft["description"]) ?? null,
      variant: p.variant,
      priceFrom: p.priceFrom === null ? "" : String(p.priceFrom),
      isActive: p.isActive,
      sort: String(p.sort),
      seoTitle: p.seo?.title ?? "",
      seoDescription: p.seo?.description ?? "",
      seoOgImageId: p.seo?.ogImageId ?? null,
      noindex: p.seo?.noindex ?? false,
      shapeIds: p.shapeIds,
      sizes: p.sizes.map((s) => ({
        sizeId: s.sizeId,
        price: s.price === null ? "" : String(s.price),
      })),
      mediaIds: p.mediaIds,
    },
    nutrition: n && {
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
    },
  };
}
