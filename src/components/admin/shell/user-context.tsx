"use client";

import { createContext, use, type ReactNode } from "react";

import type { PermissionKey } from "@/features/permissions/registry";
import { hasRole, type AdminRole } from "@/lib/auth/roles";

/** Narrow, client-safe view of the signed-in admin (no tokens / claims). */
export type AdminUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  role: AdminRole;
  /** Effective permission keys (dynamic RBAC, P8.14). UI hint only — server re-checks. */
  permissions: readonly PermissionKey[];
};

const AdminUserContext = createContext<AdminUser | null>(null);

export function AdminUserProvider({
  user,
  children,
}: {
  user: AdminUser;
  children: ReactNode;
}) {
  return <AdminUserContext value={user}>{children}</AdminUserContext>;
}

/** Current admin user inside the admin shell (client components). UI hint only — not authorization. */
export function useAdminUser(): AdminUser {
  const user = use(AdminUserContext);
  if (!user)
    throw new Error("useAdminUser must be used inside the admin layout.");
  return user;
}

/** Client-side `hasRole` for the current user (hide buttons etc.). Server still re-checks. */
export function useHasRole(required: AdminRole): boolean {
  return hasRole(useAdminUser().role, required);
}

/** Client-side permission check (hide buttons etc.). Owners always pass. Server still re-checks. */
export function useCan(permission: PermissionKey): boolean {
  const user = useAdminUser();
  return user.role === "owner" || user.permissions.includes(permission);
}

/** Display name fallback chain: profile name → email local part → "Admin". */
export function adminDisplayName(
  user: Pick<AdminUser, "displayName" | "email">,
): string {
  return user.displayName?.trim() || user.email?.split("@")[0] || "Admin";
}
