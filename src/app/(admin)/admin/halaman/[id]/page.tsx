import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { uuidSchema } from "@/features/_shared/schema";

import { PageEditor } from "../_components/page-editor";
import { loadBuilderOptions, loadEditorPage } from "../_lib/load";

export const metadata: Metadata = { title: "Edit halaman" };

export default function EditPageAdmin({
  params,
}: PageProps<"/admin/halaman/[id]">) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <EditorContent params={params} />
    </Suspense>
  );
}

async function EditorContent({
  params,
}: {
  params: PageProps<"/admin/halaman/[id]">["params"];
}) {
  const { id } = await params;
  await connection();
  if (!uuidSchema.safeParse(id).success) notFound();
  const [page, options] = await Promise.all([
    loadEditorPage(id),
    loadBuilderOptions(),
  ]);
  if (!page) notFound();
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/halaman" className="hover:underline">
            ← Halaman
          </Link>
        }
        title={page.title}
        description={`Rute situs: ${page.slug === "home" ? "/" : `/${page.slug}`}. Tambah, urutkan, sembunyikan, dan edit section; simpan sekali untuk semua perubahan.`}
      />
      <PageEditor key={page.id} page={page} options={options} />
    </>
  );
}

function EditorSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      aria-busy="true"
      aria-label="Memuat editor halaman"
    >
      <Skeleton className="h-16 w-full max-w-xl" />
      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <Skeleton className="h-96 w-full rounded-lg" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    </div>
  );
}
