import { describe, expect, it } from "vitest";

import {
  EnvValidationError,
  parseClientEnv,
  parseServerEnv,
  isEnvValidationSkipped,
} from "@/lib/env";

const validServer = {
  NODE_ENV: "production",
  NEXT_PUBLIC_SITE_URL: "https://tempemaknuk.com/",
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role",
  DATABASE_URL: "postgresql://u:p@aws-0-x.pooler.supabase.com:6543/postgres",
  DIRECT_URL: "postgresql://u:p@db.abc.supabase.co:5432/postgres",
  CRON_SECRET: "x".repeat(32),
  REVALIDATE_SECRET: "y".repeat(32),
};

describe("parseServerEnv", () => {
  it("accepts a complete env and strips trailing slash from site URL", () => {
    const env = parseServerEnv(validServer);
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("https://tempemaknuk.com");
    expect(env.DATABASE_URL).toContain(":6543/");
  });

  it("throws a clear error naming missing vars", () => {
    const { SUPABASE_SERVICE_ROLE_KEY: _omit, ...rest } = validServer;
    void _omit;
    expect(() => parseServerEnv(rest)).toThrow(EnvValidationError);
    expect(() => parseServerEnv(rest)).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("treats empty strings as missing", () => {
    expect(() => parseServerEnv({ ...validServer, CRON_SECRET: "" })).toThrow(
      /CRON_SECRET/,
    );
  });

  it("rejects short secrets and invalid URLs", () => {
    expect(() =>
      parseServerEnv({ ...validServer, CRON_SECRET: "short" }),
    ).toThrow(/CRON_SECRET/);
    expect(() =>
      parseServerEnv({ ...validServer, DATABASE_URL: "nope" }),
    ).toThrow(/DATABASE_URL/);
  });

  it("makes DIRECT_URL optional", () => {
    const { DIRECT_URL: _omit, ...rest } = validServer;
    void _omit;
    expect(parseServerEnv(rest).DIRECT_URL).toBeUndefined();
  });

  it("bypasses validation with SKIP_ENV_VALIDATION=1", () => {
    expect(() => parseServerEnv({ SKIP_ENV_VALIDATION: "1" })).not.toThrow();
    expect(isEnvValidationSkipped({ SKIP_ENV_VALIDATION: "true" })).toBe(true);
    expect(isEnvValidationSkipped({ SKIP_ENV_VALIDATION: "0" })).toBe(false);
  });
});

describe("parseClientEnv", () => {
  it("only exposes NEXT_PUBLIC_* keys", () => {
    const env = parseClientEnv(validServer);
    expect(Object.keys(env).sort()).toEqual([
      "NEXT_PUBLIC_SITE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
    ]);
    expect(env).not.toHaveProperty("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("does not require server secrets", () => {
    expect(() =>
      parseClientEnv({
        NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
        NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
      }),
    ).not.toThrow();
  });

  it("fails when public Supabase URL is missing", () => {
    expect(() =>
      parseClientEnv({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});
