import { z } from "zod";

import { slotStatus } from "@/db/schema/enums";
import { isDateKey } from "@/lib/dates";
import { optionalText, requiredText } from "@/features/_shared/schema";

export const dateKeySchema = z
  .string()
  .refine(isDateKey, "Tanggal tidak valid (YYYY-MM-DD)");

export const slotDayInputSchema = z.object({
  date: dateKeySchema,
  capacity: z.coerce
    .number()
    .int()
    .min(0)
    .max(1000)
    .nullish()
    .transform((v) => v ?? null),
  booked: z.coerce.number().int().min(0).max(1000).default(0),
  status: z.enum(slotStatus.enumValues).default("auto"),
  /** Admin note — table is public-readable, NEVER put customer data here. */
  note: optionalText(200),
});
export type SlotDayInput = z.input<typeof slotDayInputSchema>;

export const holidayInputSchema = z.object({
  date: dateKeySchema,
  label: requiredText(120, "Keterangan libur"),
});
export type HolidayInput = z.input<typeof holidayInputSchema>;

export const slotRangeSchema = z.object({
  from: dateKeySchema,
  days: z.coerce.number().int().min(1).max(120),
});
