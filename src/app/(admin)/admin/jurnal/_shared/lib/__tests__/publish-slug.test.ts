import { describe, expect, it } from "vitest";

import {
  checkPublish,
  formatWib,
  fromWibInput,
  publishedAtForSave,
  toWibInput,
  visibilityOf,
} from "../publish";
import { cleanSlugInput, slugify } from "../slug";

describe("slugify", () => {
  it("makes schema-valid slugs", () => {
    expect(slugify("Tempe Mendoan Krispi!")).toBe("tempe-mendoan-krispi");
    expect(slugify("  Sambal & Lalapan  ")).toBe("sambal-dan-lalapan");
    expect(slugify("Kéripik Témpe")).toBe("keripik-tempe");
    expect(slugify("---")).toBe("");
    expect(slugify("a".repeat(130))).toHaveLength(120);
    expect(slugify(`${"a".repeat(119)} b`)).toBe("a".repeat(119));
  });
  it("cleans typed input but keeps a trailing dash", () => {
    expect(cleanSlugInput("Tempe Goreng-")).toBe("tempe-goreng-");
    expect(cleanSlugInput("-a--b_c")).toBe("a-bc");
  });
});

describe("WIB conversion", () => {
  it("round-trips datetime-local values in Asia/Jakarta", () => {
    const d = fromWibInput("2026-10-17T15:30")!;
    expect(d.toISOString()).toBe("2026-10-17T08:30:00.000Z");
    expect(toWibInput(d)).toBe("2026-10-17T15:30");
    expect(toWibInput("2026-10-17T20:00:00.000Z")).toBe("2026-10-18T03:00");
  });
  it("handles empty / invalid", () => {
    expect(fromWibInput("")).toBeNull();
    expect(fromWibInput("2026-13-01T10:00")).toBeNull();
    expect(toWibInput(null)).toBe("");
    expect(publishedAtForSave("")).toBeNull();
    expect(publishedAtForSave("2026-01-01T07:00")).toBe(
      "2026-01-01T00:00:00.000Z",
    );
  });
  it("formats with WIB suffix", () => {
    expect(formatWib("2026-10-17T08:30:00.000Z")).toMatch(
      /17 Oktober 2026 15[.:]30 WIB/,
    );
  });
});

describe("visibility & publish checks", () => {
  const now = new Date("2026-10-17T08:00:00.000Z");
  it("mirrors isLiveSql", () => {
    expect(visibilityOf("draft", now, now)).toBe("draft");
    expect(visibilityOf("published", null, now)).toBe("live");
    expect(visibilityOf("published", "2026-10-18T00:00:00Z", now)).toBe(
      "scheduled",
    );
    expect(visibilityOf("scheduled", "2026-10-16T00:00:00Z", now)).toBe("live");
    expect(visibilityOf("scheduled", null, now)).toBe("scheduled");
  });
  it("requires a date for scheduled and warns on past/future mismatch", () => {
    expect(checkPublish("scheduled", "", now).error).toBeTruthy();
    expect(checkPublish("scheduled", "2026-10-17T14:00", now).warning).toMatch(
      /lewat/,
    );
    expect(checkPublish("scheduled", "2026-10-18T09:00", now)).toEqual({});
    expect(
      checkPublish("published", "2026-10-18T09:00", now).warning,
    ).toBeTruthy();
    expect(checkPublish("draft", "bogus", now).error).toBeTruthy();
    expect(checkPublish("draft", "", now)).toEqual({});
  });
});
