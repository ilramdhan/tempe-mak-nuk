import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { listMediaForAdmin } from "@/features/media/queries.admin";

import { MediaLibrary, PAGE_SIZE } from "./_components/media-library";

export const metadata: Metadata = { title: "Media" };

export default function MediaAdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Konten"
        title="Pustaka Media"
        description="Unggah foto (otomatis WebP, maks. 2400 px, metadata dihapus). Teks alt wajib untuk aksesibilitas & SEO."
      />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-lg" aria-label="Memuat media" />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await connection();
  let rows: Awaited<ReturnType<typeof listMediaForAdmin>> = [];
  let loadError = false;
  try {
    rows = await listMediaForAdmin({ limit: PAGE_SIZE + 1 });
  } catch (error) {
    console.error("[admin/media] load failed:", error);
    loadError = true;
  }
  return (
    <MediaLibrary
      loadError={loadError}
      initialHasMore={rows.length > PAGE_SIZE}
      initialItems={rows.slice(0, PAGE_SIZE).map((r) => ({
        id: r.id,
        url: r.url,
        alt: r.alt,
        width: r.width,
        height: r.height,
        sizeBytes: r.sizeBytes,
        blurDataUrl: r.blurDataUrl,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
