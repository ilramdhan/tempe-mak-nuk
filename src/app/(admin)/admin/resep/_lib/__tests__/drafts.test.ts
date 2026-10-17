import { describe, expect, it } from "vitest";

import { postInputSchema } from "@/features/posts/schema";
import { recipeInputSchema } from "@/features/recipes/schema";

import {
  emptyPostDraft,
  postDraftFromRecord,
  postSnapshot,
  toPostInput,
  validatePostDraft,
  withTitle,
} from "../../../jurnal/_lib/post-draft";
import {
  emptyIngredient,
  emptyRecipeDraft,
  emptyStep,
  recipeDraftFromRecord,
  recipeSnapshot,
  toRecipeInput,
  totalMinutes,
  validateRecipeDraft,
} from "../recipe-draft";

const UUID = "3f1c6f7e-1d2b-4c5a-9e8f-0a1b2c3d4e5f";
const now = new Date("2026-10-17T08:00:00.000Z");

describe("post draft", () => {
  it("auto slug follows title until edited", () => {
    let d = withTitle(emptyPostDraft(), "Tempe Bacem Manis");
    expect(d.slug).toBe("tempe-bacem-manis");
    d = { ...d, slug: "bacem", slugAuto: false };
    expect(withTitle(d, "Lain").slug).toBe("bacem");
  });

  it("validates required fields and schedule date", () => {
    const e = validatePostDraft(
      { ...emptyPostDraft(), status: "scheduled" },
      now,
    );
    expect(e.title).toBeTruthy();
    expect(e.slug).toBeTruthy();
    expect(e.publishedAt).toBeTruthy();
  });

  it("produces schema-valid input with WIB date and trimmed SEO", () => {
    const d = {
      ...withTitle(emptyPostDraft(), "Halo"),
      status: "scheduled" as const,
      publishedAt: "2026-10-20T09:00",
      readingMinutes: "4",
      seo: {
        title: "",
        description: "Deskripsi",
        ogImageId: null,
        noindex: false,
      },
      tagIds: [UUID],
    };
    expect(validatePostDraft(d, now)).toEqual({});
    const input = toPostInput(d);
    expect(input.publishedAt).toBe("2026-10-20T02:00:00.000Z");
    expect(input.seo).toEqual({
      title: undefined,
      description: "Deskripsi",
      ogImageId: null,
      noindex: undefined,
    });
    const parsed = postInputSchema.parse(input);
    expect(parsed.readingMinutes).toBe(4);
    expect(parsed.excerpt).toBeNull();
  });

  it("round-trips a DB record without becoming dirty", () => {
    const rec = {
      title: "A",
      slug: "a",
      excerpt: null,
      content: {
        type: "doc" as const,
        content: [
          { type: "paragraph", content: [{ type: "text", text: "x" }] },
        ],
      },
      coverMediaId: null,
      categoryId: UUID,
      status: "published" as const,
      publishedAt: new Date("2026-10-01T01:00:00Z"),
      readingMinutes: null,
      seo: {},
      tagIds: [UUID],
    };
    const d = postDraftFromRecord(rec);
    expect(d.publishedAt).toBe("2026-10-01T08:00");
    expect(postSnapshot(d)).toBe(postSnapshot(postDraftFromRecord(rec)));
    expect(postSnapshot({ ...d, title: "B" })).not.toBe(postSnapshot(d));
  });
});

describe("recipe draft", () => {
  it("drops blank rows and maps row errors back to the draft index", () => {
    const d = {
      ...emptyRecipeDraft(),
      title: "Mendoan",
      slug: "mendoan",
      ingredients: [
        { ...emptyIngredient(), item: "Tempe", qty: "1 papan" },
        emptyIngredient(),
        { ...emptyIngredient(), qty: "2 sdm" }, // missing item → error at draft index 2
      ],
      steps: [emptyStep(), { ...emptyStep(), text: "Goreng." }],
    };
    const input = toRecipeInput(d);
    expect(input.ingredients).toHaveLength(2);
    expect(input.steps).toEqual([{ text: "Goreng.", mediaId: null }]);
    const e = validateRecipeDraft(d, now);
    expect(Object.keys(e)).toEqual(["ingredients.2.item"]);
  });

  it("produces schema-valid input", () => {
    const d = {
      ...emptyRecipeDraft(),
      title: "Mendoan",
      slug: "mendoan",
      prepMinutes: "10",
      cookMinutes: "",
      servings: "4",
      difficulty: "easy" as const,
      ingredients: [{ ...emptyIngredient(), item: "Tempe", group: "Utama" }],
      steps: [{ ...emptyStep(), text: "Iris." }],
    };
    expect(validateRecipeDraft(d, now)).toEqual({});
    const parsed = recipeInputSchema.parse(toRecipeInput(d));
    expect(parsed.prepMinutes).toBe(10);
    expect(parsed.cookMinutes).toBeNull();
    expect(parsed.ingredients[0]).toEqual({
      item: "Tempe",
      qty: undefined,
      note: undefined,
      group: "Utama",
    });
  });

  it("rejects out-of-range numbers", () => {
    const d = { ...emptyRecipeDraft(), title: "A", slug: "a", servings: "0" };
    expect(validateRecipeDraft(d, now).servings).toBeTruthy();
  });

  it("round-trips a record", () => {
    const rec = {
      title: "A",
      slug: "a",
      excerpt: "x",
      content: null,
      ingredients: [{ item: "Tempe", qty: "1" }],
      steps: [{ text: "Goreng", mediaId: null }],
      prepMinutes: 5,
      cookMinutes: null,
      servings: 2,
      difficulty: null,
      productId: null,
      categoryId: null,
      coverMediaId: null,
      status: "draft" as const,
      publishedAt: null,
      seo: { noindex: true },
    };
    const d = recipeDraftFromRecord(rec);
    expect(d.seo.noindex).toBe(true);
    expect(d.prepMinutes).toBe("5");
    expect(recipeSnapshot(d)).toBe(recipeSnapshot(recipeDraftFromRecord(rec)));
  });

  it("totalMinutes", () => {
    expect(totalMinutes(null, null)).toBeNull();
    expect(totalMinutes(5, null)).toBe(5);
    expect(totalMinutes(5, 10)).toBe(15);
  });
});
