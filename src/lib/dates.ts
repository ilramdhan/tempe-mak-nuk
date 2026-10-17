/**
 * Date helpers pinned to Asia/Jakarta (WIB, UTC+7, no DST) using only `Intl`.
 *
 * Calendar dates are passed around as `DateKey` strings ("YYYY-MM-DD") — the same format as
 * Postgres `date` columns — so arithmetic never depends on the server's local timezone.
 * Instants (deadlines, "now") are plain `Date` objects.
 */

export const JAKARTA_TZ = "Asia/Jakarta";
export const DEFAULT_LOCALE = "id-ID";

/** "YYYY-MM-DD" calendar date (no time, no zone). */
export type DateKey = string;

const DATE_KEY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isDateKey(value: unknown): value is DateKey {
  if (typeof value !== "string") return false;
  const m = DATE_KEY_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === mo - 1 &&
    dt.getUTCDate() === d
  );
}

function assertDateKey(key: DateKey): [number, number, number] {
  if (!isDateKey(key)) throw new RangeError(`Invalid date key: ${key}`);
  const m = DATE_KEY_RE.exec(key)!;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

function keyFromUtc(dt: Date): DateKey {
  return `${pad(dt.getUTCFullYear(), 4)}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

const partsFormatters = new Map<string, Intl.DateTimeFormat>();
function partsFormatter(timeZone: string) {
  let f = partsFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    partsFormatters.set(timeZone, f);
  }
  return f;
}

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

/** Wall-clock parts of an instant in a timezone (default Asia/Jakarta). */
export function zonedParts(date: Date, timeZone = JAKARTA_TZ): ZonedParts {
  const out: Record<string, number> = {};
  for (const p of partsFormatter(timeZone).formatToParts(date)) {
    if (p.type !== "literal") out[p.type] = Number(p.value);
  }
  return {
    year: out.year,
    month: out.month,
    day: out.day,
    hour: out.hour === 24 ? 0 : out.hour,
    minute: out.minute,
    second: out.second,
  };
}

/** Calendar date of an instant in Jakarta (or `timeZone`). */
export function toDateKey(date: Date, timeZone = JAKARTA_TZ): DateKey {
  const p = zonedParts(date, timeZone);
  return `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}`;
}

/** Today's date in Jakarta. */
export function todayKey(now: Date = new Date()): DateKey {
  return toDateKey(now);
}

export function addDays(key: DateKey, days: number): DateKey {
  const [y, m, d] = assertDateKey(key);
  return keyFromUtc(new Date(Date.UTC(y, m - 1, d + days)));
}

/** 0 = Sunday … 6 = Saturday (matches settings `order.closedWeekdays`). */
export function weekdayOf(key: DateKey): number {
  const [y, m, d] = assertDateKey(key);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Whole days from `a` to `b` (b - a). */
export function diffDays(a: DateKey, b: DateKey): number {
  const [ay, am, ad] = assertDateKey(a);
  const [by, bm, bd] = assertDateKey(b);
  return Math.round(
    (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000,
  );
}

export function compareDateKeys(a: DateKey, b: DateKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Inclusive list of `count` consecutive date keys starting at `from`. */
export function dateRange(from: DateKey, count: number): DateKey[] {
  return Array.from({ length: Math.max(0, count) }, (_, i) => addDays(from, i));
}

export function isTimeString(value: unknown): value is string {
  return typeof value === "string" && TIME_RE.test(value);
}

/** "HH:mm" → { hour, minute }. Throws on invalid input. */
export function parseTime(value: string): { hour: number; minute: number } {
  const m = TIME_RE.exec(value);
  if (!m) throw new RangeError(`Invalid time (expected HH:mm): ${value}`);
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

/** Offset (ms) of `timeZone` from UTC at the given instant. */
function tzOffsetMs(instant: number, timeZone: string): number {
  const p = zonedParts(new Date(instant), timeZone);
  const asUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/** Instant for a wall-clock date + "HH:mm" in a timezone (default Jakarta). */
export function zonedDateTime(
  key: DateKey,
  time: string,
  timeZone = JAKARTA_TZ,
): Date {
  const [y, m, d] = assertDateKey(key);
  const { hour, minute } = parseTime(time);
  const guess = Date.UTC(y, m - 1, d, hour, minute);
  // Two passes handle zones with DST transitions; Jakarta converges in one.
  let ts = guess - tzOffsetMs(guess, timeZone);
  ts = guess - tzOffsetMs(ts, timeZone);
  return new Date(ts);
}

type DateInput = Date | DateKey;

/** Noon UTC of a date key keeps the calendar day stable in every timezone when formatting. */
function toInstant(input: DateInput): Date {
  if (input instanceof Date) return input;
  const [y, m, d] = assertDateKey(input);
  return new Date(Date.UTC(y, m - 1, d, 5)); // 12:00 WIB
}

const formatCache = new Map<string, Intl.DateTimeFormat>();
function fmt(options: Intl.DateTimeFormatOptions, locale = DEFAULT_LOCALE) {
  const k = locale + JSON.stringify(options);
  let f = formatCache.get(k);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { timeZone: JAKARTA_TZ, ...options });
    formatCache.set(k, f);
  }
  return f;
}

/** "Selasa, 21 Okt 2026" */
export function formatDateLong(input: DateInput): string {
  return fmt({
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(toInstant(input));
}

/** "21 Oktober 2026" */
export function formatDate(input: DateInput): string {
  return fmt({ day: "numeric", month: "long", year: "numeric" }).format(
    toInstant(input),
  );
}

/** "21 Okt" */
export function formatDateShort(input: DateInput): string {
  return fmt({ day: "numeric", month: "short" }).format(toInstant(input));
}

/** "Selasa" */
export function formatWeekday(input: DateInput): string {
  return fmt({ weekday: "long" }).format(toInstant(input));
}

/** "15.00" (id-ID clock style) for an instant in Jakarta. */
export function formatTime(date: Date): string {
  return fmt({ hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    date,
  );
}

/** "Jumat, 17 Okt 2026 pukul 15.00 WIB" */
export function formatDeadline(date: Date): string {
  return `${formatDateLong(date)} pukul ${formatTime(date)} WIB`;
}

/**
 * DateKey → browser-local `Date` at local noon. For date-picker widgets (react-day-picker)
 * that work in the viewer's local zone: the calendar day is preserved whatever the zone.
 */
export function dateKeyToLocalDate(key: DateKey): Date {
  const [y, m, d] = assertDateKey(key);
  return new Date(y, m - 1, d, 12);
}

/** Inverse of `dateKeyToLocalDate`: local calendar day of a picker `Date` → DateKey. */
export function localDateToDateKey(date: Date): DateKey {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
