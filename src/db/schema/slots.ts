import { date, integer, pgTable, text } from "drizzle-orm/pg-core";

import { standardPolicies, timestamps } from "./_shared";
import { slotStatus } from "./enums";

/** Per-day capacity overrides. Missing row = defaults from settings (order.slotsPerDay). */
export const slotDays = pgTable(
  "slot_days",
  {
    date: date("date").primaryKey(),
    /** null = use settings `order.slotsPerDay`. */
    capacity: integer("capacity"),
    booked: integer("booked").notNull().default(0),
    status: slotStatus("status").notNull().default("auto"),
    /** Admin-only intent, but table is public-readable — never put customer data here. */
    note: text("note"),
    ...timestamps(),
  },
  () => standardPolicies(),
);

export const holidays = pgTable(
  "holidays",
  {
    date: date("date").primaryKey(),
    label: text("label").notNull(),
    ...timestamps(),
  },
  () => standardPolicies(),
);

export type SlotDay = typeof slotDays.$inferSelect;
export type NewSlotDay = typeof slotDays.$inferInsert;
export type Holiday = typeof holidays.$inferSelect;
export type NewHoliday = typeof holidays.$inferInsert;
