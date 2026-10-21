import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { uuidSchema } from "@/features/_shared/schema";

import { NutritionForm } from "../_components/nutrition-form";
import { ProductForm } from "../_components/product-form";
import { loadOptions, loadProductForEdit } from "../_lib/load";

export const metadata: Metadata = { title: "Edit produk" };

export default function EditProductPage({
  params,
}: PageProps<"/admin/produk/[id]">) {
  return (
    <Suspense
      fallback={
        <Skeleton
          className="h-96 w-full rounded-lg"
          aria-label="Memuat editor produk"
        />
      }
    >
      <Content params={params} />
    </Suspense>
  );
}

async function Content({
  params,
}: {
  params: PageProps<"/admin/produk/[id]">["params"];
}) {
  const { id } = await params;
  await connection();
  if (!uuidSchema.safeParse(id).success) notFound();
  const [product, options] = await Promise.all([
    loadProductForEdit(id),
    loadOptions(),
  ]);
  if (!product) notFound();
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/produk" className="hover:underline">
            ← Produk
          </Link>
        }
        title={product.name}
        description={`Alamat situs: /produk/${product.slug}.`}
      />
      <div className="flex flex-col gap-10">
        <ProductForm
          key={product.id}
          productId={product.id}
          initial={product.draft}
          shapes={options.shapes}
          sizes={options.sizes}
        />
        <section
          aria-labelledby="h-gizi"
          className="border-t border-border pt-8"
        >
          <h2 id="h-gizi" className="mb-4 text-lg font-medium">
            Nilai gizi per 100 g
          </h2>
          <NutritionForm
            key={product.nutrition?.id ?? "new"}
            productId={product.id}
            initial={product.nutrition}
          />
        </section>
      </div>
    </>
  );
}
