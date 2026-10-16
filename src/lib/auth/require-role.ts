import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/db/client";
import { profiles, type UserRole } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";

export type AdminRole = UserRole; // "owner" | "editor"

export type SessionUser = {
  id: string;
  email: string | null;
  role: AdminRole;
  displayName: string | null;
};

/** Role hierarchy: owner can do everything an editor can. */
const RANK: Record<AdminRole, number> = { editor: 1, owner: 2 };

export function hasRole(role: AdminRole, required: AdminRole): boolean {
  return RANK[role] >= RANK[required];
}

export class AuthError extends Error {
  constructor(
    public readonly reason: "unauthenticated" | "forbidden",
    message = reason === "unauthenticated" ? "Silakan masuk terlebih dahulu." : "Anda tidak memiliki akses.",
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Current admin user, or null (not signed in / no profile / auth not configured).
 * Uses `getClaims()` (verifies the JWT signature) — never trust `getSession()` on the server.
 * Reads cookies → request-time only; never call inside "use cache".
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return null;
  const [profile] = await getDb()
    .select({ role: profiles.role, displayName: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.id, claims.sub))
    .limit(1);
  if (!profile) return null;
  return {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : null,
    role: profile.role,
    displayName: profile.displayName,
  };
}

export type RequireRoleOptions = {
  /**
   * "throw" (default, for Server Actions): throws AuthError.
   * "redirect" (for admin pages/layouts): redirects to `/admin/login?next=…`.
   */
  onFail?: "throw" | "redirect";
  /** Path to return to after login (redirect mode). */
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
  const user = await getSessionUser();
  if (user && hasRole(user.role, required)) return user;
  if (options.onFail === "redirect") {
    if (!user) {
      const next = options.next && options.next.startsWith("/") ? `?next=${encodeURIComponent(options.next)}` : "";
      redirect(`/admin/login${next}`);
    }
    redirect("/admin?forbidden=1");
  }
  throw new AuthError(user ? "forbidden" : "unauthenticated");
}
