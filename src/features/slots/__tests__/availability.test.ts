import { describe, expect, it } from "vitest";

import {
  computeAvailability,
  earliestOrderableDate,
  getDayAvailability,
  latestOrderDeadline,
  type OrderRules,
  toBadgeStatus,
} from "@/features/slots/availability";

const rules: OrderRules = {
  leadDays: 4,
  cutoffTime: "15:00",
  closedWeekdays: [0],
  slotsPerDay: 8,
  nearlyFullThreshold: 2,
};

/** Instant from a WIB wall-clock string. */
const wib = (s: string) => new Date(`${s}+07:00`);

// Calendar reference (Oct 2026): Fri 16, Sat 17, Sun 18, Mon 19, Tue 20, Wed 21, Thu 22.

describe("latestOrderDeadline", () => {
  it("use Tuesday, leadDays 4 → Friday 15:00 WIB", () => {
    const d = latestOrderDeadline("2026-10-20", rules);
    expect(d.toISOString()).toBe("2026-10-16T08:00:00.000Z");
  });

  it("deadline landing on a closed Sunday moves back to Saturday", () => {
    // Thu 22 − 4 = Sun 18 (closed) → Sat 17 15:00
    expect(latestOrderDeadline("2026-10-22", rules).toISOString()).toBe(
      "2026-10-17T08:00:00.000Z",
    );
  });

  it("walks back over consecutive holidays", () => {
    // Fri 23 − 4 = Mon 19 holiday, Sun 18 closed → Sat 17
    const d = latestOrderDeadline("2026-10-23", rules, {
      holidays: [{ date: "2026-10-19", label: "Libur" }],
    });
    expect(d.toISOString()).toBe("2026-10-17T08:00:00.000Z");
  });

  it("an 'open' override on the deadline day keeps it", () => {
    const d = latestOrderDeadline("2026-10-22", rules, {
      overrides: [{ date: "2026-10-18", capacity: null, booked: 0, status: "open" }],
    });
    expect(d.toISOString()).toBe("2026-10-18T08:00:00.000Z");
  });

  it("respects other cutoff times and leadDays 0", () => {
    const d = latestOrderDeadline("2026-10-20", { ...rules, leadDays: 0, cutoffTime: "06:30" });
    expect(d.toISOString()).toBe("2026-10-19T23:30:00.000Z");
  });

  it("crosses year boundary", () => {
    // Sat 2027-01-02 − 4 = Tue 2026-12-29
    expect(latestOrderDeadline("2027-01-02", rules).toISOString()).toBe(
      "2026-12-29T08:00:00.000Z",
    );
  });

  it("rejects invalid dates", () => {
    expect(() => latestOrderDeadline("2026-13-01", rules)).toThrow(RangeError);
  });
});

describe("getDayAvailability — cutoff", () => {
  it("Friday 14:59 WIB → Tuesday still orderable", () => {
    const d = getDayAvailability("2026-10-20", { rules, now: wib("2026-10-16T14:59:59") });
    expect(d.status).toBe("available");
    expect(d.orderable).toBe(true);
    expect(d.reason).toContain("Jumat, 16 Okt 2026 pukul 15.00 WIB");
  });

  it("exactly 15:00:00 WIB is still allowed; 15:00:01 is past", () => {
    expect(getDayAvailability("2026-10-20", { rules, now: wib("2026-10-16T15:00:00") }).status).toBe(
      "available",
    );
    expect(getDayAvailability("2026-10-20", { rules, now: wib("2026-10-16T15:00:01") }).status).toBe(
      "past-cutoff",
    );
  });

  it("uses Jakarta time, not UTC date (UTC still Friday, WIB already Saturday)", () => {
    // 2026-10-16T17:30Z = Sat 00:30 WIB
    const now = new Date("2026-10-16T17:30:00Z");
    expect(getDayAvailability("2026-10-20", { rules, now }).status).toBe("past-cutoff");
    // Wed 21 deadline = Sat 17 15:00 → still open
    expect(getDayAvailability("2026-10-21", { rules, now }).status).toBe("available");
  });

  it("today and past dates are past-cutoff", () => {
    const now = wib("2026-10-16T08:00:00");
    expect(getDayAvailability("2026-10-16", { rules, now }).status).toBe("past-cutoff");
    expect(getDayAvailability("2026-10-01", { rules, now }).status).toBe("past-cutoff");
  });
});

describe("getDayAvailability — closures and overrides", () => {
  const now = wib("2026-10-01T09:00:00");

  it("closed weekday", () => {
    const d = getDayAvailability("2026-10-18", { rules, now });
    expect(d.status).toBe("closed");
    expect(d.deadline).toBeNull();
    expect(toBadgeStatus(d.status)).toBe("closed");
  });

  it("holiday is closed with label", () => {
    const d = getDayAvailability("2026-10-20", {
      rules,
      now,
      holidays: [{ date: "2026-10-20", label: "Hari Raya" }],
    });
    expect(d).toMatchObject({ status: "closed", holiday: "Hari Raya", reason: "Libur: Hari Raya" });
  });

  it("closed beats past-cutoff", () => {
    expect(getDayAvailability("2026-09-27", { rules, now }).status).toBe("closed");
  });

  it("override closed on a normal day", () => {
    const d = getDayAvailability("2026-10-20", {
      rules,
      now,
      overrides: [{ date: "2026-10-20", capacity: null, booked: 0, status: "closed" }],
    });
    expect(d.status).toBe("closed");
  });

  it("override open re-opens a Sunday/holiday", () => {
    const d = getDayAvailability("2026-10-18", {
      rules,
      now,
      holidays: [{ date: "2026-10-18", label: "X" }],
      overrides: [{ date: "2026-10-18", capacity: 5, booked: 0, status: "open" }],
    });
    expect(d.status).toBe("available");
    expect(d.holiday).toBe("X");
  });

  it("override full", () => {
    const d = getDayAvailability("2026-10-20", {
      rules,
      now,
      overrides: [{ date: "2026-10-20", capacity: null, booked: 0, status: "full" }],
    });
    expect(d).toMatchObject({ status: "full", orderable: false });
  });

  it("capacity math: default capacity, nearly threshold, full", () => {
    const at = (booked: number, capacity: number | null = null) =>
      getDayAvailability("2026-10-20", {
        rules,
        now,
        overrides: [{ date: "2026-10-20", capacity, booked, status: "auto" }],
      });
    expect(at(5)).toMatchObject({ status: "available", remaining: 3, capacity: 8 });
    expect(at(6)).toMatchObject({ status: "nearly", remaining: 2 });
    expect(at(7).status).toBe("nearly");
    expect(at(8)).toMatchObject({ status: "full", remaining: 0 });
    expect(at(12).remaining).toBe(0);
    expect(at(0, 0).status).toBe("full");
    expect(at(1, 20).status).toBe("available");
  });

  it("override open with no remaining capacity is not full", () => {
    const d = getDayAvailability("2026-10-20", {
      rules,
      now,
      overrides: [{ date: "2026-10-20", capacity: 2, booked: 2, status: "open" }],
    });
    expect(d.status).toBe("available");
  });
});

describe("computeAvailability / earliestOrderableDate", () => {
  it("computes a range starting today (Jakarta)", () => {
    const now = wib("2026-10-16T10:00:00");
    const days = computeAvailability({ rules, now, days: 7 });
    expect(days.map((d) => [d.date, d.status])).toEqual([
      ["2026-10-16", "past-cutoff"],
      ["2026-10-17", "past-cutoff"],
      ["2026-10-18", "closed"],
      ["2026-10-19", "past-cutoff"],
      ["2026-10-20", "available"],
      ["2026-10-21", "available"],
      ["2026-10-22", "available"],
    ]);
  });

  it("finds earliest orderable date, skipping full days", () => {
    const now = wib("2026-10-16T16:00:00"); // past Friday cutoff
    expect(earliestOrderableDate({ rules, now })).toBe("2026-10-21");
    expect(
      earliestOrderableDate({
        rules,
        now,
        overrides: [{ date: "2026-10-21", capacity: null, booked: 8, status: "auto" }],
      }),
    ).toBe("2026-10-22");
  });

  it("returns null when nothing is orderable", () => {
    expect(
      earliestOrderableDate({ rules: { ...rules, closedWeekdays: [0, 1, 2, 3, 4, 5, 6] }, now: new Date() }, 14),
    ).toBeNull();
  });
});
