import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { guardAdminRoute, isAdminPath } from "@/lib/supabase/proxy";

const req = (path: string) =>
  new NextRequest(new URL(path, "https://tmn.test"));
const user = { sub: "00000000-0000-0000-0000-000000000001" };

describe("guardAdminRoute", () => {
  it("redirects anonymous admin requests to /login with next", () => {
    const res = guardAdminRoute(req("/admin/produk?tab=gizi"), null);
    expect(res?.status).toBe(307);
    const loc = new URL(res!.headers.get("location")!);
    expect(loc.pathname).toBe("/login");
    expect(loc.searchParams.get("next")).toBe("/admin/produk?tab=gizi");
  });

  it("omits next for /admin itself", () => {
    const loc = new URL(
      guardAdminRoute(req("/admin"), {})!.headers.get("location")!,
    );
    expect(loc.pathname + loc.search).toBe("/login");
  });

  it("lets signed-in users and non-admin paths through", () => {
    expect(guardAdminRoute(req("/admin/faq"), user)).toBeNull();
    expect(guardAdminRoute(req("/produk"), null)).toBeNull();
    expect(guardAdminRoute(req("/administrator"), null)).toBeNull();
    expect(guardAdminRoute(req("/login"), null)).toBeNull();
  });

  it("sends signed-in users away from /login to a safe next", () => {
    const loc = (p: string) =>
      new URL(guardAdminRoute(req(p), user)!.headers.get("location")!);
    expect(loc("/login?next=%2Fadmin%2Fslot").pathname).toBe("/admin/slot");
    expect(loc("/login?next=https%3A%2F%2Fevil.com").href).toBe(
      "https://tmn.test/admin",
    );
  });

  it("isAdminPath", () => {
    expect(isAdminPath("/admin")).toBe(true);
    expect(isAdminPath("/admin/x")).toBe(true);
    expect(isAdminPath("/adminx")).toBe(false);
  });
});
