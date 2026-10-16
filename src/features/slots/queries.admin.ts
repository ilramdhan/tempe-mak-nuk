import "server-only";

import { and, asc, gte, lte } from "drizzle-orm";

import { getDb } from "@/db/client";
import { holidays, slotDays } from "@/db/schema";
import type { DateKey } from "@/lib/dates";

/** Admin calendar: overrides incl. notes, and holidays in a range. */
export async function getSlotCalendarForAdmin(from: DateKey, to: DateKey) {
  const db = getDb();
  const [days, hol] = await Promise.all([
    db.select().from(slotDays).where(and(gte(slotDays.date, from), lte(slotDays.date, to))).orderBy(asc(slotDays.date)),
    db.select().from(holidays).where(and(gte(holidays.date, from), lte(holidays.date, to))).orderBy(asc(holidays.date)),
  ]);
  return { slotDays: days, holidays: hol };
}

export async function listHolidaysForAdmin() {
  return getDb().select().from(holidays).orderBy(asc(holidays.date));
}
