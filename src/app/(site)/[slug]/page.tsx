import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/site/layout";
import { Container, Heading, Section } from "@/components/site/primitives";
import {
  BlockRenderer,
  validateBlocks,
} from "@/features/pages/blocks/block-renderer";
import { getPage, listCmsPagesForSitemap } from "@/features/pages/queries";
import { isCmsRouteSlug } from "@/features/pages/slugs";
import { getSettings } from "@/features/settings/queries";
import { JsonLd, siteBaseUrl, webPageJsonLd } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";

/**
 * CMS pages created in Admin → Halaman whose slug has no code route (P8.1).
 *
 * - Static routes (`/produk`, `/jurnal`, …) always win over this dynamic segment; on top of that
 *   only `isCmsRouteSlug` slugs are served, so `/home` or a static page's slug never renders
 *   twice, and the admin rejects reserved slugs (`pageSlugSchema`).
 * - `ensureStatic = "navigation"`: unlisted slugs wait for the full render (no App Shell flush),
 *   so `notFound()` gives a real HTTP 404 for unknown/draft pages (same as P8.2 routes).
 *   Everything is `"use cache"` → pages stay fully static and revalidate via `page:<slug>`.
 */
export const ensureStatic = "navigation";

/** Blocks needing request-time data (`connection()`) are not allowed under ensureStatic. */
const REQUEST_TIME_BLOCKS = new Set(["slotCalendarPreview"]);

export async function generateStaticParams() {
  try {
    const rows = await listCmsPagesForSitemap();
    if (rows.length > 0) return rows.map(({ slug }) => ({ slug }));
  } catch {}
  // cacheComponents needs ≥1 param; "_" is never a valid page slug → 404.
  return [{ slug: "_" }];
}

async function loadPage(slug: string) {
  return isCmsRouteSlug(slug) ? getPage(slug) : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) return {};
  return pageMetadata({
    title: page.title,
    description: page.seo.description,
    path: `/${page.slug}`,
    seo: page.seo,
    modifiedTime: page.updatedAt,
  });
}

export default async function CmsPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) notFound();
  const settings = await getSettings();
  const sections = page.sections.filter(
    (s) => !REQUEST_TIME_BLOCKS.has(s.type),
  );
  // The hero carries the <h1>; without one, render the page title as the heading.
  const hasHero = validateBlocks(sections)[0]?.type === "hero";
  const jsonLd = webPageJsonLd(
    {
      name: page.seo.title || page.title,
      path: `/${page.slug}`,
      description: page.seo.description,
    },
    siteBaseUrl(settings["site.url"]),
  );

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: page.title }]} />
      </Container>
      {hasHero ? null : (
        <Section spacing="tight">
          <Container>
            <Heading level={1} size="display">
              {page.title}
            </Heading>
          </Container>
        </Section>
      )}
      <BlockRenderer blocks={sections} firstHeadingLevel={hasHero ? 1 : 2} />
      <JsonLd data={jsonLd} />
    </>
  );
}
