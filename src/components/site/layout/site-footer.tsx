import { ArrowUpRightIcon, BadgeCheckIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { ConsentSettingsButton } from "@/features/consent/consent-settings-button";
import { MyceliumPattern } from "@/components/brand/textures";
import { Container, Divider, Grid, Stack } from "@/components/site/primitives";
import type { Navigation, NavLink } from "@/features/navigation/queries";
import type { Settings } from "@/features/settings/schema";
import { buildWaLink } from "@/lib/wa-link";

import { CopyrightYear } from "./copyright-year";
import { isExternalHref } from "./nav-utils";
import { WaLink } from "./wa-link";

/** Column headings (layout labels; the links themselves come from nav_items). */
const COLUMNS = [
  ["footer_col1", "Produk"],
  ["footer_col2", "Pesan"],
  ["footer_col3", "Pelajari"],
  ["footer_col4", "Tentang kami"],
] as const;

const SOCIALS = [
  ["social.instagram", "Instagram"],
  ["social.tiktok", "TikTok"],
  ["social.facebook", "Facebook"],
  ["social.youtube", "YouTube"],
  ["social.googleBusiness", "Google Maps"],
] as const;

const linkClass =
  "inline-flex min-h-11 items-center gap-1 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground sm:min-h-9";

function FooterLink({ link }: { link: NavLink }) {
  if (isExternalHref(link.href)) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {link.label}
        <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
      </a>
    );
  }
  return (
    <Link href={link.href} className={linkClass}>
      {link.label}
    </Link>
  );
}

function FactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

export type SiteFooterProps = {
  navigation: Navigation;
  settings: Settings;
  /** Brand line under the logo (docs/brand.md tagline). */
  tagline?: string;
};

/** Site footer (server component). All business facts come from settings. */
export function SiteFooter({
  navigation,
  settings: s,
  tagline,
}: SiteFooterProps) {
  const waHref = buildWaLink(s["contact.whatsapp"], s["cta.waFloatMessage"]);
  const address = [
    s["address.street"],
    s["address.village"],
    s["address.district"],
    [s["address.city"], s["address.postalCode"]].filter(Boolean).join(" "),
    s["address.province"],
  ].filter(Boolean);
  const socials = SOCIALS.filter(([key]) => Boolean(s[key]));
  const columns = COLUMNS.filter(([loc]) => navigation[loc].length > 0);
  const founded = s["business.foundedYear"];
  const owner = s["business.legalName"] || s["business.name"];

  return (
    <footer className="relative isolate overflow-hidden border-t border-border bg-surface text-foreground">
      <MyceliumPattern className="-z-10 text-primary opacity-[0.06] dark:opacity-[0.08]" />
      <Container size="wide" className="py-section-tight">
        <Grid cols={12} gap="lg" rowGap="xl">
          {/* Brand + contact */}
          <Stack gap="md" className="col-span-4 md:col-span-12 lg:col-span-4">
            <Link
              href="/"
              className="inline-flex w-fit rounded-sm text-primary dark:text-foreground"
            >
              <Logo
                variant="horizontal"
                className="h-11 w-auto"
                aria-label="Tempe Mak Nuk, ke beranda"
              />
            </Link>
            {tagline ? (
              <p className="max-w-xs font-display-soft text-h4 text-foreground">
                {tagline}
              </p>
            ) : null}
            {waHref ? (
              <WaLink
                href={waHref}
                source="footer"
                className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-input px-5 text-sm font-medium transition-colors hover:bg-background"
              >
                Chat WhatsApp
                {s["contact.whatsappDisplay"] ? (
                  <span className="text-muted-foreground">
                    {s["contact.whatsappDisplay"]}
                  </span>
                ) : null}
                <span className="sr-only">(tab baru)</span>
              </WaLink>
            ) : null}
          </Stack>

          {/* Link columns */}
          <nav
            aria-label="Tautan footer"
            className="col-span-4 md:col-span-12 lg:col-span-8"
          >
            <Grid cols={4} gap="lg" rowGap="lg" className="grid-cols-2">
              {columns.map(([loc, title]) => (
                <Stack key={loc} gap="xs">
                  {/* Eyebrow styling inline: <Eyebrow> runs cn(), which currently drops text-eyebrow. */}
                  <h2 className="font-sans text-eyebrow font-medium text-muted-foreground uppercase">
                    {title}
                  </h2>
                  <ul className="flex flex-col">
                    {navigation[loc].map((link) => (
                      <li key={link.id}>
                        <FooterLink link={link} />
                      </li>
                    ))}
                  </ul>
                </Stack>
              ))}
            </Grid>
          </nav>
        </Grid>

        <Divider className="my-10 lg:my-16" />

        {/* Facts: address, hours, contact, halal */}
        <Grid cols={4} gap="lg" rowGap="md" as="dl">
          {address.length ? (
            <FactRow label="Alamat">
              <address className="not-italic">
                {address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              {s["maps.url"] ? (
                <a
                  href={s["maps.url"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex min-h-11 items-center gap-1 rounded-sm text-accent-strong underline-offset-4 hover:underline sm:min-h-9"
                >
                  Buka di Google Maps
                  <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </FactRow>
          ) : null}
          {s.hours.summary ? (
            <FactRow label="Jam buka">{s.hours.summary}</FactRow>
          ) : null}
          {s["contact.email"] || s["contact.phone"] ? (
            <FactRow label="Kontak">
              {s["contact.email"] ? (
                <a
                  href={`mailto:${s["contact.email"]}`}
                  className="inline-flex min-h-11 items-center rounded-sm underline-offset-4 hover:underline sm:min-h-8"
                >
                  {s["contact.email"]}
                </a>
              ) : null}
              {s["contact.phone"] ? (
                <a
                  href={`tel:${s["contact.phone"].replace(/[^\d+]/g, "")}`}
                  className="flex min-h-11 items-center rounded-sm underline-offset-4 hover:underline sm:min-h-8"
                >
                  {s["contact.phone"]}
                </a>
              ) : null}
            </FactRow>
          ) : null}
          {s["halal.number"] ? (
            <FactRow label="Halal">
              <span className="inline-flex items-center gap-2">
                <BadgeCheckIcon
                  className="size-4 shrink-0 text-halal"
                  aria-hidden="true"
                />
                <span className="font-mono text-sm tracking-tight">
                  {s["halal.number"]}
                </span>
              </span>
              {s["halal.issuer"] ? (
                <span className="block text-muted-foreground">
                  {s["halal.issuer"]}
                </span>
              ) : null}
              {s["halal.verifyUrl"] ? (
                <a
                  href={s["halal.verifyUrl"]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex min-h-11 items-center gap-1 rounded-sm text-accent-strong underline-offset-4 hover:underline sm:min-h-9"
                >
                  Cek sertifikat di BPJPH
                  <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </FactRow>
          ) : null}
        </Grid>

        {socials.length ? (
          <ul
            aria-label="Media sosial"
            className="mt-10 flex flex-wrap gap-x-6 gap-y-1"
          >
            {socials.map(([key, label]) => (
              <li key={key}>
                <a
                  href={s[key]}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className={linkClass}
                >
                  {label}
                  <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        ) : null}

        <Divider className="my-8" />

        {/* Legal row */}
        <div className="flex flex-col gap-4 text-caption text-muted-foreground lg:flex-row lg:items-center lg:justify-between">
          <p>
            © {founded ? `${founded}–` : ""}
            <CopyrightYear /> {owner}.
            {s["legal.nib"] ? <> NIB {s["legal.nib"]}.</> : null}
            {s["legal.pirt"] ? <> P-IRT {s["legal.pirt"]}.</> : null}
          </p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-5">
              {navigation.legal.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center rounded-sm transition-colors hover:text-foreground sm:min-h-8"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <ConsentSettingsButton className="inline-flex min-h-11 cursor-pointer items-center rounded-sm transition-colors hover:text-foreground sm:min-h-8" />
              </li>
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
