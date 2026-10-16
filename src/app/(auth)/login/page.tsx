import type { Metadata } from "next";
import { Suspense } from "react";

import { isAuthConfigured } from "@/lib/auth/config";
import { loginNotice } from "@/lib/auth/messages";
import { DEFAULT_AFTER_LOGIN, sanitizeNextPath } from "@/lib/auth/next-path";

import { LoginForm } from "./login-form";
import { NotConfigured } from "./not-configured";

export const metadata: Metadata = {
  title: "Masuk Admin",
};

/** Static heading; the form reads `?next` / `?pesan` so it streams behind Suspense. */
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <>
      <h1 className="font-display text-2xl font-medium tracking-tight">
        Masuk ke Admin
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Kelola isi situs, slot, dan pesanan pre-order.
      </p>
      <div className="mt-6">
        {isAuthConfigured() ? (
          <Suspense
            fallback={
              <div className="h-72 animate-pulse rounded-lg bg-surface" />
            }
          >
            <LoginFormFromParams searchParams={searchParams} />
          </Suspense>
        ) : (
          <NotConfigured />
        )}
      </div>
    </>
  );
}

async function LoginFormFromParams({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;
  const next = sanitizeNextPath(first(params.next), DEFAULT_AFTER_LOGIN);
  const notice = loginNotice(first(params.pesan));
  return <LoginForm next={next} notice={notice} />;
}
