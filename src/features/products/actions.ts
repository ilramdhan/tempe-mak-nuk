"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import type { Database } from "@/db/client";
import {
  nutrition,
  productMedia,
  products,
  productShapeLinks,
  productShapes,
  productSizeLinks,
  productSizes,
} from "@/db/schema";
import { fail, type ActionResult } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";
import { applyOrder } from "@/features/_shared/reorder";
import { reorderSchema, uuidSchema } from "@/features/_shared/schema";
import { tags } from "@/lib/cache-tags";

import {
  nutritionInputSchema,
  productInputSchema,
  productShapeInputSchema,
  productSizeInputSchema,
  type NutritionInput,
  type ProductData,
  type ProductInput,
  type ProductShapeInput,
  type ProductSizeInput,
} from "./schema";

type Tx = Parameters<Parameters<Database["transaction"]>[0]>[0];
const idSchema = z.object({ id: uuidSchema });

async function syncLinks(tx: Tx, productId: string, data: ProductData) {
  if (data.shapeIds) {
    await tx.delete(productShapeLinks).where(eq(productShapeLinks.productId, productId));
    if (data.shapeIds.length)
      await tx.insert(productShapeLinks).values(data.shapeIds.map((shapeId, sort) => ({ productId, shapeId, sort })));
  }
  if (data.sizes) {
    await tx.delete(productSizeLinks).where(eq(productSizeLinks.productId, productId));
    if (data.sizes.length)
      await tx
        .insert(productSizeLinks)
        .values(data.sizes.map((s, sort) => ({ productId, sizeId: s.sizeId, price: s.price, sort })));
  }
  if (data.mediaIds) {
    await tx.delete(productMedia).where(eq(productMedia.productId, productId));
    if (data.mediaIds.length)
      await tx.insert(productMedia).values(data.mediaIds.map((mediaId, sort) => ({ productId, mediaId, sort })));
  }
}

function columns(d: ProductData) {
  return {
    slug: d.slug,
    name: d.name,
    short: d.short,
    description: d.description,
    variant: d.variant,
    priceFrom: d.priceFrom,
    isActive: d.isActive,
    sort: d.sort,
    seo: d.seo,
  };
}

export async function createProduct(input: ProductInput): Promise<ActionResult<{ id: string; slug: string }>> {
  return adminAction({
    schema: productInputSchema,
    input,
    entity: "products",
    action: "create",
    run: async (data, { tx }) => {
      const [row] = await tx.insert(products).values(columns(data)).returning({ id: products.id, slug: products.slug });
      await syncLinks(tx, row.id, data);
      return { result: row, entityId: row.id, tags: [tags.products, tags.product(row.slug), tags.productOptions] };
    },
  });
}

export async function updateProduct(id: string, input: ProductInput): Promise<ActionResult<{ id: string; slug: string }>> {
  return adminAction({
    schema: productInputSchema.extend({ id: uuidSchema }),
    input: { ...input, id },
    entity: "products",
    action: "update",
    run: async ({ id, ...data }, { tx }) => {
      const [prev] = await tx.select({ slug: products.slug }).from(products).where(eq(products.id, id)).limit(1);
      if (!prev) return fail("Produk tidak ditemukan.");
      const [row] = await tx
        .update(products)
        .set(columns(data))
        .where(eq(products.id, id))
        .returning({ id: products.id, slug: products.slug });
      await syncLinks(tx, id, data);
      return {
        result: row,
        entityId: id,
        tags: [tags.products, tags.product(prev.slug), tags.product(row.slug), tags.productOptions, tags.recipes],
      };
    },
  });
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  return adminAction({
    role: "owner",
    schema: idSchema,
    input: { id },
    entity: "products",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const [row] = await tx.delete(products).where(eq(products.id, id)).returning({ slug: products.slug });
      if (!row) return fail("Produk tidak ditemukan.");
      return { result: undefined, entityId: id, diff: row, tags: [tags.products, tags.product(row.slug), tags.productOptions, tags.recipes] };
    },
  });
}

export async function reorderProducts(ids: string[]): Promise<ActionResult> {
  return adminAction({
    schema: reorderSchema,
    input: { ids },
    entity: "products",
    action: "reorder",
    run: async ({ ids }, { tx }) => {
      await applyOrder(tx, products, products.id, products.sort, ids);
      return { result: undefined, tags: [tags.products, tags.productOptions] };
    },
  });
}

// ── Shapes ────────────────────────────────────────────────────────────────
const optionTags = [tags.productOptions, tags.products];

export async function createProductShape(input: ProductShapeInput): Promise<ActionResult<{ id: string }>> {
  return adminAction({
    schema: productShapeInputSchema,
    input,
    entity: "product_shapes",
    action: "create",
    run: async (data, { tx }) => {
      const [row] = await tx.insert(productShapes).values(data).returning({ id: productShapes.id });
      return { result: row, entityId: row.id, tags: optionTags };
    },
  });
}

export async function updateProductShape(id: string, input: ProductShapeInput): Promise<ActionResult> {
  return adminAction({
    schema: productShapeInputSchema.extend({ id: uuidSchema }),
    input: { ...input, id },
    entity: "product_shapes",
    action: "update",
    run: async ({ id, ...data }, { tx }) => {
      const rows = await tx.update(productShapes).set(data).where(eq(productShapes.id, id)).returning({ id: productShapes.id });
      if (!rows.length) return fail("Bentuk tidak ditemukan.");
      return { result: undefined, entityId: id, tags: optionTags };
    },
  });
}

export async function deleteProductShape(id: string): Promise<ActionResult> {
  return adminAction({
    schema: idSchema,
    input: { id },
    entity: "product_shapes",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const rows = await tx.delete(productShapes).where(eq(productShapes.id, id)).returning({ id: productShapes.id });
      if (!rows.length) return fail("Bentuk tidak ditemukan.");
      return { result: undefined, entityId: id, tags: optionTags };
    },
  });
}

export async function reorderProductShapes(ids: string[]): Promise<ActionResult> {
  return adminAction({
    schema: reorderSchema,
    input: { ids },
    entity: "product_shapes",
    action: "reorder",
    run: async ({ ids }, { tx }) => {
      await applyOrder(tx, productShapes, productShapes.id, productShapes.sort, ids);
      return { result: undefined, tags: optionTags };
    },
  });
}

// ── Sizes ─────────────────────────────────────────────────────────────────
export async function createProductSize(input: ProductSizeInput): Promise<ActionResult<{ id: string }>> {
  return adminAction({
    schema: productSizeInputSchema,
    input,
    entity: "product_sizes",
    action: "create",
    run: async (data, { tx }) => {
      const [row] = await tx.insert(productSizes).values(data).returning({ id: productSizes.id });
      return { result: row, entityId: row.id, tags: optionTags };
    },
  });
}

export async function updateProductSize(id: string, input: ProductSizeInput): Promise<ActionResult> {
  return adminAction({
    schema: productSizeInputSchema.extend({ id: uuidSchema }),
    input: { ...input, id },
    entity: "product_sizes",
    action: "update",
    run: async ({ id, ...data }, { tx }) => {
      const rows = await tx.update(productSizes).set(data).where(eq(productSizes.id, id)).returning({ id: productSizes.id });
      if (!rows.length) return fail("Ukuran tidak ditemukan.");
      return { result: undefined, entityId: id, tags: optionTags };
    },
  });
}

export async function deleteProductSize(id: string): Promise<ActionResult> {
  return adminAction({
    schema: idSchema,
    input: { id },
    entity: "product_sizes",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const rows = await tx.delete(productSizes).where(eq(productSizes.id, id)).returning({ id: productSizes.id });
      if (!rows.length) return fail("Ukuran tidak ditemukan.");
      return { result: undefined, entityId: id, tags: optionTags };
    },
  });
}

export async function reorderProductSizes(ids: string[]): Promise<ActionResult> {
  return adminAction({
    schema: reorderSchema,
    input: { ids },
    entity: "product_sizes",
    action: "reorder",
    run: async ({ ids }, { tx }) => {
      await applyOrder(tx, productSizes, productSizes.id, productSizes.sort, ids);
      return { result: undefined, tags: optionTags };
    },
  });
}

// ── Nutrition ─────────────────────────────────────────────────────────────
/** Upsert nutrition for (productId, perGrams). */
export async function upsertNutrition(input: NutritionInput): Promise<ActionResult<{ id: string }>> {
  return adminAction({
    schema: nutritionInputSchema,
    input,
    entity: "nutrition",
    action: "update",
    run: async (data, { tx }) => {
      const [p] = await tx.select({ slug: products.slug }).from(products).where(eq(products.id, data.productId)).limit(1);
      if (!p) return fail("Produk tidak ditemukan.");
      const { productId, perGrams, ...rest } = data;
      const [row] = await tx
        .insert(nutrition)
        .values(data)
        .onConflictDoUpdate({ target: [nutrition.productId, nutrition.perGrams], set: rest })
        .returning({ id: nutrition.id });
      void productId;
      void perGrams;
      return { result: row, entityId: row.id, tags: [tags.product(p.slug)] };
    },
  });
}

export async function deleteNutrition(id: string): Promise<ActionResult> {
  return adminAction({
    schema: idSchema,
    input: { id },
    entity: "nutrition",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const [row] = await tx.delete(nutrition).where(eq(nutrition.id, id)).returning({ productId: nutrition.productId });
      if (!row) return fail("Data gizi tidak ditemukan.");
      const [p] = await tx.select({ slug: products.slug }).from(products).where(eq(products.id, row.productId)).limit(1);
      return { result: undefined, entityId: id, tags: [tags.products, p && tags.product(p.slug)] };
    },
  });
}
