"use server";

import { eq, sql } from "drizzle-orm";
import { z } from "zod";

import { recipes } from "@/db/schema";
import { fail, type ActionResult } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";
import { uuidSchema } from "@/features/_shared/schema";
import { tags } from "@/lib/cache-tags";

import { recipeInputSchema, type RecipeData, type RecipeInput } from "./schema";

function columns(d: RecipeData) {
  return {
    ...d,
    ingredients: d.ingredients.map((i) => ({ ...i })),
    steps: d.steps.map((s) => ({ text: s.text, mediaId: s.mediaId ?? null })),
    publishedAt:
      d.status === "published" && !d.publishedAt ? new Date() : d.publishedAt,
  };
}

export async function createRecipe(
  input: RecipeInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  return adminAction({
    schema: recipeInputSchema,
    input,
    entity: "recipes",
    action: "create",
    run: async (data, { tx }) => {
      const [row] = await tx
        .insert(recipes)
        .values(columns(data))
        .returning({ id: recipes.id, slug: recipes.slug });
      return {
        result: row,
        entityId: row.id,
        diff: { ...data, content: undefined },
        tags: [tags.recipes, tags.recipe(row.slug)],
      };
    },
  });
}

export async function updateRecipe(
  id: string,
  input: RecipeInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  return adminAction({
    schema: z.intersection(recipeInputSchema, z.object({ id: uuidSchema })),
    input: { ...input, id },
    entity: "recipes",
    action: "update",
    run: async ({ id, ...data }, { tx }) => {
      const [prev] = await tx
        .select({ slug: recipes.slug })
        .from(recipes)
        .where(eq(recipes.id, id))
        .limit(1);
      if (!prev) return fail("Resep tidak ditemukan.");
      const [row] = await tx
        .update(recipes)
        .set(columns(data))
        .where(eq(recipes.id, id))
        .returning({ id: recipes.id, slug: recipes.slug });
      return {
        result: row,
        entityId: id,
        diff: { ...data, content: undefined },
        tags: [tags.recipes, tags.recipe(prev.slug), tags.recipe(row.slug)],
      };
    },
  });
}

export async function deleteRecipe(id: string): Promise<ActionResult> {
  return adminAction({
    // P8.14: owner-only by default; the owner may grant `recipes.delete` via /admin/akses.
    role: "owner",
    schema: z.object({ id: uuidSchema }),
    input: { id },
    entity: "recipes",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const [row] = await tx
        .delete(recipes)
        .where(eq(recipes.id, id))
        .returning({ slug: recipes.slug, title: recipes.title });
      if (!row) return fail("Resep tidak ditemukan.");
      return {
        result: undefined,
        entityId: id,
        diff: row,
        tags: [tags.recipes, tags.recipe(row.slug)],
      };
    },
  });
}

export async function setRecipeStatus(
  id: string,
  status: "draft" | "published" | "scheduled",
  publishedAt?: Date | string | null,
): Promise<ActionResult> {
  return adminAction({
    schema: z
      .object({
        id: uuidSchema,
        status: z.enum(["draft", "published", "scheduled"]),
        publishedAt: z.coerce.date().nullish(),
      })
      .refine((v) => v.status !== "scheduled" || v.publishedAt, {
        path: ["publishedAt"],
        message: "Tanggal terbit wajib diisi",
      }),
    input: { id, status, publishedAt },
    entity: "recipes",
    action: status === "draft" ? "unpublish" : "publish",
    run: async ({ id, status, publishedAt }, { tx }) => {
      const [row] = await tx
        .update(recipes)
        .set({
          status,
          ...(status !== "draft"
            ? {
                publishedAt:
                  publishedAt ?? sql`coalesce(${recipes.publishedAt}, now())`,
              }
            : {}),
        })
        .where(eq(recipes.id, id))
        .returning({ slug: recipes.slug });
      if (!row) return fail("Resep tidak ditemukan.");
      return {
        result: undefined,
        entityId: id,
        tags: [tags.recipes, tags.recipe(row.slug)],
      };
    },
  });
}
