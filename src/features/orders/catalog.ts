/**
 * Order catalog helpers (pure, client-safe). The catalog is the serializable shape of
 * `getProductOptions()` — every option comes from the DB (admin-managed), nothing hard-coded.
 */

export type CatalogShape = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type CatalogSize = {
  id: string;
  name: string;
  weightGrams: number | null;
  dims: string | null;
  price: number | null;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  short: string | null;
  priceFrom: number | null;
  /** Allowed shapes (empty = every active shape). */
  shapeIds: string[];
  /** Allowed sizes with per-product price override (empty = every active size). */
  sizes: { sizeId: string; price: number | null }[];
};

export type OrderCatalog = {
  products: CatalogProduct[];
  shapes: CatalogShape[];
  sizes: CatalogSize[];
};

export type SizeOption = CatalogSize & {
  /** Effective unit price for this product (override ?? size price), null = ask via WA. */
  price: number | null;
};

export function findProduct(
  catalog: OrderCatalog,
  productId: string | null | undefined,
): CatalogProduct | null {
  return catalog.products.find((p) => p.id === productId) ?? null;
}

/** Product id for a `?produk=<slug>` param, or null if unknown/inactive. */
export function productIdFromSlug(
  catalog: OrderCatalog,
  slug: string | string[] | null | undefined,
): string | null {
  const s = Array.isArray(slug) ? slug[0] : slug;
  if (!s) return null;
  return catalog.products.find((p) => p.slug === s)?.id ?? null;
}

/** Shapes available for a product, in shape sort order. */
export function shapesForProduct(
  catalog: OrderCatalog,
  productId: string | null | undefined,
): CatalogShape[] {
  const product = findProduct(catalog, productId);
  if (!product) return [];
  if (!product.shapeIds.length) return catalog.shapes;
  const allowed = new Set(product.shapeIds);
  return catalog.shapes.filter((s) => allowed.has(s.id));
}

/** Sizes available for a product with their effective price, in size sort order. */
export function sizesForProduct(
  catalog: OrderCatalog,
  productId: string | null | undefined,
): SizeOption[] {
  const product = findProduct(catalog, productId);
  if (!product) return [];
  if (!product.sizes.length) return catalog.sizes;
  const links = new Map(product.sizes.map((l) => [l.sizeId, l.price]));
  return catalog.sizes
    .filter((s) => links.has(s.id))
    .map((s) => ({ ...s, price: links.get(s.id) ?? s.price }));
}

/** "Sedang (±250 g)" — skips dims already contained in the name. */
export function sizeLabel(size: Pick<CatalogSize, "name" | "dims">): string {
  const dims = size.dims?.trim();
  if (!dims || size.name.toLowerCase().includes(dims.toLowerCase()))
    return size.name;
  return `${size.name} (${dims})`;
}
