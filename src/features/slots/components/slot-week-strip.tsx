import { connection } from "next/server";
import { Suspense } from "react";

import { SlotBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AVAILABILITY_LABEL,
  toBadgeStatus,
} from "@/features/slots/availability";
import { getAvailability } from "@/features/slots/queries";
import { formatDateShort, formatWeekday } from "@/lib/dates";
import { cn } from "@/lib/utils";

async function WeekData({ days }: { days: number }) {
  await connection();
  const { days: list } = await getAvailability({ now: new Date(), days });
  return (
    <ul
      className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4 lg:grid-cols-7"
      aria-label={`Status slot ${days} hari ke depan`}
    >
      {list.map((d) => (
        <li
          key={d.date}
          className={cn(
            "flex flex-col gap-2 rounded-lg border border-border bg-card p-3",
            !d.orderable && "text-muted-foreground",
          )}
        >
          <span className="text-xs">{formatWeekday(d.date)}</span>
          <span className="font-display text-h4 leading-none text-foreground">
            {formatDateShort(d.date)}
          </span>
          <SlotBadge status={toBadgeStatus(d.status)}>
            {AVAILABILITY_LABEL[d.status]}
          </SlotBadge>
          <span className="sr-only">{d.reason}</span>
        </li>
      ))}
    </ul>
  );
}

function WeekSkeleton({ days }: { days: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
      aria-hidden
    >
      {Array.from({ length: days }, (_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}

/** Compact strip of the next `days` days (beranda). Self-contained: includes <Suspense>. */
export function SlotWeekStrip({ days = 7 }: { days?: number }) {
  return (
    <Suspense fallback={<WeekSkeleton days={days} />}>
      <WeekData days={days} />
    </Suspense>
  );
}
