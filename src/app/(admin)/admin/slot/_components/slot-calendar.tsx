"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { SlotDot } from "@/components/ui/badge";
import {
  AVAILABILITY_LABEL,
  toBadgeStatus,
} from "@/features/slots/availability";
import { formatDateLong, type DateKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

import {
  formatMonthLabel,
  monthOf,
  navigateKey,
  shiftMonth,
  WEEKDAY_LONG,
  WEEKDAY_SHORT,
} from "./calendar-utils";
import type { CalendarDay, SlotAdminData } from "./types";

const STATUS_TEXT: Record<string, string> = {
  available: "text-slot-available",
  nearly: "text-slot-nearly",
  full: "text-slot-full",
  closed: "text-slot-closed",
};

export function monthHref(month: string, date?: DateKey) {
  const p = new URLSearchParams({ bulan: month });
  if (date) p.set("tanggal", date);
  return `/admin/slot?${p.toString()}`;
}

/** Accessible label for one cell (status is never colour-only). */
export function dayLabel(day: CalendarDay): string {
  const parts = [formatDateLong(day.date), AVAILABILITY_LABEL[day.status]];
  if (day.status !== "closed")
    parts.push(`terpakai ${day.booked} dari ${day.capacity}`);
  if (day.holiday) parts.push(`libur: ${day.holiday}`);
  if (day.override) parts.push("ada pengaturan khusus");
  if (day.override?.note) parts.push("ada catatan");
  return parts.join(", ");
}

/**
 * Month calendar following the WAI-ARIA date-grid pattern: one tab stop (roving tabindex),
 * arrows/Home/End/PageUp/PageDown move, Enter/Space selects. Leaving the month navigates.
 */
export function SlotCalendar({
  data,
  selected,
  onSelect,
  onNavigateMonth,
}: {
  data: SlotAdminData;
  selected: DateKey;
  onSelect: (date: DateKey) => void;
  onNavigateMonth: (month: string, date: DateKey) => void;
}) {
  const refs = useRef(new Map<DateKey, HTMLButtonElement>());
  const shouldFocus = useRef(false);

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    refs.current.get(selected)?.focus();
  }, [selected]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, date: DateKey) {
    const target = navigateKey(date, event);
    if (!target) return;
    event.preventDefault();
    if (monthOf(target) !== data.month) {
      onNavigateMonth(monthOf(target), target);
      return;
    }
    shouldFocus.current = true;
    onSelect(target);
  }

  const prev = shiftMonth(data.month, -1);
  const next = shiftMonth(data.month, 1);
  const label = formatMonthLabel(data.month);

  return (
    <section aria-labelledby="slot-cal-title" className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2
          id="slot-cal-title"
          className="text-lg font-medium capitalize"
          aria-live="polite"
        >
          {label}
        </h2>
        <div className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon-sm">
            <Link href={monthHref(prev)} aria-label="Bulan sebelumnya">
              <ChevronLeft aria-hidden="true" />
            </Link>
          </Button>
          {monthOf(data.today) !== data.month ? (
            <Button asChild variant="secondary" size="xs">
              <Link href={monthHref(monthOf(data.today), data.today)}>
                Hari ini
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="ghost" size="icon-sm">
            <Link href={monthHref(next)} aria-label="Bulan berikutnya">
              <ChevronRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      <table
        role="grid"
        aria-labelledby="slot-cal-title"
        aria-describedby="slot-cal-help"
        className="w-full table-fixed border-separate border-spacing-1"
      >
        <thead>
          <tr>
            {WEEKDAY_SHORT.map((d, i) => (
              <th
                key={d}
                scope="col"
                abbr={WEEKDAY_LONG[i]}
                className="pb-1 text-xs font-medium text-muted-foreground"
              >
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.weeks.map((week) => (
            <tr key={week[0]}>
              {week.map((date) => {
                const day = data.days[date];
                if (!day) return <td key={date} />;
                const isSelected = date === selected;
                const badge = toBadgeStatus(day.status);
                return (
                  <td
                    key={date}
                    role="gridcell"
                    aria-selected={isSelected}
                    className="p-0"
                  >
                    {day.inMonth ? (
                      <button
                        ref={(el) => {
                          if (el) refs.current.set(date, el);
                          else refs.current.delete(date);
                        }}
                        type="button"
                        tabIndex={isSelected ? 0 : -1}
                        aria-label={dayLabel(day)}
                        aria-current={day.isToday ? "date" : undefined}
                        onClick={() => onSelect(date)}
                        onKeyDown={(e) => onKeyDown(e, date)}
                        className={cn(
                          "flex h-16 w-full flex-col items-start justify-between rounded-md border border-input bg-card p-1.5 text-left text-xs transition-colors outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background sm:h-20 sm:p-2",
                          day.isPast && "opacity-60",
                          day.status === "closed" && "bg-muted/60",
                          isSelected &&
                            "border-primary bg-primary/5 ring-1 ring-primary",
                        )}
                      >
                        <span className="flex w-full items-center justify-between gap-1">
                          <span
                            className={cn(
                              "text-sm font-medium tabular-nums",
                              day.isToday &&
                                "rounded-full bg-primary px-1.5 text-primary-foreground",
                            )}
                          >
                            {Number(date.slice(8))}
                          </span>
                          {day.override?.note ? (
                            <span
                              aria-hidden="true"
                              className="size-1.5 rounded-full bg-accent-strong"
                            />
                          ) : null}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1",
                            STATUS_TEXT[badge],
                          )}
                          aria-hidden="true"
                        >
                          <SlotDot status={badge} />
                          <span className="hidden tabular-nums sm:inline">
                            {day.status === "closed"
                              ? "Libur"
                              : `${day.booked}/${day.capacity}`}
                          </span>
                        </span>
                      </button>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex h-16 items-start p-1.5 text-xs text-muted-foreground/60 tabular-nums sm:h-20 sm:p-2"
                      >
                        {Number(date.slice(8))}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p id="slot-cal-help" className="mt-2 text-xs text-muted-foreground">
        Panah untuk pindah hari, PageUp/PageDown untuk pindah bulan, Enter untuk
        memilih. Angka = slot terpakai/kapasitas. Titik emas = ada catatan.
      </p>
      <Legend />
    </section>
  );
}

function Legend() {
  const items = ["available", "nearly", "full", "closed"] as const;
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {items.map((s) => (
        <li key={s} className={cn("flex items-center gap-1.5", STATUS_TEXT[s])}>
          <SlotDot status={s} />
          <span className="text-foreground">
            {s === "closed" ? "Libur / lewat batas" : AVAILABILITY_LABEL[s]}
          </span>
        </li>
      ))}
    </ul>
  );
}
