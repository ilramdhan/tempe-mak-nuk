/**
 * Block registry for the admin page builder (P5.3): Indonesian labels, descriptions and
 * default data per block type. Client-safe (no renderers / server imports here).
 */
import { BLOCK_SCHEMAS, type BlockInputMap, type BlockType } from "./schema";

export type BlockCategory = "pembuka" | "konten" | "data" | "ajakan";

export type BlockDefinition<K extends BlockType = BlockType> = {
  type: K;
  label: string;
  description: string;
  category: BlockCategory;
  /** Valid default data (passes BLOCK_SCHEMAS[type]). */
  defaults: BlockInputMap[K];
};

const WA = { label: "Cek slot via WhatsApp", href: "/custom-order" };

const DEFS: { [K in BlockType]: Omit<BlockDefinition<K>, "type"> } = {
  hero: {
    label: "Hero",
    description: "Pembuka halaman: judul besar, subjudul, tombol, dan gambar.",
    category: "pembuka",
    defaults: { eyebrow: "Tempe handmade · Klaten", headline: "Judul halaman", subheadline: "Kalimat pendukung singkat.", primaryCta: WA, secondaryCta: null, image: null, layout: "split" },
  },
  richText: {
    label: "Teks bebas",
    description: "Paragraf, subjudul, daftar, kutipan, dan tautan (editor teks).",
    category: "konten",
    defaults: { content: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Tulis teks di sini." }] }] }, width: "prose" },
  },
  featureGrid: {
    label: "Grid keunggulan",
    description: "2–12 poin dengan ikon, judul, dan penjelasan singkat.",
    category: "konten",
    defaults: {
      heading: "Kenapa Mak Nuk",
      items: [
        { icon: "hand", title: "Dibuat dengan tangan", body: "Penjelasan singkat." },
        { icon: "leaf", title: "Tanpa pengawet", body: "Penjelasan singkat." },
        { icon: "badge-check", title: "Halal", body: "Penjelasan singkat." },
      ],
    },
  },
  compare: {
    label: "Tabel perbandingan",
    description: "Bandingkan varian atau aturan dalam tabel kolom × baris.",
    category: "konten",
    defaults: {
      heading: "Perbandingan",
      columns: ["Varian A", "Varian B"],
      rows: [{ label: "Tekstur", values: ["…", "…"] }],
    },
  },
  steps: {
    label: "Langkah / proses",
    description: "Urutan bernomor: cara pesan, proses pembuatan.",
    category: "konten",
    defaults: {
      heading: "Cara pesan",
      items: [
        { title: "Susun pesanan", body: "…" },
        { title: "Kirim ke WhatsApp", body: "…" },
        { title: "Konfirmasi slot", body: "…" },
      ],
      cta: null,
    },
  },
  stats: {
    label: "Angka / statistik",
    description: "Angka penting (gizi, tahun berdiri) dengan sumber.",
    category: "konten",
    defaults: { heading: "Dalam angka", items: [{ value: "2001", unit: null, label: "Mulai membuat tempe" }], source: null },
  },
  cta: {
    label: "Ajakan (CTA)",
    description: "Pita penutup berwarna dengan judul dan tombol.",
    category: "ajakan",
    defaults: { headline: "Monggo, pilih tanggalnya.", body: "Chat dulu untuk cek slot.", primary: WA, secondary: { label: "Cara pesan", href: "/cara-pesan" } },
  },
  faqList: {
    label: "Daftar FAQ",
    description: "FAQ dari menu FAQ: pilihan beranda, satu kategori, atau semua.",
    category: "data",
    defaults: { heading: "Pertanyaan singkat", source: "home", category: null, cta: { label: "Semua FAQ", href: "/faq" } },
  },
  testimonialList: {
    label: "Testimoni",
    description: "Kutipan pelanggan dari menu Testimoni.",
    category: "data",
    defaults: { heading: "Kata pelanggan", limit: 3 },
  },
  gallery: {
    label: "Galeri foto",
    description: "Grid foto dari Media, dengan keterangan opsional.",
    category: "konten",
    defaults: { heading: "Galeri", items: [], note: "Foto menyusul.", columns: 3 },
  },
  productTeaser: {
    label: "Kartu produk",
    description: "Tampilkan varian produk aktif (semua atau pilihan).",
    category: "data",
    defaults: { heading: "Dua varian, satu cara membuat", productSlugs: null, ctaLabel: "Lihat detail" },
  },
  slotCalendarPreview: {
    label: "Kalender slot",
    description: "Status slot beberapa hari ke depan (Tersedia / Hampir penuh / Penuh / Libur).",
    category: "data",
    defaults: { heading: "Cek slot", intro: "Status diperbarui manual. Konfirmasi akhir via WhatsApp.", days: 14, cta: WA },
  },
  recipeTeaser: {
    label: "Resep pilihan",
    description: "Kartu resep terbaru atau pilihan.",
    category: "data",
    defaults: { heading: "Resep pilihan", limit: 3, cta: { label: "Lihat semua resep", href: "/resep" } },
  },
  postTeaser: {
    label: "Artikel jurnal",
    description: "Kartu artikel terbaru, per kategori, atau pilihan.",
    category: "data",
    defaults: { heading: "Dari Jurnal", limit: 3, cta: { label: "Baca selengkapnya", href: "/jurnal" } },
  },
  trustStrip: {
    label: "Pita kepercayaan",
    description: "Baris pendek poin kepercayaan (halal, sejak 2001, …).",
    category: "pembuka",
    defaults: {
      items: [
        { icon: "badge-check", label: "Bersertifikat Halal" },
        { icon: "calendar", label: "Sejak 2001" },
        { icon: "leaf", label: "Tanpa pengawet" },
      ],
    },
  },
  logoStrip: {
    label: "Logo mitra",
    description: "Deretan logo/nama mitra atau liputan media.",
    category: "konten",
    defaults: { heading: "Dipercaya oleh", items: [{ mediaId: null, label: "Nama mitra", href: null }] },
  },
  split: {
    label: "Gambar + teks",
    description: "Dua kolom: teks (dengan data dari Pengaturan) dan gambar atau peta.",
    category: "konten",
    defaults: {
      heading: "Judul",
      body: "Teks pendek.",
      facts: [],
      cta: null,
      image: null,
      imagePosition: "right",
      map: false,
    },
  },
};

export const BLOCK_REGISTRY: { [K in BlockType]: BlockDefinition<K> } = Object.fromEntries(
  Object.entries(DEFS).map(([type, def]) => [type, { type, ...def }]),
) as { [K in BlockType]: BlockDefinition<K> };

export const BLOCK_LIST: BlockDefinition[] = Object.values(BLOCK_REGISTRY) as BlockDefinition[];

export const BLOCK_CATEGORY_LABEL: Record<BlockCategory, string> = {
  pembuka: "Pembuka",
  konten: "Konten",
  data: "Data otomatis",
  ajakan: "Ajakan",
};

/** Fresh, validated default data for a new block of `type`. */
export function getBlockDefaults<K extends BlockType>(type: K): BlockInputMap[K] {
  return structuredClone(BLOCK_REGISTRY[type].defaults);
}

export { BLOCK_SCHEMAS };
