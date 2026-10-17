import { addDays, dateRange, type DateKey } from "@/lib/dates";

/** Fill a per-day series for the last `days` days ending at `today` (zeros for missing days). */
export function fillDailySeries(
  rows: { day: string; total: number }[],
  today: DateKey,
  days: number,
): { day: DateKey; total: number }[] {
  const map = new Map(rows.map((r) => [r.day, r.total]));
  return dateRange(addDays(today, -(days - 1)), days).map((day) => ({
    day,
    total: map.get(day) ?? 0,
  }));
}

/** Percentage 0–100 (rounded), safe for zero denominators. */
export function percent(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((part / whole) * 100)));
}

export const KIND_LABEL: Record<string, string> = {
  order: "Pesanan",
  general: "Umum",
  b2b: "Kemitraan (B2B)",
};
