import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/site/layout";
import { Container } from "@/components/site/primitives";
import { BlockRenderer } from "@/features/pages/blocks/block-renderer";
import { getPage, getPageMeta } from "@/features/pages/queries";
import { getSettings } from "@/features/settings/queries";
import { articleJsonLd, JsonLd, siteBaseUrl } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";

const SLUG = "manfaat-tempe";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageMeta(SLUG);
  if (!page) return {};
  return pageMetadata({
    title: page.title,
    description: page.seo.description,
    path: "/manfaat-tempe",
    seo: page.seo,
    titleAbsolute: true,
  });
}

export default async function Page() {
  const [page, settings] = await Promise.all([getPage(SLUG), getSettings()]);
  if (!page) notFound();
  const base = siteBaseUrl(settings["site.url"]);
  const title = page.seo.title ?? page.title;
  const description = page.seo.description;
  const jsonLd = articleJsonLd(
    {
      headline: title,
      path: "/manfaat-tempe",
      description,
      modifiedAt: page.updatedAt,
      publisherName: settings["business.name"],
    },
    base,
  );

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: "Manfaat Tempe" }]} />
      </Container>
      <BlockRenderer blocks={page.sections} />
      <JsonLd data={jsonLd} />
    </>
  );
}
