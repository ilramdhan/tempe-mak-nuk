import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/site/layout";
import { Container } from "@/components/site/primitives";
import { BlockRenderer } from "@/features/pages/blocks/block-renderer";
import { getPage, getPageMeta } from "@/features/pages/queries";
import { getSettings } from "@/features/settings/queries";
import { howToJsonLd, JsonLd, siteBaseUrl } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";

const SLUG = "proses";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageMeta(SLUG);
  if (!page) return {};
  return pageMetadata({
    title: page.title,
    description: page.seo.description,
    path: "/proses",
    seo: page.seo,
    titleAbsolute: true,
  });
}

export default async function Page() {
  const [page, settings] = await Promise.all([getPage(SLUG), getSettings()]);
  if (!page) notFound();
  const base = siteBaseUrl(settings["site.url"]);
  const description = page.seo.description;
  const stepsBlock = page.sections.find((s) => s.type === "steps");
  const items =
    (
      stepsBlock?.data as
        { items?: { title: string; body?: string | null }[] } | undefined
    )?.items ?? [];
  const jsonLd = howToJsonLd(
    {
      name: "Cara membuat tempe tradisional",
      description,
      path: "/proses",
      steps: items.map((s) => ({
        name: s.title.replace(/^\d+\.\s*/, ""),
        text: s.body ?? s.title,
      })),
    },
    base,
  );

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: "Proses" }]} />
      </Container>
      <BlockRenderer blocks={page.sections} />
      <JsonLd data={jsonLd} />
    </>
  );
}
