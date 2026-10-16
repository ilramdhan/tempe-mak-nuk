"use client";

import type { ReactNode } from "react";

import type { AdminRole } from "@/lib/auth/roles";

import { useHasRole } from "./user-context";

/**
 * Show children only if the current admin has `role` (owner ⊇ editor).
 * UI convenience only — the page/action must still call `requireRole()` server-side.
 * Works in Server Components too (as a client boundary) inside the admin layout.
 */
export function RoleGate({
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
