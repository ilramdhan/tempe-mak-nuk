/**
 * Pure permission resolution (client-safe, unit-tested). The server is the source of truth:
 * `src/lib/auth/permissions.ts` loads the overrides from the DB and calls `resolvePermission`.
 *
 * Order for a permission key:
 *   1. owner → always allowed (cannot be locked out).
 *   2. no admin role → denied.
 *   3. unknown key → falls back to the call-site role (`callRole`, default owner).
 *   4. call site stricter than the registry default (e.g. owner-only settings groups passed as
 *      `role: "owner"` for `settings.update`) → the call-site role is a hard floor, no overrides.
 *   5. non-grantable key → registry default (owner) only; overrides ignored.
 *   6. per-user override (allow/deny) → role override → registry default role.
 */
import { hasRole, isAdminRole, type AdminRole } from "@/lib/auth/roles";

import {
  getPermissionDef,
  PERMISSION_KEYS,
  type PermissionKey,
} from "./registry";

export type PermissionOverrides = {
  /** Overrides for the user's role (`role_permissions`). */
  role: ReadonlyMap<string, boolean>;
  /** Overrides for the user (`user_permissions`). */
  user: ReadonlyMap<string, boolean>;
};

export const NO_OVERRIDES: PermissionOverrides = {
  role: new Map(),
  user: new Map(),
};

const RANK: Record<AdminRole, number> = { editor: 1, owner: 2 };

export function resolvePermission(opts: {
  role: AdminRole | null | undefined;
  key: string;
  overrides?: PermissionOverrides;
  /** Role passed at the call site (`adminAction({ role })`). */
  callRole?: AdminRole;
}): boolean {
  const { role, key, callRole } = opts;
  if (!isAdminRole(role)) return false;
  if (role === "owner") return true;
  const def = getPermissionDef(key);
  if (!def) return hasRole(role, callRole ?? "owner");
  if (callRole && RANK[callRole] > RANK[def.defaultRole])
    return hasRole(role, callRole);
  if (!def.grantable) return hasRole(role, def.defaultRole);
  const overrides = opts.overrides ?? NO_OVERRIDES;
  const user = overrides.user.get(key);
  if (user !== undefined) return user;
  const fromRole = overrides.role.get(key);
  if (fromRole !== undefined) return fromRole;
  return hasRole(role, def.defaultRole);
}

/** Every registry key the user currently has (for hiding/showing admin UI). */
export function effectivePermissions(
  role: AdminRole | null | undefined,
  overrides: PermissionOverrides = NO_OVERRIDES,
): PermissionKey[] {
  return PERMISSION_KEYS.filter((key) =>
    resolvePermission({ role, key, overrides }),
  );
}

/** Role-level value for the access matrix: override if set, else registry default. */
export function rolePermissionValue(
  role: AdminRole,
  key: PermissionKey,
  roleOverrides: ReadonlyMap<string, boolean>,
): boolean {
  return resolvePermission({
    role,
    key,
    overrides: { role: roleOverrides, user: new Map() },
  });
}
