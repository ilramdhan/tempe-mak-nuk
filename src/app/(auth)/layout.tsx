import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

/** Minimal centred layout for login / access pages (no site header/footer). */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grain flex min-h-dvh flex-1 flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mx-auto mb-8 block w-fit rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo variant="stacked" className="h-24 w-auto text-primary" />
        </Link>
        <main className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
          {children}
        </main>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Halaman ini khusus pengelola Tempe Mak Nuk.
        </p>
      </div>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
