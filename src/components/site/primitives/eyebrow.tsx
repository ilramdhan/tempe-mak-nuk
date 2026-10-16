import type { ElementType } from "react";

import { cn } from "@/lib/utils";

import type { PolymorphicProps } from "./types";

type OwnProps = {
  /** Short leading rule before the label. */
  rule?: boolean;
  /** Colour: muted (default) or accent-strong (AA-safe gold text). */
  tone?: "muted" | "accent" | "inherit";
};

const TONE = {
  muted: "text-muted-foreground",
  accent: "text-accent-strong",
  inherit: "",
} as const;

/** Small uppercase tracked label above headings (Geist 500, +0.18em). */
export function Eyebrow<E extends ElementType = "p">({
  as,
  rule = false,
  tone = "muted",
  className,
  children,
  ...props
}: PolymorphicProps<E, OwnProps>) {
  const Comp: ElementType = as ?? "p";
  return (
    <Comp
      className={cn(
        "font-sans text-eyebrow font-medium uppercase",
        rule && "flex items-center gap-3",
        TONE[tone],
        className,
      )}
      {...props}
    >
      {rule ? (
        <span
          aria-hidden="true"
          className="h-px w-8 shrink-0 bg-current opacity-60"
        />
      ) : null}
      {children}
    </Comp>
  );
}
