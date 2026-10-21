import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { listLegalDocumentsForAdmin } from "@/features/legal/queries.admin";
import { getSettingsForAdmin } from "@/features/settings/queries.admin";
import { requireRole } from "@/lib/auth/require-role";

import { LegalTabs } from "./_components/legal-tabs";
import { isSampleContent, type LegalRow } from "./_lib/legal-form";

export const metadata: Metadata = { title: "Legal & Privasi" };

export default function LegalAdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sistem"
        title="Legal & Privasi"
        description="Dokumen legal berversi dan teks persetujuan cookie. Hanya pemilik yang dapat mengubah."
      />
      <Suspense
        fallback={
          <Skeleton
            className="h-96 w-full rounded-lg"
            aria-label="Memuat dokumen legal"
          />
        }
      >
        <LegalContent />
      </Suspense>
    </>
  );
}

async function LegalContent() {
  await connection();
  await requireRole("owner", { onFail: "redirect", next: "/admin/legal" });
  const [docs, { settings }] = await Promise.all([
    listLegalDocumentsForAdmin(),
    getSettingsForAdmin(),
  ]);
  const rows: LegalRow[] = docs.map((d) => ({
    id: d.id,
    slug: d.slug,
    title: d.title,
    version: d.version,
    status: d.status,
    effectiveAt: d.effectiveAt?.toISOString() ?? null,
    updatedAt: d.updatedAt.toISOString(),
    sample: isSampleContent(d.content),
  }));
  return <LegalTabs rows={rows} consent={settings["consent.config"]} />;
}
