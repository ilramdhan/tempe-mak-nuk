"use client";

import dynamic from "next/dynamic";

import { cn } from "@/lib/utils";

import type { SlotCalendarProps } from "./slot-calendar";

/**
 * Same box as `SlotCalendar` (border + p-3, 44 px cells: caption + weekday row + up to
 * 6 weeks) so swapping it for the real calendar doesn't shift layout.
 */
export function SlotCalendarSkeleton({
  numberOfMonths = 1,
  className,
}: Pick<SlotCalendarProps, "numberOfMonths" | "className">) {
  return (
    <div
      aria-hidden
      data-slot="slot-calendar-skeleton"
      className={cn(
        "flex w-full flex-col gap-6 rounded-lg border border-border bg-card p-3 md:flex-row",
        className,
      )}
    >
      {Array.from({ length: numberOfMonths }, (_, i) => (
        <div
          key={i}
          className="h-[23.5rem] w-full animate-pulse rounded-md bg-muted"
        />
      ))}
    </div>
  );
}

/**
 * Code-split `SlotCalendar` (P8.11): react-day-picker + date-fns (~22 kB gz) load only
 * where a calendar actually renders, instead of riding along with every prefetch of
 * `/custom-order` / `/cara-pesan`. Still server-rendered (`ssr` default), so the first
 * paint is the real calendar; the skeleton only shows on client-side mounts.
 */
export const SlotCalendar = dynamic(
  () => import("./slot-calendar").then((m) => m.SlotCalendar),
  {
    loading: () => <SlotCalendarSkeleton />,
  },
);
