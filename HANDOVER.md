# HANDOVER — Tempe Mak Nuk (sesi 6 → sesi 7)

> Paste blok di bawah ini apa adanya ke sesi Claude Code baru, di root project
> `/Users/ilhamramadhan/WebstormProjects/tempe-mak-nuk`.

---

````markdown
Kamu melanjutkan project **Tempe Mak Nuk** (website brand + CMS admin, produsen tempe handmade sejak 2001, Klaten). **Fase 0–7 berstatus done** dan sudah di-push ke GitHub `https://github.com/ilramdhan/tempe-mak-nuk` (publik, branch `main`). Sesi 6 menjalankan **audit kelengkapan** (`docs/audit/phase-*.md`) yang menemukan gap nyata. Sesi 7 = **Fase 8 (perbaikan gap audit + QA + performa)** dan **Fase 9 (repo GitHub production-grade)**. Jangan analisa ulang dari nol; baca file berikut, lalu lanjut ke §9.

## 1. Baca dulu (urut, jangan skip)
1. `STATE.md`: ledger status per task (sumber kebenaran progres) dan log sesi.
2. `PLAN.md`: Fase 7 (P7.1–P7.5) beserta model, dependensi, ownership, dan template "Protokol Sub-agent".
3. `PROMPT.md`: spesifikasi (IA §4, fitur §5, cookie/legal §5.4, design §6, motion §7, SEO §9, security §12).
4. **`docs/audit/phase-0-3.md`, `phase-4-6.md`, `phase-5-7.md`** (temuan audit sesi 6, bukti path:line), `docs/qa.md` (P7.2).
5. `docs/brand.md`, `docs/business.md`, `docs/seo.md`, `docs/performance.md` (baseline Lighthouse P6.4), `docs/security.md` (P7.3: temuan + checklist pemilik), `README.md`, `docs/admin-guide.md`.
6. `AGENTS.md`: WAJIB baca docs Next.js bawaan di `node_modules/next/dist/docs` sebelum menulis kode Next.

## 2. Cara kerja (wajib)
- Kamu orkestrator. Semua pekerjaan lewat sub-agent (Agent tool, `run_in_background`), paralel bila dependensinya `done` dan ownership tidak bertumpuk.
- **SUB-AGENT DRIVEN + MODEL DINAMIS (WAJIB, hemat token & konteks):** orkestrator tidak mengerjakan task sendiri; setiap task diluncurkan sebagai sub-agent dengan model sesuai kolom *Model* di tabel §9 — **`sonnet` untuk task ringan (S)**, **`opus` untuk task berat (O)**. Orkestrator cukup memverifikasi, review, dan commit. Jangan baca file besar di konteks orkestrator; minta sub-agent merangkum.
- **Model hemat:** `model: "sonnet"` untuk semua yang masih sanggup dikerjakan sonnet, yaitu task S (test E2E, docs, README, checklist deploy, CRUD, wiring). `model: "opus"` hanya untuk task berat O: review visual P7.2, security review P7.3, audit lintas file.
- **Maks 3 agent bersamaan.** Sesi 3 dan 4 berulang kali kena `ECONNREFUSED` atau 429. Bila agent gagal karena API error, kirim `SendMessage` ke agent yang sama: "lanjutkan dari titik terakhir, cek file yang ada di disk dulu". Konteksnya tetap ada dan progresnya ada di disk. Di setiap prompt minta: **tulis file satu per satu ke disk segera, respons akhir pendek, path absolut untuk Write**.
- Aturan sub-agent:
  - Hanya menyentuh file ownership-nya dan baris task-nya di `STATE.md`.
  - Tidak commit.
  - Tidak `pnpm add`; orkestrator yang memasang paket dan meng-commit dulu.
  - Tidak `pnpm format` global, dan tidak menjalankan prettier pada file yang sudah ada. Repo ini tidak seluruhnya di-prettier, misalnya `src/app/(site)/page.tsx` dan `src/features/**`.
- **Dev server / build:** Next 16 menolak dua `next dev` per repo dan dua `next build` bersamaan. Tulis di prompt: "jangan `next build` bila `pgrep -f "next build"` ada (tunggu); uji dengan `next start -p <port bebas 31xx>` dan matikan sesudahnya; jangan matikan server agent lain". Agent tidak punya login admin, jadi admin cukup diverifikasi lewat typecheck/lint/test/build dan unit test.
- Setelah agent selesai, orkestrator:
  1. Verifikasi sendiri `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.
  2. Review file yang disentuh di luar ownership. Untuk Server Action baru, cek role, Zod, dan cakupan id.
  3. Cek ulang baris ledger. Agent bisa menimpa baris yang sudah diubah orkestrator; di sesi 4, baris P5.7 kembali ke `doing`.
  4. Set status `done`, lalu commit per task dengan trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Jangan percaya klaim sub-agent mentah-mentah; uji sendiri hasil yang penting. Contoh sesi 4: fallback OG `/opengraph-image` ternyata 404 karena file route OG mendapat hash, dan metadata halaman menimpa file OG per route. Keduanya baru ketahuan lewat `curl` ke `next start`.
- Laporan ke user dalam Bahasa Indonesia, ringkas.

## 3. Status (per 2026-10-21, HEAD = commit "docs: session 6 final handover", sudah di-push ke `origin/main`)
- **Done:** P0.1–P0.5, P1.1–P1.3, P1.5, P2.*, P3.*, P4.*, P5.*, P6.*, P7.* (status ledger). **Tapi audit sesi 6 menemukan gap** → Fase 8.
- **Review:** P1.4 (CI ada, tapi **CI di GitHub GAGAL** — lihat P8.0; link Vercel menunggu akun user).
- **Todo:** P0.6 (opsional, skills §13 belum dicatat), Fase 8, Fase 9.
- **Hasil sesi 6:** P7.2 (`docs/qa.md`, a11y `KNOWN` kosong, `make e2e-strict` hijau 41 ✓), P7.5 (`docs/deploy.md`), audit 3 laporan (`docs/audit/`), push ke GitHub (riwayat discan: tanpa `.env`/JWT/secret; ref Supabase di HANDOVER diredaksi — ref masih ada di commit lama, bukan secret karena publik di `NEXT_PUBLIC_SUPABASE_URL`).
- **Ringkasan audit:** Fase 0–3: 20 ✅ / 1 ⚠️ (P1.4) / 1 ❌ (P0.6). Fase 4+6: 8 ✅ / 7 ⚠️. Fase 5+7: 7 ✅ / 8 ⚠️. 0 ❌ fungsional; TODO/FIXME = 0. Semua action pakai `adminAction`/`requireRole` + Zod; tag cache konsisten (`src/lib/cache-tags.ts`); klik WA tercatat di `wa_clicks`.
- **Temuan terverifikasi orkestrator (curl `next start`):** judul ganda `"… — Tempe Mak Nuk — Tempe Mak Nuk"` (mis. `/cara-pesan`), `"Tips Tempe Tempe: …"` di kategori jurnal, `/favicon.ico` 404, `/resep/<slug-tak-ada>` HTTP 200. CI GitHub: `Format check` gagal (168 file belum di-prettier) → test/build tidak jalan. PR Dependabot #1 (12 update npm) terbuka — **jangan merge sebelum CI hijau dan diuji**.
- **Sisa rekomendasi performa (opsional, dari P6.4):**
  - TBT beranda ±135 ms. Jalankan animasi below-the-fold (SplitText, ScrollTrigger, PinnedStory) saat idle.
  - Chunk react-day-picker ±22 kB ter-prefetch dari link `/custom-order` dan `/cara-pesan`. Pakai `prefetch={false}` atau dynamic import `SlotCalendar`.
  - Atur `browserslist` modern (±14 kB polyfill).
  - Ukur ulang di Vercel.
- **Gap fitur kecil (opsional):**
  - Kelola kategori FAQ/jurnal dari UI belum ada. Action-nya sudah ada di `features/taxonomy`; perlu halaman `/admin/kategori`.
  - Sitemap belum mengecualikan item `seo.noindex`, karena query slug tidak mengembalikan flag itu.
  - Halaman CMS di tabel `pages` tanpa route statis tidak punya route publik.

## 4. Keputusan terkunci
- **Tagline hero:** "Tiga bahan, tanpa jalan pintas." · Slot/PO: "Tempe yang layak ditunggu." · /tentang: "Dari dapur Mak, tanpa jalan pintas."
- **Stack terpasang:**
  - Next 16.4.2 (App Router, Turbopack, `cacheComponents: true`, `partialPrefetching: true`), React 19.3, TS 5.9 strict, Tailwind 4.3.3, shadcn (radix-nova).
  - lucide-react, next-themes, GSAP 3.15 + @gsap/react, Lenis 1.3, Motion 14.
  - Zod 4, Drizzle 0.45 + postgres-js, @supabase/ssr 0.12, react-hook-form, sonner, cmdk, react-day-picker, Vitest 5, pnpm 12.8.
  - @tanstack/react-table 9.3 (API v9!), @dnd-kit (core 6.3 / sortable 10 / utilities 3.2), Tiptap 3.32, @vercel/analytics 2.0 + speed-insights 2.0.
  - **sharp 0.35.5** (sesi 4).
- **@playwright/test 1.64.1 + @axe-core/playwright 4.14.0** (sesi 5; chromium headless shell terpasang).
- Tidak ada nilai bisnis yang di-hard-code; selalu lewat `getSettings()` atau query DB.
- Testimoni placeholder wajib berlabel. Legal ditandai "Dokumen contoh — perlu ditinjau ahli hukum".
- Cookie consent di `settings["consent.config"]`, cookie `tmn_consent`. Analytics (dynamic import) hanya dimuat setelah consent. Banner consent ada di HTML statis: skrip pra-paint menyembunyikannya bila keputusan sudah ada (fix LCP P6.4); jangan dijadikan client-only lagi.
- Role:
  - **Owner-only:** hapus halaman/produk/media/FAQ/testimoni/navigasi, Legal, Pengguna, Redirect, serta grup settings business/legal/halal/order/consent/private/site.
  - **Editor:** grup contact/social/seo/cta dan CRUD konten.
  - **Hapus artikel/resep masih boleh oleh editor.** Ini menunggu keputusan user (§8).
  - Catatan audit: tab "SEO & situs" di UI owner-only padahal server mengizinkan editor untuk `seo.*`/`cta.*` → selaraskan (P8.9).

## 5. API yang sudah ada (pakai, jangan duplikasi)
- **UI:**
  - `@/components/site/primitives` (Container, Section, Heading, Eyebrow, Lead, Prose, Grid, Stack, Divider).
  - `@/components/ui/*` (pakai `field`, bukan `form`).
  - `@/components/brand/*`.
  - `@/components/motion` (import gsap dari sini; Lenis/GSAP di-load lazy di `lenis-provider.tsx`).
  - `cn()` sudah mengenal token custom.
- **Data (server-only, cached):** `src/features/<domain>/queries.ts` untuk settings, pages (+`<BlockRenderer>`), navigation, products, posts, recipes, taxonomy, faqs, testimonials, slots (`getAvailability`), legal, media (`getMediaByIds`), dan `getRedirects`.
  - Admin: `queries.admin.ts`.
  - Domain baru sesi 4: `features/redirects` (`saveRedirect`/`removeRedirect` owner, `match.ts`, `logic.ts`) dan `features/users` (`setUserRole`/`inviteUser` owner, `listUsersForAdmin`).
- **SEO (P6.1):** `@/lib/seo`.
  - Metadata: `buildMetadata` (pure), `pageMetadata` dan `rootMetadata` (server).
  - JSON-LD builders: organization, foodEstablishment, webSite, breadcrumbList, product (tanpa rating palsu), article, recipe (`isoDuration`), faqPage, howTo, webPage, itemList.
  - Komponen `<JsonLd>`, plus `siteBaseUrl`/`absoluteUrl`.
  - Route yang punya file `opengraph-image` sendiri (beranda, produk/jurnal/resep `[slug]`) memanggil `pageMetadata({ ogImageFile: true, ... })`. Route lain otomatis memakai `/og-default.png` (`src/app/og-default.png/route.tsx`). **Route baru yang punya file OG wajib `ogImageFile: true`**, karena `openGraph.images` dari metadata menimpa file OG.
- **OG (P6.3):** `@/lib/og` (`renderOg`, `truncate`, `OG_TAGLINE`). Font Fraunces 600 ada di `src/lib/og/fonts`. Cover WebP/AVIF dikonversi sharp ke JPEG.
- **SEO files (P6.2):** `src/app/{sitemap,robots,manifest}.ts`.
  - Robots mengizinkan semua kecuali saat `VERCEL_ENV` ada dan bukan production.
  - **`NEXT_PUBLIC_SITE_URL` wajib di produksi**; kalau kosong, canonical/sitemap memakai localhost.
  - Redirect DB dibaca `src/proxy.ts` dengan cache memori TTL 60 s per instance. Perubahan di admin berlaku ≤60 s.
- **Slot:** `@/features/slots/components/public-slot-calendar` (`PublicSlotCalendar({days})`) dan `slot-week-strip` (`SlotWeekStrip({days})`). Keduanya server component yang sudah membungkus Suspense + `connection()` sendiri. `SlotCalendar`/`SlotLegend` ada di `@/features/orders/components/slot-calendar`.
- **Media (P5.8):**
  - `POST /api/upload` (multipart `file` + `alt`; editor+, same-origin; sharp: rotate, strip, ≤2400 px WebP q80, blurDataUrl; maks 5 MB; path `uploads/YYYY/MM/<uuid>.webp`).
  - Actions di `features/media/library-actions.ts`: `searchMediaLibrary`, `getMediaLibraryItem`, `getMediaUsageAction` (editor) dan `deleteMediaAndFile` (owner, cek pemakaian).
  - **Picker:** `MediaPicker` / `MediaPickerDialog` dari `@/components/admin/media-picker`. Sudah dipasang di semua form admin; loader `listMediaForAdmin({limit:200})` lama sudah dihapus.
  - Bucket Storage `media` (public-read) dibuat dengan `pnpm tsx --env-file=.env scripts/dev/ensure-media-bucket.mts`. Skripnya idempoten; **jalankan lagi di setiap project Supabase baru**.
- **Admin shell / pola:**
  - `<PageHeader>`, `<RoleGate role="owner">` (UI saja), `adminAction({role, schema, input, entity, action, run})`, `requireRole(role, {onFail:"redirect"})`, `useAdminMutation` (`admin/slot/_components/use-action.ts`), `use-unsaved-guard` (halaman), `sortable-list` (produk).
  - Editor konten bersama ada di `admin/jurnal/_shared/*`. `RichTextEditor({id?, value, onChange, invalid?, ariaDescribedBy?})` dari `@/components/admin/editor`; prop `media` sudah dihapus dan gambar dipilih lewat picker.
- **Situs publik:**
  - Layout `(site)` sudah me-render `<main id="main">`, header, footer, FloatingWhatsApp, dan ConsentManager, jadi halaman tidak boleh me-render `<main>` sendiri.
  - Barrel `@/components/site/layout` hanya untuk server component. Dari client, impor langsung `.../wa-link`.
  - Semua CTA WhatsApp lewat `<WaLink source kind>`.

## 6. Gotcha teknis (sudah pernah kena)
- `cacheComponents`:
  - Baca DB di page butuh `"use cache"` atau `await connection()` di dalam `<Suspense>`.
  - `generateStaticParams` wajib mengembalikan ≥1 hasil (OG `[slug]` memakai fallback `_`).
  - `new Date()` hanya boleh di fungsi `"use cache"` atau setelah `connection()`.
- **Build & DB:**
  - `next build` jalan dengan 14 worker. `src/db/client.ts` memakai `max: 1` koneksi saat `NEXT_PHASE=phase-production-build`.
  - `DATABASE_URL` memakai pooler port 6543. Host direct IPv6-only dan port 5432 diblokir di jaringan ini.
  - Jangan ubah konfigurasi ini tanpa menguji `pnpm build` 2×.
- Next 16:
  - Middleware ada di `src/proxy.ts`; `"use cache"` tidak berlaku di proxy.
  - Server Action memakai `updateTag`; route handler memakai `revalidateTag(tag, "max")`.
  - Prop `error.tsx` bernama `retry`.
  - `next/image` memakai `preload` (`priority` sudah deprecated).
  - File route `opengraph-image` mendapat hash pada URL-nya.
- `experimental.inlineCss` sudah dicoba dan memperburuk hasil (HTML 1.16 MB). Jangan dipakai.
- Jangan import db di top-level; panggil `getDb()` di dalam fungsi. Drizzle bypass RLS, jadi setiap action wajib cek role.
- `pnpm typecheck` = `next typegen && tsc --noEmit`. Paket dengan build script perlu didaftarkan di `allowBuilds` (`pnpm-workspace.yaml`).
- CSP di `next.config.ts`: script `'unsafe-inline'`; `frame-src` Google Maps; host gambar diambil dari `NEXT_PUBLIC_SUPABASE_URL` saat build.
- shadcn CLI menimpa `globals.css`/`layout.tsx`/`lib/utils.ts`, jadi cek `git diff` setelah `shadcn add`.
- Parser jsonb raw text ada di `src/db/client.ts`. Skrip yang membuat koneksi `postgres()` sendiri perlu override yang sama.
- `usePathname`/`useSearchParams` di client island harus dibungkus `<Suspense>`.
- Lingkungan lokal:
  - Port 54321 adalah SSH tunnel.
  - `next-server v16.3.4` (9router) bukan milik project.
  - Lighthouse 13.5 tersedia di cache npx.
  - Headless Chrome 375px lewat CDP `Emulation.setDeviceMetricsOverride`.

## 7. Lingkungan lokal
- **DB = Supabase remote** (project `<ref di .env>`, ap-northeast-1).
  - Sudah dimigrasi dan di-seed: 50 settings, 2 produk, 11 halaman, 27 FAQ, 8 artikel, 6 resep, 4 legal, slot.
  - Bucket `media` sudah ada.
  - Latensi ±700 ms per koneksi.
- `.env` (tidak di-commit) berisi kredensial Supabase dan secrets. `.env.local` berisi `SKIP_ENV_VALIDATION=1`, `NEXT_PUBLIC_SITE_URL`, dan secrets.
- `.env.local.docker.bak` untracked; **jangan di-commit**. Container `tmn-dev` (port 54329) dipertahankan sebagai cadangan offline.
- **Auth:** akun owner sudah ada. Public sign-up **sudah mati** (dikonfirmasi user). Migrasi 0003 aktif: user baru tanpa profil = tanpa akses; editor hanya lewat undangan.
- **Makefile** (sesi 5): `make` untuk daftar. `make check`, `make verify` (check+build+e2e), `make e2e`/`e2e-strict`/`screenshots`, `make db-status`/`db-migrate` (lewat pooler 6543 via `scripts/dev/migrate.mts`; **`pnpm db:migrate` drizzle-kit gagal diam-diam karena DIRECT_URL 5432 diblokir**), `make db-seed`, `make bucket`, `make start`/`stop` (port 3100).
- Perintah:
  - `pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`.
  - `pnpm db:migrate`, `pnpm db:seed` (idempoten), `pnpm db:generate`.
  - Validasi seed: `pnpm tsx --tsconfig tsconfig.json scripts/dev/validate-sections.mts`.
- Status sesi 5 terakhir: lint ✓, typecheck ✓, 331 test ✓ (17 skip), build ✓, e2e 41 ✓ (1 skip).
- `pnpm lint` mengabaikan `playwright-report/` dan `test-results/`.

## 8. Menunggu dari user (jangan memblokir)
- Sign-up publik sudah dimatikan user sejak awal; migrasi 0003 sudah diterapkan. Sisa saran: aktifkan CAPTCHA/attack protection di Supabase Auth.
- **Uji manual admin setelah login** (belum pernah diuji dengan sesi nyata): semua modul `/admin/*`, terutama upload media, MediaPicker, Pengaturan, Pengguna (undang butuh SMTP Supabase dan redirect URL), Redirect, Legal, dan consent.
- Keputusan: hapus artikel/resep dijadikan owner-only atau tidak.
- Keputusan desain: bar sticky "Lanjut" `/custom-order` di 375 px & tombol WA mengambang (P8.12).
- Keputusan Fase 9: lisensi (default usulan: **proprietary / All rights reserved** karena brand komersial; alternatif MIT untuk kode saja), apakah repo tetap publik, image container dipublikasikan ke GHCR publik/privat.
- Secrets GitHub Actions bila diperlukan (mis. `E2E_ADMIN_*`, Vercel token bila deploy via Actions).
- Akun/project Vercel dan domain:
  - Env Vercel: `DATABASE_URL` pooler 6543, `DIRECT_URL`, Supabase keys, `SUPABASE_SERVICE_ROLE_KEY`, secrets, **`NEXT_PUBLIC_SITE_URL`**.
- Akun editor khusus E2E (`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`, undang via Admin → Pengguna) supaya `tests/e2e/admin.spec.ts` jalan.
- Data asli (WA, alamat, nomor halal, foto) diisi lewat Admin → Pengaturan / Media.

## 9. Mulai sekarang
1. Cek awal: `git log --oneline | head`, `git status` (bersih), `git fetch && git status` (sinkron dengan `origin/main`), `pnpm typecheck && pnpm test`, `make db-status` (0000–0003 ✓), `gh run list -L 5`.
2. Tambahkan Fase 8 & 9 (tabel di bawah) ke `STATE.md` (bagian Task) dan `PLAN.md`, tambah log sesi 7, set task yang diluncurkan ke `doing`.
3. Jalankan **sub-agent driven** sesuai kolom *Model* (sonnet = ringan, opus = berat), maks 3 paralel, ownership tidak bertumpuk. Urutan: **P8.0 dulu sendirian** (menyentuh banyak file), lalu gelombang lain.
4. Setiap task: verifikasi sendiri (`make verify` + `make e2e-strict`; untuk Fase 9 juga `gh run watch`), review, set `done`, commit per task, `git push`. Di akhir setiap fase dan sesi: perbarui `HANDOVER.md` dan `STATE.md`.

### Fase 8 — Perbaikan gap audit, QA, performa
| ID | Task | Model | Dep | Ownership / catatan |
|---|---|---|---|---|
| P8.0 | **CI hijau:** keputusan format — opsi A (disarankan): satu commit `chore: prettier --write .` terisolasi (dicek `pnpm build`+e2e, tambahkan hash ke `.git-blame-ignore-revs`); opsi B: `format:check` hanya file berubah. Lalu pastikan job Test + Build jalan di GitHub. Setelah itu aturan "jangan prettier file lama" **dicabut**. | sonnet | — | `.prettierignore`, `package.json`, `.github/workflows/ci.yml`, seluruh repo (opsi A) |
| P8.1 | Halaman `/produk`, `/faq`, `/kontak` membaca `getPage` + `<BlockRenderer>`/SEO dari DB (bukan hard-code) agar editan admin tampil (§15). Halaman CMS baru: route catch-all `(site)/[slug]` **atau** blokir pembuatan halaman baru di admin — pilih yang aman terhadap route statis. | opus | P8.0 | `src/app/(site)/{produk,faq,kontak}/page.tsx`, route baru, `features/pages` |
| P8.2 | Route dinamis (`/produk|jurnal|resep/[slug]`, `/jurnal/kategori/[slug]`) mengembalikan **404 sejak request pertama** (sekarang 200 soft-404 karena `notFound()` dalam Suspense streaming). Baca docs Next 16 (cacheComponents, not-found). | opus | P8.0 | route `[slug]` terkait |
| P8.3 | SEO kecil: judul ganda (template `%s — Tempe Mak Nuk` + judul yang sudah memuat brand), "Tips Tempe Tempe", sitemap saring `seo.noindex` + status, JSON-LD `image` untuk Recipe/Product/BlogPosting, `/favicon.ico`, description legal duplikat. | sonnet | P8.0 | `src/lib/seo/*`, `src/app/sitemap.ts`, metadata route terkait, queries slug |
| P8.4 | Cache/revalidate: `updateMediaAlt` meng-expire tag pemakai (produk/testimoni/post/resep); konten terjadwal dipublikasikan tepat waktu (cron Vercel → route revalidate ber-`CRON_SECRET`, atau tag TTL pendek). | sonnet | P8.0 | `features/media/actions.ts`, `vercel.json`, `src/app/api/cron/*` |
| P8.5 | `/admin/kategori`: kelola kategori FAQ/jurnal/resep + tag (action `features/taxonomy` sudah ada; cek role + Zod). | sonnet | P8.0 | `src/app/admin/kategori/**`, nav admin |
| P8.6 | Dasbor: kartu "peringatan konten kosong" (§5.3). | sonnet | P8.0 | `src/app/admin/(dashboard)` |
| P8.7 | Konten/fitur publik kurang: FAQ produk + resep terkait di `/produk/[slug]`, galeri bentuk `/produk`, probiotik `/manfaat-tempe`, timeline/tim `/tentang`, announcement bar dari status slot minggu ini; consent 12 bulan + "Tolak" sesuai §5.4; TOC halaman legal. | sonnet | P8.1 | route publik terkait (jangan bentrok dengan P8.1) |
| P8.8 | Docs akurat: `docs/admin-guide.md` (editor bisa Navigasi/Pengumuman/CTA; undang tanpa pilihan peran; tidak ada nonaktifkan akun; versi legal via "Buat versi baru"; hapus klaim "±1 menit"), README Setup → `make db-migrate`, `docs/security.md` status 0003 & commit. | sonnet | P8.1–P8.6 | `README.md`, `docs/*.md` |
| P8.9 | Admin kecil: tab "SEO & situs" editor boleh `seo.*`/`cta.*`; hapus action redirect lama duplikat di `features/pages/actions.ts`; (bila user memutuskan) hapus artikel/resep owner-only. | sonnet | P8.0 | `features/settings`, `features/pages/actions.ts` |
| P8.10 | E2E: anonim `/admin` → `/login`; admin CRUD (skip tanpa `E2E_ADMIN_*`); 404 slug. | sonnet | P8.2 | `tests/e2e/*` |
| P8.11 | Performa (P6.4 sisa): animasi below-the-fold (SplitText/ScrollTrigger/PinnedStory) saat idle; `prefetch={false}` atau dynamic import `SlotCalendar` (react-day-picker ±22 kB); `browserslist` modern; bundle analyzer + ukur INP; perbarui `docs/performance.md`. Hapus dep `motion` bila tak dipakai (atau pakai untuk View Transitions). | opus | P8.0 | `src/components/motion/*`, link CTA, `package.json` (orkestrator pasang/hapus paket) |
| P8.12 | QA terbuka (`docs/qa.md`): token dark `--card` ≠ `--surface` di `src/styles/globals.css` (cek ulang screenshot dark semua route); bar sticky `/custom-order` 375 px; tombol WA mengambang menutupi konten mobile. | opus | P8.0 | `globals.css`, `features/orders/components/*`, `floating-whatsapp.tsx` |
| P8.13 | P0.6: catat skills §13 yang tersedia/terpasang di `STATE.md` (opsional). | sonnet | — | `STATE.md` |

### Fase 9 — Repo GitHub production-grade (scalable, secure)
Repo: `https://github.com/ilramdhan/tempe-mak-nuk` (publik). `gh` CLI sudah login sebagai `ilramdhan`. Setiap perubahan setting repo (branch protection, release, package) = aksi keluar → konfirmasi user dulu bila belum diizinkan.
| ID | Task | Model | Dep | Ownership / catatan |
|---|---|---|---|---|
| P9.1 | Community health files: `README.md` (badge CI/release/license, ringkas + link docs), `CONTRIBUTING.md` (setup, Conventional Commits, branch, `make verify`, aturan PR), `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1), `SECURITY.md` (private vulnerability reporting, scope), `LICENSE` (sesuai keputusan user), `ACCESSIBILITY.md` (target WCAG 2.1 AA, axe strict di CI, cara lapor), `SUPPORT.md`, `.editorconfig`, `.gitattributes`. | sonnet | P8.0 | root files |
| P9.2 | `.github/`: `CODEOWNERS` (`* @ilramdhan`, path sensitif `drizzle/ src/proxy.ts next.config.ts src/features/**/actions.ts .github/`), `ISSUE_TEMPLATE/` (issue forms YAML: bug, feature, a11y, content; `config.yml` blank off + link security), `pull_request_template.md` (checklist: typecheck/lint/test/build/e2e, a11y, migrasi, screenshot, security), `labeler.yml` + label sync, `FUNDING` tidak perlu. | sonnet | — | `.github/**` (kecuali workflows) |
| P9.3 | CI/CD workflows (least-privilege `permissions`, pin action ke SHA, `concurrency`, cache pnpm): `ci.yml` (typecheck, lint, format, unit, build, **Playwright e2e + axe strict** dengan artefak report — butuh DB: pakai Postgres service container + migrasi + seed, atau jalankan e2e hanya bila secret DB ada), `codeql.yml` (JS/TS), `dependency-review.yml` (PR), `pr-title.yml` (Conventional Commits semantic PR), `labeler.yml`, `stale.yml` opsional. Dependabot: sudah ada — kelompokkan + jadwal mingguan, tambah `github-actions` & `docker`. | opus | P8.0, P9.2 | `.github/workflows/*`, `.github/dependabot.yml` |
| P9.4 | Release: **release-please** (`googleapis/release-please-action`, `release-please-config.json` + `.release-please-manifest.json`, release-type `node`, CHANGELOG.md, tag `vX.Y.Z`, mulai dari `0.1.0`). Deskripsi repo + topics via `gh repo edit` (konfirmasi user). | sonnet | P9.3 | config release-please, workflow release |
| P9.5 | Image build (package): `Dockerfile` multi-stage (node 22-alpine/distroless, pnpm via corepack, `output: "standalone"` di `next.config.ts` — **uji `pnpm build` 2× dan e2e**, user non-root, `HEALTHCHECK`), `.dockerignore` (wajib exclude `.env*`), env runtime (bukan baked; ingat `NEXT_PUBLIC_*` & host gambar CSP dibaca saat build → build-arg). Workflow `docker.yml`: build multi-arch (amd64/arm64) dengan buildx + cache GHA, push ke **GHCR** `ghcr.io/ilramdhan/tempe-mak-nuk` saat release/tag (`docker/metadata-action` tag semver + sha), SBOM + provenance, scan Trivy/Grype, sign cosign keyless (OIDC). Deploy utama tetap Vercel; image untuk self-host. Dokumentasikan di `docs/deploy.md`. | opus | P9.3, P9.4 | `Dockerfile`, `.dockerignore`, `.github/workflows/docker.yml`, `next.config.ts` (output), `docs/deploy.md` |
| P9.6 | Setting repo via `gh` (konfirmasi user): branch protection/ruleset `main` (wajib PR + CI hijau + CODEOWNERS review, larang force-push), aktifkan secret scanning + push protection, Dependabot alerts/security updates, private vulnerability reporting, auto-delete branch, squash merge only. Tangani PR Dependabot #1 (rebase, CI hijau, uji, merge — atau tutup). | sonnet | P9.1–P9.5 | setting GitHub |
| P9.7 | Audit akhir Fase 9: verifikasi semua workflow hijau di GitHub (`gh run list`), release pertama terbit, image ter-push & ter-sign, tidak ada secret bocor; perbarui `HANDOVER.md`/`STATE.md`. | opus | P9.6 | `docs/audit/phase-9.md` |
````
