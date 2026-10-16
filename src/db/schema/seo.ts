/** Shape of every `seo` jsonb column (pages, products, posts, recipes). All optional. */
export type SeoMeta = {
  title?: string;
  description?: string;
  ogImageId?: string | null;
  noindex?: boolean;
};

/** Tiptap / ProseMirror JSON document (validated + sanitized in the features layer). */
export type RichTextDoc = {
  type: "doc";
  content?: unknown[];
  [key: string]: unknown;
};
