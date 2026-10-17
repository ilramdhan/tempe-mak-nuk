import { describe, expect, it } from "vitest";

import { announcementStatus, fromLocalInput, toLocalInput } from "./datetime";

describe("datetime helpers", () => {
  it("round-trips local input", () => {
    const iso = fromLocalInput("2026-10-17T08:30");
    expect(iso).not.toBeNull();
    expect(toLocalInput(iso)).toBe("2026-10-17T08:30");
  });
  it("handles empty/invalid", () => {
    expect(fromLocalInput("")).toBeNull();
    expect(fromLocalInput("zzz")).toBeNull();
    expect(toLocalInput(null)).toBe("");
  });
  it("derives announcement status", () => {
    const now = Date.parse("2026-10-17T00:00:00Z");
    expect(
      announcementStatus({ active: false, startsAt: null, endsAt: null }, now),
    ).toBe("inactive");
    expect(
      announcementStatus(
        { active: true, startsAt: "2026-11-01T00:00:00Z", endsAt: null },
        now,
      ),
    ).toBe("scheduled");
    expect(
      announcementStatus(
        { active: true, startsAt: null, endsAt: "2026-10-01T00:00:00Z" },
        now,
      ),
    ).toBe("expired");
    expect(
      announcementStatus({ active: true, startsAt: null, endsAt: null }, now),
    ).toBe("live");
  });
});
