import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { uuidSchema } from "@/features/_shared/schema";

import { EditorSkeleton } from "../../jurnal/_shared/components/editor-skeleton";
import { RecipeEditor } from "../_components/recipe-editor";
import { loadRecipeDraft, loadRecipeOptions } from "../_lib/load";

export const metadata: Metadata = { title: "Edit resep" };

export default function EditRecipePage({
  params,
}: PageProps<"/admin/resep/[id]">) {
  return (
    <Suspense fallback={<EditorSkeleton label="Memuat editor resep" />}>
      <EditRecipeContent params={params} />
    </Suspense>
  );
}

async function EditRecipeContent({
  params,
}: {
  params: PageProps<"/admin/resep/[id]">["params"];
}) {
  const { id } = await params;
  await connection();
  if (!uuidSchema.safeParse(id).success) notFound();
  const [recipe, options] = await Promise.all([
    loadRecipeDraft(id),
    loadRecipeOptions(),
  ]);
  if (!recipe) notFound();
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/resep" className="hover:underline">
            ← Resep
          </Link>
        }
        title={recipe.draft.title}
        description={`Alamat: /resep/${recipe.draft.slug}`}
      />
      <RecipeEditor
        key={id}
        id={id}
        initial={recipe.draft}
        options={options}
        live={recipe.liveSlug}
      />
    </>
  );
}
