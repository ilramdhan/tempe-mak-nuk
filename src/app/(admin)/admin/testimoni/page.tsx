import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { listTestimonialsForAdmin } from "@/features/testimonials/queries.admin";

import { TestimonialManager } from "./_components/testimonial-manager";

export const metadata: Metadata = { title: "Testimoni" };

export default function TestimonialAdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Konten"
        title="Testimoni"
        description="Testimoni contoh wajib berlabel sampai diganti testimoni asli yang sudah disetujui pemberinya."
      />
      <Suspense
        fallback={
          <Skeleton
            className="h-96 w-full rounded-lg"
            aria-label="Memuat testimoni"
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
  const rows = await listTestimonialsForAdmin();
  return (
    <TestimonialManager
      items={rows.map((t) => ({
        id: t.id,
        name: t.name,
        role: t.role,
        city: t.city,
        quote: t.quote,
        rating: t.rating,
        mediaId: t.mediaId,
        verified: t.verified,
        visible: t.visible,
        sort: t.sort,
        isPlaceholder: t.isPlaceholder,
      }))}
    />
  );
}
