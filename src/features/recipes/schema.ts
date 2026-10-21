import { z } from "zod";

import { recipeDifficulty } from "@/db/schema/enums";
import {
  dateTimeSchema,
  optionalText,
  requiredText,
  richTextDocSchema,
  seoSchema,
  slugSchema,
  uuidSchema,
} from "@/features/_shared/schema";
import { contentStatusSchema, withPublishRule } from "@/features/posts/schema";

export const recipeDifficultySchema = z.enum(recipeDifficulty.enumValues);

export const recipeIngredientSchema = z.object({
  item: requiredText(160, "Bahan"),
  qty: z.string().trim().max(60).optional(),
  note: z.string().trim().max(200).optional(),
  group: z.string().trim().max(80).optional(),
});

export const recipeStepSchema = z.object({
  text: requiredText(2000, "Langkah"),
  mediaId: uuidSchema.nullish(),
});

const minutes = z.coerce
  .number()
  .int()
  .min(0)
  .max(10_000)
  .nullish()
  .transform((v) => v ?? null);

export const recipeInputSchema = z
  .object({
    slug: slugSchema,
    title: requiredText(160, "Judul"),
    excerpt: optionalText(400),
    content: richTextDocSchema.nullish().transform((v) => v ?? null),
    ingredients: z.array(recipeIngredientSchema).max(100).default([]),
    steps: z.array(recipeStepSchema).max(100).default([]),
    prepMinutes: minutes,
    cookMinutes: minutes,
    servings: z.coerce
      .number()
      .int()
      .min(1)
      .max(1000)
      .nullish()
      .transform((v) => v ?? null),
    difficulty: recipeDifficultySchema.nullish().transform((v) => v ?? null),
    productId: uuidSchema.nullish().transform((v) => v ?? null),
    categoryId: uuidSchema.nullish().transform((v) => v ?? null),
    coverMediaId: uuidSchema.nullish().transform((v) => v ?? null),
    status: contentStatusSchema.default("draft"),
    publishedAt: dateTimeSchema,
    seo: seoSchema,
  })
  .superRefine(withPublishRule);
export type RecipeInput = z.input<typeof recipeInputSchema>;
export type RecipeData = z.output<typeof recipeInputSchema>;
