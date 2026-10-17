/** Recipe editor state ↔ `RecipeInput` (pure; unit-tested). */
import { toStoredDoc } from "@/components/admin/editor/doc-utils";
import type { RecipeDifficulty } from "@/db/schema/enums";
import { recipeInputSchema, type RecipeInput } from "@/features/recipes/schema";
import type { TiptapDoc } from "@/lib/rich-text/schema";

import {
  numberOrNull,
  numberToInput,
  seoFromDb,
  seoToInput,
  stableStringify,
  validateWith,
  type FieldErrors,
  type SeoDraft,
} from "../../jurnal/_shared/lib/form";
import {
  checkPublish,
  publishedAtForSave,
  toWibInput,
  type ContentStatus,
} from "../../jurnal/_shared/lib/publish";

export type IngredientDraft = {
  key: string;
  item: string;
  qty: string;
  note: string;
  group: string;
};
export type StepDraft = { key: string; text: string; mediaId: string | null };

export type RecipeDraft = {
  title: string;
  slug: string;
  slugAuto: boolean;
  excerpt: string;
  /** "Tips dan catatan" (rich text). */
  content: TiptapDoc | null;
  ingredients: IngredientDraft[];
  steps: StepDraft[];
  prepMinutes: string;
  cookMinutes: string;
  servings: string;
  difficulty: RecipeDifficulty | null;
  productId: string | null;
  categoryId: string | null;
  coverMediaId: string | null;
  status: ContentStatus;
  publishedAt: string;
  seo: SeoDraft;
};

export type RecipeRecord = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: TiptapDoc | null;
  ingredients: { item: string; qty?: string; note?: string; group?: string }[];
  steps: { text: string; mediaId?: string | null }[];
  prepMinutes: number | null;
  cookMinutes: number | null;
  servings: number | null;
  difficulty: RecipeDifficulty | null;
  productId: string | null;
  categoryId: string | null;
  coverMediaId: string | null;
  status: ContentStatus;
  publishedAt: Date | string | null;
  seo: Parameters<typeof seoFromDb>[0];
};

export const DIFFICULTY_LABEL: Record<RecipeDifficulty, string> = {
  easy: "Mudah",
  medium: "Sedang",
  hard: "Menantang",
};

let seq = 0;
export const newKey = () =>
  `k${Date.now().toString(36)}${(seq++).toString(36)}`;

export const emptyIngredient = (group = ""): IngredientDraft => ({
  key: newKey(),
  item: "",
  qty: "",
  note: "",
  group,
});
export const emptyStep = (): StepDraft => ({
  key: newKey(),
  text: "",
  mediaId: null,
});

export function emptyRecipeDraft(): RecipeDraft {
  return {
    title: "",
    slug: "",
    slugAuto: true,
    excerpt: "",
    content: null,
    ingredients: [emptyIngredient()],
    steps: [emptyStep()],
    prepMinutes: "",
    cookMinutes: "",
    servings: "",
    difficulty: null,
    productId: null,
    categoryId: null,
    coverMediaId: null,
    status: "draft",
    publishedAt: "",
    seo: seoFromDb(null),
  };
}

export function recipeDraftFromRecord(r: RecipeRecord): RecipeDraft {
  return {
    title: r.title,
    slug: r.slug,
    slugAuto: false,
    excerpt: r.excerpt ?? "",
    content: r.content,
    ingredients: r.ingredients.map((i, n) => ({
      key: `i${n}`,
      item: i.item,
      qty: i.qty ?? "",
      note: i.note ?? "",
      group: i.group ?? "",
    })),
    steps: r.steps.map((s, n) => ({
      key: `s${n}`,
      text: s.text,
      mediaId: s.mediaId ?? null,
    })),
    prepMinutes: numberToInput(r.prepMinutes),
    cookMinutes: numberToInput(r.cookMinutes),
    servings: numberToInput(r.servings),
    difficulty: r.difficulty,
    productId: r.productId,
    categoryId: r.categoryId,
    coverMediaId: r.coverMediaId,
    status: r.status,
    publishedAt: toWibInput(r.publishedAt),
    seo: seoFromDb(r.seo),
  };
}

const opt = (v: string) => (v.trim() ? v.trim() : undefined);

/** Fully blank rows are dropped (so an empty trailing row doesn't block saving). */
export function toRecipeInput(d: RecipeDraft): RecipeInput {
  return {
    slug: d.slug.trim(),
    title: d.title,
    excerpt: d.excerpt,
    content: d.content,
    ingredients: d.ingredients
      .filter((i) => i.item.trim() || i.qty.trim() || i.note.trim())
      .map((i) => ({
        item: i.item,
        qty: opt(i.qty),
        note: opt(i.note),
        group: opt(i.group),
      })),
    steps: d.steps
      .filter((s) => s.text.trim() || s.mediaId)
      .map((s) => ({ text: s.text, mediaId: s.mediaId })),
    prepMinutes: numberOrNull(d.prepMinutes) as RecipeInput["prepMinutes"],
    cookMinutes: numberOrNull(d.cookMinutes) as RecipeInput["cookMinutes"],
    servings: numberOrNull(d.servings) as RecipeInput["servings"],
    difficulty: d.difficulty,
    productId: d.productId,
    categoryId: d.categoryId,
    coverMediaId: d.coverMediaId,
    status: d.status,
    publishedAt: publishedAtForSave(d.publishedAt),
    seo: seoToInput(d.seo),
  };
}

/**
 * Map an error key on the *filtered* input array ("ingredients.1.item") back onto the draft
 * row index (blank rows were skipped).
 */
export function remapRowErrors(
  d: RecipeDraft,
  errors: FieldErrors,
): FieldErrors {
  const idx = {
    ingredients: d.ingredients
      .map((i, n) => (i.item.trim() || i.qty.trim() || i.note.trim() ? n : -1))
      .filter((n) => n >= 0),
    steps: d.steps
      .map((s, n) => (s.text.trim() || s.mediaId ? n : -1))
      .filter((n) => n >= 0),
  };
  const out: FieldErrors = {};
  for (const [k, v] of Object.entries(errors)) {
    const m = /^(ingredients|steps)\.(\d+)(\..*)?$/.exec(k);
    if (m) {
      const real = idx[m[1] as "ingredients" | "steps"][Number(m[2])];
      out[`${m[1]}.${real ?? m[2]}${m[3] ?? ""}`] ??= v;
    } else out[k] ??= v;
  }
  return out;
}

export function validateRecipeDraft(
  d: RecipeDraft,
  now = new Date(),
): FieldErrors {
  const errors = remapRowErrors(
    d,
    validateWith(recipeInputSchema, toRecipeInput(d)),
  );
  const pub = checkPublish(d.status, d.publishedAt, now);
  if (pub.error) errors.publishedAt ??= pub.error;
  return errors;
}

export function recipeSnapshot(d: RecipeDraft): string {
  return stableStringify({
    ...toRecipeInput(d),
    content: toStoredDoc(d.content),
  });
}

/** Total minutes for the list ("—" when unknown). */
export function totalMinutes(
  prep: number | null,
  cook: number | null,
): number | null {
  if (prep === null && cook === null) return null;
  return (prep ?? 0) + (cook ?? 0);
}
