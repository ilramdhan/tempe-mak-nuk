import { sql } from "drizzle-orm";

import { settings } from "../schema";
import { SETTINGS_KEYS, type SettingKey } from "../schema/settings";
import type { Tx } from "./rich";

/**
 * Values come from docs/business.md (ALL DUMMY — owner edits via Admin -> Pengaturan).
 * Typed as Record<SettingKey, unknown> so a missing key fails typecheck.
 */
const VALUES: Record<SettingKey, unknown> = {
  "business.name": "Tempe Mak Nuk",
  "business.legalName": "Usaha Tempe Mak Nuk",
  "business.foundedYear": 2001,
  "business.owner": "Ibu Nuk (Mak Nuk)",
  "contact.whatsapp": "6281234567890",
  "contact.whatsappDisplay": "+62 812-3456-7890",
  "contact.email": "halo@tempemaknuk.com",
  "contact.phone": "+62 272 000 000",
  "address.street": "Jl. Raya Pedan No. 21, Dk. Kauman",
  "address.village": "Desa Kalangan",
  "address.district": "Kec. Pedan",
  "address.city": "Kabupaten Klaten",
  "address.province": "Jawa Tengah",
  "address.postalCode": "57468",
  "address.country": "ID",
  "geo.lat": -7.7023,
  "geo.lng": 110.6894,
  "maps.url": "https://maps.google.com/?q=-7.7023,110.6894",
  "maps.embedUrl":
    "https://www.google.com/maps?q=-7.7023,110.6894&output=embed",
  "halal.number": "ID33110012345670124",
  "halal.issuer": "BPJPH Kementerian Agama RI",
  "halal.issuedAt": "2024-03-12",
  "halal.verifyUrl": "https://bpjph.halal.go.id/search/sertifikat",
  "legal.nib": "1234567890123",
  "legal.pirt": "2063310010123-29",
  hours: {
    summary:
      "Sen–Sab 06.00–16.00 WIB · Minggu & libur nasional: produksi libur (chat tetap dibalas)",
    days: [
      { day: 1, open: "06:00", close: "16:00" },
      { day: 2, open: "06:00", close: "16:00" },
      { day: 3, open: "06:00", close: "16:00" },
      { day: 4, open: "06:00", close: "16:00" },
      { day: 5, open: "06:00", close: "16:00" },
      { day: 6, open: "06:00", close: "16:00" },
    ],
  },
  "order.leadDays": 4,
  "order.cutoffTime": "15:00",
  "order.slotsPerDay": 8,
  "order.nearlyFullThreshold": 2,
  "order.closedWeekdays": [0],
  "pricing.show": true,
  "delivery.areas": [
    "Ambil di tempat (gratis)",
    "Klaten kota (antar, ongkir flat)",
    "Solo Raya & Yogyakarta (kurir instan, ongkir sesuai aplikasi)",
  ],
  "payment.methods": ["Transfer bank", "QRIS", "Tunai saat ambil"],
  "social.instagram": "https://instagram.com/tempemaknuk",
  "social.tiktok": "https://tiktok.com/@tempemaknuk",
  "social.facebook": "https://facebook.com/tempemaknuk",
  "social.youtube": "https://youtube.com/@tempemaknuk",
  "social.googleBusiness": "https://g.page/tempemaknuk",
  "site.url": "https://tempemaknuk.com",
  "site.locale": "id-ID",
  "seo.defaultTitle": "Tempe Klaten Handmade Sejak 2001 — Tempe Mak Nuk",
  "seo.titleTemplate": "%s — Tempe Mak Nuk",
  "seo.defaultDescription":
    "Tempe handmade dari Klaten sejak 2001. Tanpa pengawet, bersertifikat halal, bisa custom bentuk tanpa minimum order. Cek slot dan PO via WhatsApp.",
  "seo.defaultOgImageId": "",
  "cta.primaryLabel": "Cek slot via WhatsApp",
  "cta.primaryHref": "/custom-order",
  "cta.waFloatEnabled": true,
  "cta.waFloatMessage":
    "Halo Mak Nuk, saya ingin cek slot dan PO tempe. Mohon infonya ya.",
  "consent.config": {
    version: 1,
    bannerText:
      "Kami memakai cookie wajib agar situs berjalan, dan cookie opsional untuk memahami cara situs dipakai. Anda yang menentukan. Pilihan bisa diubah kapan saja lewat “Pengaturan cookie” di bagian bawah halaman.",
    categories: [
      {
        key: "necessary",
        label: "Wajib",
        description:
          "Diperlukan agar situs berfungsi: menyimpan pilihan cookie, draft pesanan, dan keamanan. Selalu aktif.",
        required: true,
      },
      {
        key: "analytics",
        label: "Analitik",
        description:
          "Membantu kami melihat halaman mana yang dibaca dan di mana pengunjung kesulitan. Data bersifat agregat. Hanya aktif jika Anda setuju.",
        required: false,
      },
      {
        key: "marketing",
        label: "Pemasaran",
        description:
          "Dipakai untuk mengukur iklan dan menampilkan konten yang relevan di platform lain. Hanya aktif jika Anda setuju.",
        required: false,
      },
    ],
  },
};

export async function seedSettings(tx: Tx) {
  const rows = (Object.keys(SETTINGS_KEYS) as SettingKey[]).map((key) => ({
    key,
    value: VALUES[key],
    group: SETTINGS_KEYS[key].group,
  }));
  await tx
    .insert(settings)
    .values(rows)
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        value: sql`excluded.value`,
        group: sql`excluded."group"`,
        updatedAt: sql`now()`,
      },
    });
  return rows.length;
}
