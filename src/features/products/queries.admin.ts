import "server-only";

import { asc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import {
  nutrition,
  productMedia,
  products,
  productShapeLinks,
  productShapes,
  productSizeLinks,
  productSizes,
} from "@/db/schema";

/** Admin: all products incl. inactive. */
export async function listProductsForAdmin() {
  return getDb().select().from(products).orderBy(asc(products.sort), asc(products.name));
}

export async function getProductForAdmin(id: string) {
  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return null;
  const [shapeLinks, sizeLinks, nutr, gallery] = await Promise.all([
    db.select().from(productShapeLinks).where(eq(productShapeLinks.productId, id)).orderBy(asc(productShapeLinks.sort)),
    db.select().from(productSizeLinks).where(eq(productSizeLinks.productId, id)).orderBy(asc(productSizeLinks.sort)),
    db.select().from(nutrition).where(eq(nutrition.productId, id)),
    db.select().from(productMedia).where(eq(productMedia.productId, id)).orderBy(asc(productMedia.sort)),
  ]);
  return {
    ...product,
    shapeIds: shapeLinks.map((l) => l.shapeId),
    sizes: sizeLinks.map((l) => ({ sizeId: l.sizeId, price: l.price })),
    mediaIds: gallery.map((g) => g.mediaId),
    nutrition: nutr,
  };
}

export async function listShapesForAdmin() {
  return getDb().select().from(productShapes).orderBy(asc(productShapes.sort));
}

export async function listSizesForAdmin() {
  return getDb().select().from(productSizes).orderBy(asc(productSizes.sort));
}
