import { describe, expect, it } from "vitest";

import type { DayAvailability } from "../availability";
import { weekSlotMessage } from "../week-message";

const d = (p: Partial<DayAvailability>): DayAvailability => ({
  date: "2026-10-21",
  weekday: 3,
  status: "available",
  orderable: true,
  capacity: 10,
  booked: 0,
  remaining: 10,
  deadline: null,
  holiday: null,
  reason: "",
  ...p,
});

describe("weekSlotMessage", () => {
  it("full when nothing orderable", () => {
    expect(
      weekSlotMessage([d({ orderable: false, status: "full", remaining: 0 })])
        .text,
    ).toContain("penuh");
  });
  it("counts remaining when nearly full", () => {
    const m = weekSlotMessage([
      d({ status: "nearly", remaining: 2 }),
      d({ remaining: 3 }),
    ]);
    expect(m.text).toContain("tinggal 5");
  });
  it("open otherwise", () => {
    expect(weekSlotMessage([d({})]).id).toBe("slot-open");
  });
});
