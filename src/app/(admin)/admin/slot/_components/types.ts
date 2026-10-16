import type {
  DayAvailability,
  OrderRules,
} from "@/features/slots/availability";
import type { DateKey } from "@/lib/dates";

export type OverrideStatus = "auto" | "open" | "full" | "closed";

/** One calendar cell, computed on the server (serializable). */
export type CalendarDay = DayAvailability & {
  inMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  /** Raw override row (null = mengikuti default). */
  override: {
    capacity: number | null;
    booked: number;
    status: OverrideStatus;
    note: string | null;
  } | null;
};

export type HolidayRow = { date: DateKey; label: string };

export type SlotAdminData = {
  month: string;
  today: DateKey;
  rules: OrderRules;
  weeks: DateKey[][];
  days: Record<DateKey, CalendarDay>;
};

export const OVERRIDE_STATUS_LABEL: Record<OverrideStatus, string> = {
  auto: "Otomatis (ikut kapasitas & libur)",
  open: "Buka khusus (abaikan libur/penuh)",
  full: "Tandai penuh",
  closed: "Tutup hari ini",
};
