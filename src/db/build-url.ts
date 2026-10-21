/**
 * Supabase's transaction pooler (port 6543) stalls when a connection gets a second query while
 * one is in flight, which is exactly what concurrent "use cache" prerender reads do. During
 * `next build` use the session pooler instead (same host, port 5432, IPv4), where queued
 * queries flow normally.
 */
export function buildDatabaseUrl(url: string): string {
  const u = new URL(url);
  if (u.hostname.endsWith(".pooler.supabase.com") && u.port === "6543")
    u.port = "5432";
  return u.toString();
}
