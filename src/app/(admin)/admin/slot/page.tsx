import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { computeAvailability } from "@/features/slots/availability";
import {
  getSlotCalendarForAdmin,
  listHolidaysForAdmin,
} from "@/features/slots/queries.admin";
import { getOrderRules } from "@/features/settings/queries";
import { addDays, compareDateKeys, toDateKey } from "@/lib/dates";

import {
  monthGrid,
  monthOf,
  parseMonthParam,
} from "./_components/calendar-utils";
import { SlotAdmin } from "./_components/slot-admin";
import type { CalendarDay, SlotAdminData } from "./_components/types";

export const metadata: Metadata = { title: "Slot & PO" };

/** Look-back so order deadlines can skip closed days before the visible range. */
const LOOKBACK_DAYS = 45;

export default function SlotAdminPage({
  searchParams,
}: PageProps<"/admin/slot">) {
  return (
    <>
      <PageHeader
        eyebrow="Operasional"
        title="Slot & PO"
        description="Atur kapasitas per hari, tutup hari tertentu, kelola hari libur, dan aturan batas pesan. Status publik dihitung otomatis dari data ini."
      />
      <Suspense fallback={<SlotAdminSkeleton />}>
        <SlotAdminContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SlotAdminContent({
  searchParams,
}: {
  searchParams: PageProps<"/admin/slot">["searchParams"];
}) {
  const sp = await searchParams;
  await connection();
  const now = new Date();
  const today = toDateKey(now);
  const month = parseMonthParam(sp.bulan, today);
  const grid = monthGrid(month);

  const [rules, calendar, holidayRows] = await Promise.all([
    getOrderRules(),
    getSlotCalendarForAdmin(addDays(grid.start, -LOOKBACK_DAYS), grid.end),
    listHolidaysForAdmin(),
  ]);

  const overrides = calendar.slotDays.map((d) => ({
    date: d.date,
    capacity: d.capacity,
    booked: d.booked,
    status: d.status,
  }));
  const rowByDate = new Map(calendar.slotDays.map((d) => [d.date, d]));
  const availability = computeAvailability({
    rules,
    holidays: calendar.holidays.map((h) => ({ date: h.date, label: h.label })),
    overrides,
    now,
    from: grid.start,
    days: grid.length,
  });

  const days: Record<string, CalendarDay> = {};
  for (const a of availability) {
    const row = rowByDate.get(a.date);
    days[a.date] = {
      ...a,
      inMonth: monthOf(a.date) === month,
      isToday: a.date === today,
      isPast: compareDateKeys(a.date, today) < 0,
      override: row
        ? {
            capacity: row.capacity,
            booked: row.booked,
            status: row.status,
            note: row.note,
          }
        : null,
    };
  }

  const data: SlotAdminData = {
    month,
    today,
    rules: { ...rules, closedWeekdays: [...rules.closedWeekdays] },
    weeks: grid.weeks,
    days,
  };
  const initialDate =
    typeof sp.tanggal === "string" && days[sp.tanggal]
      ? sp.tanggal
      : monthOf(today) === month
        ? today
        : `${month}-01`;

  return (
    <SlotAdmin
      // Remount per month so the selection follows the URL.
      key={month}
      data={data}
      initialDate={initialDate}
      holidays={holidayRows.map((h) => ({ date: h.date, label: h.label }))}
    />
  );
}

function SlotAdminSkeleton() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
      aria-busy="true"
      aria-label="Memuat kalender slot"
    >
      <Skeleton className="h-[28rem] w-full rounded-lg" />
      <Skeleton className="h-[28rem] w-full rounded-lg" />
    </div>
  );
}
