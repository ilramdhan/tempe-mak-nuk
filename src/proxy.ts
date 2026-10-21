import { NextResponse, type NextRequest } from "next/server";

import { redirects } from "@/db/schema";
import { getDb } from "@/db/client";
import {
  buildRedirectMap,
  matchRedirect,
  type RedirectEntry,
} from "@/features/redirects/match";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Redirects from the DB. Proxy runs on every request, and "use cache" (getRedirects) is not
 * available here, so keep a short in-memory TTL cache per server instance (admin edits show up
 * within TTL). DB failure never blocks a request: serve stale rules or none.
 */
const TTL_MS = 60_000;
const FAIL_TTL_MS = 15_000;
let cache: { map: Map<string, RedirectEntry>; expires: number } | null = null;
let inflight: Promise<Map<string, RedirectEntry>> | null = null;

async function loadRedirects(): Promise<Map<string, RedirectEntry>> {
  const stale = cache?.map ?? new Map<string, RedirectEntry>();
  if (!process.env.DATABASE_URL) return stale;
  try {
    const rows = await getDb()
      .select({
        from: redirects.from,
        to: redirects.to,
        permanent: redirects.permanent,
      })
      .from(redirects);
    cache = { map: buildRedirectMap(rows), expires: Date.now() + TTL_MS };
  } catch {
    cache = { map: stale, expires: Date.now() + FAIL_TTL_MS };
  }
  return cache.map;
}

async function getRedirectMap(): Promise<Map<string, RedirectEntry>> {
  if (cache && cache.expires > Date.now()) return cache.map;
  inflight ??= loadRedirects().finally(() => {
    inflight = null;
  });
  return inflight;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (request.method === "GET" || request.method === "HEAD") {
    const hit = matchRedirect(await getRedirectMap(), pathname, search);
    if (hit) {
      return NextResponse.redirect(new URL(hit.to, request.url), hit.status);
    }
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip Next internals, Vercel internals, cron/API and static files.
    "/((?!_next/static|_next/image|_vercel|api/cron|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|txt|xml|woff2?|ttf|otf|mp4|webm)$).*)",
  ],
};
