import type { ElementType } from "react";

import { cn } from "@/lib/utils";

import type { PolymorphicProps } from "./types";

export type ContainerSize = "prose" | "default" | "wide" | "full";

const SIZE: Record<ContainerSize, string> = {
  prose: "max-w-measure", // 68ch
  default: "max-w-content", // 1280px
  wide: "max-w-wide", // 1440px
  full: "max-w-none",
};

type OwnProps = {
  size?: ContainerSize;
  /** Drop the horizontal gutter (e.g. for full-bleed media inside). */
  bleed?: boolean;
};

/** Centered width wrapper. Gutter 16px mobile → 32px desktop (`--gutter`). */
export function Container<E extends ElementType = "div">({
  as,
  size = "default",
  bleed = false,
  className,
  ...props
}: PolymorphicProps<E, OwnProps>) {
  const Comp: ElementType = as ?? "div";
  return (
    <Comp
      className={cn(
        "mx-auto w-full",
        SIZE[size],
        !bleed && "px-gutter",
        className,
      )}
      {...props}
    />
  );
}
