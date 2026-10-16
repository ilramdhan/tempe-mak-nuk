"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { isAuthConfigured } from "./config";
import { AUTH_MESSAGES, authErrorMessage, classifyAuthError } from "./messages";
import { DEFAULT_AFTER_LOGIN, sanitizeNextPath } from "./next-path";
import { magicLinkSchema, passwordLoginSchema } from "./schema";

/** Result for login forms. Success of password login redirects instead of returning. */
export type AuthActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function invalidInput(
  issues: { path: PropertyKey[]; message: string }[],
): AuthActionResult {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return {
    ok: false,
    error: "Periksa kembali isian yang ditandai.",
    fieldErrors,
  };
}

/** Public origin for auth email links: NEXT_PUBLIC_SITE_URL, else the request's own host. */
async function requestOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Email + password sign-in. On success redirects to the sanitised `next` admin path. */
export async function signInWithPassword(
  input: unknown,
): Promise<AuthActionResult> {
  if (!isAuthConfigured())
    return { ok: false, error: AUTH_MESSAGES.notConfigured };
  const parsed = passwordLoginSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error.issues);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) {
    if (classifyAuthError(error) !== "invalid_credentials") {
      console.warn(
        "[auth] password sign-in failed:",
        error.code ?? error.status,
        error.message,
      );
    }
    return { ok: false, error: authErrorMessage(error) };
  }
  redirect(sanitizeNextPath(parsed.data.next, DEFAULT_AFTER_LOGIN));
}

/**
 * Magic link. `shouldCreateUser: false` → no public sign-up. The response is identical whether or
 * not the email exists (no user enumeration); only rate-limit / network errors are surfaced.
 */
export async function sendMagicLink(input: unknown): Promise<AuthActionResult> {
  if (!isAuthConfigured())
    return { ok: false, error: AUTH_MESSAGES.notConfigured };
  const parsed = magicLinkSchema.safeParse(input);
  if (!parsed.success) return invalidInput(parsed.error.issues);

  const next = sanitizeNextPath(parsed.data.next, DEFAULT_AFTER_LOGIN);
  const callback = new URL("/auth/callback", await requestOrigin());
  callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: false, emailRedirectTo: callback.toString() },
  });
  if (error) {
    const kind = classifyAuthError(error);
    if (kind === "rate_limited" || kind === "network") {
      return { ok: false, error: authErrorMessage(error) };
    }
    // Unknown email / signups disabled etc. → same answer as success.
    console.warn("[auth] magic link not sent:", error.code ?? error.status);
  }
  return { ok: true, message: AUTH_MESSAGES.magicLinkSent };
}

/** Sign out of this device and go back to the login page. */
export async function signOut(): Promise<never> {
  if (isAuthConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error)
      console.warn("[auth] sign-out error:", error.code ?? error.status);
  }
  redirect("/login?pesan=keluar");
}
