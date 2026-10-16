import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";

import { getDb } from "@/db/client";
import { profiles } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

import { isAuthConfigured } from "./config";
import { loginPathFor } from "./next-path";
import { hasRole, isAdminRole, type AdminRole } from "./roles";

export { hasRole, type AdminRole } from "./roles";

export type SessionUser = {
  id: string;
  email: string | null;
  role: AdminRole;
  displayName: string | null;
};

export class AuthError extends Error {
  constructor(
    public readonly reason: "unauthenticated" | "forbidden",
    message = reason === "unauthenticated"
      ? "Silakan masuk terlebih dahulu."
      : "Anda tidak memiliki akses.",
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type AuthState =
  | { status: "unconfigured" }
  | { status: "anonymous" }
  /** Signed in to Supabase, but no admin profile/role (e.g. profile row deleted). */
  | { status: "no-access"; userId: string; email: string | null }
  | { status: "ok"; user: SessionUser };

/**
 * Full auth state for the current request (deduped per request via React `cache`).
 * Uses `getClaims()` (verifies the JWT) — never trust `getSession()` on the server.
 * Role comes from `profiles` in the DB, not from the JWT. Reads cookies → request-time only;
 * never call inside "use cache".
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
  if (!isAuthConfigured()) return { status: "unconfigured" };
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return { status: "anonymous" };
  const email = typeof claims.email === "string" ? claims.email : null;

  const [profile] = await getDb()
    .select({ role: profiles.role, displayName: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.id, claims.sub))
    .limit(1);
  if (!profile || !isAdminRole(profile.role)) {
    return { status: "no-access", userId: claims.sub, email };
  }
  return {
    status: "ok",
    user: {
      id: claims.sub,
      email,
      role: profile.role,
      displayName: profile.displayName,
    },
  };
});

/** Current admin user, or null (not signed in / no admin profile / auth not configured). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const state = await getAuthState();
  return state.status === "ok" ? state.user : null;
}

export type RequireRoleOptions = {
  /**
   * "throw" (default, for Server Actions): throws AuthError.
   * "redirect" (for admin pages/layouts): unauthenticated → `/login?next=…`,
   * signed in without enough role → `/akses-ditolak`.
   */
  onFail?: "throw" | "redirect";
  /** Admin path to return to after login (redirect mode). Sanitised to `/admin*`. */
  next?: string;
};

/**
 * Guard for every admin Server Action and admin page. Checks session + role in DB.
 * The proxy check is only optimistic — this is the authoritative check.
 */
export async function requireRole(
  required: AdminRole = "editor",
  options: RequireRoleOptions = {},
): Promise<SessionUser> {
  const state = await getAuthState();
  if (state.status === "ok" && hasRole(state.user.role, required)) {
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
