import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type HeadingLevel = 1 | 2 | 3 | 4;
export type HeadingSize = "display-xl" | "display" | "h1" | "h2" | "h3" | "h4";

const SIZE: Record<HeadingSize, string> = {
  "display-xl": "text-display-xl",
  display: "text-display",
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
  h4: "text-h4",
};

const DEFAULT_SIZE: Record<HeadingLevel, HeadingSize> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
};

export type HeadingProps = HTMLAttributes<HTMLHeadingElement> & {
  /** Semantic level (document outline). */
  level?: HeadingLevel;
  /** Visual size, independent of level. Defaults to the level's size. */
  size?: HeadingSize;
};

/** Fraunces display heading; `text-wrap: balance` comes from base styles. */
export function Heading({
  level = 2,
  size,
  className,
  ...props
}: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={cn(
        "font-display text-balance",
        SIZE[size ?? DEFAULT_SIZE[level]],
        className,
      )}
      {...props}
    />
  );
}
