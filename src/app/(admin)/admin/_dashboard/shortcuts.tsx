import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LINKS = [
  { href: "/admin/slot", label: "Atur slot & PO" },
  { href: "/admin/jurnal", label: "Tulis artikel" },
  { href: "/admin/resep", label: "Tambah resep" },
  { href: "/admin/produk", label: "Kelola produk" },
  { href: "/admin/testimoni", label: "Testimoni" },
  { href: "/admin/pengaturan", label: "Pengaturan" },
];

export function ShortcutsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pintasan cepat</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block rounded-md border px-3 py-2 text-sm font-medium hover:bg-surface"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
