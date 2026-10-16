/**
 * Pure slot availability engine (no DB, no Next APIs) — shared by the public calendar,
 * the order builder (client) and admin. All calendar math happens in Asia/Jakarta.
 *
 * Rules (PROMPT §5.1/§5.2, docs/business.md):
 * - Order deadline for a use date = (useDate − leadDays calendar days) at cutoffTime WIB.
 *   e.g. leadDays 4, cutoff 15:00: use Tuesday → order by Friday 15:00 WIB.
 *   If that deadline day is itself closed (closed weekday / holiday / closed override),
 *   it moves back to the previous open day (nobody is there to confirm on a closed day).
 * - Status precedence: closed → past-cutoff → full → nearly → available.
 *   - `closed`: closed weekday or holiday, or a slot_days override with status `closed`.
 *     An override with status `open` re-opens a closed weekday/holiday (special production).
 *   - `past-cutoff`: the deadline has passed (includes today and past dates).
 *   - `full`: override status `full`, or remaining capacity ≤ 0 (unless override `open`).
 *   - `nearly`: 0 < remaining ≤ nearlyFullThreshold.
 */
import {
  addDays,
  compareDateKeys,
  dateRange,
  type DateKey,
  formatDeadline,
  isDateKey,
  toDateKey,
  weekdayOf,
  zonedDateTime,
} from "@/lib/dates";

export type OrderRules = {
  leadDays: number;
  /** "HH:mm" Asia/Jakarta. */
  cutoffTime: string;
  /** 0 = Sunday … 6 = Saturday. */
  closedWeekdays: readonly number[];
  slotsPerDay: number;
  nearlyFullThreshold: number;
};

export type HolidayInput = { date: DateKey; label: string };

export type SlotOverrideInput = {
  date: DateKey;
  capacity: number | null;
  booked: number;
  status: "auto" | "open" | "full" | "closed";
};

export type AvailabilityStatus =
  | "available"
  | "nearly"
  | "full"
  | "closed"
  | "past-cutoff";

export type DayAvailability = {
  date: DateKey;
  weekday: number;
  status: AvailabilityStatus;
  /** True only for `available` and `nearly`. */
  orderable: boolean;
  capacity: number;
  booked: number;
  remaining: number;
  /** ISO instant of the latest order time (serializable), null for closed days. */
  deadline: string | null;
  holiday: string | null;
  /** Short Indonesian explanation for disabled dates / tooltips. */
  reason: string;
};

export type AvailabilityInput = {
  rules: OrderRules;
  holidays?: readonly HolidayInput[];
  overrides?: readonly SlotOverrideInput[];
  now: Date;
};

/** Upper bound for walking back over consecutive closed days. */
const MAX_CLOSED_WALK = 31;

type Ctx = {
  rules: OrderRules;
  holidays: Map<DateKey, string>;
  overrides: Map<DateKey, SlotOverrideInput>;
};

function buildCtx(input: Omit<AvailabilityInput, "now">): Ctx {
  return {
    rules: input.rules,
    holidays: new Map((input.holidays ?? []).map((h) => [h.date, h.label])),
    overrides: new Map((input.overrides ?? []).map((o) => [o.date, o])),
  };
}

function closedInfo(ctx: Ctx, date: DateKey): { closed: boolean; holiday: string | null } {
  const override = ctx.overrides.get(date);
  const holiday = ctx.holidays.get(date) ?? null;
  if (override?.status === "closed") return { closed: true, holiday };
  if (override?.status === "open") return { closed: false, holiday };
  if (holiday) return { closed: true, holiday };
  return { closed: ctx.rules.closedWeekdays.includes(weekdayOf(date)), holiday: null };
}

function deadlineFor(ctx: Ctx, useDate: DateKey): Date {
  let day = addDays(useDate, -Math.max(0, Math.trunc(ctx.rules.leadDays)));
  for (let i = 0; i < MAX_CLOSED_WALK && closedInfo(ctx, day).closed; i++) {
    day = addDays(day, -1);
  }
  return zonedDateTime(day, ctx.rules.cutoffTime);
}

/**
 * Latest instant an order for `useDate` can be placed.
 * Pass holidays/overrides so deadlines skip closed days; without them only closed weekdays apply.
 */
export function latestOrderDeadline(
  useDate: DateKey,
  rules: OrderRules,
  extra: Pick<AvailabilityInput, "holidays" | "overrides"> = {},
): Date {
  if (!isDateKey(useDate)) throw new RangeError(`Invalid date: ${useDate}`);
  return deadlineFor(buildCtx({ rules, ...extra }), useDate);
}

function evaluate(ctx: Ctx, date: DateKey, now: Date): DayAvailability {
  const { rules } = ctx;
  const override = ctx.overrides.get(date);
  const capacity = Math.max(0, override?.capacity ?? rules.slotsPerDay);
  const booked = Math.max(0, override?.booked ?? 0);
  const remaining = Math.max(0, capacity - booked);
  const { closed, holiday } = closedInfo(ctx, date);
  const base = { date, weekday: weekdayOf(date), capacity, booked, remaining, holiday };

  if (closed) {
    return {
      ...base,
      status: "closed",
      orderable: false,
      deadline: null,
      reason: holiday ? `Libur: ${holiday}` : "Produksi libur",
    };
  }

  const deadline = deadlineFor(ctx, date);
  if (now.getTime() > deadline.getTime()) {
    return {
      ...base,
      status: "past-cutoff",
      orderable: false,
      deadline: deadline.toISOString(),
      reason: `Batas pesan sudah lewat (${formatDeadline(deadline)})`,
    };
  }

  const deadlineText = `Pesan paling lambat ${formatDeadline(deadline)}`;
  const forcedOpen = override?.status === "open";
  if (override?.status === "full" || (!forcedOpen && remaining <= 0)) {
    return {
      ...base,
      status: "full",
      orderable: false,
      deadline: deadline.toISOString(),
      reason: "Slot penuh",
    };
  }
  if (remaining > 0 && remaining <= Math.max(0, rules.nearlyFullThreshold)) {
    return {
      ...base,
      status: "nearly",
      orderable: true,
      deadline: deadline.toISOString(),
      reason: `Hampir penuh, sisa ${remaining} slot. ${deadlineText}`,
    };
  }
  return {
    ...base,
    status: "available",
    orderable: true,
    deadline: deadline.toISOString(),
    reason: deadlineText,
  };
}

/** Availability for a single date. */
export function getDayAvailability(date: DateKey, input: AvailabilityInput): DayAvailability {
  if (!isDateKey(date)) throw new RangeError(`Invalid date: ${date}`);
  return evaluate(buildCtx(input), date, input.now);
}

/**
 * Availability for `days` consecutive dates starting at `from`
 * (default: today in Jakarta).
 */
export function computeAvailability(
  input: AvailabilityInput & { from?: DateKey; days: number },
): DayAvailability[] {
  const ctx = buildCtx(input);
  const from = input.from ?? toDateKey(input.now);
  return dateRange(from, input.days).map((d) => evaluate(ctx, d, input.now));
}

/** First orderable date within `searchDays` of today, or null. */
export function earliestOrderableDate(
  input: AvailabilityInput,
  searchDays = 60,
): DateKey | null {
  const today = toDateKey(input.now);
  return (
    computeAvailability({ ...input, from: today, days: searchDays }).find((d) => d.orderable)
      ?.date ?? null
  );
}

/** Whether `date` is strictly after today in Jakarta. */
export function isFutureDate(date: DateKey, now: Date): boolean {
  return compareDateKeys(date, toDateKey(now)) > 0;
}

/** Map engine status → `SlotBadge` status (past-cutoff renders as closed). */
export function toBadgeStatus(
  status: AvailabilityStatus,
): "available" | "nearly" | "full" | "closed" {
  return status === "past-cutoff" ? "closed" : status;
}

export const AVAILABILITY_LABEL: Record<AvailabilityStatus, string> = {
  available: "Tersedia",
  nearly: "Hampir penuh",
  full: "Penuh",
  closed: "Libur",
  "past-cutoff": "Lewat batas pesan",
};
