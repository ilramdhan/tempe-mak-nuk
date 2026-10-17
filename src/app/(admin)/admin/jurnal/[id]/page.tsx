import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { uuidSchema } from "@/features/_shared/schema";

import { PostEditor } from "../_components/post-editor";
import { loadPostDraft, loadPostOptions } from "../_lib/load";
import { EditorSkeleton } from "../_shared/components/editor-skeleton";

export const metadata: Metadata = { title: "Edit artikel" };

export default function EditPostPage({
  params,
}: PageProps<"/admin/jurnal/[id]">) {
  return (
    <Suspense fallback={<EditorSkeleton label="Memuat editor artikel" />}>
      <EditPostContent params={params} />
    </Suspense>
  );
}

async function EditPostContent({
  params,
}: {
  params: PageProps<"/admin/jurnal/[id]">["params"];
}) {
  const { id } = await params;
  await connection();
  if (!uuidSchema.safeParse(id).success) notFound();
  const [post, options] = await Promise.all([
    loadPostDraft(id),
    loadPostOptions(),
  ]);
  if (!post) notFound();
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/jurnal" className="hover:underline">
            ← Jurnal
          </Link>
        }
        title={post.draft.title}
        description={`Alamat: /jurnal/${post.draft.slug}`}
      />
      <PostEditor
        key={id}
        id={id}
        initial={post.draft}
        options={options}
        live={post.liveSlug}
      />
    </>
  );
}
