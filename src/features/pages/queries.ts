import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

import { pages, pageSections, redirects } from "@/db/schema";
import type { SeoMeta } from "@/db/schema/seo";
import { cachedRead } from "@/features/_shared/db";
import { tags } from "@/lib/cache-tags";

import { isCmsRouteSlug } from "./slugs";

/** Unvalidated section row — <BlockRenderer> validates each with blockSchema. */
export type RawSection = { id: string; type: string; data: unknown };

export type PublicPage = {
  id: string;
  slug: string;
  title: string;
  seo: SeoMeta;
  updatedAt: Date;
  sections: RawSection[];
};

/** Published page + visible sections in order, or null. */
export async function getPage(slug: string): Promise<PublicPage | null> {
  "use cache";
  cacheTag(tags.pages, tags.page(slug));
  return cachedRead("page", "days", null, async (db) => {
    const [page] = await db
      .select({
        id: pages.id,
        slug: pages.slug,
        title: pages.title,
        seo: pages.seo,
        updatedAt: pages.updatedAt,
      })
      .from(pages)
      .where(and(eq(pages.slug, slug), eq(pages.status, "published")))
      .limit(1);
    if (!page) return null;
    const sections = await db
      .select({
        id: pageSections.id,
        type: pageSections.type,
        data: pageSections.data,
      })
      .from(pageSections)
      .where(
        and(eq(pageSections.pageId, page.id), eq(pageSections.visible, true)),
      )
      .orderBy(asc(pageSections.sort));
    return { ...page, sections };
  });
}

/** Page SEO only (generateMetadata) — shares the getPage cache entry. */
export async function getPageMeta(
  slug: string,
): Promise<{ title: string; seo: SeoMeta; updatedAt: Date } | null> {
  const page = await getPage(slug);
  return page
    ? { title: page.title, seo: page.seo, updatedAt: page.updatedAt }
    : null;
}

export async function getPublishedPageSlugs(): Promise<
  { slug: string; updatedAt: Date }[]
> {
  "use cache";
  cacheTag(tags.pages);
  return cachedRead("page-slugs", "days", [], (db) =>
    db
      .select({ slug: pages.slug, updatedAt: pages.updatedAt })
      .from(pages)
      .where(eq(pages.status, "published")),
  );
}

export type CmsPageEntry = { slug: string; updatedAt: Date; noindex: boolean };

/**
 * Published pages served by the CMS catch-all `/[slug]` (static-route and reserved slugs
 * excluded — see `./slugs`). For generateStaticParams + sitemap (skip `noindex`).
 */
export async function listCmsPagesForSitemap(): Promise<CmsPageEntry[]> {
  "use cache";
  cacheTag(tags.pages);
  const rows = await cachedRead("cms-pages", "days", [], (db) =>
    db
      .select({ slug: pages.slug, updatedAt: pages.updatedAt, seo: pages.seo })
      .from(pages)
      .where(eq(pages.status, "published")),
  );
  return rows
    .filter((r) => isCmsRouteSlug(r.slug))
    .map((r) => ({
      slug: r.slug,
      updatedAt: r.updatedAt,
      noindex: Boolean(r.seo?.noindex),
    }));
}

export type PublicRedirect = { from: string; to: string; permanent: boolean };

export async function getRedirects(): Promise<PublicRedirect[]> {
  "use cache";
  cacheTag(tags.redirects);
  return cachedRead("redirects", "days", [], (db) =>
    db
      .select({
        from: redirects.from,
        to: redirects.to,
        permanent: redirects.permanent,
      })
      .from(redirects),
  );
}
