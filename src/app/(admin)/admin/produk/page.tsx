import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { ProductTable } from "./_components/product-table";
import { loadProductList } from "./_lib/load";

export const metadata: Metadata = { title: "Produk" };

export default function ProductsAdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Katalog"
        title="Produk"
        description="Kelola produk tempe: harga mulai dari, bentuk, ukuran, nilai gizi, galeri, dan SEO."
        actions={
          <>
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/produk/opsi">Bentuk & ukuran</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/produk/baru">Produk baru</Link>
            </Button>
          </>
        }
      />
      <Suspense
        fallback={
          <Skeleton
            className="h-80 w-full rounded-lg"
            aria-label="Memuat daftar produk"
          />
        }
      >
        <ListContent />
      </Suspense>
    </>
  );
}

async function ListContent() {
  await connection();
  const products = await loadProductList();
  return <ProductTable products={products} />;
}
