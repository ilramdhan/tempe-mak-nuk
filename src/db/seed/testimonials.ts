import { sql } from "drizzle-orm";

import { testimonials } from "../schema";
import { stableId, type Tx } from "./rich";

/** PLACEHOLDERS ONLY. Replace with real, consented testimonials; never present these as genuine. */
const ROWS = [
  {
    name: "Ibu R.",
    role: "Ibu rumah tangga",
    city: "Klaten",
    quote:
      "[PLACEHOLDER] Tempe-nya bersih dan teksturnya lembut. Ulasan asli pelanggan akan menggantikan teks ini.",
  },
  {
    name: "Pak S.",
    role: "Pemilik warung makan",
    city: "Solo",
    quote:
      "[PLACEHOLDER] Ukurannya seragam, jadi mudah dihitung untuk dagangan. Ulasan asli akan menggantikan teks ini.",
  },
  {
    name: "Ibu D.",
    role: "Ibu MPASI",
    city: "Yogyakarta",
    quote:
      "[PLACEHOLDER] Varian tanpa kulitnya nyaman diolah. Ulasan asli akan menggantikan teks ini.",
  },
  {
    name: "Katering A.",
    role: "Katering",
    city: "Sukoharjo",
    quote:
      "[PLACEHOLDER] Pesanan datang tepat jadwal. Ulasan asli akan menggantikan teks ini.",
  },
];

export async function seedTestimonials(tx: Tx) {
  const rows = ROWS.map((r, sort) => ({
    id: stableId(`testimonial:${r.name}:${r.city}`),
    ...r,
    rating: null,
    verified: false,
    isPlaceholder: true,
    visible: true,
    sort,
  }));
  await tx
    .insert(testimonials)
    .values(rows)
    .onConflictDoUpdate({
      target: testimonials.id,
      set: {
        quote: sql`excluded.quote`,
        role: sql`excluded.role`,
        city: sql`excluded.city`,
        sort: sql`excluded.sort`,
        updatedAt: sql`now()`,
      },
    });
  return rows.length;
}
