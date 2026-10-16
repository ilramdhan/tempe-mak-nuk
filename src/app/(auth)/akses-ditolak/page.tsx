import { ShieldAlert } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Akses ditolak",
};

const COPY = {
  peran: {
    title: "Halaman ini khusus pemilik.",
    body: "Akun Anda bisa mengelola konten, tetapi menu ini hanya untuk pemilik. Minta pemilik bila perlu akses.",
  },
  akun: {
    title: "Akun ini belum punya akses admin.",
    body: "Anda sudah masuk, tetapi akun ini belum terdaftar sebagai pengelola. Hubungi pemilik untuk diundang, atau keluar dan masuk dengan akun lain.",
  },
} as const;

/**
 * Where `requireRole(…, { onFail: "redirect" })` sends signed-in users without enough role:
 * `?alasan=peran` (editor on an owner page) or no param (signed in, no admin profile).
 */
export default function AccessDeniedPage({
  searchParams,
}: PageProps<"/akses-ditolak">) {
  return (
    <div className="flex flex-col gap-4">
      <ShieldAlert className="size-8 text-destructive" aria-hidden="true" />
      <Suspense
        fallback={<div className="h-24 animate-pulse rounded-md bg-surface" />}
      >
        <Reason searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Reason({
  searchParams,
}: {
  searchParams: PageProps<"/akses-ditolak">["searchParams"];
}) {
  const { alasan } = await searchParams;
  const role = alasan === "peran";
  const copy = role ? COPY.peran : COPY.akun;
  return (
    <>
      <h1 className="font-display text-2xl font-medium tracking-tight text-balance">
        {copy.title}
      </h1>
      <p className="text-sm text-muted-foreground">{copy.body}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {role ? (
          <Button asChild>
            <Link href="/admin">Kembali ke dasbor</Link>
          </Button>
        ) : null}
        <form action={signOut}>
          <Button type="submit" variant={role ? "secondary" : "primary"}>
            Keluar
          </Button>
        </form>
      </div>
    </>
  );
}
