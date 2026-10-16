import type { ElementType } from "react";

import { cn } from "@/lib/utils";

import { GAP, type Gap, type PolymorphicProps } from "./types";

type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "between";

const ALIGN: Record<Align, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const JUSTIFY: Record<Justify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

type OwnProps = {
  direction?: "column" | "row";
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
};

/** Flex stack with token gaps only. */
export function Stack<E extends ElementType = "div">({
  as,
  direction = "column",
  gap = "sm",
  align,
  justify,
  wrap = false,
  className,
  ...props
}: PolymorphicProps<E, OwnProps>) {
  const Comp: ElementType = as ?? "div";
  return (
    <Comp
      className={cn(
        "flex",
        direction === "column" ? "flex-col" : "flex-row",
        GAP[gap],
        align && ALIGN[align],
        justify && JUSTIFY[justify],
        wrap && "flex-wrap",
        className,
      )}
      {...props}
    />
  );
}
