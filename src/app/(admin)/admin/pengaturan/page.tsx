import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { listRedirectsForAdmin } from "@/features/pages/queries.admin";
import { getSettingsForAdmin } from "@/features/settings/queries.admin";

import { SettingsTabs } from "./_components/settings-tabs";

export const metadata: Metadata = { title: "Pengaturan" };

export default function SettingsAdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sistem"
        title="Pengaturan"
        description="Data bisnis, kontak, halal, aturan PO, SEO, dan redirect. Perubahan langsung tampil di situs."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" aria-label="Memuat pengaturan" />}>
        <SettingsContent />
      </Suspense>
    </>
  );
}

async function SettingsContent() {
  await connection();
  const [{ settings, invalidKeys }, redirects] = await Promise.all([getSettingsForAdmin(), listRedirectsForAdmin()]);
  return (
    <div className="flex flex-col gap-4">
      {invalidKeys.length ? (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">
          Nilai tersimpan tidak valid untuk: {invalidKeys.join(", ")}. Nilai bawaan ditampilkan; simpan untuk memperbaiki.
        </p>
      ) : null}
      <SettingsTabs
        settings={settings}
        redirects={redirects.map((r) => ({ id: r.id, from: r.from, to: r.to, permanent: r.permanent }))}
      />
    </div>
  );
}
