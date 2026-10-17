"use client";

import { useMemo } from "react";
import type { DayButton } from "react-day-picker";
import { id as idLocale } from "react-day-picker/locale";

import { SlotDot } from "@/components/ui/badge";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import {
  AVAILABILITY_LABEL,
  type DayAvailability,
  toBadgeStatus,
} from "@/features/slots/availability";
import {
  type DateKey,
  dateKeyToLocalDate,
  formatDateLong,
  localDateToDateKey,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

export type SlotCalendarProps = {
  /** Consecutive days from the slot engine (`computeAvailability` / `getAvailability().days`). */
  days: readonly DayAvailability[];
  /** Jakarta "today" (highlighted). Defaults to the first day. */
  today?: DateKey;
  selected?: DateKey | null;
  /**
   * Called with the clicked day (orderable or not) so the caller can explain why a date is
   * unavailable. Omit for a read-only calendar.
   */
  onSelect?: (day: DayAvailability) => void;
  numberOfMonths?: 1 | 2;
  className?: string;
  /** Id of an element describing the grid (e.g. legend / error). */
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

const STATUS_TEXT = {
  available: "text-foreground",
  nearly: "text-slot-nearly",
  full: "text-slot-full line-through decoration-1",
  closed: "text-slot-closed",
} as const;

const LEGEND_COLOR = {
  available: "flex text-slot-available",
  nearly: "flex text-slot-nearly",
  full: "flex text-slot-full",
  closed: "flex text-slot-closed",
} as const;

/**
 * Month calendar coloured by slot status (shape marker + label, never colour only).
 * Unavailable days stay focusable (aria-disabled) so keyboard and screen-reader users can
 * hear why; selection is handled by the caller via `onSelect`.
 * Keyboard: arrows move by day/week, PageUp/PageDown by month, Home/End to week edges.
 */
export function SlotCalendar({
  days,
  today,
  selected,
  onSelect,
  numberOfMonths = 1,
  className,
  ...aria
}: SlotCalendarProps) {
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const first = days[0]?.date;
  const last = days.at(-1)?.date;

  const DayBtn = useMemo(
    () =>
      function SlotDayButton(props: React.ComponentProps<typeof DayButton>) {
        const day = byDate.get(localDateToDateKey(props.day.date));
        if (!day || props.modifiers.outside)
          return <CalendarDayButton locale={idLocale} {...props} />;
        const badge = toBadgeStatus(day.status);
        return (
          <CalendarDayButton
            locale={idLocale}
            {...props}
            aria-disabled={!day.orderable || undefined}
            data-status={day.status}
            className={cn(
              props.className,
              "tabular-nums",
              !day.orderable && "opacity-70",
              !props.modifiers.selected && STATUS_TEXT[badge],
            )}
          >
            {props.children}
            <span
              className="flex h-2.5 items-center justify-center"
              aria-hidden
            >
              <SlotDot status={badge} />
            </span>
          </CalendarDayButton>
        );
      },
    [byDate],
  );

  if (!first || !last) return null;

  return (
    <Calendar
      mode="single"
      locale={idLocale}
      weekStartsOn={1}
      numberOfMonths={numberOfMonths}
      showOutsideDays={false}
      today={dateKeyToLocalDate(today ?? first)}
      startMonth={dateKeyToLocalDate(first)}
      endMonth={dateKeyToLocalDate(last)}
      defaultMonth={dateKeyToLocalDate(selected ?? first)}
      selected={selected ? dateKeyToLocalDate(selected) : undefined}
      disabled={[
        { before: dateKeyToLocalDate(first) },
        { after: dateKeyToLocalDate(last) },
        ...(onSelect ? [] : [() => true]),
      ]}
      onDayClick={(date, modifiers) => {
        if (modifiers.disabled || !onSelect) return;
        const day = byDate.get(localDateToDateKey(date));
        if (day) onSelect(day);
      }}
      labels={{
        labelDayButton: (date, modifiers) => {
          const day = byDate.get(localDateToDateKey(date));
          const base = formatDateLong(localDateToDateKey(date));
          const parts = [modifiers.today ? `Hari ini, ${base}` : base];
          if (day) parts.push(AVAILABILITY_LABEL[day.status], day.reason);
          if (modifiers.selected) parts.push("dipilih");
          return parts.join(". ");
        },
      }}
      className={cn(
        "w-full rounded-lg border border-border bg-card p-3 [--cell-size:--spacing(11)]",
        className,
      )}
      classNames={{
        root: "w-full",
        months: "relative flex flex-col gap-6 md:flex-row",
      }}
      components={{ DayButton: DayBtn }}
      {...aria}
    />
  );
}

/** Legend for the calendar markers (status + shape). */
export function SlotLegend({
  id,
  className,
}: {
  id?: string;
  className?: string;
}) {
  const items = ["available", "nearly", "full", "closed"] as const;
  return (
    <ul
      id={id}
      className={cn(
        "flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground",
        className,
      )}
    >
      {items.map((s) => (
        <li key={s} className="flex items-center gap-2">
          <span className={LEGEND_COLOR[s]}>
            <SlotDot status={s} />
          </span>
          <span>
            {s === "closed"
              ? `${AVAILABILITY_LABEL.closed} / lewat batas`
              : AVAILABILITY_LABEL[s]}
          </span>
        </li>
      ))}
    </ul>
  );
}
