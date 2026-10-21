/**
 * Page slug ↔ route rules (P8.1). Pure + client-safe (used by Zod in the admin editor).
 *
 * - STATIC_PAGE_SLUGS: `pages` rows rendered by their own static route (`/produk`, `/tentang`, …).
 *   They stay editable in the admin and are never served by the CMS catch-all.
 * - RESERVED_PAGE_SLUGS: top-level paths owned by code (lists, legal, admin, auth, API, metadata
 *   files). A page with such a slug could never be reached, so the admin rejects it.
 * - Anything else is a "CMS route slug", served by `src/app/(site)/[slug]/page.tsx`.
 *
 * Keep in sync with `src/app/**` — `__tests__/slugs.test.ts` fails when a new top-level route
 * directory is not listed here.
 */

export const STATIC_PAGE_SLUGS = [
  "home",
  "produk",
  "faq",
  "kontak",
  "tentang",
  "cara-pesan",
  "custom-order",
  "halal-kualitas",
  "kemitraan",
  "manfaat-tempe",
  "proses",
] as const;

export const RESERVED_PAGE_SLUGS = [
  // public routes without a `pages` row
  "jurnal",
  "resep",
  "kebijakan-cookie",
  "kebijakan-pemesanan",
  "kebijakan-privasi",
  "syarat-ketentuan",
  // admin, auth, api, dev
  "admin",
  "login",
  "logout",
  "auth",
  "akses-ditolak",
  "api",
  "dev",
  // metadata files / framework paths
  "sitemap",
  "robots",
  "manifest",
  "favicon",
  "og-default",
  "not-found",
  "404",
  "500",
] as const;

/** Metadata routes that get a hashed suffix (`/opengraph-image-abc123`). */
const RESERVED_PREFIXES = [
  "opengraph-image",
  "twitter-image",
  "icon",
  "apple-icon",
] as const;

const STATIC_SET = new Set<string>(STATIC_PAGE_SLUGS);
const RESERVED_SET = new Set<string>(RESERVED_PAGE_SLUGS);

/** Single kebab-case segment (a-z, 0-9, -). */
export const PAGE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isStaticPageSlug(slug: string): boolean {
  return STATIC_SET.has(slug);
}

/** True when the slug's path is owned by a code route other than a CMS-backed static page. */
export function isReservedPageSlug(slug: string): boolean {
  const first = slug.split("/")[0] ?? "";
  if (RESERVED_SET.has(first)) return true;
  return RESERVED_PREFIXES.some(
    (p) => first === p || first.startsWith(`${p}-`),
  );
}

/** Slugs served by the CMS catch-all `/[slug]` (not static, not reserved). */
export function isCmsRouteSlug(slug: string): boolean {
  return (
    PAGE_SLUG_RE.test(slug) &&
    !isStaticPageSlug(slug) &&
    !isReservedPageSlug(slug)
  );
}

/** Public path of a page row (`home` → `/`). */
export function pagePath(slug: string): string {
  return slug === "home" ? "/" : `/${slug}`;
}
