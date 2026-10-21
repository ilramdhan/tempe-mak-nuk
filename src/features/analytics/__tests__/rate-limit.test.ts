import { describe, expect, it } from "vitest";

import { waClickInputSchema } from "@/features/analytics/schema";
import { createRateLimiter } from "@/features/analytics/rate-limit";

describe("createRateLimiter", () => {
  it("allows up to limit per window, then resets", () => {
    const allow = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 10)).toBe(true);
    expect(allow("a", 20)).toBe(false);
    expect(allow("b", 20)).toBe(true);
    expect(allow("a", 1001)).toBe(true);
  });

  it("bounds memory", () => {
    const allow = createRateLimiter({ limit: 1, windowMs: 1000, maxKeys: 2 });
    allow("a", 0);
    allow("b", 0);
    expect(allow("c", 0)).toBe(true); // evicts oldest
    expect(allow("a", 0)).toBe(true);
  });
});

describe("waClickInputSchema", () => {
  it("accepts identifiers, defaults kind", () => {
    expect(waClickInputSchema.parse({ source: "home:hero" })).toEqual({
      source: "home:hero",
      kind: "general",
      variant: null,
    });
  });
  it("rejects free text / PII-like input and long strings", () => {
    expect(
      waClickInputSchema.safeParse({ source: "Budi 0812 345" }).success,
    ).toBe(false);
    expect(
      waClickInputSchema.safeParse({ source: "x".repeat(201) }).success,
    ).toBe(false);
    expect(
      waClickInputSchema.safeParse({ source: "a", variant: "y".repeat(101) })
        .success,
    ).toBe(false);
    expect(
      waClickInputSchema.safeParse({ source: "a", kind: "spam" }).success,
    ).toBe(false);
  });
});
