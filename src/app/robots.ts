import type { MetadataRoute } from "next";

import { getSettings } from "@/features/settings/queries";

async function siteUrl(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  const raw = env || (await getSettings())["site.url"];
  return raw ? raw.replace(/\/+$/, "") : "";
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  // Only the production deployment is indexable (previews/local: block all).
  const indexable = !process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production";
  if (!indexable) return { rules: { userAgent: "*", disallow: "/" } };
  const base = await siteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/dev", "/auth", "/login"] },
    ...(base ? { sitemap: `${base}/sitemap.xml`, host: base } : {}),
  };
}
