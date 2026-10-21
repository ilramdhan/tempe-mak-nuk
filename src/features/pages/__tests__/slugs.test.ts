import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { pageSlugSchema } from "@/features/pages/schema";
import {
  isCmsRouteSlug,
  isReservedPageSlug,
  isStaticPageSlug,
  pagePath,
  RESERVED_PAGE_SLUGS,
  STATIC_PAGE_SLUGS,
} from "@/features/pages/slugs";

/** Top-level URL segments defined under src/app (route groups flattened, _private/[dynamic] skipped). */
function topLevelRouteSegments(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const name = e.isDirectory()
      ? e.name
      : e.name.replace(/\.(tsx?|png|ico)$/, "");
    if (e.isDirectory() && /^\(.+\)$/.test(name)) {
      out.push(...topLevelRouteSegments(join(dir, name)));
      continue;
    }
    if (!e.isDirectory()) continue;
    if (name.startsWith("_") || name.startsWith("[")) continue;
    out.push(name.replace(/\.png$/, ""));
  }
  return out;
}

describe("page slug rules", () => {
  it("covers every top-level route directory in src/app", () => {
    const known = new Set<string>([
      ...STATIC_PAGE_SLUGS,
      ...RESERVED_PAGE_SLUGS,
    ]);
    const segments = topLevelRouteSegments(join(process.cwd(), "src/app"));
    expect(segments.length).toBeGreaterThan(10);
    expect(segments.filter((s) => !known.has(s))).toEqual([]);
  });

  it("static and reserved lists do not overlap", () => {
    for (const s of STATIC_PAGE_SLUGS)
      expect(isReservedPageSlug(s)).toBe(false);
  });

  it.each([
    "jurnal",
    "resep",
    "admin",
    "login",
    "api",
    "kebijakan-privasi",
    "sitemap",
    "opengraph-image-12ab",
  ])("reserves %s", (slug) => {
    expect(isReservedPageSlug(slug)).toBe(true);
    expect(isCmsRouteSlug(slug)).toBe(false);
  });

  it("static pages are not CMS-catch-all slugs", () => {
    expect(isStaticPageSlug("produk")).toBe(true);
    expect(isCmsRouteSlug("produk")).toBe(false);
    expect(isCmsRouteSlug("home")).toBe(false);
  });

  it("accepts free CMS slugs", () => {
    expect(isCmsRouteSlug("promo-lebaran")).toBe(true);
    expect(isCmsRouteSlug("Promo")).toBe(false);
    expect(isCmsRouteSlug("a/b")).toBe(false);
    expect(isCmsRouteSlug("jurnal-tempe")).toBe(true);
  });

  it("pagePath maps home to /", () => {
    expect(pagePath("home")).toBe("/");
    expect(pagePath("tentang")).toBe("/tentang");
  });
});

describe("pageSlugSchema", () => {
  it("rejects reserved slugs with a readable message", () => {
    const res = pageSlugSchema.safeParse("admin");
    expect(res.success).toBe(false);
    expect(res.error?.issues[0]?.message).toMatch(/rute bawaan/);
  });

  it("rejects nested and malformed slugs", () => {
    expect(pageSlugSchema.safeParse("a/b").success).toBe(false);
    expect(pageSlugSchema.safeParse("-x").success).toBe(false);
    expect(pageSlugSchema.safeParse("").success).toBe(false);
  });

  it("keeps existing static page slugs and free slugs valid", () => {
    for (const s of STATIC_PAGE_SLUGS)
      expect(pageSlugSchema.safeParse(s).success).toBe(true);
    expect(pageSlugSchema.parse("  promo-lebaran ")).toBe("promo-lebaran");
  });
});
