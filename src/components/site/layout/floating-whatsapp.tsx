"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import {
  FLOATING_WA_HIDDEN_ROUTES,
  isBannerShown,
  isFloatingWaTucked,
  isRouteHidden,
} from "./floating-whatsapp-visibility";
import { toTrackingSource } from "./nav-utils";
import { WaLink } from "./wa-link";
import { WhatsAppIcon } from "./whatsapp-icon";

export type FloatingWhatsAppProps = {
  href: string;
  /** Visible label on wide screens + accessible name (brand: "Cek slot via WhatsApp"). */
  label: string;
  /**
   * Extra routes (prefix match) where the button is hidden. `/custom-order` (own WA CTA +
   * sticky bar) and `/admin` are always hidden.
   */
  hideOn?: string[];
};

/** Matches `consent-ui.tsx` BANNER_ID. */
const CONSENT_BANNER_ID = "tmn-consent-banner";
/** Below Tailwind `md` (48rem): icon-only button, footer WA links take over. */
const MOBILE_QUERY = "(max-width: 47.999rem)";

/** Tracks whether the floating button would cover the footer (mobile) or the consent banner. */
function useTucked(): boolean {
  const [footerVisible, setFooterVisible] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    // Site footer only (not an <article>'s footer inside <main>).
    const footer = document.querySelector("footer:not(main footer)");
    const mobile = window.matchMedia(MOBILE_QUERY);
    let intersecting = false;
    const sync = () => setFooterVisible(mobile.matches && intersecting);

    const io = footer
      ? new IntersectionObserver(([entry]) => {
          intersecting = Boolean(entry?.isIntersecting);
          sync();
        })
      : null;
    if (footer) io?.observe(footer);
    mobile.addEventListener("change", sync);

    // The banner is rendered by ConsentManager, hidden pre-paint by an inline script
    // when consent exists, and unmounted after a decision → watch the DOM.
    const checkBanner = () =>
      setBannerVisible(
        isBannerShown(document.getElementById(CONSENT_BANNER_ID)),
      );
    checkBanner();
    const mo = new MutationObserver(checkBanner);
    mo.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "data-pending"],
    });

    return () => {
      io?.disconnect();
      mo.disconnect();
      mobile.removeEventListener("change", sync);
    };
  }, []);

  return isFloatingWaTucked({ footerVisible, bannerVisible });
}

function FloatingWhatsAppInner({
  href,
  label,
  hideOn = [],
}: FloatingWhatsAppProps) {
  const pathname = usePathname() ?? "/";
  const tucked = useTucked();
  if (isRouteHidden(pathname, [...FLOATING_WA_HIDDEN_ROUTES, ...hideOn])) {
    return null;
  }

  return (
    <WaLink
      href={href}
      source={toTrackingSource(`float:${pathname}`)}
      kind="general"
      aria-label={`${label} (membuka WhatsApp di tab baru)`}
      // Tucked = out of the tab order and the a11y tree, not merely transparent.
      inert={tucked}
      data-tucked={tucked ? "" : undefined}
      className={cn(
        "group fixed z-30 inline-flex h-14 min-w-14 items-center gap-3 rounded-full bg-primary pr-4 pl-4 text-primary-foreground shadow-lg shadow-foreground/10",
        // Above the iOS home indicator / Android gesture bar; clear of page edge.
        "right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] sm:right-6 sm:bottom-6",
        "transition-[background-color,transform,translate,opacity,visibility] duration-200 hover:-translate-y-0.5 hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_12%)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        // Tucked: slide down + fade, then `invisible` (visibility flips at the end of the transition).
        "data-tucked:pointer-events-none data-tucked:invisible data-tucked:translate-y-[150%] data-tucked:opacity-0",
        "focus-visible:outline-offset-4",
        // Slide only (no opacity fade): a mid-fade label fails color-contrast (axe, WCAG 1.4.3).
        "motion-safe:animate-in motion-safe:delay-700 motion-safe:duration-500 motion-safe:fill-mode-both motion-safe:slide-in-from-bottom-4",
        "print:hidden",
      )}
    >
      <WhatsAppIcon className="size-6 shrink-0" />
      <span className="hidden pr-1 text-sm font-medium md:inline">{label}</span>
    </WaLink>
  );
}

/**
 * Floating WhatsApp CTA. Icon-only on mobile (56px, bottom-right within safe areas),
 * labelled from md up. Never shown on `/custom-order` or `/admin`; tucked away (inert)
 * while the consent banner is up and, on mobile, while the footer (own WA links) is in view.
 */
export function FloatingWhatsApp(props: FloatingWhatsAppProps) {
  return (
    <Suspense fallback={null}>
      <FloatingWhatsAppInner {...props} />
    </Suspense>
  );
}
