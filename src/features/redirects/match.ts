/** Pure redirect matching for the proxy (client-safe, unit-tested). */
import { normalizeFrom } from "./logic";

export type RedirectEntry = { from: string; to: string; permanent: boolean };
export type RedirectMatch = { to: string; status: 301 | 302 };

/** Paths never redirected, whatever the table says. */
export function isProtectedPath(pathname: string): boolean {
  return /^\/(admin|api|_next)(\/|$)/.test(pathname);
}

/** Lookup keyed by normalized `from` (trim + strip trailing slashes; case-sensitive, as stored). */
export function buildRedirectMap(rules: readonly RedirectEntry[]): Map<string, RedirectEntry> {
  const map = new Map<string, RedirectEntry>();
  for (const r of rules) {
    const key = normalizeFrom(r.from);
    if (key.startsWith("/")) map.set(key, r);
  }
  return map;
}

/**
 * Match a request path. Internal targets keep the request query string unless the target has its own;
 * external targets are used as-is. Returns null for no match, protected paths and self-redirects.
 * Permanent → 301, otherwise 302.
 */
export function matchRedirect(
  map: ReadonlyMap<string, RedirectEntry>,
  pathname: string,
  search = "",
): RedirectMatch | null {
  if (isProtectedPath(pathname)) return null;
  const key = normalizeFrom(pathname);
  const rule = map.get(key);
  if (!rule) return null;
  const to = rule.to.trim();
  if (!to) return null;
  const internal = to.startsWith("/") && !to.startsWith("//");
  if (internal) {
    const targetPath = normalizeFrom(to.split(/[?#]/)[0] ?? "");
    if (targetPath === key) return null;
  }
  const withQuery = internal && search && !to.includes("?") ? insertSearch(to, search) : to;
  return { to: withQuery, status: rule.permanent ? 301 : 302 };
}

function insertSearch(to: string, search: string): string {
  const hashAt = to.indexOf("#");
  return hashAt === -1 ? to + search : to.slice(0, hashAt) + search + to.slice(hashAt);
}
