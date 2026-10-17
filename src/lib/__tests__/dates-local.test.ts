import { describe, expect, it } from "vitest";

import { dateKeyToLocalDate, localDateToDateKey } from "@/lib/dates";

describe("dateKeyToLocalDate / localDateToDateKey", () => {
  it.each(["2026-10-20", "2026-12-31", "2027-01-01", "2028-02-29"])(
    "round-trips %s",
    (key) => expect(localDateToDateKey(dateKeyToLocalDate(key))).toBe(key),
  );

  it("uses local noon so the calendar day is stable", () => {
    const d = dateKeyToLocalDate("2026-10-20");
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([
      2026, 9, 20, 12,
    ]);
  });

  it("rejects invalid keys", () => {
    expect(() => dateKeyToLocalDate("2026-02-30")).toThrow(RangeError);
  });
});
