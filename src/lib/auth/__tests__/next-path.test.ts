import { describe, expect, it } from "vitest";

import { loginPathFor, sanitizeNextPath } from "@/lib/auth/next-path";

describe("sanitizeNextPath", () => {
  it.each([
    ["/admin", "/admin"],
    ["/admin/", "/admin/"],
    ["/admin/produk", "/admin/produk"],
    ["/admin/produk/abc?tab=gizi#galeri", "/admin/produk/abc?tab=gizi#galeri"],
    ["  /admin/faq  ", "/admin/faq"],
  ])("accepts %s", (input, expected) => {
    expect(sanitizeNextPath(input)).toBe(expected);
  });

  it.each([
    undefined,
    null,
    123,
    "",
    "admin",
    "/",
    "/produk",
    "/administrator",
    "/admin-evil",
    "//evil.com/admin",
    "/\\evil.com/admin",
    "\\\\evil.com",
    "https://evil.com/admin",
    "javascript:alert(1)",
    "/admin/../login",
    "/admin/%2e%2e/login",
    "/admin/..%2fevil",
    "/admin%2f..%2f..%2fevil",
    "/admin\n/x",
    "/admin/" + "a".repeat(600),
  ])("rejects %j", (input) => {
    expect(sanitizeNextPath(input)).toBe("/admin");
  });

  it("uses the given fallback", () => {
    expect(sanitizeNextPath("//evil.com", "")).toBe("");
  });
});

describe("loginPathFor", () => {
  it("adds next for admin sub-paths", () => {
    expect(loginPathFor("/admin/produk?x=1")).toBe(
      "/login?next=%2Fadmin%2Fproduk%3Fx%3D1",
    );
  });
  it("omits next for the default and unsafe paths", () => {
    expect(loginPathFor("/admin")).toBe("/login");
    expect(loginPathFor("https://evil.com")).toBe("/login");
    expect(loginPathFor(undefined)).toBe("/login");
  });
});
