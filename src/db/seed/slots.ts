import { sql } from "drizzle-orm";

import { holidays, slotDays } from "../schema";
import { jakartaDate, type Tx } from "./rich";

/**
 * Indonesian national holidays + cuti bersama, rest of 2026 and 2027. BEST-KNOWN DATES from the
 * SKB 3 Menteri calendars; moveable (Islamic/lunar) dates are approximate. OWNER MUST VERIFY
 * against the official SKB each year and edit via Admin -> Slot & PO.
 */
const HOLIDAY_LIST: [string, string][] = [
  // 2026 (rest of year)
  ["2026-12-24", "Cuti Bersama Natal"],
  ["2026-12-25", "Hari Raya Natal"],
  // 2027
  ["2027-01-01", "Tahun Baru Masehi"],
  ["2027-02-06", "Tahun Baru Imlek 2578"],
  ["2027-03-09", "Hari Suci Nyepi (Tahun Baru Saka 1949)"],
  ["2027-01-05", "Isra Mikraj Nabi Muhammad SAW (perkiraan)"],
  ["2027-03-26", "Wafat Isa Almasih (Jumat Agung)"],
  ["2027-03-10", "Idulfitri 1448 H (hari pertama, perkiraan)"],
  ["2027-03-11", "Idulfitri 1448 H (hari kedua, perkiraan)"],
  ["2027-05-01", "Hari Buruh Internasional"],
  ["2027-05-06", "Kenaikan Isa Almasih"],
  ["2027-05-20", "Hari Raya Waisak (perkiraan)"],
  ["2027-05-17", "Iduladha 1448 H (perkiraan)"],
  ["2027-06-01", "Hari Lahir Pancasila"],
  ["2027-06-06", "Tahun Baru Islam 1449 H (perkiraan)"],
  ["2027-08-17", "Hari Kemerdekaan RI"],
  ["2027-08-15", "Maulid Nabi Muhammad SAW (perkiraan)"],
  ["2027-12-25", "Hari Raya Natal"],
];

/** Booked counts relative to today: [offsetDays, booked, status?, capacity?] to show all states. */
const BOOKINGS: [number, number][] = [
  [4, 3], [5, 6], [6, 7], [7, 8], [8, 2], [9, 5], [10, 8],
  [12, 1], [13, 7], [14, 4], [16, 6], [18, 0], [19, 2],
];

export async function seedSlots(tx: Tx) {
  const dedup = new Map(HOLIDAY_LIST);
  const hRows = [...dedup].map(([date, label]) => ({ date, label }));
  await tx
    .insert(holidays)
    .values(hRows)
    .onConflictDoUpdate({
      target: holidays.date,
      set: { label: sql`excluded.label`, updatedAt: sql`now()` },
    });

  // Next 21 days. Sundays are closed (weekday rule in settings); one manual closure shown.
  const rows = [];
  for (let i = 0; i < 21; i++) {
    const date = jakartaDate(i);
    const booked = BOOKINGS.find(([o]) => o === i)?.[1] ?? 0;
    if (!BOOKINGS.some(([o]) => o === i) && i < 4) continue;
    rows.push({
      date,
      capacity: null as number | null,
      booked,
      status: "auto" as "auto" | "closed",
      note: null as string | null,
    });
  }
  if (rows.length > 15) {
    rows[15].status = "closed";
    rows[15].note = "Contoh: produksi libur (acara keluarga)";
    rows[15].booked = 0;
  }
  await tx
    .insert(slotDays)
    .values(rows)
    .onConflictDoUpdate({
      target: slotDays.date,
      set: {
        capacity: sql`excluded.capacity`,
        booked: sql`excluded.booked`,
        status: sql`excluded.status`,
        note: sql`excluded.note`,
        updatedAt: sql`now()`,
      },
    });
  return { holidays: hRows.length, slotDays: rows.length };
}
