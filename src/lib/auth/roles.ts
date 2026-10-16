/**
 * Pure role helpers (no server-only import) — safe in client components, proxy and tests.
 * Authoritative checks still happen server-side via `requireRole()` (role read from DB).
 */
import type { UserRole } from "@/db/schema/enums";

export type AdminRole = UserRole; // "owner" | "editor"

export const ADMIN_ROLES = [
  "editor",
  "owner",
] as const satisfies readonly AdminRole[];

/** Role hierarchy: owner can do everything an editor can. */
const RANK: Record<AdminRole, number> = { editor: 1, owner: 2 };

export const ROLE_LABEL: Record<AdminRole, string> = {
  owner: "Pemilik",
  editor: "Editor",
};

export function isAdminRole(value: unknown): value is AdminRole {
  return typeof value === "string" && Object.hasOwn(RANK, value);
}

/** true when `role` meets or exceeds `required`. Unknown / missing roles never pass. */
export function hasRole(
  role: AdminRole | null | undefined,
  required: AdminRole,
): boolean {
  if (!isAdminRole(role)) return false;
  return RANK[role] >= RANK[required];
}
