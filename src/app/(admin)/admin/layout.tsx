import type { Metadata } from "next";
import { Suspense } from "react";

import {
  AdminShell,
  AdminShellFallback,
} from "@/components/admin/shell/admin-shell";
import { getEffectivePermissions } from "@/lib/auth/permissions";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = {
  title: { template: "%s — Admin Tempe Mak Nuk", default: "Admin" },
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Admin layout (P5.1). The session read happens inside <Suspense> (cacheComponents: request
 * data can't be in the static shell), so the static shell is just the skeleton.
 * Authorization: proxy = optimistic redirect; here = authoritative `requireRole("editor")`
 * (role from DB). Owner-only pages must additionally call `requireRole("owner", …)`.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<AdminShellFallback />}>
      <AuthorizedShell>{children}</AuthorizedShell>
    </Suspense>
  );
}

async function AuthorizedShell({ children }: { children: React.ReactNode }) {
  const user = await requireRole("editor", { onFail: "redirect" });
  const permissions = await getEffectivePermissions();
  return (
    <AdminShell
      user={{
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        permissions,
      }}
    >
      {children}
    </AdminShell>
  );
}
