import "server-only";

import { getRecipeForAdmin } from "@/features/recipes/queries.admin";
import type { TiptapDoc } from "@/lib/rich-text/schema";

import {
  loadCategoryOptions,
  loadMediaOptions,
  loadProductOptions,
} from "../../jurnal/_shared/lib/load";
import { visibilityOf } from "../../jurnal/_shared/lib/publish";
import type { RecipeEditorOptions } from "../_components/recipe-editor";
import { recipeDraftFromRecord, type RecipeDraft } from "./recipe-draft";

export async function loadRecipeOptions(): Promise<RecipeEditorOptions> {
  const [media, categories, products] = await Promise.all([
    loadMediaOptions(),
    loadCategoryOptions("recipe"),
    loadProductOptions(),
  ]);
  return { media, categories, products };
}

export async function loadRecipeDraft(
  id: string,
): Promise<{ draft: RecipeDraft; liveSlug: string | null } | null> {
  const r = await getRecipeForAdmin(id);
  if (!r) return null;
  return {
    draft: recipeDraftFromRecord({
      ...r,
      content: (r.content ?? null) as TiptapDoc | null,
    }),
    liveSlug: visibilityOf(r.status, r.publishedAt) === "live" ? r.slug : null,
  };
}
