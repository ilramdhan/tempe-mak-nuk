import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/site/layout";
import { Container } from "@/components/site/primitives";
import { BlockRenderer } from "@/features/pages/blocks/block-renderer";
import { getPage, getPageMeta } from "@/features/pages/queries";
import { getSettings } from "@/features/settings/queries";
import {
  businessFromSettings,
  JsonLd,
  organizationJsonLd,
  siteBaseUrl,
  webPageJsonLd,
} from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";

const SLUG = "halal-kualitas";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageMeta(SLUG);
  if (!page) return {};
  return pageMetadata({
    title: page.title,
    description: page.seo.description,
    path: "/halal-kualitas",
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
  const jsonLd = [
    webPageJsonLd({ name: title, path: "/halal-kualitas", description }, base),
    organizationJsonLd(businessFromSettings(settings), base),
  ];

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: "Halal dan Kualitas" }]} />
      </Container>
      <BlockRenderer blocks={page.sections} />
      <JsonLd data={jsonLd} />
    </>
  );
}
