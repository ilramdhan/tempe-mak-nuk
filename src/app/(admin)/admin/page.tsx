import type { Metadata } from "next";

import { PageHeader } from "@/components/admin/shell";

export const metadata: Metadata = { title: "Dasbor" };

/** Placeholder (P5.1). P5.2 owns this file and replaces it with the real dashboard. */
export default function AdminDashboardPage() {
  return (
    <PageHeader
      title="Dasbor"
      description="Ringkasan slot minggu ini, klik WhatsApp, dan konten draft akan tampil di sini."
    />
  );
}
