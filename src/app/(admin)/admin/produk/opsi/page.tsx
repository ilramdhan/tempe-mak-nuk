import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";

import { OptionsManager } from "../_components/options-manager";
import { loadOptions } from "../_lib/load";

export const metadata: Metadata = { title: "Bentuk & ukuran produk" };

export default function ProductOptionsPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <Link href="/admin/produk" className="hover:underline">
            ← Produk
          </Link>
        }
        title="Bentuk & ukuran"
        description="Daftar bentuk dan ukuran yang bisa ditautkan ke tiap produk. Urutan di sini jadi urutan default."
      />
      <Suspense
        fallback={
          <Skeleton
            className="h-96 w-full rounded-lg"
            aria-label="Memuat opsi"
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
  const { shapes, sizes } = await loadOptions();
  return <OptionsManager shapes={shapes} sizes={sizes} />;
}
