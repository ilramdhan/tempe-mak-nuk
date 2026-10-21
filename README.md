# Tempe Mak Nuk

Situs web bisnis tempe keluarga Mak Nuk: katalog produk, jurnal & resep, kalender slot Pre-Order, pemesanan lewat WhatsApp, dan panel admin untuk pemilik.

[![CI](https://github.com/ilramdhan/tempe-mak-nuk/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/ilramdhan/tempe-mak-nuk/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/ilramdhan/tempe-mak-nuk)](https://github.com/ilramdhan/tempe-mak-nuk/releases)
[![License: proprietary](https://img.shields.io/badge/license-proprietary-red)](LICENSE)

## Fitur

- Katalog produk dan jurnal & resep
- Kalender slot Pre-Order (PO) dengan pengumuman minggu berjalan
- Pemesanan lewat WhatsApp
- Panel admin `/admin` dengan peran Pemilik/Editor, hak akses dinamis (`/admin/akses`), kategori & tag, media library, dan audit log
- SEO (sitemap, OG, data terstruktur), persetujuan cookie, halaman legal

Konten bisnis ada di [docs/business.md](docs/business.md).

## Stack

- Next.js 16 (App Router, `cacheComponents`), React 19, TypeScript
- Tailwind CSS 4, shadcn/ui (Radix), GSAP, Lenis
- Supabase (Auth, Storage, Postgres) + Drizzle ORM (`postgres` driver)
- Tiptap (editor teks), react-hook-form + zod, dnd-kit (urutan)
- Vitest (unit), Playwright + axe (E2E, lihat catatan di bawah)
- Hosting: Vercel (`vercel.json`, Analytics, Speed Insights)

## Prasyarat

- Node.js 20+ dan pnpm (`packageManager` di `package.json`)
- Proyek Supabase (URL, anon key, service role key, string koneksi Postgres)

## Environment

Salin `.env.example` ke `.env.local` (dan `.env` untuk skrip/drizzle), lalu isi. Jangan pernah commit nilai rahasia.

| Variabel                        | Keterangan                                                                           |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL`          | URL publik tanpa garis miring akhir. **Wajib di produksi** (canonical, sitemap, OG). |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL proyek Supabase                                                                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Kunci anon (publik)                                                                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Hanya server. Jangan diekspos ke klien.                                              |
| `DATABASE_URL`                  | Koneksi runtime lewat pooler transaksi (port **6543**)                               |
| `DIRECT_URL`                    | Koneksi langsung/session (port 5432) untuk migrasi                                   |
| `CRON_SECRET`                   | Rahasia route cron, min. 16 karakter                                                 |
| `REVALIDATE_SECRET`             | Rahasia route revalidate, min. 16 karakter                                           |

Validasi ada di `src/lib/env.ts`. Set `SKIP_ENV_VALIDATION=1` untuk build CI tanpa Supabase asli.

## Setup

```bash
pnpm install
cp .env.example .env.local   # salin juga ke .env, lalu isi
make db-migrate        # terapkan migrasi lewat pooler 6543
make db-seed           # data awal
make bucket            # buat bucket media di Supabase Storage
pnpm dev               # http://localhost:3000
```

Gunakan `make db-migrate`, bukan `pnpm db:migrate`: yang kedua memakai `DIRECT_URL` port 5432 yang sering diblokir dan gagal tanpa pesan.

Pengguna pertama yang dibuat di Supabase Auth otomatis menjadi `owner` (trigger `on_auth_user_created`, lihat `src/db/schema/profiles.ts`).

Setelah itu **matikan public sign-up** di Supabase Auth dan tambah pengguna lewat Admin → Pengguna (undang). Pengguna yang diundang menjadi `editor`; hak akses Editor diatur Pemilik di Admin → Hak Akses. Konten terjadwal diterbitkan oleh cron (`vercel.json`, butuh `CRON_SECRET`; berjalan harian di Vercel Hobby, lihat [docs/deploy.md](docs/deploy.md)).

## Perintah

Pintasan via `Makefile`: jalankan `make` untuk daftar lengkap. Yang paling sering:

| Make                                                    | Fungsi                                                                  |
| ------------------------------------------------------- | ----------------------------------------------------------------------- |
| `make setup`                                            | Install, migrasi, seed, dan bucket media (project/DB baru)              |
| `make dev` / `build` / `start` / `stop`                 | Dev server, build, serve di :3100, matikan server                       |
| `make check`                                            | typecheck + lint + unit test                                            |
| `make verify`                                           | check + build + e2e (sebelum commit)                                    |
| `make e2e` / `e2e-strict` / `e2e-admin` / `screenshots` | Playwright                                                              |
| `make db-status` / `db-migrate`                         | Status / terapkan migrasi lewat pooler 6543 (`scripts/dev/migrate.mts`) |
| `make db-seed` / `bucket`                               | Seed / bucket Storage `media`                                           |

`pnpm db:migrate` (drizzle-kit) memakai `DIRECT_URL` port 5432 yang sering diblokir dan gagal tanpa pesan; pakai `make db-migrate`.

Script pnpm:

| Perintah                       | Fungsi                                                                                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev` / `build` / `start` | Jalankan, build, dan serve produksi                                                                                                                                            |
| `pnpm typecheck`               | `next typegen` + `tsc --noEmit`                                                                                                                                                |
| `pnpm lint` / `format:check`   | ESLint / Prettier                                                                                                                                                              |
| `pnpm test`                    | Vitest (unit)                                                                                                                                                                  |
| `pnpm db:generate`             | Buat migrasi dari skema Drizzle                                                                                                                                                |
| `pnpm test:e2e`                | Playwright (butuh `pnpm build`; otomatis `pnpm start -p 3100`). Test admin butuh `E2E_ADMIN_EMAIL` dan `E2E_ADMIN_PASSWORD` (akun editor khusus test) dan di-skip bila kosong. |

Tes RLS ada di `tests/rls` (lihat README di sana).

## Struktur folder

```
src/app/          Route: situs publik, (admin)/admin/*, route handler
src/components/   UI bersama, shell & editor admin
src/features/     Logika per domain (products, posts, recipes, slots, settings, legal, media, ...)
src/db/           Skema Drizzle, klien, seed, kebijakan RLS
src/lib/          env, auth, seo, og, rich-text, supabase, audit, cache-tags
src/proxy.ts      Proxy (auth/redirect)
scripts/          dev (bucket, validasi section), brand (aset)
tests/rls/        Tes kebijakan RLS
docs/             Dokumentasi
```

## Catatan penting (gotchas)

- `cacheComponents` aktif: ikuti pola cache/`use cache` Next 16. Baca panduan di `node_modules/next/dist/docs/` sebelum mengubah perilaku cache; API-nya berbeda dari versi lama.
- `DATABASE_URL` harus lewat pooler transaksi port 6543 (`prepare: false`). Migrasi lewat `make db-migrate` (pooler 6543).
- Drizzle terhubung sebagai role database sehingga **melewati RLS**. Setiap server action wajib memeriksa peran sendiri (`requireRole("editor" | "owner")`). Tombol yang disembunyikan di UI (`RoleGate`) bukan pengamanan.
- Redirect dari database di-cache sekitar 60 detik per instance; perubahan redirect tidak langsung berlaku. Perubahan konten lain langsung (cache tag).
- Setiap perubahan konten memakai cache tag (`src/lib/cache-tags.ts`) agar halaman publik segar.
- Foto wajib punya teks alt (divalidasi di media library).

## Dokumentasi

- [docs/admin-guide.md](docs/admin-guide.md): panduan admin untuk pemilik
- [docs/deploy.md](docs/deploy.md): checklist deploy produksi (Supabase, Vercel, domain, Search Console)
- [docs/business.md](docs/business.md): data & aturan bisnis
- [docs/brand.md](docs/brand.md): identitas merek
- [docs/seo.md](docs/seo.md): strategi SEO
- [docs/performance.md](docs/performance.md): audit performa
- [docs/security.md](docs/security.md): model keamanan
- [docs/qa.md](docs/qa.md): catatan QA
- [docs/audit](docs/audit): laporan audit per fase
- [docs/photo-brief.md](docs/photo-brief.md): brief foto
- `PLAN.md`, `STATE.md`, `HANDOVER.md`: rencana dan status pengerjaan

## Kontribusi, keamanan, lisensi

- [CONTRIBUTING.md](CONTRIBUTING.md) dan [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- [SECURITY.md](SECURITY.md): lapor kerentanan secara privat
- [ACCESSIBILITY.md](ACCESSIBILITY.md) dan [SUPPORT.md](SUPPORT.md)
- [LICENSE](LICENSE): proprietary, hak cipta dilindungi. Kode terlihat publik hanya sebagai referensi.
