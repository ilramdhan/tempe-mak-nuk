import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { DraftsCard } from "./_dashboard/drafts";
import { ShortcutsCard } from "./_dashboard/shortcuts";
import { SlotWeekCard } from "./_dashboard/slot-week";
import { WaStatsCard } from "./_dashboard/wa-stats";
import { WarningsCard } from "./_dashboard/warnings";

export const metadata: Metadata = { title: "Dasbor" };

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        title="Dasbor"
        description="Ringkasan slot minggu ini, klik WhatsApp, dan konten yang belum terbit."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense
          fallback={
            <CardSkeleton label="peringatan konten" className="lg:col-span-2" />
          }
        >
          <Warnings />
        </Suspense>
        <Suspense fallback={<CardSkeleton label="slot" />}>
          <SlotWeek />
        </Suspense>
        <Suspense fallback={<CardSkeleton label="klik WhatsApp" />}>
          <WaStats />
        </Suspense>
        <Suspense fallback={<CardSkeleton label="konten draft" />}>
          <DraftsCard />
        </Suspense>
        <ShortcutsCard />
      </div>
    </>
  );
}

async function SlotWeek() {
  await connection();
  return <SlotWeekCard now={new Date()} />;
}

async function Warnings() {
  await connection();
  return <WarningsCard now={new Date()} />;
}

async function WaStats() {
  await connection();
  return <WaStatsCard now={new Date()} />;
}

function CardSkeleton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <Skeleton
      className={cn("h-72 w-full rounded-lg", className)}
      aria-busy="true"
      aria-label={`Memuat ${label}`}
    />
  );
}
