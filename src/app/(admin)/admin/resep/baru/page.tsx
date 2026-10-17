import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";

import { EditorSkeleton } from "../../jurnal/_shared/components/editor-skeleton";
import { RecipeEditor } from "../_components/recipe-editor";
import { loadRecipeOptions } from "../_lib/load";
import { emptyRecipeDraft } from "../_lib/recipe-draft";

export const metadata: Metadata = { title: "Resep baru" };

export default function NewRecipePage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/resep" className="hover:underline">
            ← Resep
          </Link>
        }
        title="Resep baru"
        description="Simpan sebagai draf dulu bila belum siap terbit."
      />
      <Suspense fallback={<EditorSkeleton label="Memuat editor resep" />}>
        <NewRecipeEditor />
      </Suspense>
    </>
  );
}

async function NewRecipeEditor() {
  await connection();
  const options = await loadRecipeOptions();
  return (
    <RecipeEditor id={null} initial={emptyRecipeDraft()} options={options} />
  );
}
