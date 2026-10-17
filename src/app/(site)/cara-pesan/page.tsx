import type { Metadata } from "next";
import Link from "next/link";

import {
  Breadcrumb,
  serializeJsonLd,
  WaLink,
} from "@/components/site/layout";
import {
  Container,
  Eyebrow,
  Lead,
  Section,
  Stack,
} from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { BlockRenderer } from "@/features/pages/blocks/block-renderer";
import { getPage, getPageMeta } from "@/features/pages/queries";
import { getSettings } from "@/features/settings/queries";
import { PublicSlotCalendar } from "@/features/slots/components/public-slot-calendar";
import { buildWaLink } from "@/lib/wa-link";

const SLUG = "cara-pesan";

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPageMeta(SLUG);
  return {
    title: meta?.seo.title ?? meta?.title ?? "Cara Pesan",
    description: meta?.seo.description ?? undefined,
    alternates: { canonical: "/cara-pesan" },
  };
}

export default async function CaraPesanPage() {
  const page = await getPage(SLUG);
  const settings = await getSettings();
  const sections = page?.sections ?? [];

  const calIndex = sections.findIndex((s) => s.type === "slotCalendarPreview");
  const before = calIndex >= 0 ? sections.slice(0, calIndex) : sections;
  const after = calIndex >= 0 ? sections.slice(calIndex + 1) : [];
  const calData = (
    calIndex >= 0 ? sections[calIndex].data : {}
  ) as Record<string, unknown>;
  const calHeading =
    typeof calData.heading === "string" ? calData.heading : "Kalender slot";
  const calIntro = typeof calData.intro === "string" ? calData.intro : null;
  const calDays =
    typeof calData.days === "number" ? Math.min(calData.days, 60) : 30;

  const steps = sections.find((s) => s.type === "steps")?.data as
    | { items?: { title?: string; body?: string }[] }
    | undefined;
  const howTo = steps?.items?.length
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: page?.title ?? "Cara Pesan",
        step: steps.items.map((it, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: it.title,
          text: it.body,
        })),
      }
    : null;

  const wa = settings["contact.whatsapp"];
  const waHref = wa ? buildWaLink(wa, settings["cta.waFloatMessage"]) : null;

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: page?.title ?? "Cara Pesan" }]} />
      </Container>
      {howTo ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(howTo) }}
        />
      ) : null}
      {before.length ? <BlockRenderer blocks={before} /> : null}
      <Section id="slot" tone="surface" aria-label="Kalender slot">
        <Container>
          <Stack gap="lg">
            <Stack gap="sm">
              <Eyebrow rule tone="accent">
                {settings["order.slotsPerDay"]} slot per hari
              </Eyebrow>
              <h2 className="font-display text-h1 text-balance">
                {calHeading}
              </h2>
              {calIntro ? <Lead muted>{calIntro}</Lead> : null}
            </Stack>
            <PublicSlotCalendar days={calDays} />
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/custom-order">Susun pesanan</Link>
              </Button>
              {waHref ? (
                <Button asChild variant="ghost">
                  <WaLink
                    href={waHref}
                    source="cara-pesan:slot"
                    kind="general"
                  >
                    Cek slot via WhatsApp
                  </WaLink>
                </Button>
              ) : null}
            </div>
          </Stack>
        </Container>
      </Section>
      {after.length ? (
        <BlockRenderer blocks={after} firstHeadingLevel={2} />
      ) : null}
    </>
  );
}
