import { describe, expect, it } from "vitest";

import { isAuthorizedCronRequest } from "@/app/api/cron/_lib/auth";

const secret = "s3cr3t-value-that-is-long-enough";

describe("isAuthorizedCronRequest", () => {
  it("accepts the correct bearer token", () => {
    expect(isAuthorizedCronRequest(`Bearer ${secret}`, secret)).toBe(true);
    expect(isAuthorizedCronRequest(`bearer ${secret}`, secret)).toBe(true);
  });

  it("rejects wrong, partial or differently-sized tokens", () => {
    expect(isAuthorizedCronRequest("Bearer wrong", secret)).toBe(false);
    expect(isAuthorizedCronRequest(`Bearer ${secret}x`, secret)).toBe(false);
    expect(
      isAuthorizedCronRequest(`Bearer ${secret.slice(0, -1)}`, secret),
    ).toBe(false);
  });

  it("rejects missing header or non-bearer schemes", () => {
    expect(isAuthorizedCronRequest(null, secret)).toBe(false);
    expect(isAuthorizedCronRequest(undefined, secret)).toBe(false);
    expect(isAuthorizedCronRequest(secret, secret)).toBe(false);
    expect(isAuthorizedCronRequest(`Basic ${secret}`, secret)).toBe(false);
  });

  it("fails closed when the secret is not configured", () => {
    expect(isAuthorizedCronRequest("Bearer ", "")).toBe(false);
    expect(isAuthorizedCronRequest("Bearer undefined", undefined)).toBe(false);
  });
});
