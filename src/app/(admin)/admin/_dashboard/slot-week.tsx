import Link from "next/link";

import { Badge, SlotBadge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AVAILABILITY_LABEL,
  computeAvailability,
  toBadgeStatus,
} from "@/features/slots/availability";
import { getSlotCalendarForAdmin } from "@/features/slots/queries.admin";
import { getOrderRules } from "@/features/settings/queries";
import { addDays, formatDateShort, formatWeekday } from "@/lib/dates";
import { toDateKey } from "@/lib/dates";

import { percent } from "./aggregate";

export async function SlotWeekCard({ now }: { now: Date }) {
  const today = toDateKey(now);
  const [rules, calendar] = await Promise.all([
    getOrderRules(),
    getSlotCalendarForAdmin(addDays(today, -45), addDays(today, 7)),
  ]);
  const days = computeAvailability({
    rules,
    holidays: calendar.holidays.map((h) => ({ date: h.date, label: h.label })),
    overrides: calendar.slotDays.map((d) => ({
      date: d.date,
      capacity: d.capacity,
      booked: d.booked,
      status: d.status,
    })),
    now,
    from: today,
    days: 7,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slot 7 hari ke depan</CardTitle>
        <CardDescription>Terpakai dari kapasitas per hari.</CardDescription>
        <CardAction>
          <Link
            href="/admin/slot"
            className="text-sm font-medium underline underline-offset-4"
          >
            Kelola slot
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {days.map((d) => {
            const closed = d.status === "closed" || d.status === "past-cutoff";
            const pct = percent(d.booked, d.capacity);
            return (
              <li key={d.date}>
                <Link
                  href={`/admin/slot?tanggal=${d.date}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 hover:bg-surface"
                >
                  <div className="w-32 shrink-0">
                    <div className="text-sm font-medium">
                      {formatWeekday(d.date)}
                      {d.date === today ? (
                        <Badge variant="outline" className="ml-2">
                          Hari ini
                        </Badge>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateShort(d.date)}
                    </div>
                  </div>
                  <div className="min-w-32 flex-1">
                    {closed ? (
                      <span className="text-xs text-muted-foreground">
                        {d.holiday ?? d.reason}
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-valuenow={d.booked}
                          aria-valuemin={0}
                          aria-valuemax={d.capacity}
                          aria-label={`Terpakai ${d.booked} dari ${d.capacity}`}
                        >
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-14 text-right text-xs tabular-nums">
                          {d.booked}/{d.capacity}
                        </span>
                      </div>
                    )}
                  </div>
                  <SlotBadge status={toBadgeStatus(d.status)}>
                    {AVAILABILITY_LABEL[d.status]}
                  </SlotBadge>
                </Link>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
