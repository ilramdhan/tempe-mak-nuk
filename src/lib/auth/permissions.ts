import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getDb } from "@/db/client";
import { rolePermissions, userPermissions } from "@/db/schema";
import {
  effectivePermissions,
  NO_OVERRIDES,
  resolvePermission,
  type PermissionOverrides,
} from "@/features/permissions/resolve";
import type { PermissionKey } from "@/features/permissions/registry";

import { loginPathFor } from "./next-path";
import {
  AuthError,
  getAuthState,
  type AdminRole,
  type SessionUser,
} from "./require-role";

/**
 * DB overrides for one user (+ their role). Deduped per render pass via React `cache`
 * (Server Actions run it once per call). Request-time, user-specific — never "use cache".
 * Owners skip the query: they always have every permission.
 */
export const loadPermissionOverrides = cache(
  async (userId: string, role: AdminRole): Promise<PermissionOverrides> => {
    if (role === "owner") return NO_OVERRIDES;
    const db = getDb();
    const [roleRows, userRows] = await Promise.all([
      db
        .select({
          key: rolePermissions.permission,
          allowed: rolePermissions.allowed,
        })
        .from(rolePermissions)
        .where(eq(rolePermissions.role, role)),
      db
        .select({
          key: userPermissions.permission,
          allowed: userPermissions.allowed,
        })
        .from(userPermissions)
        .where(eq(userPermissions.userId, userId)),
    ]);
    return {
      role: new Map(roleRows.map((r) => [r.key, r.allowed])),
      user: new Map(userRows.map((r) => [r.key, r.allowed])),
    };
  },
);

/** true when `user` may perform `permission` (owner → always). */
export async function userCan(
  user: Pick<SessionUser, "id" | "role">,
  permission: PermissionKey | (string & {}),
  callRole?: AdminRole,
): Promise<boolean> {
  if (user.role === "owner") return true;
  const overrides = await loadPermissionOverrides(user.id, user.role);
  return resolvePermission({
    role: user.role,
    key: permission,
    overrides,
    callRole,
  });
}

/** Current admin may perform `permission`? false when not signed in / no admin profile. */
export async function can(permission: PermissionKey): Promise<boolean> {
  const state = await getAuthState();
  if (state.status !== "ok") return false;
  return userCan(state.user, permission);
}

/** Effective permission keys of the current admin (for cosmetic UI gating). */
export async function getEffectivePermissions(): Promise<PermissionKey[]> {
  const state = await getAuthState();
  if (state.status !== "ok") return [];
  const { user } = state;
  const overrides =
    user.role === "owner"
      ? NO_OVERRIDES
      : await loadPermissionOverrides(user.id, user.role);
  return effectivePermissions(user.role, overrides);
}

/**
 * Guard for Server Actions / pages that maps to one permission key. Mirrors `requireRole`:
 * "throw" → AuthError; "redirect" → login or `/akses-ditolak?alasan=peran`.
 */
export async function requirePermission(
  permission: PermissionKey,
  options: {
    onFail?: "throw" | "redirect";
    next?: string;
    role?: AdminRole;
  } = {},
): Promise<SessionUser> {
  const state = await getAuthState();
  if (
    state.status === "ok" &&
    (await userCan(state.user, permission, options.role))
  ) {
    return state.user;
  }
  const signedIn = state.status === "ok" || state.status === "no-access";
  if (options.onFail === "redirect") {
    if (state.status === "unconfigured") redirect("/login?pesan=config");
    if (!signedIn) redirect(loginPathFor(options.next));
    redirect(
      state.status === "ok" ? "/akses-ditolak?alasan=peran" : "/akses-ditolak",
    );
  }
  throw new AuthError(signedIn ? "forbidden" : "unauthenticated");
}
