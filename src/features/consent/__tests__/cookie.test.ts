import { describe, expect, it } from "vitest";

import {
  acceptAll,
  buildCookieString,
  hasConsent,
  isConsentCurrent,
  normalizeCategories,
  parseConsent,
  readCookieValue,
  rejectOptional,
  serializeConsent,
} from "../cookie";

const defs = [
  { key: "necessary", required: true },
  { key: "analytics", required: false },
  { key: "marketing", required: false },
];
const rec = { version: 1, categories: ["necessary", "analytics"], ts: 1000 };

describe("consent cookie", () => {
  it("round-trips", () =>
    expect(parseConsent(serializeConsent(rec))).toEqual(rec));
  it("rejects garbage", () => {
    expect(parseConsent(null)).toBeNull();
    expect(parseConsent("%E0%A4%A")).toBeNull();
    expect(parseConsent(encodeURIComponent('{"version":"1"}'))).toBeNull();
    expect(parseConsent(encodeURIComponent("[1]"))).toBeNull();
  });
  it("reads from header", () => {
    expect(
      readCookieValue(`a=1; tmn_consent=${serializeConsent(rec)}; b=2`),
    ).toBe(serializeConsent(rec));
    expect(readCookieValue("a=1")).toBeNull();
  });
  it("builds cookie with 365 days + SameSite=Lax", () => {
    const s = buildCookieString(rec, true);
    expect(s).toContain("Max-Age=31536000");
    expect(s).toContain("SameSite=Lax");
    expect(s).toContain("Secure");
    expect(buildCookieString(rec, false)).not.toContain("Secure");
  });
  it("version logic", () => {
    expect(isConsentCurrent(rec, 1)).toBe(true);
    expect(isConsentCurrent(rec, 2)).toBe(false);
    expect(isConsentCurrent(null, 1)).toBe(false);
    expect(hasConsent(rec, 1, "analytics")).toBe(true);
    expect(hasConsent(rec, 1, "marketing")).toBe(false);
    expect(hasConsent(rec, 2, "analytics")).toBe(false);
  });
  it("normalizes categories", () => {
    expect(normalizeCategories(["marketing", "x"], defs)).toEqual([
      "necessary",
      "marketing",
    ]);
    expect(acceptAll(defs)).toEqual(["necessary", "analytics", "marketing"]);
    expect(rejectOptional(defs)).toEqual(["necessary"]);
  });
});
