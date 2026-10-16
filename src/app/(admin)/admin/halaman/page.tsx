import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";

import { PageList } from "./_components/page-list";
import { loadPageList } from "./_lib/load";

export const metadata: Metadata = { title: "Halaman" };

export default function PagesAdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Konten"
        title="Halaman"
        description="Atur isi tiap halaman situs dari susunan section: tambah, urutkan, sembunyikan, dan ubah teks tanpa menyentuh kode."
      />
      <Suspense
        fallback={
          <Skeleton
            className="h-80 w-full rounded-lg"
            aria-label="Memuat daftar halaman"
          />
        }
      >
        <PageListContent />
      </Suspense>
    </>
  );
}

async function PageListContent() {
  await connection();
  const pages = await loadPageList();
  return <PageList pages={pages} />;
}
