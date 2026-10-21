# Berkontribusi

Repositori ini proprietary (lihat [LICENSE](LICENSE)); kontribusi hanya diterima setelah disetujui maintainer [@ilramdhan](https://github.com/ilramdhan). Buka isu dahulu sebelum mengerjakan perubahan besar. Dengan berkontribusi Anda setuju kode Anda berada di bawah lisensi yang sama. Perilaku mengikuti [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Setup

```bash
pnpm install
cp .env.example .env.local   # lalu salin juga ke .env; isi nilainya
make db-migrate
make db-seed
make bucket
pnpm dev
```

Jangan pernah commit rahasia (`.env*`, service role key, dll).

## Next.js 16

Versi ini punya perubahan API dan konvensi. Baca panduan di `node_modules/next/dist/docs/` dan [AGENTS.md](AGENTS.md) sebelum menulis kode Next, dan perhatikan peringatan deprecation.

## Branch

Gunakan awalan: `feat/…`, `fix/…`, `docs/…`, `chore/…`, `refactor/…`, `test/…`.

## Conventional Commits

Format `type(scope): ringkasan`. Tipe: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Contoh scope: `admin`, `slots`, `media`, `seo`, `db`, `deps`.

```
feat(slots): tampilkan pengumuman minggu PO
fix(media): tolak berkas tanpa teks alt
```

**Judul PR harus Conventional** (divalidasi CI). Merge memakai **squash**, jadi judul PR menjadi pesan commit. Changelog dan rilis dibuat otomatis oleh release-please dari commit.

## Sebelum membuka PR

```bash
make verify       # typecheck, lint, unit test, build, e2e
make e2e-strict   # axe ketat
pnpm format       # Prettier wajib; CI menjalankan format:check
```

Tambahkan atau sesuaikan tes untuk logika baru.

## Migrasi database

1. Ubah skema Drizzle di `src/db/schema/`.
2. `pnpm db:generate` untuk membuat berkas migrasi.
3. `make db-migrate` untuk menerapkan. Jangan pakai `pnpm db:migrate`: ia memakai `DIRECT_URL` port 5432 yang sering diblokir dan gagal tanpa pesan.
4. Tabel baru **wajib** memiliki RLS dan kebijakannya; tambahkan tes di `tests/rls`.

## Aturan Server Action

- Bungkus dengan `adminAction`.
- Validasi input dengan Zod.
- Daftarkan izin di `src/features/permissions/registry.ts`.
- Drizzle melewati RLS, jadi pemeriksaan peran di server wajib; menyembunyikan tombol di UI bukan pengamanan.
- Perubahan konten harus me-revalidate cache tag terkait (`src/lib/cache-tags.ts`).
