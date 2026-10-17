import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { uuidSchema } from "@/features/_shared/schema";
import { getLegalDocumentForAdmin } from "@/features/legal/queries.admin";
import { requireRole } from "@/lib/auth/require-role";

import { DocumentEditor } from "../_components/document-editor";
import { LEGAL_SLUG_LABEL } from "../_lib/legal-form";

export const metadata: Metadata = { title: "Edit dokumen legal" };

export default function EditLegalPage({ params }: PageProps<"/admin/legal/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" aria-label="Memuat editor" />}>
      <EditContent params={params} />
    </Suspense>
  );
}

async function EditContent({ params }: { params: PageProps<"/admin/legal/[id]">["params"] }) {
  const { id } = await params;
  await connection();
  await requireRole("owner", { onFail: "redirect", next: `/admin/legal/${id}` });
  if (!uuidSchema.safeParse(id).success) notFound();
  const doc = await getLegalDocumentForAdmin(id);
  if (!doc) notFound();
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/legal" className="hover:underline">
            ← Legal & Privasi
          </Link>
        }
        title={`${LEGAL_SLUG_LABEL[doc.slug]} · versi ${doc.version}`}
        description="Dokumen terbit tampil di situs setelah tanggal berlaku (WIB). Buat versi baru untuk perubahan material."
      />
      <DocumentEditor
        key={`${doc.id}-${doc.updatedAt.getTime()}`}
        id={doc.id}
        slug={doc.slug}
        version={doc.version}
        initial={{ title: doc.title, content: doc.content, effectiveAt: doc.effectiveAt?.toISOString() ?? null, status: doc.status }}
      />
    </>
  );
}
