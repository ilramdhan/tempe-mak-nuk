import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteRecipe } from "@/features/recipes/actions";

import { ContentTable } from "../jurnal/_shared/components/content-table";
import { loadRecipeRows } from "../jurnal/_shared/lib/load";

export const metadata: Metadata = { title: "Resep" };

export default function RecipesAdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Konten"
        title="Resep"
        description="Kelola resep: bahan, langkah, waktu, porsi, dan tips. Waktu terbit memakai zona Asia/Jakarta (WIB)."
      />
      <Suspense
        fallback={
          <Skeleton
            className="h-80 w-full rounded-lg"
            aria-label="Memuat daftar resep"
          />
        }
      >
        <RecipeList />
      </Suspense>
    </>
  );
}

async function RecipeList() {
  await connection();
  const { rows, categories } = await loadRecipeRows();
  return (
    <ContentTable
      rows={rows}
      categories={categories}
      entityLabel="resep"
      basePath="/admin/resep"
      publicBasePath="/resep"
      extraLabel="Produk"
      onDelete={deleteRecipe}
    />
  );
}
