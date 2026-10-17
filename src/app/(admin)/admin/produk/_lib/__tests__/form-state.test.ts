import { describe, expect, it } from "vitest";

import {
  autoSlug,
  emptyDraft,
  isDirty,
  mapServerErrors,
  move,
  parseNutrient,
  toProductInput,
  validateDraft,
} from "../form-state";

describe("produk form-state", () => {
  it("autoSlug strips accents and symbols", () => {
    expect(autoSlug("Tempe Mak Nuk — Kélas 1!")).toBe("tempe-mak-nuk-kelas-1");
  });
  it("empty draft is invalid (name, slug)", () => {
    const e = validateDraft(emptyDraft());
    expect(e.name).toBeTruthy();
    expect(e.slug).toBeTruthy();
  });
  it("valid draft passes; price blank -> null", () => {
    const d = { ...emptyDraft(), name: "Tempe", slug: "tempe" };
    expect(validateDraft(d)).toEqual({});
    expect(toProductInput(d).priceFrom).toBeNull();
    expect(toProductInput({ ...d, priceFrom: "12.500" }).priceFrom).toBe(12500);
  });
  it("reports nested size price errors", () => {
    const d = {
      ...emptyDraft(),
      name: "T",
      slug: "t",
      sizes: [{ sizeId: "7f0c2a5e-3b1d-4c6e-8f9a-0b1c2d3e4f50", price: "-5" }],
    };
    expect(validateDraft(d)["sizes.0.price"]).toBeTruthy();
  });
  it("move / dirty / server errors / nutrient", () => {
    expect(move([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(move([1, 2], 0, 5)).toEqual([1, 2]);
    expect(isDirty(emptyDraft(), emptyDraft())).toBe(false);
    expect(isDirty(emptyDraft(), { ...emptyDraft(), name: "x" })).toBe(true);
    expect(mapServerErrors({ slug: ["a", "b"] })).toEqual({ slug: "a" });
    expect(parseNutrient("")).toBeNull();
    expect(parseNutrient("12,5")).toBe(12.5);
  });
});
