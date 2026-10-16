import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false, follow: false },
};

/** Fallback 404 for URLs outside the (site) group; renders inside the root layout only. */
export default function RootNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center gap-4 px-4 py-24">
      <p className="text-sm font-semibold tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="font-display text-4xl font-semibold text-balance sm:text-5xl">
        Halaman ini sudah tidak ada.
      </h1>
      <p className="text-lg text-muted-foreground">
        Mungkin sudah dipindah, seperti tempe yang sudah diambil.
      </p>
      <Button asChild variant="primary" size="lg">
        <Link href="/">Kembali ke beranda</Link>
      </Button>
    </main>
  );
}
