import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";

import { DraftsCard } from "./_dashboard/drafts";
import { ShortcutsCard } from "./_dashboard/shortcuts";
import { SlotWeekCard } from "./_dashboard/slot-week";
import { WaStatsCard } from "./_dashboard/wa-stats";

export const metadata: Metadata = { title: "Dasbor" };

export default function AdminDashboardPage() {
  return (
    <>
      <PageHeader
        title="Dasbor"
        description="Ringkasan slot minggu ini, klik WhatsApp, dan konten yang belum terbit."
      />
      <div className="grid gap-6 lg:grid-cols-2">
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

async function WaStats() {
  await connection();
  return <WaStatsCard now={new Date()} />;
}

function CardSkeleton({ label }: { label: string }) {
  return (
    <Skeleton
      className="h-72 w-full rounded-lg"
      aria-busy="true"
      aria-label={`Memuat ${label}`}
    />
  );
}
