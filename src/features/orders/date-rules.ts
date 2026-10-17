/**
 * Use-date validation for the order builder (pure). Wraps the slot engine
 * (features/slots/availability) so the same rules — lead time, 15:00 WIB cutoff, closed
 * weekdays, holidays, capacity — drive the calendar, the form validation and the summary.
 */
import {
  type AvailabilityInput,
  type DayAvailability,
  earliestOrderableDate,
  getDayAvailability,
} from "@/features/slots/availability";
import {
  addDays,
  type DateKey,
  formatDateLong,
  formatDeadline,
  isDateKey,
  toDateKey,
} from "@/lib/dates";

/** How far ahead the builder lets people pick (calendar window). */
export const ORDER_WINDOW_DAYS = 60;

export type UseDateCheck =
  | { ok: true; day: DayAvailability; message: string }
  | { ok: false; day: DayAvailability | null; message: string };

/** Last selectable date of the booking window. */
export function orderWindowEnd(now: Date, days = ORDER_WINDOW_DAYS): DateKey {
  return addDays(toDateKey(now), days - 1);
}

/**
 * "Untuk dipakai Selasa, 20 Okt 2026, pesan paling lambat Jumat, 16 Okt 2026 pukul 15.00 WIB."
 * (docs/brand.md §5 — lead time).
 */
export function leadTimeMessage(day: DayAvailability): string {
  if (!day.deadline) return day.reason;
  return `Untuk dipakai ${formatDateLong(day.date)}, pesan paling lambat ${formatDeadline(new Date(day.deadline))}.`;
}

/** Validate a chosen use date against the order rules + slot data at `input.now`. */
export function checkUseDate(
  date: DateKey | null | undefined,
  input: AvailabilityInput,
  windowDays = ORDER_WINDOW_DAYS,
): UseDateCheck {
  if (!date)
    return { ok: false, day: null, message: "Pilih tanggal pakai dulu, ya." };
  if (!isDateKey(date))
    return { ok: false, day: null, message: "Tanggal tidak valid." };

  const day = getDayAvailability(date, input);
  const earliest = earliestOrderableDate(input, windowDays);
  const suggestion = earliest
    ? ` Pilih tanggal mulai ${formatDateLong(earliest)}.`
    : "";

  switch (day.status) {
    case "available":
    case "nearly": {
      if (date > orderWindowEnd(input.now, windowDays)) {
        return {
          ok: false,
          day,
          message: `Tanggal terlalu jauh. Untuk PO lebih dari ${windowDays} hari ke depan, chat kami langsung via WhatsApp.`,
        };
      }
      return { ok: true, day, message: leadTimeMessage(day) };
    }
    case "past-cutoff":
      return {
        ok: false,
        day,
        message: `Tanggal ini sudah lewat batas pesan.${suggestion}`,
      };
    case "full":
      return {
        ok: false,
        day,
        message: `Slot tanggal ini sudah terisi. Coba tanggal lain.${suggestion}`,
      };
    case "closed":
      return {
        ok: false,
        day,
        message: `${day.holiday ? `Libur: ${day.holiday}` : "Produksi libur"} di tanggal ini.${suggestion}`,
      };
  }
}
