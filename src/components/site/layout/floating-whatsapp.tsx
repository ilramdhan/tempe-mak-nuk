"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { cn } from "@/lib/utils";

import { toTrackingSource } from "./nav-utils";
import { WaLink } from "./wa-link";
import { WhatsAppIcon } from "./whatsapp-icon";

export type FloatingWhatsAppProps = {
  href: string;
  /** Visible label on wide screens + accessible name (brand: "Cek slot via WhatsApp"). */
  label: string;
  /** Routes (prefix match) where the button is hidden, e.g. the order builder that has its own WA CTA. */
  hideOn?: string[];
};

function FloatingWhatsAppInner({
  href,
  label,
  hideOn = [],
}: FloatingWhatsAppProps) {
  const pathname = usePathname() ?? "/";
  const hidden = hideOn.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (hidden) return null;

  return (
    <WaLink
      href={href}
      source={toTrackingSource(`float:${pathname}`)}
      kind="general"
      aria-label={`${label} (membuka WhatsApp di tab baru)`}
      className={cn(
        "group fixed z-30 inline-flex h-14 items-center gap-3 rounded-full bg-primary pr-4 pl-4 text-primary-foreground shadow-lg shadow-foreground/10",
        // Above the iOS home indicator / Android gesture bar; clear of page edge.
        "right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] sm:right-6 sm:bottom-6",
        "transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_12%)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        "focus-visible:outline-offset-4",
        "motion-safe:animate-in motion-safe:delay-700 motion-safe:duration-500 motion-safe:fade-in-0 motion-safe:fill-mode-both motion-safe:slide-in-from-bottom-4",
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
 * labelled from md up. Pages with a sticky mobile CTA should add their route to `hideOn`
 * or reserve `pb-24` at the bottom so it never covers content.
 */
export function FloatingWhatsApp(props: FloatingWhatsAppProps) {
  return (
    <Suspense fallback={null}>
      <FloatingWhatsAppInner {...props} />
    </Suspense>
  );
}
