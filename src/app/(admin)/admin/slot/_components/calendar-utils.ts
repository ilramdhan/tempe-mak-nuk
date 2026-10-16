/**
 * Pure helpers for the admin slot calendar (P5.5): month grid, month param parsing and
 * keyboard navigation. No React / Next imports — unit-tested.
 * Weeks start on Monday (Indonesian convention). All keys are Jakarta calendar dates.
 */
import { addDays, type DateKey, isDateKey, weekdayOf } from "@/lib/dates";

/** "YYYY-MM" */
export type MonthKey = string;

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Monday = 0 … Sunday = 6. */
export function mondayIndex(key: DateKey): number {
  return (weekdayOf(key) + 6) % 7;
}

export function monthOf(key: DateKey): MonthKey {
  return key.slice(0, 7);
}

export function firstOfMonth(month: MonthKey): DateKey {
  return `${month}-01`;
}

export function daysInMonth(month: MonthKey): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Parse `?bulan=YYYY-MM`; falls back to the month of `today`. Clamped to ±24 months. */
export function parseMonthParam(value: unknown, today: DateKey): MonthKey {
  const fallback = monthOf(today);
  if (typeof value !== "string" || !MONTH_RE.test(value)) return fallback;
  const diff = monthDiff(fallback, value);
  return Math.abs(diff) > 24 ? fallback : value;
}

/** Whole months from `a` to `b`. */
export function monthDiff(a: MonthKey, b: MonthKey): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

export function shiftMonth(month: MonthKey, delta: number): MonthKey {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Same day-of-month `delta` months away, clamped to the target month's length. */
export function shiftDateByMonths(key: DateKey, delta: number): DateKey {
  const target = shiftMonth(monthOf(key), delta);
  const day = Math.min(Number(key.slice(8, 10)), daysInMonth(target));
  return `${target}-${String(day).padStart(2, "0")}`;
}

export type MonthGrid = {
  /** First visible date (a Monday). */
  start: DateKey;
  /** Last visible date (a Sunday). */
  end: DateKey;
  /** Number of visible days (multiple of 7). */
  length: number;
  weeks: DateKey[][];
};

/** Monday-first weeks covering the whole month (4–6 rows). */
export function monthGrid(month: MonthKey): MonthGrid {
  const first = firstOfMonth(month);
  const last = `${month}-${String(daysInMonth(month)).padStart(2, "0")}`;
  const start = addDays(first, -mondayIndex(first));
  const end = addDays(last, 6 - mondayIndex(last));
  const weeks: DateKey[][] = [];
  for (let d = start; d <= end; d = addDays(d, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(d, i)));
  }
  return { start, end, length: weeks.length * 7, weeks };
}

/**
 * Target date for a calendar keyboard key (WAI-ARIA date grid pattern), or null when the
 * key isn't a navigation key. Arrows ±1/±7 days, Home/End = start/end of week,
 * PageUp/PageDown = ±1 month (Shift = ±1 year).
 */
export function navigateKey(
  key: DateKey,
  event: { key: string; shiftKey?: boolean },
): DateKey | null {
  if (!isDateKey(key)) return null;
  switch (event.key) {
    case "ArrowLeft":
      return addDays(key, -1);
    case "ArrowRight":
      return addDays(key, 1);
    case "ArrowUp":
      return addDays(key, -7);
    case "ArrowDown":
      return addDays(key, 7);
    case "Home":
      return addDays(key, -mondayIndex(key));
    case "End":
      return addDays(key, 6 - mondayIndex(key));
    case "PageUp":
      return shiftDateByMonths(key, event.shiftKey ? -12 : -1);
    case "PageDown":
      return shiftDateByMonths(key, event.shiftKey ? 12 : 1);
    default:
      return null;
  }
}

/** Header labels, Monday first. */
export const WEEKDAY_SHORT = [
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
  "Min",
] as const;
export const WEEKDAY_LONG = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;
/** Settings index (0 = Sunday) → Indonesian name. */
export const WEEKDAY_BY_JS_INDEX = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;

/** "Oktober 2026" */
export function formatMonthLabel(month: MonthKey): string {
  const [y, m] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 15)));
}

/**
 * Convert the day editor's capacity text ("" = ikut default) to the action input.
 * Returns undefined when invalid.
 */
export function parseCapacityInput(value: string): number | null | undefined {
  const v = value.trim();
  if (v === "") return null;
  if (!/^\d{1,4}$/.test(v)) return undefined;
  const n = Number(v);
  return n <= 1000 ? n : undefined;
}
