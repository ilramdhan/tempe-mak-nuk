import type { Metadata } from "next";

import { Breadcrumb, WaLink } from "@/components/site/layout";
import {
  Container,
  Eyebrow,
  Heading,
  Lead,
  Section,
  Stack,
} from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { faqAnswerPlainText, queryFaqs } from "@/features/faqs/queries";
import { BlockRenderer } from "@/features/pages/blocks/block-renderer";
import { CtaButton, CtaRow } from "@/features/pages/blocks/shared";
import { splitPageSections } from "@/features/pages/layout";
import { getPage, getPageMeta } from "@/features/pages/queries";
import { getSettings } from "@/features/settings/queries";
import { renderLightMarkdown } from "@/lib/rich-text/inline";
import { faqPageJsonLd, JsonLd, siteBaseUrl } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";
import { buildWaLink } from "@/lib/wa-link";

import { FaqBrowser, type FaqBrowserItem } from "./_components/faq-browser";

const SLUG = "faq";

/** Fallback copy when the `pages` row "faq" is missing/unpublished (admin: Halaman → FAQ). */
const FALLBACK = {
  title: "FAQ Tempe Mak Nuk: Pesan, Simpan, Kirim, Halal",
  description:
    "Jawaban pertanyaan umum tentang pesan, PO, kirim, simpan, dan varian Tempe Mak Nuk. Cari pertanyaan Anda atau tanya langsung via WhatsApp.",
  intro: {
    eyebrow: "FAQ",
    headline: "Pertanyaan yang sering ditanyakan",
    subheadline:
      "Jawaban pertanyaan umum tentang pesan, PO, kirim, simpan, dan varian Tempe Mak Nuk. Cari pertanyaan Anda atau tanya langsung via WhatsApp.",
    primaryCta: null,
    secondaryCta: null,
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPageMeta(SLUG);
  return pageMetadata({
    title: meta ? meta.title : FALLBACK.title,
    description: meta?.seo.description || FALLBACK.description,
    path: "/faq",
    seo: meta?.seo ?? { title: FALLBACK.title },
    titleAbsolute: !meta,
  });
}

function hostOf(url: string): string[] {
  try {
    return url ? [new URL(url).hostname] : [];
  } catch {
    return [];
  }
}

export default async function FaqPage() {
  const [page, settings] = await Promise.all([getPage(SLUG), getSettings()]);
  // CMS sections: hero → intro; `faqList` marks where the searchable FAQ browser goes
  // (its category/source filter applies; default = all FAQs).
  const layout = splitPageSections(page?.sections, "faqList");
  const intro = layout.intro ?? FALLBACK.intro;
  const list = layout.marker;
  const faqs = await queryFaqs({
    source: list?.source ?? "all",
    category: list?.category,
    ids: list?.ids,
    limit: list?.limit,
  });
  const siteUrl = settings["site.url"];
  const internalHosts = hostOf(siteUrl);
  const waHref = buildWaLink(
    settings["contact.whatsapp"],
    "Halo Mak Nuk, saya mau tanya soal tempe.",
  );

  const items: FaqBrowserItem[] = faqs.map((f) => ({
    id: f.id,
    question: f.question,
    plain: faqAnswerPlainText(f.answer),
    group: f.category?.slug ?? "_",
    groupName: f.category?.name ?? "Lainnya",
    answer: renderLightMarkdown(f.answer, { internalHosts }),
  }));

  const jsonLd = faqPageJsonLd(
    faqs.map((f) => ({
      question: f.question,
      answer: faqAnswerPlainText(f.answer),
    })),
    { path: "/faq", base: siteBaseUrl(siteUrl), lang: "id-ID" },
  );

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: "FAQ" }]} />
      </Container>
      <Section spacing="tight">
        <Container size="prose">
          <Stack gap="md">
            {intro.eyebrow ? (
              <Eyebrow rule tone="accent">
                {intro.eyebrow}
              </Eyebrow>
            ) : null}
            <Heading level={1} size="display">
              {intro.headline}
            </Heading>
            {intro.subheadline ? <Lead muted>{intro.subheadline}</Lead> : null}
            {intro.primaryCta || intro.secondaryCta ? (
              <CtaRow className="pt-2">
                <CtaButton cta={intro.primaryCta} />
                <CtaButton cta={intro.secondaryCta} variant="secondary" />
              </CtaRow>
            ) : null}
          </Stack>
        </Container>
      </Section>
      {layout.before.length ? (
        <BlockRenderer blocks={layout.before} firstHeadingLevel={2} />
      ) : null}
      <Section spacing="tight" id={list?.anchor ?? undefined}>
        <Container size="prose">
          {list?.heading || list?.intro ? (
            <Stack gap="sm" className="mb-6">
              {list.heading ? (
                <Heading level={2} size="h3">
                  {list.heading}
                </Heading>
              ) : null}
              {list.intro ? <Lead muted>{list.intro}</Lead> : null}
            </Stack>
          ) : null}
          {items.length ? (
            <FaqBrowser items={items} waHref={waHref} />
          ) : (
            <p className="text-muted-foreground">
              Pertanyaan sedang Mak siapkan. Sambil menunggu, tanyakan langsung
              via WhatsApp.
            </p>
          )}
        </Container>
      </Section>
      {layout.after.length ? (
        <BlockRenderer blocks={layout.after} firstHeadingLevel={2} />
      ) : null}
      {waHref ? (
        <Section spacing="tight">
          <Container size="prose">
            <Stack gap="sm" className="items-start">
              <Heading level={2} size="h3">
                Masih ada yang mau ditanyakan?
              </Heading>
              <Button asChild size="lg">
                <WaLink href={waHref} source="faq:cta" kind="general">
                  Chat Mak Nuk via WhatsApp
                </WaLink>
              </Button>
            </Stack>
          </Container>
        </Section>
      ) : null}
      <JsonLd data={jsonLd} />
    </>
  );
}
