"use client";

import type { ReactNode } from "react";

import type { PermissionKey } from "@/features/permissions/registry";
import type { AdminRole } from "@/lib/auth/roles";

import { useCan, useHasRole } from "./user-context";

type RoleGateProps = {
  children: ReactNode;
  fallback?: ReactNode;
} & (
  | { role: AdminRole; permission?: never }
  | { permission: PermissionKey; role?: never }
);

/**
 * Show children only if the current admin has `role` (owner ⊇ editor) or the effective
 * `permission` (dynamic RBAC, P8.14 — prefer this for actions mapped to a permission key).
 * UI convenience only — the page/action must still check server-side.
 * Works in Server Components too (as a client boundary) inside the admin layout.
 */
export function RoleGate(props: RoleGateProps) {
  return props.permission ? (
    <PermissionGate {...props} permission={props.permission} />
  ) : (
    <RoleOnlyGate {...props} role={props.role!} />
  );
}

function PermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: PermissionKey;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return useCan(permission) ? children : fallback;
}

function RoleOnlyGate({
  role,
  children,
  fallback = null,
}: {
  role: AdminRole;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return useHasRole(role) ? children : fallback;
}
