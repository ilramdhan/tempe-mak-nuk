import type { ComponentPropsWithoutRef, ElementType } from "react";

/** Minimal polymorphic props: `as` + the intrinsic props of that element. */
export type PolymorphicProps<E extends ElementType, Own = object> = Own &
  Omit<ComponentPropsWithoutRef<E>, keyof Own | "as"> & { as?: E };

/** Gap scale — the ONLY gaps primitives accept (4px grid). */
export type Gap =
  "none" | "2xs" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "section";

export const GAP: Record<Gap, string> = {
  none: "gap-0",
  "2xs": "gap-1", // 4
  xs: "gap-2", // 8
  sm: "gap-4", // 16
  md: "gap-6", // 24
  lg: "gap-10", // 40
  xl: "gap-16", // 64
  "2xl": "gap-24", // 96
  section: "gap-section", // fluid, = --section-y
};
