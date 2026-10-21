import { SETTINGS_KEYS, type SettingKey } from "@/db/schema/settings";
import { settingSchemas, type Settings } from "@/features/settings/schema";

export type FieldKind =
  | "text"
  | "textarea"
  | "url"
  | "email"
  | "phone"
  | "date"
  | "time"
  | "int"
  | "number"
  | "boolean"
  | "lines"
  | "ints"
  | "hours"
  | "json"
  | "media";

export type FieldDef = {
  key: SettingKey;
  label: string;
  kind: FieldKind;
  hint?: string;
  placeholder?: string;
};

export type TabDef = {
  id: string;
  label: string;
  description: string;
  /** Server requires owner for any key in these groups (mirrors features/settings/actions.ts). */
  ownerOnly: boolean;
  sections: { title?: string; fields: FieldDef[] }[];
};

const f = (key: SettingKey, label: string, kind: FieldKind, extra: Partial<FieldDef> = {}): FieldDef => ({
  key,
  label,
  kind,
  ...extra,
});

export const TABS: TabDef[] = [
  {
    id: "bisnis",
    label: "Bisnis",
    description: "Identitas usaha, alamat, lokasi, dan jam operasional.",
    ownerOnly: true,
    sections: [
      {
        title: "Identitas",
        fields: [
          f("business.name", "Nama usaha", "text"),
          f("business.legalName", "Nama badan usaha", "text"),
          f("business.foundedYear", "Tahun berdiri", "int"),
          f("business.owner", "Pemilik / pendiri", "text"),
          f("legal.nib", "NIB", "text"),
          f("legal.pirt", "No. PIRT", "text"),
        ],
      },
      {
        title: "Alamat",
        fields: [
          f("address.street", "Jalan", "text"),
          f("address.village", "Desa / kelurahan", "text"),
          f("address.district", "Kecamatan", "text"),
          f("address.city", "Kota / kabupaten", "text"),
          f("address.province", "Provinsi", "text"),
          f("address.postalCode", "Kode pos", "text"),
          f("address.country", "Negara (kode 2 huruf)", "text", { placeholder: "ID" }),
        ],
      },
      {
        title: "Lokasi & peta",
        fields: [
          f("geo.lat", "Lintang (lat)", "number", { hint: "-90 sampai 90" }),
          f("geo.lng", "Bujur (lng)", "number", { hint: "-180 sampai 180" }),
          f("maps.url", "Tautan Google Maps", "url"),
          f("maps.embedUrl", "Tautan embed peta", "url"),
        ],
      },
      { title: "Jam operasional", fields: [f("hours", "Ringkasan jam buka", "hours")] },
    ],
  },
  {
    id: "kontak",
    label: "Kontak",
    description: "Kontak yang tampil di situs dan dipakai tombol WhatsApp.",
    ownerOnly: false,
    sections: [
      {
        fields: [
          f("contact.whatsapp", "Nomor WhatsApp (wa.me)", "phone", {
            hint: "Format internasional tanpa +, mis. 6281234567890. Awalan 0 diubah ke 62.",
          }),
          f("contact.whatsappDisplay", "Tampilan nomor WhatsApp", "text", { placeholder: "+62 812-3456-7890" }),
          f("contact.email", "Email", "email"),
          f("contact.phone", "Telepon", "text"),
        ],
      },
    ],
  },
  {
    id: "sosial",
    label: "Sosial",
    description: "Tautan media sosial (kosongkan bila tidak ada).",
    ownerOnly: false,
    sections: [
      {
        fields: [
          f("social.instagram", "Instagram", "url"),
          f("social.tiktok", "TikTok", "url"),
          f("social.facebook", "Facebook", "url"),
          f("social.youtube", "YouTube", "url"),
          f("social.googleBusiness", "Google Business", "url"),
        ],
      },
    ],
  },
  {
    id: "halal",
    label: "Halal",
    description: "Data sertifikat halal yang tampil di halaman Halal & footer.",
    ownerOnly: true,
    sections: [
      {
        fields: [
          f("halal.number", "Nomor sertifikat", "text"),
          f("halal.issuer", "Penerbit", "text"),
          f("halal.issuedAt", "Tanggal terbit", "date"),
          f("halal.verifyUrl", "Tautan verifikasi", "url"),
        ],
      },
    ],
  },
  {
    id: "po",
    label: "PO & pengiriman",
    description: "Aturan pre-order, harga, area antar, dan pembayaran.",
    ownerOnly: true,
    sections: [
      {
        title: "Aturan pemesanan",
        fields: [
          f("order.leadDays", "Lead time (hari)", "int", { hint: "0–60" }),
          f("order.cutoffTime", "Jam cutoff (WIB)", "time"),
          f("order.slotsPerDay", "Kapasitas default per hari", "int"),
          f("order.nearlyFullThreshold", "Hampir penuh bila sisa ≤", "int"),
          f("order.closedWeekdays", "Hari libur rutin", "ints", {
            hint: "Angka dipisah koma: 0=Minggu, 1=Senin … 6=Sabtu.",
            placeholder: "0",
          }),
        ],
      },
      {
        title: "Harga, antar, pembayaran",
        fields: [
          f("pricing.show", "Tampilkan harga (mode \"mulai dari\")", "boolean"),
          f("delivery.areas", "Area pengantaran", "lines", { hint: "Satu area per baris." }),
          f("payment.methods", "Metode pembayaran", "lines", { hint: "Satu metode per baris." }),
        ],
      },
    ],
  },
  {
    id: "seo",
    label: "SEO & situs",
    description: "Default metadata, URL situs, dan tombol ajakan (CTA).",
    ownerOnly: true,
    sections: [
      {
        title: "Situs",
        fields: [
          f("site.url", "URL situs", "url", { placeholder: "https://tempemaknuk.com" }),
          f("site.locale", "Locale", "text", { placeholder: "id-ID" }),
        ],
      },
      {
        title: "SEO default",
        fields: [
          f("seo.defaultTitle", "Judul default", "text"),
          f("seo.titleTemplate", "Template judul", "text", { hint: "%s diganti judul halaman." }),
          f("seo.defaultDescription", "Deskripsi default", "textarea", { hint: "Idealnya ≤ 160 karakter." }),
          f("seo.defaultOgImageId", "Gambar OG default", "media", { hint: "Dipakai saat halaman tidak punya gambar berbagi sendiri." }),
        ],
      },
      {
        title: "CTA",
        fields: [
          f("cta.primaryLabel", "Label CTA utama", "text"),
          f("cta.primaryHref", "Tautan CTA utama", "text", { placeholder: "/custom-order" }),
          f("cta.waFloatEnabled", "Tombol WhatsApp melayang", "boolean"),
          f("cta.waFloatMessage", "Pesan awal WhatsApp melayang", "textarea"),
        ],
      },
    ],
  },
  {
    id: "cookie",
    label: "Cookie",
    description: "Konfigurasi banner persetujuan cookie (JSON). Naikkan version agar pengunjung diminta ulang.",
    ownerOnly: true,
    sections: [{ fields: [f("consent.config", "Konfigurasi consent", "json")] }],
  },
];

/** Every settings key is covered by exactly one field. */
export const ALL_FIELD_KEYS = TABS.flatMap((t) => t.sections.flatMap((s) => s.fields.map((x) => x.key)));

/** Draft (string/boolean) representation of a value. */
export type Draft = string | boolean;

export function toDraft(def: FieldDef, value: unknown): Draft {
  switch (def.kind) {
    case "boolean":
      return value === true;
    case "lines":
      return Array.isArray(value) ? value.join("\n") : "";
    case "ints":
      return Array.isArray(value) ? value.join(", ") : "";
    case "hours":
      return (value as { summary?: string } | null)?.summary ?? "";
    case "json":
      return JSON.stringify(value, null, 2);
    default:
      return value === null || value === undefined ? "" : String(value);
  }
}

/** Normalise "0812…" / "+62 812…" to "62812…". */
export function normalizePhone(v: string): string {
  const d = v.replace(/[^\d]/g, "");
  if (d.startsWith("0")) return `62${d.slice(1)}`;
  return d;
}

const KIND_MESSAGE: Partial<Record<FieldKind, string>> = {
  url: "Harus URL lengkap diawali http:// atau https://.",
  email: "Format email tidak valid.",
  phone: "Hanya angka format internasional, mis. 6281234567890.",
  date: "Format tanggal YYYY-MM-DD.",
  time: "Format jam HH:mm.",
  int: "Isi bilangan bulat yang valid.",
  number: "Isi angka yang valid.",
  ints: "Isi angka 0–6 dipisah koma.",
  json: "JSON tidak valid.",
};

export type ParseResult = { ok: true; value: unknown } | { ok: false; message: string };

/** Draft → validated value using the shared Zod schema (messages in Indonesian). */
export function parseDraft(def: FieldDef, draft: Draft, current: Settings): ParseResult {
  let raw: unknown;
  const s = typeof draft === "string" ? draft : "";
  switch (def.kind) {
    case "boolean":
      raw = draft === true;
      break;
    case "int":
    case "number": {
      if (s.trim() === "" || Number.isNaN(Number(s))) return { ok: false, message: KIND_MESSAGE[def.kind]! };
      raw = Number(s);
      break;
    }
    case "phone":
      raw = s.trim() === "" ? "" : normalizePhone(s);
      break;
    case "lines":
      raw = s.split("\n").map((x) => x.trim()).filter(Boolean);
      break;
    case "ints": {
      const parts = s.split(/[,\s]+/).filter(Boolean);
      const nums = parts.map(Number);
      if (nums.some((n) => !Number.isInteger(n))) return { ok: false, message: KIND_MESSAGE.ints! };
      raw = nums;
      break;
    }
    case "hours":
      raw = { ...(current.hours as object), summary: s.trim() };
      break;
    case "json":
      try {
        raw = JSON.parse(s);
      } catch {
        return { ok: false, message: KIND_MESSAGE.json! };
      }
      break;
    default:
      raw = s.trim();
  }
  const res = settingSchemas[def.key].safeParse(raw);
  if (res.success) return { ok: true, value: res.data };
  const own = KIND_MESSAGE[def.kind];
  const msg = res.error.issues[0]?.message;
  const isGeneric = !msg || /^(Invalid|Too|Expected|String|Number)/.test(msg);
  return { ok: false, message: isGeneric ? (own ?? "Nilai tidak valid.") : msg };
}

export function groupOf(key: SettingKey) {
  return SETTINGS_KEYS[key].group;
}
