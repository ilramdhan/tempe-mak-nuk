/** Fallback origin when neither env nor settings define one (local dev / CI build). */
export const FALLBACK_SITE_URL = "http://localhost:3000";

/**
 * Single source of truth for the public origin (same rule as `src/app/sitemap.ts`):
 * NEXT_PUBLIC_SITE_URL → settings `site.url` → localhost. No trailing slash.
 */
export function siteBaseUrl(settingsSiteUrl?: string | null): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || settingsSiteUrl || FALLBACK_SITE_URL;
  return raw.replace(/\/+$/, "");
}

/** Absolute URL for a root-relative path ("/" → origin). Absolute inputs pass through. */
export function absoluteUrl(path: string, base: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const origin = base.replace(/\/+$/, "");
  if (!path || path === "/") return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
