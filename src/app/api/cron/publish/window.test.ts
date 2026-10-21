import { describe, expect, it } from "vitest";

import { isAuthorizedCronRequest } from "../_lib/auth";
import { parseWindowMinutes } from "./window";

describe("parseWindowMinutes", () => {
  it("defaults and clamps", () => {
    expect(parseWindowMinutes(null)).toBe(20);
    expect(parseWindowMinutes("abc")).toBe(20);
    expect(parseWindowMinutes("1440")).toBe(1440);
    expect(parseWindowMinutes("999999")).toBe(10080);
  });
});

describe("cron auth", () => {
  it("accepts only the right bearer", () => {
    expect(
      isAuthorizedCronRequest("Bearer s3cret-s3cret-xx", "s3cret-s3cret-xx"),
    ).toBe(true);
    expect(isAuthorizedCronRequest("Bearer nope", "s3cret-s3cret-xx")).toBe(
      false,
    );
    expect(isAuthorizedCronRequest(null, "s3cret-s3cret-xx")).toBe(false);
    expect(isAuthorizedCronRequest("Bearer x", undefined)).toBe(false);
  });
});
