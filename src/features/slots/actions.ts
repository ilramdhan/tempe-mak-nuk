"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { holidays, slotDays } from "@/db/schema";
import { fail, type ActionResult } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";
import { tags } from "@/lib/cache-tags";

import { dateKeySchema, holidayInputSchema, slotDayInputSchema, type HolidayInput, type SlotDayInput } from "./schema";

/** Create/replace the override for one date. */
export async function upsertSlotDay(input: SlotDayInput): Promise<ActionResult> {
  return adminAction({
    schema: slotDayInputSchema,
    input,
    entity: "slot_days",
    action: "update",
    run: async (data, { tx }) => {
      const { date, ...rest } = data;
      await tx.insert(slotDays).values(data).onConflictDoUpdate({ target: slotDays.date, set: rest });
      return { result: undefined, entityId: date, tags: [tags.slots] };
    },
  });
}

/** Bulk upsert (e.g. set capacity for a week). */
export async function upsertSlotDays(input: SlotDayInput[]): Promise<ActionResult<{ count: number }>> {
  return adminAction({
    schema: z.array(slotDayInputSchema).min(1).max(120),
    input,
    entity: "slot_days",
    action: "update",
    run: async (rows, { tx }) => {
      for (const { date, ...rest } of rows) {
        await tx.insert(slotDays).values({ date, ...rest }).onConflictDoUpdate({ target: slotDays.date, set: rest });
      }
      return { result: { count: rows.length }, diff: { dates: rows.map((r) => r.date) }, tags: [tags.slots] };
    },
  });
}

/** Remove the override → date falls back to settings defaults. */
export async function clearSlotDay(date: string): Promise<ActionResult> {
  return adminAction({
    schema: z.object({ date: dateKeySchema }),
    input: { date },
    entity: "slot_days",
    action: "delete",
    run: async ({ date }, { tx }) => {
      await tx.delete(slotDays).where(eq(slotDays.date, date));
      return { result: undefined, entityId: date, tags: [tags.slots] };
    },
  });
}

/** +/- booked count for a date (quick "slot terisi" button). Never below 0. */
export async function adjustBooked(date: string, delta: number): Promise<ActionResult<{ booked: number }>> {
  return adminAction({
    schema: z.object({ date: dateKeySchema, delta: z.number().int().min(-100).max(100) }),
    input: { date, delta },
    entity: "slot_days",
    action: "update",
    run: async ({ date, delta }, { tx }) => {
      const [cur] = await tx.select({ booked: slotDays.booked }).from(slotDays).where(eq(slotDays.date, date)).limit(1);
      const booked = Math.max(0, (cur?.booked ?? 0) + delta);
      await tx.insert(slotDays).values({ date, booked }).onConflictDoUpdate({ target: slotDays.date, set: { booked } });
      return { result: { booked }, entityId: date, tags: [tags.slots] };
    },
  });
}

export async function upsertHoliday(input: HolidayInput): Promise<ActionResult> {
  return adminAction({
    schema: holidayInputSchema,
    input,
    entity: "holidays",
    action: "update",
    run: async (data, { tx }) => {
      await tx.insert(holidays).values(data).onConflictDoUpdate({ target: holidays.date, set: { label: data.label } });
      return { result: undefined, entityId: data.date, tags: [tags.slots] };
    },
  });
}

export async function deleteHoliday(date: string): Promise<ActionResult> {
  return adminAction({
    schema: z.object({ date: dateKeySchema }),
    input: { date },
    entity: "holidays",
    action: "delete",
    run: async ({ date }, { tx }) => {
      const rows = await tx.delete(holidays).where(eq(holidays.date, date)).returning({ date: holidays.date });
      if (!rows.length) return fail("Hari libur tidak ditemukan.");
      return { result: undefined, entityId: date, tags: [tags.slots] };
    },
  });
}
