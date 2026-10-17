import { describe, expect, it } from "vitest";

import { fillDailySeries, percent } from "./aggregate";

describe("fillDailySeries", () => {
  it("fills missing days with zero, ending today", () => {
    const s = fillDailySeries(
      [{ day: "2026-10-16", total: 3 }],
      "2026-10-17",
      3,
    );
    expect(s).toEqual([
      { day: "2026-10-15", total: 0 },
      { day: "2026-10-16", total: 3 },
      { day: "2026-10-17", total: 0 },
    ]);
  });
});

describe("percent", () => {
  it("handles zero and clamps", () => {
    expect(percent(1, 0)).toBe(0);
    expect(percent(1, 3)).toBe(33);
    expect(percent(5, 3)).toBe(100);
  });
});
