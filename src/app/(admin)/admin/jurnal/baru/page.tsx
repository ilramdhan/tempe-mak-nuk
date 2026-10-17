import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";

import { PostEditor } from "../_components/post-editor";
import { emptyPostDraft } from "../_lib/post-draft";
import { loadPostOptions } from "../_lib/load";
import { EditorSkeleton } from "../_shared/components/editor-skeleton";

export const metadata: Metadata = { title: "Artikel baru" };

export default function NewPostPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/jurnal" className="hover:underline">
            ← Jurnal
          </Link>
        }
        title="Artikel baru"
        description="Simpan sebagai draf dulu bila belum siap terbit."
      />
      <Suspense fallback={<EditorSkeleton label="Memuat editor artikel" />}>
        <NewPostEditor />
      </Suspense>
    </>
  );
}

async function NewPostEditor() {
  await connection();
  const options = await loadPostOptions();
  return <PostEditor id={null} initial={emptyPostDraft()} options={options} />;
}
