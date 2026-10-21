import { describe, expect, it } from "vitest";

import { categoryTopic } from "./category-label";

describe("categoryTopic", () => {
  it("does not duplicate 'Tempe' when the name already contains it", () => {
    expect(categoryTopic("Tips Tempe")).toBe("Tips Tempe");
    expect(categoryTopic("Gizi tempe")).toBe("Gizi tempe");
    expect(categoryTopic("Tempe Goreng")).toBe("Tempe Goreng");
  });

  it("appends 'Tempe' otherwise", () => {
    expect(categoryTopic("Cerita Dapur")).toBe("Cerita Dapur Tempe");
    expect(categoryTopic(" Katering ")).toBe("Katering Tempe");
  });

  it("matches whole words only", () => {
    expect(categoryTopic("Tempeh")).toBe("Tempeh Tempe");
  });
});
