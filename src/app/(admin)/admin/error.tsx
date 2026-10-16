"use client";

import { useEffect } from "react";

import { PageHeader } from "@/components/admin/shell/page-header";
import { Button } from "@/components/ui/button";

/** Admin segment error boundary (renders inside the admin shell). */
export default function AdminError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div>
      <PageHeader
        title="Ada yang salah di sisi kami."
        description="Halaman ini gagal dimuat. Coba muat ulang; bila masih gagal, catat waktunya dan hubungi pengembang."
        actions={<Button onClick={() => retry()}>Coba lagi</Button>}
      />
    </div>
  );
}
