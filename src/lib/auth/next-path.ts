/**
 * Post-login redirect target sanitisation (open-redirect guard).
 * Only same-origin paths under `/admin` are accepted; anything else falls back.
 */

export const DEFAULT_AFTER_LOGIN = "/admin";

const BASE = "http://tmn.invalid";
const MAX_LENGTH = 512;

/**
 * Returns a safe in-app path (`/admin…` incl. query/hash) or `fallback`.
 * Rejects absolute / protocol-relative URLs, backslashes, control chars, path traversal out of
 * `/admin`, and look-alikes such as `/administrator`.
 */
export function sanitizeNextPath(
  raw: unknown,
  fallback: string = DEFAULT_AFTER_LOGIN,
): string {
  if (typeof raw !== "string") return fallback;
  const value = raw.trim();
  if (!value || value.length > MAX_LENGTH) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  // Backslashes are normalised to "/" by browsers ("/\evil.com" → "//evil.com"); control chars likewise stripped.
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return fallback;

  let url: URL;
  try {
    url = new URL(value, BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE) return fallback;
  if (!/^\/admin(?:\/|$)/.test(url.pathname)) return fallback;
  // Encoded slashes/backslashes could be re-decoded by a downstream router.
  if (/%2f|%5c/i.test(url.pathname)) return fallback;

  return `${url.pathname}${url.search}${url.hash}`;
}

/** `/login?next=…` for a requested admin path (path is sanitised first). */
export function loginPathFor(requested?: string | null): string {
  const next = sanitizeNextPath(requested, "");
  return next && next !== DEFAULT_AFTER_LOGIN
    ? `/login?next=${encodeURIComponent(next)}`
    : "/login";
}
