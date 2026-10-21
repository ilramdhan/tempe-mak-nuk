import { afterEach, describe, expect, it, vi } from "vitest";

import {
  BLOCK_LIST,
  BLOCK_REGISTRY,
  getBlockDefaults,
} from "@/features/pages/blocks/registry";
import {
  BLOCK_SCHEMAS,
  BLOCK_TYPES,
  blockSchema,
} from "@/features/pages/blocks/schema";
import { validateBlocks } from "@/features/pages/blocks/validate";

afterEach(() => vi.restoreAllMocks());

describe("block registry", () => {
  it("covers every block type with an Indonesian label", () => {
    expect(Object.keys(BLOCK_REGISTRY).sort()).toEqual([...BLOCK_TYPES].sort());
    for (const def of BLOCK_LIST) expect(def.label.length).toBeGreaterThan(2);
  });

  it.each(BLOCK_TYPES)("default data for %s is valid", (type) => {
    const res = BLOCK_SCHEMAS[type].safeParse(getBlockDefaults(type));
    expect(res.error?.issues ?? []).toEqual([]);
    expect(
      blockSchema.safeParse({ type, data: getBlockDefaults(type) }).success,
    ).toBe(true);
  });

  it("getBlockDefaults returns a fresh copy", () => {
    const a = getBlockDefaults("featureGrid");
    a.items.push({ title: "x" });
    expect(getBlockDefaults("featureGrid").items).toHaveLength(3);
  });
});

describe("block schemas", () => {
  it("accepts seed-style hero with nulls and normalises", () => {
    const res = blockSchema.parse({
      type: "hero",
      data: {
        eyebrow: "Produk",
        headline: "Dua varian",
        subheadline: "…",
        primaryCta: null,
        secondaryCta: null,
        image: null,
      },
    });
    expect(res.type === "hero" && res.data.layout).toBe("split");
  });

  it("compare requires values length = columns length", () => {
    const res = blockSchema.safeParse({
      type: "compare",
      data: { columns: ["A", "B"], rows: [{ label: "x", values: ["1"] }] },
    });
    expect(res.success).toBe(false);
    expect(res.error?.issues[0].path).toEqual(["data", "rows", 0, "values"]);
  });

  it("unknown icon degrades to null instead of failing", () => {
    const res = blockSchema.parse({
      type: "trustStrip",
      data: { items: [{ icon: "rocket", label: "Cepat" }] },
    });
    expect(res.type === "trustStrip" && res.data.items[0].icon).toBeNull();
  });

  it("rejects javascript: hrefs in CTAs", () => {
    expect(
      blockSchema.safeParse({
        type: "cta",
        data: {
          headline: "x",
          primary: { label: "y", href: "javascript:alert(1)" },
        },
      }).success,
    ).toBe(false);
  });

  it("split facts must reference real settings keys", () => {
    expect(
      blockSchema.safeParse({
        type: "split",
        data: { facts: [{ label: "No", settingKey: "halal.number" }] },
      }).success,
    ).toBe(true);
    expect(
      blockSchema.safeParse({
        type: "split",
        data: { facts: [{ label: "No", settingKey: "nope" }] },
      }).success,
    ).toBe(false);
  });
});

describe("validateBlocks", () => {
  it("keeps valid blocks in order and skips invalid/unknown ones without throwing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = validateBlocks([
      { id: "a", type: "hero", data: { headline: "Halo" } },
      { id: "b", type: "marquee", data: {} },
      { id: "c", type: "stats", data: { items: [] } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      null as any,
      { type: "cta", data: { headline: "Ayo" } },
    ]);
    expect(out.map((b) => [b.key, b.type])).toEqual([
      ["a", "hero"],
      ["cta-4", "cta"],
    ]);
    expect(warn).toHaveBeenCalledTimes(3);
    expect(validateBlocks(null)).toEqual([]);
  });
});
