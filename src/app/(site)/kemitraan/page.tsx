import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb, serializeJsonLd } from "@/components/site/layout";
import {
  Container,
  Heading,
  Lead,
  Section,
  Stack,
} from "@/components/site/primitives";
import { BlockRenderer } from "@/features/pages/blocks/block-renderer";
import { getPage, getPageMeta } from "@/features/pages/queries";
import { getProducts } from "@/features/products/queries";
import { getSettings } from "@/features/settings/queries";

import { InquiryForm } from "./_components/inquiry-form";

const SLUG = "kemitraan";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageMeta(SLUG);
  if (!page) return {};
  return {
    title: { absolute: page.seo.title ?? page.title },
    description: page.seo.description,
    alternates: { canonical: "/kemitraan" },
    robots: page.seo.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function Page() {
  const [page, settings, products] = await Promise.all([
    getPage(SLUG),
    getSettings(),
    getProducts(),
  ]);
  if (!page) notFound();
  const siteUrl = settings["site.url"];
  const url = siteUrl ? new URL("/kemitraan", siteUrl).toString() : null;
  const jsonLd = url
    ? {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": url,
        url,
        name: page.seo.title ?? page.title,
        description: page.seo.description,
        inLanguage: "id-ID",
      }
    : null;

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: "Kemitraan" }]} />
      </Container>
      <BlockRenderer blocks={page.sections} />
      <Section tone="surface" id="ajukan">
        <Container size="prose">
          <Stack gap="lg">
            <Heading level={2}>Ajukan kerja sama</Heading>
            <Lead>
              Isi data usaha Anda. Kami susun pesannya, Anda tinggal kirim lewat
              WhatsApp.
            </Lead>
            <InquiryForm
              whatsapp={settings["contact.whatsapp"]}
              productNames={products.map((p) => p.name)}
            />
          </Stack>
        </Container>
      </Section>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      ) : null}
    </>
  );
}
