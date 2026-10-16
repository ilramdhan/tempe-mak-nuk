"use client";

import type { ComponentProps } from "react";

import type { WaClickInput } from "@/features/analytics/schema";
import { trackWaClick } from "@/features/analytics/actions";

import { toTrackingSource } from "./nav-utils";

export type WaLinkProps = Omit<ComponentProps<"a">, "href"> & {
  /** Prebuilt wa.me URL (server: `buildWaLink(settings["contact.whatsapp"], msg)`). */
  href: string;
  /** Where the click happened, e.g. "footer", "home:hero". Sanitised for analytics. */
  source: string;
  kind?: WaClickInput["kind"];
  variant?: string | null;
};

/**
 * Anchor to WhatsApp that records an anonymous click (fire-and-forget server action).
 * Opens in a new tab; never blocks navigation.
 */
export function WaLink({
  href,
  source,
  kind = "general",
  variant,
  onClick,
  target = "_blank",
  rel = "noopener noreferrer",
  ...props
}: WaLinkProps) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      onClick={(event) => {
        onClick?.(event);
        void trackWaClick({
          source: toTrackingSource(source),
          kind,
          variant: variant ? toTrackingSource(variant).slice(0, 100) : null,
        }).catch(() => undefined);
      }}
      {...props}
    />
  );
}
