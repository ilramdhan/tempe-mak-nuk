import "server-only";

import type { Metadata } from "next";

import { getMedia } from "@/features/media/queries";
import { getSettings } from "@/features/settings/queries";

import { buildMetadata, OG_LOCALE, type BuildMetadataInput, type SeoOverride } from "./metadata";
import { businessFromSettings } from "./settings";
import { siteBaseUrl } from "./url";

/** Settings + resolved origin + business facts, for pages building JSON-LD. */
export async function getSeoContext() {
  const settings = await getSettings();
  const base = siteBaseUrl(settings["site.url"]);
  return { settings, base, business: businessFromSettings(settings) };
}

/** Resolve a CMS `seo.ogImageId` to an explicit image (null → use the file convention). */
export async function seoImage(ogImageId?: string | null): Promise<SeoOverride["ogImage"]> {
  if (!ogImageId) return null;
  const m = await getMedia(ogImageId);
  return m ? { url: m.url, width: m.width, height: m.height, alt: m.alt } : null;
}

type PageMetadataInput = Omit<BuildMetadataInput, "siteName" | "seo"> & {
  seo?: { title?: string | null; description?: string | null; noindex?: boolean | null; ogImageId?: string | null } | null;
};

/** `buildMetadata` with siteName from settings and the CMS og image resolved. */
export async function pageMetadata(input: PageMetadataInput): Promise<Metadata> {
  const [settings, ogImage] = await Promise.all([getSettings(), seoImage(input.seo?.ogImageId)]);
  return buildMetadata({
    ...input,
    description: input.description || settings["seo.defaultDescription"] || undefined,
    siteName: settings["business.name"],
    seo: input.seo ? { ...input.seo, ogImage } : null,
  });
}

/** Root metadata: metadataBase, title template, defaults. All from settings. */
export async function rootMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const base = siteBaseUrl(settings["site.url"]);
  const name = settings["business.name"];
  const description = settings["seo.defaultDescription"] || undefined;
  const title = settings["seo.defaultTitle"] || name;
  return {
    metadataBase: new URL(base),
    title: { template: settings["seo.titleTemplate"] || `%s — ${name}`, default: title },
    description,
    applicationName: name,
    openGraph: { siteName: name, locale: OG_LOCALE, type: "website", title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}
