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
import { faqAnswerPlainText, getFaqs } from "@/features/faqs/queries";
import { getSettings } from "@/features/settings/queries";
import { renderLightMarkdown } from "@/lib/rich-text/inline";
import { faqPageJsonLd, JsonLd, siteBaseUrl } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";
import { buildWaLink } from "@/lib/wa-link";

import { FaqBrowser, type FaqBrowserItem } from "./_components/faq-browser";

const DESCRIPTION =
  "Jawaban pertanyaan umum tentang pesan, PO, kirim, simpan, dan varian Tempe Mak Nuk. Cari pertanyaanmu atau tanya langsung via WhatsApp.";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "FAQ Tempe Mak Nuk: Pesan, Simpan, Kirim, Halal",
    description: DESCRIPTION,
    path: "/faq",
    titleAbsolute: true,
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
  const [faqs, settings] = await Promise.all([getFaqs(), getSettings()]);
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
            <Eyebrow>FAQ</Eyebrow>
            <Heading level={1} size="display">
              Pertanyaan yang sering ditanyakan
            </Heading>
            <Lead muted>{DESCRIPTION}</Lead>
          </Stack>
        </Container>
      </Section>
      <Section spacing="tight">
        <Container size="prose">
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
      {waHref ? (
        <Section spacing="tight">
          <Container size="prose">
            <Stack gap="sm" className="items-start">
              <Heading level={2} size="h3">
                Masih ada yang mau ditanyakan?
              </Heading>
              <Button asChild variant="accent" size="lg">
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
