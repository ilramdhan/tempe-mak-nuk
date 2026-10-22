import { describe, expect, it } from "vitest";

import { assertSeedTarget } from "./seed-guard";

const url = (host: string) => `postgresql://postgres:s3cret@${host}:5432/tempe`;

describe("assertSeedTarget", () => {
  it.each(["localhost", "127.0.0.1", "[::1]", "postgres", "db"])(
    "allows local host %s",
    (host) => {
      expect(() => assertSeedTarget(url(host), {})).not.toThrow();
    },
  );

  it.each(["aws-0-ap-southeast-1.pooler.supabase.com", "db.xxx.supabase.co"])(
    "rejects remote host %s",
    (host) => {
      expect(() => assertSeedTarget(url(host), {})).toThrow(
        /SEED_ALLOW_REMOTE=1/,
      );
    },
  );

  it("allows remote with SEED_ALLOW_REMOTE=1", () => {
    expect(() =>
      assertSeedTarget(url("db.xxx.supabase.co"), { SEED_ALLOW_REMOTE: "1" }),
    ).not.toThrow();
  });

  it("does not leak the password", () => {
    try {
      assertSeedTarget(url("db.xxx.supabase.co"), {});
      expect.unreachable();
    } catch (e) {
      expect((e as Error).message).toContain("db.xxx.supabase.co");
      expect((e as Error).message).not.toContain("s3cret");
    }
    expect(() => assertSeedTarget("not a url s3cret", {})).toThrow(
      expect.objectContaining({
        message: expect.not.stringContaining("s3cret"),
      }),
    );
  });
});
