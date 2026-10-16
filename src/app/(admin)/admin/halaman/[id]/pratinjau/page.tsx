import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { uuidSchema } from "@/features/_shared/schema";
import { BlockRenderer } from "@/features/pages/blocks/block-renderer";
import { getPageForAdmin } from "@/features/pages/queries.admin";

export const metadata: Metadata = { title: "Pratinjau halaman" };

/**
 * Admin preview of the SAVED page (incl. draft status), visible sections only, rendered with
 * the public block renderers inside the admin shell. Hidden/invalid sections are listed.
 */
export default function PreviewPageAdmin({
  params,
}: PageProps<"/admin/halaman/[id]/pratinjau">) {
  return (
    <Suspense
      fallback={
        <Skeleton
          className="h-[60vh] w-full rounded-lg"
          aria-label="Memuat pratinjau"
        />
      }
    >
      <Preview params={params} />
    </Suspense>
  );
}

async function Preview({
  params,
}: {
  params: PageProps<"/admin/halaman/[id]/pratinjau">["params"];
}) {
  const { id } = await params;
  await connection();
  if (!uuidSchema.safeParse(id).success) notFound();
  const page = await getPageForAdmin(id);
  if (!page) notFound();
  const visible = page.sections.filter((s) => s.visible);
  const hidden = page.sections.length - visible.length;
  const invalid = visible.filter((s) => !s.valid).length;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        className="mb-0 lg:mb-0"
        eyebrow="Pratinjau"
        title={`${page.title}${page.status === "draft" ? " (draf)" : ""}`}
        description={`Versi tersimpan. ${hidden ? `${hidden} section disembunyikan tidak ditampilkan. ` : ""}${invalid ? `${invalid} section tidak valid dilewati.` : ""}`}
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href={`/admin/halaman/${page.id}`}>Kembali ke editor</Link>
          </Button>
        }
      />
      {/* Admin shell already owns the page <h1>; blocks start at h2. */}
      <div className="overflow-hidden rounded-lg border border-input bg-background">
        {visible.length ? (
          <BlockRenderer blocks={visible} firstHeadingLevel={2} />
        ) : (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Tidak ada section yang tampil.
          </p>
        )}
      </div>
    </div>
  );
}
