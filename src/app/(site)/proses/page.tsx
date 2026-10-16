import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb, serializeJsonLd } from "@/components/site/layout";
import { Container } from "@/components/site/primitives";
import { BlockRenderer } from "@/features/pages/blocks/block-renderer";
import { getPage, getPageMeta } from "@/features/pages/queries";
import { getSettings } from "@/features/settings/queries";

const SLUG = "proses";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageMeta(SLUG);
  if (!page) return {};
  return {
    title: { absolute: page.seo.title ?? page.title },
    description: page.seo.description,
    alternates: { canonical: "/proses" },
    robots: page.seo.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function Page() {
  const [page, settings] = await Promise.all([getPage(SLUG), getSettings()]);
  if (!page) notFound();
  const siteUrl = settings["site.url"];
  const url = siteUrl ? new URL("/proses", siteUrl).toString() : null;
  const description = page.seo.description;
  const stepsBlock = page.sections.find((s) => s.type === "steps");
  const items =
    (
      stepsBlock?.data as
        { items?: { title: string; body?: string | null }[] } | undefined
    )?.items ?? [];
  const jsonLd =
    url && items.length
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: "Cara membuat tempe tradisional",
          description,
          step: items.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.title.replace(/^\d+\.\s*/, ""),
            text: s.body ?? s.title,
          })),
        }
      : null;

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: "Proses" }]} />
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
