/** Shared helpers for site chrome (client-safe, no React). */

/** Exact match → "page"; section match (/jurnal for /jurnal/x) → "section"; else false. */
export function matchPath(
  pathname: string | null,
  href: string,
): "page" | "section" | false {
  if (!pathname || !href.startsWith("/")) return false;
  const clean = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  const path = clean(pathname);
  const target = clean(href.split(/[?#]/)[0] ?? href);
  if (path === target) return "page";
  if (target !== "/" && path.startsWith(`${target}/`)) return "section";
  return false;
}

export function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//i.test(href) || /^(mailto|tel):/i.test(href);
}

/** wa_clicks.source only accepts [a-zA-Z0-9/_:.-]{1,200}. */
export function toTrackingSource(value: string): string {
  const s = value.replace(/[^a-zA-Z0-9/_:.-]+/g, "_").slice(0, 200);
  return s || "unknown";
}
