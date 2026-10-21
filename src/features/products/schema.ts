import { z } from "zod";

import { productVariant } from "@/db/schema/enums";
import {
  nullableIntSchema,
  optionalText,
  requiredText,
  richTextDocSchema,
  seoSchema,
  slugSchema,
  sortSchema,
  uuidSchema,
} from "@/features/_shared/schema";

export const productVariantSchema = z.enum(productVariant.enumValues);

export const productInputSchema = z.object({
  slug: slugSchema,
  name: requiredText(120, "Nama produk"),
  short: optionalText(300),
  description: richTextDocSchema.nullish().transform((v) => v ?? null),
  variant: productVariantSchema,
  priceFrom: nullableIntSchema(0, 100_000_000),
  isActive: z.boolean().default(true),
  sort: sortSchema,
  seo: seoSchema,
  /** Linked shapes (order kept as given). Omit to leave links untouched on update. */
  shapeIds: z.array(uuidSchema).max(50).optional(),
  /** Linked sizes with optional per-product price override. */
  sizes: z
    .array(
      z.object({
        sizeId: uuidSchema,
        price: nullableIntSchema(0, 100_000_000),
      }),
    )
    .max(50)
    .optional(),
  /** Gallery media ids in display order. */
  mediaIds: z.array(uuidSchema).max(30).optional(),
});
export type ProductInput = z.input<typeof productInputSchema>;
export type ProductData = z.output<typeof productInputSchema>;

export const productShapeInputSchema = z.object({
  slug: slugSchema,
  name: requiredText(80, "Nama bentuk"),
  description: optionalText(500),
  sort: sortSchema,
  active: z.boolean().default(true),
});
export type ProductShapeInput = z.input<typeof productShapeInputSchema>;

export const productSizeInputSchema = z.object({
  name: requiredText(80, "Nama ukuran"),
  weightGrams: nullableIntSchema(0, 100_000),
  dims: optionalText(80),
  price: nullableIntSchema(0, 100_000_000),
  sort: sortSchema,
  active: z.boolean().default(true),
});
export type ProductSizeInput = z.input<typeof productSizeInputSchema>;

const nutrient = z.coerce
  .number()
  .min(0)
  .max(100_000)
  .nullish()
  .transform((v) => v ?? null);

export const nutritionInputSchema = z.object({
  productId: uuidSchema,
  perGrams: z.coerce.number().int().min(1).max(10_000).default(100),
  energyKcal: nutrient,
  proteinG: nutrient,
  fatG: nutrient,
  carbsG: nutrient,
  fiberG: nutrient,
  calciumMg: nutrient,
  ironMg: nutrient,
  source: requiredText(300, "Sumber data gizi"),
  sourceUrl: z
    .url()
    .nullish()
    .transform((v) => v ?? null),
});
export type NutritionInput = z.input<typeof nutritionInputSchema>;
