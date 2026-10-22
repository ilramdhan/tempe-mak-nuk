import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ cacheLife: () => {} }));
vi.mock("@/db/client", () => ({ getDb: () => ({}) }));

const { describeError } = await import("../db");

describe("describeError", () => {
  it("surfaces the driver cause behind a Drizzle query error", () => {
    const cause = Object.assign(
      new Error('relation "products" does not exist'),
      {
        code: "42P01",
      },
    );
    const err = new Error(
      'Failed query: select "slug" from "products"\nparams: true',
      {
        cause,
      },
    );
    expect(describeError(err)).toBe(
      'Failed query: select "slug" from "products" — cause: 42P01 relation "products" does not exist',
    );
  });

  it("keeps plain errors as-is", () => {
    expect(describeError(new Error("boom"))).toBe("boom");
    expect(describeError("x")).toBe("x");
  });
});
