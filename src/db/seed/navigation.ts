import { sql } from "drizzle-orm";

import { announcements, navItems } from "../schema";
import { stableId, type Tx } from "./rich";

type Loc = (typeof navItems.$inferInsert)["location"];
type Item = [label: string, href: string];

const header: Item[] = [
  ["Produk", "/produk"],
  ["Custom Order", "/custom-order"],
  ["Cara Pesan", "/cara-pesan"],
  ["Kemitraan", "/kemitraan"],
  ["Jurnal", "/jurnal"],
  ["Resep", "/resep"],
  ["Tentang", "/tentang"],
];

const COLUMNS: Record<Loc, Item[]> = {
  header,
  // Kolom 1: Produk
  footer_col1: [
    ["Semua varian", "/produk"],
    ["Tempe Klasik", "/produk/tempe-klasik"],
    ["Tempe Original Tanpa Kulit", "/produk/tempe-original-tanpa-kulit"],
    ["Bentuk & ukuran custom", "/custom-order"],
  ],
  // Kolom 2: Belanja & Pesan
  footer_col2: [
    ["Custom Order", "/custom-order"],
    ["Cara pesan & PO", "/cara-pesan"],
    ["Kemitraan katering & reseller", "/kemitraan"],
    ["Kebijakan pemesanan", "/kebijakan-pemesanan"],
  ],
  // Kolom 3: Pelajari
  footer_col3: [
    ["Proses pembuatan", "/proses"],
    ["Manfaat tempe", "/manfaat-tempe"],
    ["Jurnal", "/jurnal"],
    ["Resep", "/resep"],
    ["FAQ", "/faq"],
  ],
  // Kolom 4: Perusahaan
  footer_col4: [
    ["Tentang Mak Nuk", "/tentang"],
    ["Halal & kualitas", "/halal-kualitas"],
    ["Kontak & alamat", "/kontak"],
  ],
  legal: [
    ["Kebijakan Privasi", "/kebijakan-privasi"],
    ["Syarat & Ketentuan", "/syarat-ketentuan"],
    ["Kebijakan Cookie", "/kebijakan-cookie"],
    ["Kebijakan Pemesanan", "/kebijakan-pemesanan"],
  ],
  social: [
    ["Instagram", "https://instagram.com/tempemaknuk"],
    ["TikTok", "https://tiktok.com/@tempemaknuk"],
    ["Facebook", "https://facebook.com/tempemaknuk"],
    ["YouTube", "https://youtube.com/@tempemaknuk"],
  ],
};

export async function seedNavigation(tx: Tx) {
  const rows = (Object.keys(COLUMNS) as Loc[]).flatMap((location) =>
    COLUMNS[location].map(([label, href], i) => ({
      id: stableId(`nav:${location}:${href}`),
      location,
      label,
      href,
      sort: i,
      visible: true,
    })),
  );
  await tx
    .insert(navItems)
    .values(rows)
    .onConflictDoUpdate({
      target: navItems.id,
      set: {
        location: sql`excluded.location`,
        label: sql`excluded.label`,
        href: sql`excluded.href`,
        sort: sql`excluded.sort`,
        updatedAt: sql`now()`,
      },
    });

  await tx
    .insert(announcements)
    .values({
      id: stableId("announcement:po-selasa"),
      text: "PO untuk Selasa ditutup Jumat 15.00 WIB — cek slot via WhatsApp.",
      href: "/cara-pesan",
      active: true,
    })
    .onConflictDoUpdate({
      target: announcements.id,
      set: {
        text: sql`excluded.text`,
        href: sql`excluded.href`,
        updatedAt: sql`now()`,
      },
    });
  return { nav: rows.length, announcements: 1 };
}
