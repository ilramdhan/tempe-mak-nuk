"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function SiteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-start gap-4 px-4 py-24">
      <p className="text-sm font-semibold tracking-widest text-muted-foreground">
        500
      </p>
      <h1 className="font-display text-4xl font-semibold text-balance sm:text-5xl">
        Ada yang salah di sisi kami.
      </h1>
      <p className="text-lg text-muted-foreground">
        Coba muat ulang sebentar lagi, atau langsung chat via WhatsApp.
      </p>
      {error.digest ? (
        <p className="text-xs text-muted-foreground">Kode: {error.digest}</p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={() => retry()}
        >
          Muat ulang
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/">Kembali ke beranda</Link>
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/kontak">Hubungi kami</Link>
        </Button>
      </div>
    </div>
  );
}
