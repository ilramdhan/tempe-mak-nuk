import { describe, expect, it } from "vitest";

import {
  countOpenSlotDays,
  dummySettingKeys,
  isDummyDomain,
  isDummyHalalNumber,
  isDummySetting,
  isDummyWhatsapp,
  isSampleLegalContent,
  sortWarnings,
} from "../warnings-logic";

describe("dummy settings", () => {
  it("flags the seeded WhatsApp number and blanks", () => {
    expect(isDummyWhatsapp("6281234567890")).toBe(true);
    expect(isDummyWhatsapp("+62 812-3456-7890")).toBe(true);
    expect(isDummyWhatsapp("")).toBe(true);
    expect(isDummyWhatsapp(null)).toBe(true);
    expect(isDummyWhatsapp("6285711223344")).toBe(false);
  });
  it("flags halal placeholders", () => {
    expect(isDummyHalalNumber("ID33110012345670124")).toBe(true);
    expect(isDummyHalalNumber("xxxx")).toBe(true);
    expect(isDummyHalalNumber("ID33110099887766")).toBe(false);
  });
  it("flags dummy domains", () => {
    expect(isDummyDomain("https://tempemaknuk.com")).toBe(true);
    expect(isDummyDomain("https://www.tempemaknuk.com/")).toBe(true);
    expect(isDummyDomain("http://localhost:3000")).toBe(true);
    expect(isDummyDomain("not a url")).toBe(true);
    expect(isDummyDomain("https://tempemaknuk.id")).toBe(false);
  });
  it("dispatches by key", () => {
    expect(isDummySetting("legal.nib", "1234567890123")).toBe(true);
    expect(isDummySetting("legal.pirt", "999")).toBe(false);
    expect(
      dummySettingKeys({
        "contact.whatsapp": "6285711223344",
        "halal.number": "ID33110012345670124",
        "site.url": "https://real.id",
        "legal.nib": "42",
        "legal.pirt": "7",
      }),
    ).toEqual(["halal.number"]);
  });
});

describe("isSampleLegalContent", () => {
  it("detects the marker", () => {
    expect(
      isSampleLegalContent({ content: [{ text: "**Dokumen contoh — x**" }] }),
    ).toBe(true);
    expect(isSampleLegalContent({ content: [{ text: "final" }] })).toBe(false);
    expect(isSampleLegalContent(null)).toBe(false);
  });
});

describe("countOpenSlotDays", () => {
  // 2026-10-19 is a Monday.
  const base = {
    from: "2026-10-19",
    days: 7,
    closedWeekdays: [0],
    holidays: [] as string[],
    overrides: [],
    defaultCapacity: 8,
  };
  it("skips closed weekdays", () => {
    expect(countOpenSlotDays(base)).toBe(6);
  });
  it("skips holidays, closed and full overrides, zero capacity", () => {
    expect(
      countOpenSlotDays({
        ...base,
        holidays: ["2026-10-19"],
        overrides: [
          { date: "2026-10-20", capacity: null, booked: 0, status: "closed" },
          { date: "2026-10-21", capacity: null, booked: 0, status: "full" },
          { date: "2026-10-22", capacity: 3, booked: 3, status: "auto" },
        ],
      }),
    ).toBe(2);
  });
  it("open override re-opens a closed weekday", () => {
    expect(
      countOpenSlotDays({
        ...base,
        overrides: [
          { date: "2026-10-25", capacity: null, booked: 0, status: "open" },
        ],
      }),
    ).toBe(7);
  });
  it("returns 0 when default capacity is 0", () => {
    expect(countOpenSlotDays({ ...base, defaultCapacity: 0 })).toBe(0);
  });
});

describe("sortWarnings", () => {
  it("orders by severity then count", () => {
    const w = (
      id: string,
      severity: "high" | "medium" | "low",
      count: number,
    ) => ({
      id,
      severity,
      count,
      message: id,
      href: "/",
    });
    expect(
      sortWarnings([
        w("a", "low", 9),
        w("b", "high", 1),
        w("c", "high", 5),
      ]).map((x) => x.id),
    ).toEqual(["c", "b", "a"]);
  });
});
