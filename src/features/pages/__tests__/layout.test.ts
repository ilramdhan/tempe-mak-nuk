import { describe, expect, it } from "vitest";

import { splitPageSections } from "@/features/pages/layout";

const hero = {
  id: "h",
  type: "hero",
  data: { eyebrow: "FAQ", headline: "Judul", subheadline: null },
};
const rich = (id: string) => ({
  id,
  type: "richText",
  data: { content: { type: "doc", content: [] } },
});
const faq = { id: "f", type: "faqList", data: { category: "produk" } };

describe("splitPageSections", () => {
  it("handles a missing page", () => {
    expect(splitPageSections(null, "faqList")).toEqual({
      intro: null,
      before: [],
      marker: null,
      after: [],
    });
  });

  it("takes a leading hero as intro and splits around the marker", () => {
    const r = splitPageSections([hero, rich("a"), faq, rich("b")], "faqList");
    expect(r.intro).toMatchObject({
      eyebrow: "FAQ",
      headline: "Judul",
      subheadline: null,
      primaryCta: null,
    });
    expect(r.before.map((s) => s.id)).toEqual(["a"]);
    expect(r.marker).toMatchObject({ category: "produk", searchable: false });
    expect(r.after.map((s) => s.id)).toEqual(["b"]);
  });

  it("without a marker everything after the intro goes after the core", () => {
    const r = splitPageSections([hero, rich("a")], "faqList");
    expect(r.marker).toBeNull();
    expect(r.before).toEqual([]);
    expect(r.after.map((s) => s.id)).toEqual(["a"]);
  });

  it("keeps an invalid or non-leading hero as a normal section", () => {
    const bad = { id: "x", type: "hero", data: { headline: "" } };
    const r = splitPageSections([bad, faq], "faqList");
    expect(r.intro).toBeNull();
    expect(r.before.map((s) => s.id)).toEqual(["x"]);
    const r2 = splitPageSections([rich("a"), hero], "faqList");
    expect(r2.intro).toBeNull();
    expect(r2.after.map((s) => s.id)).toEqual(["a", "h"]);
  });

  it("an invalid marker still splits but yields null data", () => {
    const r = splitPageSections(
      [{ id: "f", type: "faqList", data: { category: "BAD SLUG" } }, rich("b")],
      "faqList",
    );
    expect(r.marker).toBeNull();
    expect(r.after.map((s) => s.id)).toEqual(["b"]);
  });
});
