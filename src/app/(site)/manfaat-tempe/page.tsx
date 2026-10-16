import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb, serializeJsonLd } from "@/components/site/layout";
import { Container } from "@/components/site/primitives";
import { BlockRenderer } from "@/features/pages/blocks/block-renderer";
import { getPage, getPageMeta } from "@/features/pages/queries";
import { getSettings } from "@/features/settings/queries";

const SLUG = "manfaat-tempe";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageMeta(SLUG);
  if (!page) return {};
  return {
    title: { absolute: page.seo.title ?? page.title },
    description: page.seo.description,
    alternates: { canonical: "/manfaat-tempe" },
    robots: page.seo.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function Page() {
  const [page, settings] = await Promise.all([getPage(SLUG), getSettings()]);
  if (!page) notFound();
  const siteUrl = settings["site.url"];
  const url = siteUrl ? new URL("/manfaat-tempe", siteUrl).toString() : null;
  const title = page.seo.title ?? page.title;
  const description = page.seo.description;
  const jsonLd = url
    ? {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        inLanguage: "id-ID",
        mainEntityOfPage: url,
        dateModified: page.updatedAt.toISOString(),
        author: { "@type": "Organization", name: settings["business.name"] },
        publisher: { "@type": "Organization", name: settings["business.name"] },
      }
    : null;

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: "Manfaat Tempe" }]} />
      </Container>
      <BlockRenderer blocks={page.sections} />
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      ) : null}
    </>
  );
}
