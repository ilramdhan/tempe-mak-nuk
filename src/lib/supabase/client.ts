import { createBrowserClient } from "@supabase/ssr";

import { getClientEnv } from "@/lib/env";

/** Supabase client for Client Components (anon key, cookie-based session). */
export function createClient() {
  const env = getClientEnv();
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
