# HANDOVER — Tempe Mak Nuk (sesi 5 → sesi 6)

> Paste blok di bawah ini apa adanya ke sesi Claude Code baru, di root project
> `/Users/ilhamramadhan/WebstormProjects/tempe-mak-nuk`.

---

````markdown
Kamu melanjutkan project **Tempe Mak Nuk** (website brand + CMS admin, produsen tempe handmade sejak 2001, Klaten). **Fase 0–6 selesai**, plus P7.1 (Playwright), P7.3 (security), dan P7.4 (README + panduan admin). Semua sudah diverifikasi dan di-commit. Tinggal **P7.2 (review visual + fix a11y)** dan **P7.5 (checklist deploy)**. Jangan analisa ulang dari nol. Baca file berikut, lalu lanjut ke §9.

## 1. Baca dulu (urut, jangan skip)
1. `STATE.md`: ledger status per task (sumber kebenaran progres) dan log sesi.
2. `PLAN.md`: Fase 7 (P7.1–P7.5) beserta model, dependensi, ownership, dan template "Protokol Sub-agent".
3. `PROMPT.md`: spesifikasi (IA §4, fitur §5, cookie/legal §5.4, design §6, motion §7, SEO §9, security §12).
4. `docs/brand.md`, `docs/business.md`, `docs/seo.md`, `docs/performance.md` (baseline Lighthouse P6.4), `docs/security.md` (P7.3: temuan + checklist pemilik), `README.md`, `docs/admin-guide.md`.
5. `AGENTS.md`: WAJIB baca docs Next.js bawaan di `node_modules/next/dist/docs` sebelum menulis kode Next.

## 2. Cara kerja (wajib)
- Kamu orkestrator. Semua pekerjaan lewat sub-agent (Agent tool, `run_in_background`), paralel bila dependensinya `done` dan ownership tidak bertumpuk.
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

## 3. Status (per 2026-10-21, HEAD = commit "docs: session 5 handover")
- **Done:** P0.1–P0.5, P1.1–P1.3, P1.5, P2.*, P3.*, P4.*, P5.*, P6.*, **P7.1, P7.3, P7.4**.
- **Review:** P1.4 (CI siap; link Vercel menunggu akun user).
- **Todo:** P0.6 (opsional), **P7.2, P7.5**.
- **Hasil sesi 5:**
  - **P7.1:** `pnpm test:e2e` (butuh `pnpm build` dulu; config auto `pnpm start -p 3100`, atau set `E2E_BASE_URL`). 42 test: 41 pass, admin skip tanpa `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`. Screenshot 66 PNG (11 route × 375/768/1440 × light/dark) di `test-results/screenshots/` (gitignored, dibuat ulang tiap run `screenshots.spec.ts`).
  - **P7.3:** `docs/security.md`. Fix: migrasi `drizzle/0003_signup_no_access.sql` (user baru tanpa akses; hanya user pertama jadi owner; `inviteUser` membuat profil editor), owner-only server-side untuk 7 aksi hapus + `upsertRedirect`/`deleteRedirect` lama, `requireRole` di semua `queries.admin.ts`, `.env.*` di-ignore. Migrasi 0003 **sudah diterapkan** di DB remote (diverifikasi: fungsi trigger versi baru, 4 migrasi tercatat). Terbuka: CSP `'unsafe-inline'` (diterima), rate limit login → CAPTCHA/attack protection Supabase.
  - **P7.4:** `README.md` (developer) + `docs/admin-guide.md` (pemilik, non-teknis).
- **Rencana sisa (maks 3 paralel):**
  1. **P7.2 (O, opus): visual consistency review** → `docs/qa.md` + perbaikan. Jalankan `pnpm build && pnpm exec playwright test tests/e2e/screenshots.spec.ts` dulu untuk membuat screenshot. **Sertakan perbaikan a11y** yang di-allowlist di `KNOWN` (`tests/e2e/a11y.spec.ts`), lalu hapus entri dari `KNOWN` dan pastikan `E2E_AXE_STRICT=1 pnpm test:e2e` hijau:
     - `/custom-order` critical `button-name`: radio produk `#order-product-*` tanpa nama aksesibel.
     - `/produk` serious `label-content-name-mismatch`: `a[aria-label]` kartu produk tidak memuat teks yang terlihat.
     - `/` serious `color-contrast` (9 node): langkah tidak aktif di section proses ter-pin.
     - `/produk`, `/jurnal`, `/kontak`, `/kebijakan-privasi` serious `color-contrast`: CTA header "Cek slot via WhatsApp".
  2. **P7.5 (S, sonnet):** `docs/deploy.md`: checklist Vercel (env, termasuk `NEXT_PUBLIC_SITE_URL`), domain, Supabase Auth (Site URL/redirect URL, SMTP, sign-up off, CAPTCHA), `pnpm db:migrate` + `ensure-media-bucket` di project baru, Search Console + sitemap, Google Business Profile. Butuh akun user; siapkan dokumen saja.
  3. Opsional (orkestrator/sonnet): `/produk/<slug-tak-ada>` mengembalikan HTTP 200 (notFound() dalam Suspense streaming; halaman noindex). `/custom-order` sempat macet 60 s dengan "use cache took too long" setelah beban paralel di satu instance `next start` (DB remote); di instance baru normal ±3 s. Perlu diselidiki.
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
- **DB = Supabase remote** (project `mzzktbvkdpwxufaipbla`, ap-northeast-1).
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
- Akun/project Vercel dan domain:
  - Env Vercel: `DATABASE_URL` pooler 6543, `DIRECT_URL`, Supabase keys, `SUPABASE_SERVICE_ROLE_KEY`, secrets, **`NEXT_PUBLIC_SITE_URL`**.
  - Push repo ke GitHub (belum ada remote).
- Akun editor khusus E2E (`E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`, undang via Admin → Pengguna) supaya `tests/e2e/admin.spec.ts` jalan.
- Data asli (WA, alamat, nomor halal, foto) diisi lewat Admin → Pengaturan / Media.

## 9. Mulai sekarang
1. Cek awal:
   - `git log --oneline | head` dan `git status`; yang untracked seharusnya kosong (`.env.local.docker.bak` kini di-ignore).
   - `pnpm typecheck && pnpm test`.
   - `make db-status` (semua migrasi harus ✓).
2. Tambah baris log sesi 6 di `STATE.md`, lalu ubah status task yang diluncurkan ke `doing`.
3. Luncurkan P7.2 (opus) dan P7.5 (sonnet) paralel (ownership tidak bertumpuk: P7.2 = `docs/qa.md` + file UI yang diperbaiki + `KNOWN` di `tests/e2e/a11y.spec.ts`; P7.5 = `docs/deploy.md`).
4. Setiap task: verifikasi sendiri (`make verify`), review, set `done`, commit per task. Di akhir sesi, perbarui `HANDOVER.md` dan `STATE.md`.
5. Sesudah Fase 7: sisa rekomendasi performa dan gap fitur kecil (§3) bila user mau.
````
