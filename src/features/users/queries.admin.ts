import "server-only";

import { asc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { profiles } from "@/db/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";

export type AdminUserRow = {
  id: string;
  email: string | null;
  displayName: string | null;
  role: "owner" | "editor";
  createdAt: Date;
};

/** Owner-only caller must gate. Emails come from auth.users via the service-role client. */
export async function listUsersForAdmin(): Promise<AdminUserRow[]> {
  await requireRole("owner", { onFail: "redirect" });
  const rows = await getDb()
    .select()
    .from(profiles)
    .orderBy(asc(profiles.createdAt));
  const emails = new Map<string, string>();
  try {
    const { data } = await createAdminClient().auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    for (const u of data?.users ?? []) if (u.email) emails.set(u.id, u.email);
  } catch {
    // email column degrades to empty
  }
  return rows.map((p) => ({
    id: p.id,
    email: emails.get(p.id) ?? null,
    displayName: p.displayName,
    role: p.role,
    createdAt: p.createdAt,
  }));
}

export async function countOwners(db = getDb()): Promise<number> {
  const rows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.role, "owner"));
  return rows.length;
}
