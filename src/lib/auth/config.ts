/**
 * Whether Supabase Auth is configured (public URL + anon key present).
 * Referenced literally so Next inlines the values in client bundles too.
 * Local dev without Supabase → false → login shows "Supabase belum dikonfigurasi".
 */
export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
