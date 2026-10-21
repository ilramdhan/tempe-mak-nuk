import { Suspense } from "react";

import { LenisProvider } from "@/components/motion/lenis-provider";
import {
  AnnouncementBar,
  FloatingWhatsApp,
  SiteFooter,
  SiteHeader,
  SkipLink,
  WaLink,
} from "@/components/site/layout";
import { ConsentManager } from "@/features/consent";
import {
  getActiveAnnouncement,
  getNavigation,
} from "@/features/navigation/queries";
import { getSettings } from "@/features/settings/queries";
import { buildWaLink } from "@/lib/wa-link";

/** docs/brand.md §5 — short header CTA. */
const HEADER_CTA_LABEL = "Pesan";
/** docs/brand.md §1 — chosen tagline (brand copy, not a business value). */
const TAGLINE = "Tiga bahan, tanpa jalan pintas.";
/** Routes with their own WhatsApp CTA where the floating button would compete. */
const HIDE_FLOATING_WA_ON = ["/custom-order"];

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  // All three are "use cache" reads (tags: nav, announcements, settings) → prerendered.
  const [navigation, announcement, settings] = await Promise.all([
    getNavigation(),
    getActiveAnnouncement(),
    getSettings(),
  ]);

  const waHref = buildWaLink(
    settings["contact.whatsapp"],
    settings["cta.waFloatMessage"],
  );
  const showFloatingWa = Boolean(waHref) && settings["cta.waFloatEnabled"];

  return (
    <LenisProvider>
      <SkipLink />
      {announcement ? (
        <AnnouncementBar
          id={announcement.id}
          text={announcement.text}
          href={announcement.href}
        />
      ) : null}
      <SiteHeader
        links={navigation.header}
        cta={{
          label: HEADER_CTA_LABEL,
          href: settings["cta.primaryHref"] || "/custom-order",
        }}
        mobileFooter={
          waHref ? (
            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
              <WaLink
                href={waHref}
                source="mobile-menu"
                className="inline-flex min-h-11 w-fit items-center rounded-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                {settings["cta.primaryLabel"]}
              </WaLink>
              {settings.hours.summary ? <p>{settings.hours.summary}</p> : null}
            </div>
          ) : null
        }
      />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter
        navigation={navigation}
        settings={settings}
        tagline={TAGLINE}
      />
      {showFloatingWa && waHref ? (
        <FloatingWhatsApp
          href={waHref}
          label={settings["cta.primaryLabel"]}
          hideOn={HIDE_FLOATING_WA_ON}
        />
      ) : null}
      <Suspense fallback={null}>
        <ConsentManager />
      </Suspense>
    </LenisProvider>
  );
}
