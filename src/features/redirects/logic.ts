/** Pure redirect rules (client-safe, unit-tested). */
export type RedirectRule = { from: string; to: string };

/** Path part of an internal target (strip query/hash, trailing slash); null for external/other schemes. */
export function internalPath(to: string): string | null {
  if (!to.startsWith("/") || to.startsWith("//")) return null;
  const p = to.split(/[?#]/)[0] ?? "";
  return p.length > 1 ? p.replace(/\/+$/, "") : p;
}

export function normalizeFrom(from: string): string {
  const p = from.trim();
  return p.length > 1 ? p.replace(/\/+$/, "") : p;
}

/**
 * Detect a loop if `candidate` were added to `existing` (candidate replaces the rule with the
 * same `from`). Follows the chain from candidate.to; returns an Indonesian message or null.
 */
export function findRedirectLoop(existing: RedirectRule[], candidate: RedirectRule): string | null {
  const from = normalizeFrom(candidate.from);
  const map = new Map<string, string>();
  for (const r of existing) map.set(normalizeFrom(r.from), r.to);
  map.set(from, candidate.to);
  const seen = new Set<string>([from]);
  let cur = internalPath(candidate.to);
  while (cur !== null) {
    if (cur === from) return "Redirect ini membuat perulangan (loop) ke dirinya sendiri.";
    if (seen.has(cur)) return "Rantai redirect berulang (loop).";
    seen.add(cur);
    const next = map.get(cur);
    if (next === undefined) return null;
    cur = internalPath(next);
  }
  return null;
}
