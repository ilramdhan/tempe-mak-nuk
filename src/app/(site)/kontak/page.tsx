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
import { BlockRenderer } from "@/features/pages/blocks/block-renderer";
import { CtaButton } from "@/features/pages/blocks/shared";
import { splitPageSections } from "@/features/pages/layout";
import { getPage, getPageMeta } from "@/features/pages/queries";
import { getSettings } from "@/features/settings/queries";
import {
  businessFromSettings,
  foodEstablishmentJsonLd,
  JsonLd,
  siteBaseUrl,
  webPageJsonLd,
} from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";
import { buildWaLink } from "@/lib/wa-link";

import { LazyMap } from "./_components/lazy-map";

const SLUG = "kontak";

/** Fallback copy when the `pages` row "kontak" is missing/unpublished (admin: Halaman → Kontak). */
const FALLBACK = {
  title: "Kontak dan Alamat Tempe Mak Nuk, Pedan Klaten",
  description:
    "Alamat dapur produksi Tempe Mak Nuk di Pedan, Klaten, jam buka, peta, WhatsApp, dan Instagram. Chat dulu untuk cek slot sebelum datang.",
  intro: {
    eyebrow: "Kontak",
    headline: "Kontak dan alamat",
    subheadline:
      "Alamat dapur produksi Tempe Mak Nuk di Pedan, Klaten, jam buka, peta, WhatsApp, dan Instagram. Chat dulu untuk cek slot sebelum datang.",
    primaryCta: null,
    secondaryCta: null,
  },
  note: "Chat dulu untuk cek slot sebelum datang, ya. Dapur kami produksi sesuai pesanan.",
};

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPageMeta(SLUG);
  return pageMetadata({
    title: meta ? meta.title : FALLBACK.title,
    description: meta?.seo.description || FALLBACK.description,
    path: "/kontak",
    seo: meta?.seo ?? { title: FALLBACK.title },
  });
}

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-border py-4 sm:flex-row sm:gap-6">
      <dt className="w-36 shrink-0 text-sm font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  );
}

const linkCls =
  "rounded-sm text-accent-strong underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring";

export default async function KontakPage() {
  const [page, s] = await Promise.all([getPage(SLUG), getSettings()]);
  // CMS sections: hero → intro; a `split` section marks where the contact details + map go
  // (its heading/body are used; address, hours, links and map always come from settings).
  const layout = splitPageSections(page?.sections, "split");
  const intro = layout.intro ?? FALLBACK.intro;
  const details = layout.marker;
  const note = page ? details?.body : FALLBACK.note;
  const waHref = buildWaLink(
    s["contact.whatsapp"],
    "Halo Mak Nuk, saya mau cek slot sebelum datang.",
  );
  const address = [
    s["address.street"],
    s["address.village"],
    s["address.district"],
    s["address.city"],
    s["address.province"],
    s["address.postalCode"],
  ]
    .filter(Boolean)
    .join(", ");
  const phone = s["contact.phone"];
  const email = s["contact.email"];
  const hours = s.hours;
  const socials = (
    [
      ["Instagram", s["social.instagram"]],
      ["TikTok", s["social.tiktok"]],
      ["Facebook", s["social.facebook"]],
      ["YouTube", s["social.youtube"]],
      ["Google Bisnis", s["social.googleBusiness"]],
    ] as const
  ).filter(([, url]) => Boolean(url));
  const mapsUrl =
    s["maps.url"] ||
    (address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : "");
  const embedUrl = s["maps.embedUrl"];
  const base = siteBaseUrl(s["site.url"]);
  const jsonLd = [
    webPageJsonLd(
      {
        type: "ContactPage",
        name: page?.seo.title || "Kontak Tempe Mak Nuk",
        path: "/kontak",
        description: page?.seo.description || FALLBACK.description,
      },
      base,
    ),
    foodEstablishmentJsonLd(businessFromSettings(s), base),
  ];

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: "Kontak" }]} />
      </Container>
      <Section spacing="tight">
        <Container>
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
            {waHref || intro.primaryCta || intro.secondaryCta ? (
              <div className="flex flex-wrap items-center gap-3">
                {waHref ? (
                  <Button asChild size="lg">
                    <WaLink href={waHref} source="kontak:cta" kind="general">
                      Chat via WhatsApp
                    </WaLink>
                  </Button>
                ) : null}
                <CtaButton
                  cta={intro.primaryCta}
                  variant={waHref ? "secondary" : "primary"}
                />
                <CtaButton cta={intro.secondaryCta} variant="secondary" />
              </div>
            ) : null}
          </Stack>
        </Container>
      </Section>
      {layout.before.length ? (
        <BlockRenderer blocks={layout.before} firstHeadingLevel={2} />
      ) : null}
      <Section spacing="tight" id={details?.anchor ?? undefined}>
        <Container>
          {details?.eyebrow || details?.heading ? (
            <Stack gap="sm" className="mb-6">
              {details.eyebrow ? <Eyebrow>{details.eyebrow}</Eyebrow> : null}
              {details.heading ? (
                <Heading level={2}>{details.heading}</Heading>
              ) : null}
            </Stack>
          ) : null}
          <div className="grid gap-10 lg:grid-cols-2">
            <dl className="border-t border-border">
              {address ? <Row label="Alamat">{address}</Row> : null}
              {hours.summary || hours.days?.length ? (
                <Row label="Jam buka">
                  {hours.summary ? <p>{hours.summary}</p> : null}
                  {hours.days?.length ? (
                    <ul className="mt-1 text-sm text-muted-foreground">
                      {hours.days.map((d) => (
                        <li key={d.day}>
                          {DAYS[d.day]}: {d.open} - {d.close}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </Row>
              ) : null}
              {s["contact.whatsapp"] ? (
                <Row label="WhatsApp">
                  {waHref ? (
                    <WaLink
                      href={waHref}
                      source="kontak:detail"
                      kind="general"
                      className={linkCls}
                    >
                      {s["contact.whatsappDisplay"] || s["contact.whatsapp"]}
                    </WaLink>
                  ) : (
                    s["contact.whatsappDisplay"] || s["contact.whatsapp"]
                  )}
                </Row>
              ) : null}
              {phone ? (
                <Row label="Telepon">
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                    className={linkCls}
                  >
                    {phone}
                  </a>
                </Row>
              ) : null}
              {email ? (
                <Row label="Email">
                  <a href={`mailto:${email}`} className={linkCls}>
                    {email}
                  </a>
                </Row>
              ) : null}
              {socials.length ? (
                <Row label="Sosial media">
                  <ul className="flex flex-wrap gap-x-4 gap-y-1">
                    {socials.map(([name, url]) => (
                      <li key={name}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer me"
                          className={linkCls}
                        >
                          {name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </Row>
              ) : null}
            </dl>
            {embedUrl && mapsUrl ? (
              <LazyMap
                embedUrl={embedUrl}
                mapsUrl={mapsUrl}
                title="Peta lokasi Tempe Mak Nuk"
              />
            ) : mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkCls} h-fit w-fit font-medium`}
              >
                Buka di Google Maps
              </a>
            ) : null}
          </div>
          {note ? (
            <p className="mt-8 text-sm text-muted-foreground">{note}</p>
          ) : null}
        </Container>
      </Section>
      {layout.after.length ? (
        <BlockRenderer blocks={layout.after} firstHeadingLevel={2} />
      ) : null}
      <JsonLd data={jsonLd} />
    </>
  );
}
