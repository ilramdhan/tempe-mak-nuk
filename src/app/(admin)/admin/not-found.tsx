import Link from "next/link";

import { PageHeader } from "@/components/admin/shell/page-header";
import { Button } from "@/components/ui/button";

/** Admin 404 (e.g. a module not built yet, or a deleted record). */
export default function AdminNotFound() {
  return (
    <PageHeader
      title="Halaman admin ini tidak ada."
      description="Mungkin modulnya belum tersedia atau datanya sudah dihapus."
      actions={
        <Button asChild variant="secondary">
          <Link href="/admin">Kembali ke dasbor</Link>
        </Button>
      }
    />
  );
}
