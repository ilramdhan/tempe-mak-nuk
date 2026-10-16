import type { ElementType } from "react";

import { cn } from "@/lib/utils";

import type { PolymorphicProps } from "./types";

/**
 * Article typography for CMS rich text. Styles live in globals.css under
 * `.prose-tmn` (h2, h3, p, ul, ol, blockquote, a, img, figure, table, hr, code).
 */
export function Prose<E extends ElementType = "div">({
  as,
  className,
  ...props
}: PolymorphicProps<E>) {
  const Comp: ElementType = as ?? "div";
  return <Comp className={cn("prose-tmn", className)} {...props} />;
}
