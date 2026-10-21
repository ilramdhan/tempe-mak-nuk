import type { Metadata } from "next";

export const OG_LOCALE = "id_ID";

export type SeoOverride = {
  title?: string | null;
  description?: string | null;
  noindex?: boolean | null;
  /** Explicit CMS image; overrides the `opengraph-image` file convention. */
  ogImage?: { url: string; width?: number | null; height?: number | null; alt?: string | null } | null;
};

export type BuildMetadataInput = {
  /** Fallback title (CMS `seo.title` wins). */
  title?: string | null;
  description?: string | null;
  /** Root-relative canonical path, e.g. "/produk/tempe-klasik". Resolved via `metadataBase`. */
  path: string;
  siteName: string;
  seo?: SeoOverride | null;
  type?: "website" | "article";
  /** Skip the root title template (title already complete). */
  titleAbsolute?: boolean;
  publishedTime?: Date | string | null;
  modifiedTime?: Date | string | null;
  /** Keep out of the index regardless of CMS flag (e.g. search/utility pages). */
  noindex?: boolean;
};

const iso = (d?: Date | string | null) =>
  d ? (d instanceof Date ? d.toISOString() : d) : undefined;

const DEFAULT_OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: null };

/**
 * Complete page `Metadata`: canonical, openGraph, twitter, robots.
 * `openGraph.images`: explicit CMS image, else the global `/opengraph-image` (P6.3).
 * Routes with their own `opengraph-image` file still win (file-based metadata has priority). Pure.
 */
export function buildMetadata(input: BuildMetadataInput): Metadata {
  const title = input.seo?.title || input.title || undefined;
  const description = input.seo?.description || input.description || undefined;
  const noindex = Boolean(input.noindex || input.seo?.noindex);
  const img = input.seo?.ogImage ?? DEFAULT_OG_IMAGE;
  const article = input.type === "article";

  return {
    title: title ? (input.titleAbsolute ? { absolute: title } : title) : undefined,
    description,
    alternates: { canonical: input.path },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url: input.path,
      siteName: input.siteName,
      locale: OG_LOCALE,
      type: input.type ?? "website",
      ...(article
        ? { publishedTime: iso(input.publishedTime), modifiedTime: iso(input.modifiedTime) }
        : {}),
      ...(img
        ? {
            images: [
              {
                url: img.url,
                width: img.width ?? undefined,
                height: img.height ?? undefined,
                alt: img.alt ?? undefined,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(img ? { images: [img.url] } : {}),
    },
  };
}
