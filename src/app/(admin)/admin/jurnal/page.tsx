import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { deletePost } from "@/features/posts/actions";

import { ContentTable } from "./_shared/components/content-table";
import { loadPostRows } from "./_shared/lib/load";

export const metadata: Metadata = { title: "Jurnal" };

export default function JournalAdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Konten"
        title="Jurnal"
        description="Tulis, jadwalkan, dan terbitkan artikel. Waktu terbit memakai zona Asia/Jakarta (WIB)."
      />
      <Suspense
        fallback={
          <Skeleton
            className="h-80 w-full rounded-lg"
            aria-label="Memuat daftar artikel"
          />
        }
      >
        <JournalList />
      </Suspense>
    </>
  );
}

async function JournalList() {
  await connection();
  const { rows, categories } = await loadPostRows();
  return (
    <ContentTable
      rows={rows}
      categories={categories}
      entityLabel="artikel"
      basePath="/admin/jurnal"
      publicBasePath="/jurnal"
      onDelete={deletePost}
      deletePermission="posts.delete"
    />
  );
}
