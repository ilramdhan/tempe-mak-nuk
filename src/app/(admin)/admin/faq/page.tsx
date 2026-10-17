import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { listFaqsForAdmin } from "@/features/faqs/queries.admin";
import { listCategoriesForAdmin } from "@/features/taxonomy/queries.admin";

import { FaqManager } from "./_components/faq-manager";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqAdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Konten"
        title="FAQ"
        description="Pertanyaan yang sering diajukan. Seret untuk mengubah urutan di dalam kategori."
      />
      <Suspense
        fallback={
          <Skeleton
            className="h-96 w-full rounded-lg"
            aria-label="Memuat FAQ"
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
  const [faqs, categories] = await Promise.all([
    listFaqsForAdmin(),
    listCategoriesForAdmin("faq"),
  ]);
  return (
    <FaqManager
      faqs={faqs.map((f) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        categoryId: f.categoryId,
        sort: f.sort,
        visible: f.visible,
        showOnHome: f.showOnHome,
      }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
