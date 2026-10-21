import "server-only";

import { and, asc, gte, lte } from "drizzle-orm";
import { cacheTag } from "next/cache";

import { holidays, slotDays } from "@/db/schema";
import { cachedRead } from "@/features/_shared/db";
import { getOrderRules } from "@/features/settings/queries";
import { tags } from "@/lib/cache-tags";
import { addDays, type DateKey, isDateKey, toDateKey } from "@/lib/dates";

import {
  computeAvailability,
  type DayAvailability,
  type HolidayInput,
  type OrderRules,
  type SlotOverrideInput,
} from "./availability";

export type SlotData = {
  holidays: HolidayInput[];
  overrides: SlotOverrideInput[];
};

/**
 * Raw slot overrides + holidays for [from, from+days). Cached (tag `slots`); admin writes
 * expire it via updateTag. NOTE: never includes `slot_days.note` (admin-only intent).
 */
export async function getSlotData(
  from: DateKey,
  days: number,
): Promise<SlotData> {
  "use cache";
  cacheTag(tags.slots);
  const span = Math.min(Math.max(Math.trunc(days), 1), 180);
  if (!isDateKey(from)) return { holidays: [], overrides: [] };
  // Include lead-time look-back so deadlines can skip closed days before `from`.
  const start = addDays(from, -45);
  const end = addDays(from, span);
  return cachedRead(
    "slots",
    "hours",
    { holidays: [], overrides: [] },
    async (db) => {
      const [h, o] = await Promise.all([
        db
          .select({ date: holidays.date, label: holidays.label })
          .from(holidays)
          .where(and(gte(holidays.date, start), lte(holidays.date, end)))
          .orderBy(asc(holidays.date)),
        db
          .select({
            date: slotDays.date,
            capacity: slotDays.capacity,
            booked: slotDays.booked,
            status: slotDays.status,
          })
          .from(slotDays)
          .where(and(gte(slotDays.date, start), lte(slotDays.date, end)))
          .orderBy(asc(slotDays.date)),
      ]);
      return { holidays: h, overrides: o };
    },
  );
}

export type AvailabilityResult = {
  rules: OrderRules;
  days: DayAvailability[];
  /** Same data the engine used — pass to client components (order builder) to recompute live. */
  data: SlotData;
};

/**
 * Availability for the next `days` days from Jakarta "today".
 * `now` is REQUIRED: in Server Components call `await connection()` first (inside <Suspense>)
 * and pass `new Date()`; this keeps the cached parts static under cacheComponents.
 */
export async function getAvailability(opts: {
  now: Date;
  days?: number;
  from?: DateKey;
}): Promise<AvailabilityResult> {
  const days = Math.min(Math.max(opts.days ?? 14, 1), 120);
  const from = opts.from ?? toDateKey(opts.now);
  const [rules, data] = await Promise.all([
    getOrderRules(),
    getSlotData(from, days),
  ]);
  return {
    rules,
    data,
    days: computeAvailability({ rules, ...data, now: opts.now, from, days }),
  };
}
