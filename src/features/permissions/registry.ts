/**
 * Central permission registry (P8.14, dynamic RBAC). Client-safe: no server imports.
 *
 * A permission key is `<entity>.<action>`, exactly what `adminAction({ entity, action })` receives
 * (the audit-log entity/action pair), so every admin mutation is covered automatically.
 *
 * - `defaultRole`: minimum role when nobody has overridden the permission (mirrors the role
 *   hard-coded at the call site before P8.14, except posts/recipes delete → owner).
 * - `grantable: false`: owner-only critical permission (users/roles, permission management,
 *   legal). Never grantable to editors; DB overrides for it are ignored.
 *
 * Owners always have every permission. Resolution order for editors lives in `./resolve.ts`.
 */
import type { AdminRole } from "@/lib/auth/roles";

export type PermissionDef = {
  label: string;
  group: PermissionGroupId;
  defaultRole: AdminRole;
  grantable: boolean;
  /** Extra note shown in the access matrix. */
  hint?: string;
};

export const PERMISSION_GROUPS = [
  { id: "pages", label: "Halaman" },
  { id: "products", label: "Produk" },
  { id: "slots", label: "Slot & PO" },
  { id: "posts", label: "Jurnal (artikel)" },
  { id: "recipes", label: "Resep" },
  { id: "taxonomy", label: "Kategori & tag" },
  { id: "faqs", label: "FAQ" },
  { id: "testimonials", label: "Testimoni" },
  { id: "navigation", label: "Navigasi & pengumuman" },
  { id: "media", label: "Media" },
  { id: "settings", label: "Pengaturan" },
  { id: "system", label: "Sistem (khusus pemilik)" },
] as const;

export type PermissionGroupId = (typeof PERMISSION_GROUPS)[number]["id"];

const editor = (
  group: PermissionGroupId,
  label: string,
  hint?: string,
): PermissionDef => ({
  label,
  group,
  defaultRole: "editor",
  grantable: true,
  hint,
});
const owner = (
  group: PermissionGroupId,
  label: string,
  hint?: string,
): PermissionDef => ({
  label,
  group,
  defaultRole: "owner",
  grantable: true,
  hint,
});
const ownerOnly = (group: PermissionGroupId, label: string): PermissionDef => ({
  label,
  group,
  defaultRole: "owner",
  grantable: false,
});

export const PERMISSIONS = {
  // Halaman
  "pages.create": editor("pages", "Buat halaman"),
  "pages.update": editor("pages", "Ubah halaman & kontennya"),
  "pages.delete": owner("pages", "Hapus halaman"),
  "page_sections.create": editor("pages", "Tambah section halaman"),
  "page_sections.update": editor("pages", "Ubah section halaman"),
  "page_sections.delete": editor("pages", "Hapus section halaman"),
  "page_sections.reorder": editor("pages", "Urutkan section halaman"),

  // Produk
  "products.create": editor("products", "Buat produk"),
  "products.update": editor("products", "Ubah produk"),
  "products.delete": owner("products", "Hapus produk"),
  "products.reorder": editor("products", "Urutkan produk"),
  "product_shapes.create": editor("products", "Buat bentuk produk"),
  "product_shapes.update": editor("products", "Ubah bentuk produk"),
  "product_shapes.delete": owner("products", "Hapus bentuk produk"),
  "product_shapes.reorder": editor("products", "Urutkan bentuk produk"),
  "product_sizes.create": editor("products", "Buat ukuran produk"),
  "product_sizes.update": editor("products", "Ubah ukuran produk"),
  "product_sizes.delete": owner("products", "Hapus ukuran produk"),
  "product_sizes.reorder": editor("products", "Urutkan ukuran produk"),
  "nutrition.update": editor("products", "Ubah informasi gizi"),
  "nutrition.delete": editor("products", "Hapus informasi gizi"),

  // Slot & PO
  "slot_days.update": editor("slots", "Atur kuota & status slot harian"),
  "slot_days.delete": editor("slots", "Kosongkan slot harian"),
  "holidays.update": editor("slots", "Tambah/ubah hari libur"),
  "holidays.delete": editor("slots", "Hapus hari libur"),

  // Jurnal
  "posts.create": editor("posts", "Buat artikel"),
  "posts.update": editor("posts", "Ubah artikel"),
  "posts.publish": editor("posts", "Terbitkan / jadwalkan artikel"),
  "posts.unpublish": editor("posts", "Jadikan artikel draf"),
  "posts.delete": owner("posts", "Hapus artikel"),

  // Resep
  "recipes.create": editor("recipes", "Buat resep"),
  "recipes.update": editor("recipes", "Ubah resep"),
  "recipes.publish": editor("recipes", "Terbitkan / jadwalkan resep"),
  "recipes.unpublish": editor("recipes", "Jadikan resep draf"),
  "recipes.delete": owner("recipes", "Hapus resep"),

  // Kategori & tag
  "categories.create": editor("taxonomy", "Buat kategori"),
  "categories.update": editor("taxonomy", "Ubah kategori"),
  "categories.delete": editor("taxonomy", "Hapus kategori"),
  "categories.reorder": editor("taxonomy", "Urutkan kategori"),
  "tags.create": editor("taxonomy", "Buat tag"),
  "tags.update": editor("taxonomy", "Ubah tag"),
  "tags.delete": editor("taxonomy", "Hapus tag"),

  // FAQ
  "faqs.create": editor("faqs", "Buat FAQ"),
  "faqs.update": editor("faqs", "Ubah FAQ & visibilitasnya"),
  "faqs.delete": owner("faqs", "Hapus FAQ"),
  "faqs.reorder": editor("faqs", "Urutkan FAQ"),

  // Testimoni
  "testimonials.create": editor("testimonials", "Buat testimoni"),
  "testimonials.update": editor("testimonials", "Ubah testimoni"),
  "testimonials.delete": owner("testimonials", "Hapus testimoni"),
  "testimonials.reorder": editor("testimonials", "Urutkan testimoni"),

  // Navigasi
  "nav_items.create": editor("navigation", "Tambah menu navigasi"),
  "nav_items.update": editor("navigation", "Ubah menu navigasi"),
  "nav_items.delete": owner("navigation", "Hapus menu navigasi"),
  "nav_items.reorder": editor("navigation", "Urutkan menu navigasi"),
  "announcements.create": editor("navigation", "Buat pengumuman"),
  "announcements.update": editor("navigation", "Ubah pengumuman"),
  "announcements.delete": owner("navigation", "Hapus pengumuman"),

  // Media
  "media.create": editor("media", "Tambah media"),
  "media.update": editor("media", "Ubah teks alternatif media"),
  "media.delete": owner("media", "Hapus media (beserta file)"),

  // Pengaturan
  "settings.update": editor(
    "settings",
    "Ubah pengaturan umum (SEO, CTA, kontak)",
    "Grup bisnis, legal, halal, order, consent, privat, dan situs selalu khusus pemilik.",
  ),
  "redirects.create": owner("settings", "Buat redirect URL"),
  "redirects.update": owner("settings", "Ubah redirect URL"),
  "redirects.delete": owner("settings", "Hapus redirect URL"),

  // Sistem (never grantable)
  "legal_documents.create": ownerOnly(
    "system",
    "Buat dokumen legal / versi baru",
  ),
  "legal_documents.update": ownerOnly("system", "Ubah dokumen legal"),
  "legal_documents.delete": ownerOnly("system", "Hapus dokumen legal"),
  "profiles.create": ownerOnly("system", "Undang pengguna"),
  "profiles.update": ownerOnly("system", "Ubah peran pengguna"),
  "role_permissions.update": ownerOnly("system", "Kelola hak akses peran"),
  "user_permissions.update": ownerOnly("system", "Kelola hak akses pengguna"),
} as const satisfies Record<string, PermissionDef>;

export type PermissionKey = keyof typeof PERMISSIONS;

export const PERMISSION_KEYS = Object.keys(PERMISSIONS) as [
  PermissionKey,
  ...PermissionKey[],
];

export function isPermissionKey(value: unknown): value is PermissionKey {
  return typeof value === "string" && Object.hasOwn(PERMISSIONS, value);
}

export function getPermissionDef(key: string): PermissionDef | undefined {
  return isPermissionKey(key) ? PERMISSIONS[key] : undefined;
}

/** Registry grouped for the admin UI (group order as in PERMISSION_GROUPS). */
export function permissionsByGroup(): {
  id: PermissionGroupId;
  label: string;
  items: (PermissionDef & { key: PermissionKey })[];
}[] {
  return PERMISSION_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    items: PERMISSION_KEYS.filter((k) => PERMISSIONS[k].group === g.id).map(
      (key) => ({ key, ...PERMISSIONS[key] }),
    ),
  })).filter((g) => g.items.length > 0);
}
