import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_AFTER_LOGIN, sanitizeNextPath } from "@/lib/auth/next-path";
import { getClientEnv, isEnvValidationSkipped } from "@/lib/env";

type SessionClaims = Record<string, unknown> | null;

/** `/admin` and everything below it (not `/administrator`). */
export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

/**
 * Optimistic admin guard (P5.1): unauthenticated `/admin/**` → `/login?next=…`.
 * Signed-in users hitting `/login` are sent on to their `next` admin path.
 * Proxy checks are optimistic only (JWT claims, no DB role lookup) — every admin page
 * and Server Action re-verifies session + role via `requireRole()`.
 */
export function guardAdminRoute(
  request: NextRequest,
  claims: SessionClaims,
): NextResponse | null {
  const { pathname, search } = request.nextUrl;
  const signedIn = typeof claims?.sub === "string" && claims.sub.length > 0;

  if (isAdminPath(pathname) && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const next = sanitizeNextPath(`${pathname}${search}`, DEFAULT_AFTER_LOGIN);
    if (next !== DEFAULT_AFTER_LOGIN) url.searchParams.set("next", next);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && signedIn) {
    const url = request.nextUrl.clone();
    const next = sanitizeNextPath(
      request.nextUrl.searchParams.get("next"),
      DEFAULT_AFTER_LOGIN,
    );
    const target = new URL(next, url);
    return NextResponse.redirect(target);
  }

  return null;
}

/** Without Supabase env every admin route goes to the login page (which explains the state). */
function guardWithoutAuth(request: NextRequest): NextResponse | null {
  if (!isAdminPath(request.nextUrl.pathname)) return null;
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "?pesan=config";
  return NextResponse.redirect(url);
}

/** Refreshes the Supabase auth session cookies on every matched request. */
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse> {
  const env = getClientEnv();
  if (
    isEnvValidationSkipped() &&
    (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  ) {
    return guardWithoutAuth(request) ?? NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and getClaims(): it triggers the refresh.
  const { data } = await supabase.auth.getClaims();
  const claims = (data?.claims as SessionClaims | undefined) ?? null;

  const guarded = guardAdminRoute(request, claims);
  if (guarded) {
    // Carry refreshed auth cookies over to the guard's response.
    response.cookies.getAll().forEach((c) => guarded.cookies.set(c));
    return guarded;
  }

  return response;
}
