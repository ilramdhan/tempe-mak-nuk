import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type DividerProps = HTMLAttributes<HTMLElement> & {
  orientation?: "horizontal" | "vertical";
  /** `strong` uses --input (3:1) when the line must be perceivable. */
  tone?: "default" | "strong" | "accent";
  /** Purely visual (aria-hidden) vs a semantic thematic break. */
  decorative?: boolean;
};

const TONE = {
  default: "bg-border",
  strong: "bg-input",
  accent: "bg-accent",
} as const;

export function Divider({
  orientation = "horizontal",
  tone = "default",
  decorative = true,
  className,
  ...props
}: DividerProps) {
  const shape =
    orientation === "horizontal" ? "h-px w-full" : "w-px self-stretch";
  if (decorative) {
    return (
      <div
        aria-hidden="true"
        className={cn("shrink-0", shape, TONE[tone], className)}
        {...props}
      />
    );
  }
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn("shrink-0", shape, TONE[tone], className)}
      {...props}
    />
  );
}
