/**
 * Pure classification helpers for the admin dashboard "Peringatan konten" card.
 * No DB, no Next APIs. Dummy values mirror src/db/seed/settings.ts.
 */
import { addDays, type DateKey, weekdayOf } from "@/lib/dates";

export type WarningSeverity = "high" | "medium" | "low";

export type ContentWarning = {
  id: string;
  severity: WarningSeverity;
  message: string;
  href: string;
  count: number;
};

export const DUMMY_WHATSAPP = "6281234567890";
export const DUMMY_HALAL_NUMBER = "ID33110012345670124";
export const DUMMY_DOMAIN_HOST = "tempemaknuk.com";
export const DUMMY_NIB = "1234567890123";
export const DUMMY_PIRT = "2063310010123-29";
export const SAMPLE_MARKER = "Dokumen contoh";

const SEVERITY_RANK: Record<WarningSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isBlank(value: unknown): boolean {
  return str(value) === "";
}

function digits(value: unknown): string {
  return str(value).replace(/\D/g, "");
}

export function isDummyWhatsapp(value: unknown): boolean {
  const d = digits(value);
  return d === "" || d === DUMMY_WHATSAPP || /^62(\d)\1{6,}$/.test(d);
}

export function isDummyHalalNumber(value: unknown): boolean {
  const v = str(value).toUpperCase();
  return v === "" || v === DUMMY_HALAL_NUMBER || /^(X+|0+|-+)$/.test(v);
}

/** Domain is dummy when empty, local/example, or still the seeded placeholder host. */
export function isDummyDomain(value: unknown): boolean {
  const v = str(value);
  if (v === "") return true;
  let host: string;
  try {
    host = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`).hostname;
  } catch {
    return true;
  }
  host = host.toLowerCase().replace(/^www\./, "");
  return (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".test") ||
    host === "example.com" ||
    host.endsWith(".example.com") ||
    host === DUMMY_DOMAIN_HOST
  );
}

export function isDummyRegistration(
  key: "legal.nib" | "legal.pirt",
  value: unknown,
): boolean {
  const v = str(value);
  return v === "" || v === (key === "legal.nib" ? DUMMY_NIB : DUMMY_PIRT);
}

export type DummySettingKey =
  "contact.whatsapp" | "halal.number" | "site.url" | "legal.nib" | "legal.pirt";

export const DUMMY_SETTING_KEYS: readonly DummySettingKey[] = [
  "contact.whatsapp",
  "halal.number",
  "site.url",
  "legal.nib",
  "legal.pirt",
];

export const DUMMY_SETTING_LABEL: Record<DummySettingKey, string> = {
  "contact.whatsapp": "nomor WhatsApp",
  "halal.number": "nomor sertifikat halal",
  "site.url": "domain situs",
  "legal.nib": "NIB",
  "legal.pirt": "nomor PIRT",
};

/** True when a tracked setting still holds a dummy/placeholder/empty value. */
export function isDummySetting(key: DummySettingKey, value: unknown): boolean {
  switch (key) {
    case "contact.whatsapp":
      return isDummyWhatsapp(value);
    case "halal.number":
      return isDummyHalalNumber(value);
    case "site.url":
      return isDummyDomain(value);
    case "legal.nib":
    case "legal.pirt":
      return isDummyRegistration(key, value);
  }
}

export function dummySettingKeys(
  values: Partial<Record<string, unknown>>,
): DummySettingKey[] {
  return DUMMY_SETTING_KEYS.filter((k) => isDummySetting(k, values[k]));
}

export function isSampleLegalContent(content: unknown): boolean {
  if (!content) return false;
  try {
    return JSON.stringify(content).includes(SAMPLE_MARKER);
  } catch {
    return false;
  }
}

export type SlotOverrideLite = {
  date: DateKey;
  capacity: number | null;
  booked: number;
  status: "auto" | "open" | "full" | "closed";
};

/**
 * Count days in [from, from+days) that can still take orders (ignoring lead-time/cutoff):
 * not a closed weekday/holiday/closed override, and not full. `open` override re-opens.
 */
export function countOpenSlotDays(input: {
  from: DateKey;
  days: number;
  closedWeekdays: readonly number[];
  holidays: ReadonlySet<DateKey> | readonly DateKey[];
  overrides: readonly SlotOverrideLite[];
  defaultCapacity: number;
}): number {
  const holidays = new Set(input.holidays);
  const byDate = new Map(input.overrides.map((o) => [o.date, o]));
  let open = 0;
  for (let i = 0; i < input.days; i++) {
    const date = addDays(input.from, i);
    const o = byDate.get(date);
    if (o?.status === "closed") continue;
    const reopened = o?.status === "open";
    if (
      !reopened &&
      (input.closedWeekdays.includes(weekdayOf(date)) || holidays.has(date))
    )
      continue;
    if (o?.status === "full") continue;
    const capacity = o?.capacity ?? input.defaultCapacity;
    if (!reopened && capacity - (o?.booked ?? 0) <= 0) continue;
    open++;
  }
  return open;
}

export function sortWarnings(
  list: readonly ContentWarning[],
): ContentWarning[] {
  return [...list].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      b.count - a.count ||
      a.id.localeCompare(b.id),
  );
}

export const SEVERITY_LABEL: Record<WarningSeverity, string> = {
  high: "Penting",
  medium: "Sedang",
  low: "Ringan",
};
