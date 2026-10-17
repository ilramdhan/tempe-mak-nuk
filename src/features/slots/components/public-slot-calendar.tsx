import { connection } from "next/server";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  SlotCalendar,
  SlotLegend,
} from "@/features/orders/components/slot-calendar";
import { getSettings } from "@/features/settings/queries";
import { getAvailability } from "@/features/slots/queries";

/** Read-only month calendar (server). Needs request-time "now", so render it inside <Suspense>. */
async function CalendarData({ days }: { days: number }) {
  await connection();
  const now = new Date();
  const availability = await getAvailability({ now, days });
  const settings = await getSettings();
  const list = availability.days;
  return (
    <div className="flex flex-col gap-4">
      <SlotCalendar
        days={list}
        today={list[0]?.date}
        numberOfMonths={days > 31 ? 2 : 1}
        aria-describedby="public-slot-legend"
      />
      <SlotLegend id="public-slot-legend" />
      <p className="text-sm text-muted-foreground">
        Kapasitas {settings["order.slotsPerDay"]} slot per hari. PO paling
        lambat {settings["order.leadDays"]} hari sebelumnya, pukul{" "}
        {settings["order.cutoffTime"]} WIB.
      </p>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-hidden>
      <Skeleton className="h-80 max-w-md rounded-lg" />
      <Skeleton className="h-5 w-2/3" />
    </div>
  );
}

/** Full public slot calendar. `days` = how many days ahead to show (default 30). */
export function PublicSlotCalendar({ days = 30 }: { days?: number }) {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarData days={days} />
    </Suspense>
  );
}
