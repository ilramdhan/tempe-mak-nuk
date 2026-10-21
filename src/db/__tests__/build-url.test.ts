import { describe, expect, it } from "vitest";

import { buildDatabaseUrl } from "../build-url";

describe("buildDatabaseUrl", () => {
  it("swaps the Supabase transaction pooler for the session pooler", () => {
    expect(
      buildDatabaseUrl(
        "postgresql://postgres.ref:pw@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres",
      ),
    ).toBe(
      "postgresql://postgres.ref:pw@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres",
    );
  });

  it("leaves other URLs untouched", () => {
    for (const url of [
      "postgresql://postgres:pw@127.0.0.1:5432/postgres",
      "postgresql://postgres:pw@db.ref.supabase.co:5432/postgres",
      "postgresql://postgres.ref:pw@aws-0-x.pooler.supabase.com:5432/postgres",
    ])
      expect(buildDatabaseUrl(url)).toBe(url);
  });
});
