import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listCategoriesWithCounts,
  listTagsWithCounts,
} from "@/features/taxonomy/queries.admin";

import { TaxonomyManager } from "./_components/taxonomy-manager";

export const metadata: Metadata = { title: "Kategori" };

export default function KategoriAdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Konten"
        title="Kategori & Tag"
        description="Kelola kategori FAQ, jurnal, dan resep, serta tag artikel. Seret untuk mengubah urutan kategori."
      />
      <Suspense
        fallback={
          <Skeleton
            className="h-96 w-full rounded-lg"
            aria-label="Memuat kategori"
          />
        }
      >
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await connection();
  const [categories, tags] = await Promise.all([
    listCategoriesWithCounts(),
    listTagsWithCounts(),
  ]);
  return <TaxonomyManager categories={categories} tags={tags} />;
}
