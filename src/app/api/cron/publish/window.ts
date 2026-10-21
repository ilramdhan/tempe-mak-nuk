export const DEFAULT_WINDOW_MINUTES = 20;
export const MAX_WINDOW_MINUTES = 7 * 24 * 60;

/** Pure: parse `?window=<minutes>` (clamped); falls back to the default for junk. */
export function parseWindowMinutes(raw: string | null): number {
  const n = Number(raw);
  if (!raw || !Number.isFinite(n) || n < 1) return DEFAULT_WINDOW_MINUTES;
  return Math.min(Math.floor(n), MAX_WINDOW_MINUTES);
}
