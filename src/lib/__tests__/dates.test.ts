import { describe, expect, it } from "vitest";

import {
  addDays,
  dateRange,
  diffDays,
  formatDateLong,
  formatDeadline,
  isDateKey,
  toDateKey,
  weekdayOf,
  zonedDateTime,
} from "@/lib/dates";

describe("dates (Asia/Jakarta)", () => {
  it("toDateKey uses Jakarta calendar day", () => {
    // 2026-10-16T17:30Z = 2026-10-17 00:30 WIB
    expect(toDateKey(new Date("2026-10-16T17:30:00Z"))).toBe("2026-10-17");
    expect(toDateKey(new Date("2026-10-16T16:59:59Z"))).toBe("2026-10-16");
  });

  it("zonedDateTime builds the WIB instant", () => {
    expect(zonedDateTime("2026-10-16", "15:00").toISOString()).toBe(
      "2026-10-16T08:00:00.000Z",
    );
    expect(zonedDateTime("2026-01-01", "00:00").toISOString()).toBe(
      "2025-12-31T17:00:00.000Z",
    );
  });

  it("arithmetic crosses month/year/leap boundaries", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
    expect(diffDays("2026-10-16", "2026-10-20")).toBe(4);
    expect(dateRange("2026-10-30", 3)).toEqual([
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
  });

  it("weekdayOf: 0 = Sunday", () => {
    expect(weekdayOf("2026-10-18")).toBe(0);
    expect(weekdayOf("2026-10-20")).toBe(2);
  });

  it("validates date keys", () => {
    expect(isDateKey("2026-02-29")).toBe(false);
    expect(isDateKey("2028-02-29")).toBe(true);
    expect(isDateKey("2026-1-01")).toBe(false);
    expect(() => addDays("nope", 1)).toThrow(RangeError);
  });

  it("formats Indonesian dates", () => {
    expect(formatDateLong("2026-10-20")).toBe("Selasa, 20 Okt 2026");
    expect(formatDeadline(zonedDateTime("2026-10-16", "15:00"))).toBe(
      "Jumat, 16 Okt 2026 pukul 15.00 WIB",
    );
  });
});
