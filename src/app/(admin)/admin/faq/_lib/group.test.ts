import { describe, expect, it } from "vitest";

import { groupFaqs, reorderWithin, type FaqRow } from "./group";

const f = (id: string, categoryId: string | null): FaqRow => ({
  id,
  question: id,
  answer: "a",
  categoryId,
  sort: 0,
  visible: true,
  showOnHome: false,
});

describe("faq grouping", () => {
  const list = [f("a", "c1"), f("b", null), f("c", "c1"), f("d", "gone")];
  it("groups by category with uncategorised last", () => {
    const g = groupFaqs(list, [{ id: "c1", name: "Umum" }]);
    expect(g.map((x) => x.items.map((i) => i.id))).toEqual([
      ["a", "c"],
      ["b", "d"],
    ]);
    expect(g[1].name).toBe("Tanpa kategori");
  });
  it("shows empty uncategorised group when nothing exists", () => {
    expect(groupFaqs([], [])).toHaveLength(1);
  });
  it("reorders inside a group without touching others", () => {
    const next = reorderWithin(list, ["a", "c"], 0, 1);
    expect(next.map((x) => x.id)).toEqual(["c", "b", "a", "d"]);
  });
});
