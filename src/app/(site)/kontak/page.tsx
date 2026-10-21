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
import { getSettings } from "@/features/settings/queries";
import { businessFromSettings, foodEstablishmentJsonLd, JsonLd, siteBaseUrl, webPageJsonLd } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";
import { buildWaLink } from "@/lib/wa-link";

import { LazyMap } from "./_components/lazy-map";

const DESCRIPTION =
  "Alamat dapur produksi Tempe Mak Nuk di Pedan, Klaten, jam buka, peta, WhatsApp, dan Instagram. Chat dulu untuk cek slot sebelum datang.";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Kontak dan Alamat Tempe Mak Nuk, Pedan Klaten",
    description: DESCRIPTION,
    path: "/kontak",
    titleAbsolute: true,
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
  const s = await getSettings();
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
        name: "Kontak Tempe Mak Nuk",
        path: "/kontak",
        description: DESCRIPTION,
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
            <Eyebrow>Kontak</Eyebrow>
            <Heading level={1} size="display">
              Kontak dan alamat
            </Heading>
            <Lead muted>{DESCRIPTION}</Lead>
            {waHref ? (
              <div>
                <Button asChild variant="accent" size="lg">
                  <WaLink href={waHref} source="kontak:cta" kind="general">
                    Chat via WhatsApp
                  </WaLink>
                </Button>
              </div>
            ) : null}
          </Stack>
        </Container>
      </Section>
      <Section spacing="tight">
        <Container>
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
          <p className="mt-8 text-sm text-muted-foreground">
            Chat dulu untuk cek slot sebelum datang, ya. Dapur kami produksi
            sesuai pesanan.
          </p>
        </Container>
      </Section>
      <JsonLd data={jsonLd} />
    </>
  );
}
