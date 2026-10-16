import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getClientEnv, isEnvValidationSkipped } from "@/lib/env";

type SessionClaims = Record<string, unknown> | null;

/**
 * HOOK POINT for P5.1 (admin route guard).
 * Return a NextResponse (e.g. redirect to /admin/login) to short-circuit, or
 * `null` to continue. Currently a no-op: this proxy only refreshes the session.
 * Remember: proxy checks are optimistic only — every Server Action / admin page
 * must re-verify session + role.
 */
export function guardAdminRoute(
  request: NextRequest,
  claims: SessionClaims,
): NextResponse | null {
  void request;
  void claims;
  return null;
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
    return NextResponse.next({ request });
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
