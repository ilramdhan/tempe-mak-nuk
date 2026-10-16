import type { ElementType } from "react";

import { cn } from "@/lib/utils";

import type { PolymorphicProps } from "./types";

export type SectionTone = "default" | "surface" | "primary" | "inverse";
export type SectionSpacing = "default" | "tight" | "none";

const TONE: Record<SectionTone, string> = {
  default: "bg-background text-foreground",
  surface: "bg-surface text-foreground",
  // Brand-green fill; .tone-primary softens muted text/borders for it.
  primary: "tone-primary bg-primary text-primary-foreground",
  // Flips the whole token set (light ↔ dark) for this subtree.
  inverse: "tone-inverse bg-background text-foreground",
};

const SPACING: Record<SectionSpacing, string> = {
  default: "py-section",
  tight: "py-section-tight",
  none: "",
};

type OwnProps = {
  tone?: SectionTone;
  spacing?: SectionSpacing;
  /** Overlay subtle film grain (theme-aware opacity/blend). */
  grain?: boolean;
};

/**
 * Vertical rhythm + tone band. Width is NOT constrained — nest a
 * <Container> inside. Pass `id` for in-page anchors.
 */
export function Section<E extends ElementType = "section">({
  as,
  tone = "default",
  spacing = "default",
  grain = false,
  className,
  ...props
}: PolymorphicProps<E, OwnProps>) {
  const Comp: ElementType = as ?? "section";
  return (
    <Comp
      data-tone={tone}
      className={cn(
        "relative scroll-mt-20",
        TONE[tone],
        SPACING[spacing],
        grain && "grain",
        className,
      )}
      {...props}
    />
  );
}
