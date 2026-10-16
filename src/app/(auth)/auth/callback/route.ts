import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { isAuthConfigured } from "@/lib/auth/config";
import { DEFAULT_AFTER_LOGIN, sanitizeNextPath } from "@/lib/auth/next-path";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES = new Set<EmailOtpType>([
  "magiclink",
  "email",
  "invite",
  "recovery",
]);

/**
 * Magic-link / invite landing.
 * - PKCE: `?code=…` → exchangeCodeForSession (verifier cookie set by sendMagicLink).
 * - Token hash (custom email template `{{ .TokenHash }}`): `?token_hash=…&type=…` → verifyOtp.
 * Always redirects; `next` is sanitised to `/admin*`.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = sanitizeNextPath(searchParams.get("next"), DEFAULT_AFTER_LOGIN);
  const fail = (code: string) =>
    NextResponse.redirect(new URL(`/login?pesan=${code}`, request.url));

  if (!isAuthConfigured()) return fail("config");

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
    if (error)
      console.warn("[auth] code exchange failed:", error.code ?? error.status);
  } else if (tokenHash && type && OTP_TYPES.has(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    ok = !error;
    if (error)
      console.warn("[auth] verifyOtp failed:", error.code ?? error.status);
  }

  if (!ok) return fail("link");
  return NextResponse.redirect(new URL(next, request.url));
}
