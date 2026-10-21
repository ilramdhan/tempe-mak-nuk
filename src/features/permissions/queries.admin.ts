import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { rolePermissions, userPermissions } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";

/** Owner-only: Editor role overrides as `{ [permission]: allowed }`. */
export async function getEditorRoleOverrides(): Promise<
  Record<string, boolean>
> {
  await requireRole("owner", { onFail: "redirect" });
  const rows = await getDb()
    .select({
      key: rolePermissions.permission,
      allowed: rolePermissions.allowed,
    })
    .from(rolePermissions)
    .where(eq(rolePermissions.role, "editor"));
  return Object.fromEntries(rows.map((r) => [r.key, r.allowed]));
}

/** Owner-only: every per-user override, grouped by user id. */
export async function getUserOverrides(): Promise<
  Record<string, Record<string, boolean>>
> {
  await requireRole("owner", { onFail: "redirect" });
  const rows = await getDb()
    .select({
      userId: userPermissions.userId,
      key: userPermissions.permission,
      allowed: userPermissions.allowed,
    })
    .from(userPermissions);
  const out: Record<string, Record<string, boolean>> = {};
  for (const r of rows) (out[r.userId] ??= {})[r.key] = r.allowed;
  return out;
}
