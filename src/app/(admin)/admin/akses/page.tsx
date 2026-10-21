import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getEditorRoleOverrides,
  getUserOverrides,
} from "@/features/permissions/queries.admin";
import { listUsersForAdmin } from "@/features/users/queries.admin";
import { requireRole } from "@/lib/auth/require-role";

import { AccessManager } from "./_components/access-manager";

export const metadata: Metadata = { title: "Hak Akses" };

export default function AccessAdminPage({
  searchParams,
}: PageProps<"/admin/akses">) {
  return (
    <>
      <PageHeader
        eyebrow="Sistem"
        title="Hak Akses"
        description="Atur tindakan yang boleh dilakukan Editor, per peran atau per pengguna. Pemilik selalu memiliki semua akses."
      />
      <Suspense
        fallback={
          <Skeleton
            className="h-96 w-full rounded-lg"
            aria-label="Memuat hak akses"
          />
        }
      >
        <AccessContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function AccessContent({
  searchParams,
}: {
  searchParams: PageProps<"/admin/akses">["searchParams"];
}) {
  await connection();
  await requireRole("owner", { onFail: "redirect", next: "/admin/akses" });
  const sp = await searchParams;
  const [roleOverrides, userOverrides, users] = await Promise.all([
    getEditorRoleOverrides(),
    getUserOverrides(),
    listUsersForAdmin(),
  ]);
  const editors = users
    .filter((u) => u.role === "editor")
    .map((u) => ({
      id: u.id,
      name: u.displayName || u.email || u.id.slice(0, 8),
      email: u.email,
    }));
  const requested = typeof sp.pengguna === "string" ? sp.pengguna : undefined;
  const initialUserId = editors.some((e) => e.id === requested)
    ? requested
    : undefined;
  return (
    <AccessManager
      roleOverrides={roleOverrides}
      userOverrides={userOverrides}
      editors={editors}
      initialUserId={initialUserId}
    />
  );
}
