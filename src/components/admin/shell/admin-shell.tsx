import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { Toaster } from "@/components/ui/sonner";

import { MobileNav } from "./mobile-nav";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";
import { AdminUserProvider, type AdminUser } from "./user-context";

/**
 * Admin chrome: fixed sidebar (lg+), topbar with mobile menu + user menu, main area.
 * Rendered by the admin layout only after `requireRole("editor")` passed.
 */
export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: ReactNode;
}) {
  return (
    <AdminUserProvider user={user}>
      <a
        href="#admin-main"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Lewati ke konten
      </a>
      <div className="flex min-h-dvh w-full">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
          <div className="flex h-16 items-center border-b border-border px-5">
            <Link
              href="/admin"
              className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Logo
                className="h-7 w-auto text-primary"
                aria-label="Tempe Mak Nuk — Admin"
              />
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <SidebarNav />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur supports-backdrop-filter:bg-background/75 sm:px-6">
            <MobileNav />
            <Link
              href="/admin"
              className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
            >
              <Logo
                variant="monogram"
                className="size-8 text-primary"
                aria-label="Dasbor admin"
              />
            </Link>
            <span className="text-sm font-medium text-muted-foreground max-lg:sr-only">
              Admin
            </span>
            <div className="ml-auto">
              <UserMenu />
            </div>
          </header>
          <main
            id="admin-main"
            tabIndex={-1}
            className="flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
          >
            {children}
          </main>
        </div>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </AdminUserProvider>
  );
}

/** Skeleton shown while the session/role is resolved (static shell under cacheComponents). */
export function AdminShellFallback() {
  return (
    <div className="flex min-h-dvh w-full" aria-busy="true">
      <div className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block" />
      <div className="flex flex-1 flex-col">
        <div className="h-16 border-b border-border" />
        <div className="flex-1 p-8">
          <div className="h-8 w-48 animate-pulse rounded-md bg-surface" />
          <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-md bg-surface" />
          <span className="sr-only">Memuat admin…</span>
        </div>
      </div>
    </div>
  );
}
