import { Prose } from "@/components/site/primitives";

import { renderRichText, type RenderRichTextOptions } from "./render";
import type { TiptapDoc } from "./schema";

export * from "./render";
export * from "./schema";

/** <Prose>-wrapped rich text. Server component (no client JS). */
export function RichText({
  doc,
  className,
  ...options
}: RenderRichTextOptions & { doc: TiptapDoc | null | undefined; className?: string }) {
  const content = renderRichText(doc, options);
  if (!content) return null;
  return <Prose className={className}>{content}</Prose>;
}
