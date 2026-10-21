import "server-only";

import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { recipes, type ContentStatus } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";

export async function listRecipesForAdmin(
  opts: { status?: ContentStatus } = {},
) {
  await requireRole("editor", { onFail: "redirect" });
  return getDb()
    .select({
      id: recipes.id,
      slug: recipes.slug,
      title: recipes.title,
      status: recipes.status,
      publishedAt: recipes.publishedAt,
      categoryId: recipes.categoryId,
      productId: recipes.productId,
      updatedAt: recipes.updatedAt,
    })
    .from(recipes)
    .where(opts.status ? eq(recipes.status, opts.status) : undefined)
    .orderBy(desc(recipes.updatedAt));
}

export async function getRecipeForAdmin(id: string) {
  await requireRole("editor", { onFail: "redirect" });
  const [row] = await getDb()
    .select()
    .from(recipes)
    .where(eq(recipes.id, id))
    .limit(1);
  return row ?? null;
}
