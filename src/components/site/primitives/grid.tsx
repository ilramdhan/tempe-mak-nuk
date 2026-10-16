import type { ElementType } from "react";

import { cn } from "@/lib/utils";

import { GAP, type Gap, type PolymorphicProps } from "./types";

export type GridCols = 1 | 2 | 3 | 4 | 6 | 12;

// Mobile-first, collapse to 1 column on small screens.
// 12 = editorial grid: children place themselves with col-span-*/col-start-*.
const COLS: Record<GridCols, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  12: "grid-cols-4 md:grid-cols-12",
};

type OwnProps = {
  cols?: GridCols;
  gap?: Gap;
  /** Separate row gap; defaults to `gap`. */
  rowGap?: Gap;
};

const ROW_GAP: Record<Gap, string> = {
  none: "gap-y-0",
  "2xs": "gap-y-1",
  xs: "gap-y-2",
  sm: "gap-y-4",
  md: "gap-y-6",
  lg: "gap-y-10",
  xl: "gap-y-16",
  "2xl": "gap-y-24",
  section: "gap-y-section",
};

export function Grid<E extends ElementType = "div">({
  as,
  cols = 12,
  gap = "md",
  rowGap,
  className,
  ...props
}: PolymorphicProps<E, OwnProps>) {
  const Comp: ElementType = as ?? "div";
  return (
    <Comp
      className={cn(
        "grid",
        COLS[cols],
        GAP[gap],
        rowGap && ROW_GAP[rowGap],
        className,
      )}
      {...props}
    />
  );
}
