import { describe, expect, it } from "vitest";

import {
  daysInMonth,
  formatMonthLabel,
  mondayIndex,
  monthGrid,
  navigateKey,
  parseCapacityInput,
  parseMonthParam,
  shiftDateByMonths,
  shiftMonth,
} from "../calendar-utils";

describe("month helpers", () => {
  it("daysInMonth handles leap years", () => {
    expect(daysInMonth("2028-02")).toBe(29);
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2026-10")).toBe(31);
  });

  it("shiftMonth crosses years", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("shiftDateByMonths clamps day of month", () => {
    expect(shiftDateByMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(shiftDateByMonths("2026-10-16", -12)).toBe("2025-10-16");
  });

  it("parseMonthParam validates and clamps", () => {
    expect(parseMonthParam("2026-11", "2026-10-16")).toBe("2026-11");
    expect(parseMonthParam("2026-13", "2026-10-16")).toBe("2026-10");
    expect(parseMonthParam(["2026-11"], "2026-10-16")).toBe("2026-10");
    expect(parseMonthParam("2030-01", "2026-10-16")).toBe("2026-10");
  });

  it("formatMonthLabel is Indonesian", () => {
    expect(formatMonthLabel("2026-10").toLowerCase()).toBe("oktober 2026");
  });
});

describe("monthGrid", () => {
  it("Oct 2026 starts Monday 28 Sep and ends Sunday 1 Nov", () => {
    const g = monthGrid("2026-10");
    expect(g.start).toBe("2026-09-28");
    expect(g.end).toBe("2026-11-01");
    expect(g.weeks).toHaveLength(5);
    expect(g.length).toBe(35);
    expect(mondayIndex(g.start)).toBe(0);
    expect(mondayIndex(g.end)).toBe(6);
  });

  it("Feb 2027 (starts Monday) gives exactly 4 rows", () => {
    const g = monthGrid("2027-02");
    expect(g.start).toBe("2027-02-01");
    expect(g.weeks).toHaveLength(4);
  });
});

describe("navigateKey", () => {
  const d = "2026-10-16"; // Friday
  it("arrows move by day/week", () => {
    expect(navigateKey(d, { key: "ArrowLeft" })).toBe("2026-10-15");
    expect(navigateKey(d, { key: "ArrowRight" })).toBe("2026-10-17");
    expect(navigateKey(d, { key: "ArrowUp" })).toBe("2026-10-09");
    expect(navigateKey(d, { key: "ArrowDown" })).toBe("2026-10-23");
  });
  it("Home/End go to Monday/Sunday", () => {
    expect(navigateKey(d, { key: "Home" })).toBe("2026-10-12");
    expect(navigateKey(d, { key: "End" })).toBe("2026-10-18");
  });
  it("PageUp/PageDown move months (Shift = year)", () => {
    expect(navigateKey(d, { key: "PageDown" })).toBe("2026-11-16");
    expect(navigateKey(d, { key: "PageUp", shiftKey: true })).toBe(
      "2025-10-16",
    );
  });
  it("ignores other keys", () => {
    expect(navigateKey(d, { key: "a" })).toBeNull();
  });
});

describe("parseCapacityInput", () => {
  it("empty means default", () => expect(parseCapacityInput(" ")).toBeNull());
  it("accepts 0..1000", () => {
    expect(parseCapacityInput("0")).toBe(0);
    expect(parseCapacityInput("12")).toBe(12);
  });
  it("rejects invalid", () => {
    expect(parseCapacityInput("-1")).toBeUndefined();
    expect(parseCapacityInput("1001")).toBeUndefined();
    expect(parseCapacityInput("abc")).toBeUndefined();
  });
});
