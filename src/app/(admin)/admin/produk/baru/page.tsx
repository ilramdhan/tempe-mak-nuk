import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";

import { ProductForm } from "../_components/product-form";
import { emptyDraft } from "../_lib/form-state";
import { loadOptions } from "../_lib/load";

export const metadata: Metadata = { title: "Produk baru" };

export default function NewProductPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/produk" className="hover:underline">
            ← Produk
          </Link>
        }
        title="Produk baru"
        description="Isi data dasar; nilai gizi bisa ditambahkan setelah produk dibuat."
      />
      <Suspense
        fallback={
          <Skeleton
            className="h-96 w-full rounded-lg"
            aria-label="Memuat formulir"
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
  const { shapes, sizes, media } = await loadOptions();
  return (
    <ProductForm
      productId={null}
      initial={emptyDraft()}
      shapes={shapes}
      sizes={sizes}
      media={media}
    />
  );
}
