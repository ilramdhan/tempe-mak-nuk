import { describe, expect, it } from "vitest";

import { tagsForMediaUsage } from "../usage-tags";

describe("tagsForMediaUsage", () => {
  it("always includes media tags", () => {
    expect(tagsForMediaUsage("x", [])).toEqual(["media", "media:x"]);
  });
  it("maps kinds, dedupes, ignores unknown", () => {
    const t = tagsForMediaUsage("x", [
      { kind: "Produk" },
      { kind: "Produk" },
      { kind: "Pengaturan" },
      { kind: "???" },
    ]);
    expect(t).toEqual(["media", "media:x", "products", "settings"]);
  });
});
