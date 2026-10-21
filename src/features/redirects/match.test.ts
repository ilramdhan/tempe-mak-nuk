import { describe, expect, it } from "vitest";

import { buildRedirectMap, matchRedirect } from "./match";

const map = buildRedirectMap([
  { from: "/lama/", to: "/produk", permanent: true },
  { from: "/promo", to: "/produk?x=1", permanent: false },
  { from: "/ext", to: "https://example.com/a", permanent: true },
  { from: "/loop", to: "/loop/", permanent: true },
  { from: "/admin/x", to: "/", permanent: true },
  { from: "/api/y", to: "/", permanent: true },
]);

describe("matchRedirect", () => {
  it("normalizes trailing slash on both sides", () => {
    expect(matchRedirect(map, "/lama")).toEqual({ to: "/produk", status: 301 });
    expect(matchRedirect(map, "/lama/")).toEqual({
      to: "/produk",
      status: 301,
    });
  });
  it("is case-sensitive", () => {
    expect(matchRedirect(map, "/Lama")).toBeNull();
  });
  it("uses 302 when not permanent", () => {
    expect(matchRedirect(map, "/promo")?.status).toBe(302);
  });
  it("keeps query string for internal targets, unless target has one", () => {
    expect(matchRedirect(map, "/lama", "?utm=a")?.to).toBe("/produk?utm=a");
    expect(matchRedirect(map, "/promo", "?utm=a")?.to).toBe("/produk?x=1");
  });
  it("leaves external targets untouched", () => {
    expect(matchRedirect(map, "/ext", "?a=1")?.to).toBe(
      "https://example.com/a",
    );
  });
  it("ignores self redirects and protected paths", () => {
    expect(matchRedirect(map, "/loop")).toBeNull();
    expect(matchRedirect(map, "/admin/x")).toBeNull();
    expect(matchRedirect(map, "/api/y")).toBeNull();
    expect(matchRedirect(map, "/zzz")).toBeNull();
  });
});
