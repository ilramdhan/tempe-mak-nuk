import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import { listUsersForAdmin } from "@/features/users/queries.admin";
import { requireRole } from "@/lib/auth/require-role";

import { UserTable } from "./_components/user-table";

export const metadata: Metadata = { title: "Pengguna" };

export default function UsersAdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sistem"
        title="Pengguna"
        description="Kelola akses admin. Pemilik dapat mengundang pengguna dan mengubah peran."
      />
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg" aria-label="Memuat pengguna" />}>
        <UsersContent />
      </Suspense>
    </>
  );
}

async function UsersContent() {
  await connection();
  await requireRole("owner", { onFail: "redirect", next: "/admin/pengguna" });
  const rows = await listUsersForAdmin();
  return <UserTable rows={rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))} />;
}
