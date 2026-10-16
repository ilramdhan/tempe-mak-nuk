import { TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/** Shown instead of the form when NEXT_PUBLIC_SUPABASE_URL / ANON_KEY are missing. */
export function NotConfigured() {
  return (
    <Alert>
      <TriangleAlert aria-hidden="true" />
      <AlertTitle>Supabase belum dikonfigurasi</AlertTitle>
      <AlertDescription>
        <p>
          Login admin butuh Supabase Auth. Isi{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di <code>.env.local</code>{" "}
          (lihat <code>.env.example</code>), lalu jalankan ulang server.
        </p>
      </AlertDescription>
    </Alert>
  );
}
