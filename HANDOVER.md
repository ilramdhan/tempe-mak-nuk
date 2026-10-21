# HANDOVER — Tempe Mak Nuk (sesi 7 → sesi 8)

> Paste blok di bawah ini apa adanya ke sesi Claude Code baru, di root project
> `/Users/ilhamramadhan/WebstormProjects/tempe-mak-nuk`.

---

````markdown
Kamu melanjutkan project **Tempe Mak Nuk** (website brand + CMS admin, tempe handmade sejak 2001, Klaten). Repo GitHub `ilramdhan/tempe-mak-nuk` (publik). **Fase 0–7 done; Fase 8 hampir selesai; Fase 9 separuh.** Jangan analisa ulang dari nol; baca file berikut, lalu lanjut ke §9.

## 1. Baca dulu (urut)
1. `STATE.md` — ledger status per task (sumber kebenaran) + log sesi.
2. `PLAN.md` — tabel Fase 8 & 9 + "Protokol Sub-agent".
3. `PROMPT.md` (spesifikasi), `docs/audit/phase-*.md`, `docs/qa.md`, `docs/performance.md`, `docs/security.md` (§3a RBAC), `docs/deploy.md`, `CONTRIBUTING.md`.
4. `AGENTS.md`: WAJIB baca docs Next.js di `node_modules/next/dist/docs` sebelum menulis kode Next.

## 2. Cara kerja (wajib)
- **Orkestrator + sub-agent, model dinamis:** setiap task diluncurkan sebagai sub-agent (`run_in_background`) — `model: "sonnet"` untuk task S, `model: "opus"` untuk task O. Orkestrator hanya verifikasi, review, commit. Maks **3 agent** paralel, ownership tidak bertumpuk. Bila agent putus (ECONNREFUSED/429): `SendMessage` "lanjutkan dari titik terakhir, cek file di disk dulu".
- **Aturan sub-agent** (tulis di `/tmp/rules.txt` lalu suruh agent membacanya — file /tmp hilang antar mesin, buat ulang): hanya file ownership + baris task-nya di `STATE.md`; tidak commit; tidak `pnpm add/remove`; jalankan `pnpm exec prettier --write <file yang diubah>` (repo sudah 100% prettier, CI mengecek); verifikasi `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`; build hanya bila `ps -eo command | grep -E "^node .*next build"` kosong (**jangan `pgrep -f`** — mencocokkan shell loop agent lain → menunggu selamanya); uji di `next start -p 31xx` lalu matikan; tulis file satu per satu, path absolut, respons akhir pendek.
- **Git — WAJIB lewat branch + PR** (ruleset `main`: PR, squash only, required checks `Verify (typecheck, lint, format, unit)` + `Build + E2E (Playwright)`, CodeQL, code owner review). Alur: `git switch -c <type>/<task>` → commit (Conventional Commits, trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`) → `git push -u` → `gh pr create --body-file` mengikuti `.github/pull_request_template.md` (akhiri body dengan `🤖 Generated with [Claude Code](https://claude.com/claude-code)`) → `gh pr checks <n> --watch` → **minta user merge** (orkestrator tidak boleh `gh pr merge --admin`).
- **Stage file eksplisit** (`git add <paths>`), JANGAN `git commit -am` saat agent lain sedang bekerja (sesi 7: commit ledger ikut menyapu file agent lain → HEAD tidak bisa build). Untuk commit ledger saja: `git add STATE.md`. Bila working tree berisi kerja agent lain, buat PR dari `git worktree add /tmp/wt <branch>`.
- Setelah agent selesai: verifikasi sendiri (typecheck/test, build + `curl` ke `next start` untuk hal penting; jangan percaya klaim mentah), review Server Action baru (role/permission registry, Zod, cakupan id), set status `done`, PR.
- Ubah status ledger dengan skrip kecil (kolom ke-5 = Status, ke-6 = Agent) — jangan sed regex rapuh.
- Laporan ke user dalam Bahasa Indonesia, ringkas.

## 3. Status (2026-10-21, akhir sesi 7)
**Fase 8**
- done & di `main`: P8.0 (prettier + CI Postgres), P8.1 (`/produk`,`/faq`,`/kontak` dari CMS + catch-all `(site)/[slug]` + slug reserved), P8.2 (404 asli via `export const ensureStatic = "navigation"`), P8.3 (judul tunggal, sitemap noindex, favicon.ico, JSON-LD image), P8.5 (`/admin/kategori`), P8.6 (kartu peringatan konten dasbor), P8.9 (editor boleh seo./cta.), P8.10 (e2e auth/404/FAQ CRUD), P8.11 (motion idle/near-viewport, SlotCalendar lazy, browserslist; dep `motion` dihapus), P8.12 (dark `--card`, sticky bar/WA), P8.13/P0.6 (skills), **P8.14 RBAC dinamis** (migrasi `0004_rbac_permissions` — sudah diterapkan ke remote; `/admin/akses`; registry `src/features/permissions/registry.ts`; `adminAction` cek `<entity>.<action>`).
- **P8.4** — PR **#7** `feat/p8.4-cache-cron` (menunggu CI + merge user).
- **P8.7** — agent sonnet sedang berjalan saat sesi 7 ditutup; perubahan BELUM di-commit di working tree `main` lokal: consent 12 bln + "Tolak" (`src/features/consent/*`), FAQ/resep terkait `/produk/[slug]` (halaman `ensureStatic` → hanya query `"use cache"`), galeri bentuk `/produk`, slot announcement (`src/features/slots/{week-message.ts,components/slot-announcement.tsx}`, `(site)/layout.tsx`), TOC legal, seed pages (probiotik/timeline/tim). **Sesi 8: cek `git status`; selesaikan/verifikasi (typecheck, test — test consent cookie harus hijau, build, `E2E_AXE_STRICT=1` e2e), `pnpm db:seed` bila seed berubah, lalu PR.**
- **P8.8** todo (docs akurat: admin-guide [editor bisa Navigasi/Pengumuman/CTA, undang tanpa pilihan peran, tidak ada nonaktifkan akun, versi legal via "Buat versi baru", hapus klaim "±1 menit", **tambah /admin/akses & /admin/kategori**, hapus artikel/resep owner-only], `docs/security.md` status 0003/0004).
**Fase 9**
- done: P9.1 (LICENSE proprietary, README badges, CONTRIBUTING, CoC, SECURITY, ACCESSIBILITY, SUPPORT, .editorconfig, .gitattributes), P9.2 (CODEOWNERS, issue forms, PR template, labeler, labels), P9.3 (ci.yml verify + build-e2e Postgres+Playwright+axe strict, dependency-review, pr-title, labeler, labels-sync, stale, Dependabot grouped + docker; action dipin SHA). **`codeql.yml` advanced dihapus di PR #6** karena repo memakai CodeQL *default setup* (SARIF bentrok).
- **P9.4** — PR **#6** `chore/p9.4-release-please` (CI hijau semua; menunggu merge user). Setelah merge, release-please membuka PR "chore: release 0.1.0" → merge → tag `v0.1.0`. Lalu PR kecil: hapus `release-as` dari `release-please-config.json`. Catatan: PR bot dengan GITHUB_TOKEN tidak memicu CI — opsional secret `RELEASE_PLEASE_TOKEN` (PAT) atau close/reopen PR.
- **P9.5** todo (opus): Dockerfile multi-stage + `output: "standalone"` (uji `pnpm build` 2× + e2e), `.dockerignore` (exclude `.env*`), `NEXT_PUBLIC_*` sebagai build-arg, `docker.yml` (buildx amd64/arm64, GHCR **publik** `ghcr.io/ilramdhan/tempe-mak-nuk`, metadata-action semver+sha, SBOM+provenance, Trivy, cosign keyless) dipanggil via `workflow_call` dari `release-please.yml` saat `release_created` (event release dari GITHUB_TOKEN tidak memicu workflow lain); docs/deploy.md.
- **P9.6**: setting repo sudah dilakukan user. Sisa: PR Dependabot — tutup PR lama yang gagal (typescript-eslint tidak mendukung TS 7.0); #3 (npm minor/patch group) & #4 (`@types/node` 26 major — kemungkinan tutup, Node runtime 22) diuji/merge atau tutup; pertimbangkan `ignore` TS 7 / typescript-eslint di dependabot sampai didukung.
- **P9.7** todo (opus): audit akhir → `docs/audit/phase-9.md`, `gh run list` hijau, release + image ter-sign, perbarui HANDOVER/STATE.

## 3a. Catatan teknis baru sesi 7
- `ensureStatic = "navigation"` (Next 16.4) di 4 route `[slug]` + catch-all: unknown slug → 404 asli; halaman itu hanya boleh data `"use cache"` (tanpa cookies/headers/connection/new Date di luar cache), jika tidak build gagal.
- CI tanpa Supabase: `scripts/ci/bootstrap.sql` membuat role anon/authenticated/service_role + skema `auth` minimal; migrasi lewat `scripts/dev/migrate.mts`; seed `pnpm db:seed`.
- RBAC: owner selalu boleh; kunci tak terdaftar → role call-site; role call-site lebih ketat dari default registry = lantai tetap; non-grantable (users/akses/legal) hanya default; else user override → role override → default. UI pakai `useCan()` / `<RoleGate permission=…>` (kosmetik). Action baru WAJIB entri registry (ada test pemindai).
- Motion: komponen memakai `useMotionEffect` (IO + idle → dynamic import GSAP); barrel `@/components/motion` tidak lagi mengekspor gsap — impor dari `@/components/motion/gsap`.
- `listCmsPagesForSitemap` (pages catch-all) dipakai sitemap; `src/features/pages/slugs.ts` daftar slug reserved + test pemindai `src/app`.
- `.env` dan `.env.local` punya `CRON_SECRET` berbeda (Next memakai `.env.local`).

## 4. Keputusan terkunci
- **Tagline hero:** "Tiga bahan, tanpa jalan pintas." · Slot/PO: "Tempe yang layak ditunggu." · /tentang: "Dari dapur Mak, tanpa jalan pintas."
- **Stack terpasang:**
  - Next 16.4.2 (App Router, Turbopack, `cacheComponents: true`, `partialPrefetching: true`), React 19.3, TS 5.9 strict, Tailwind 4.3.3, shadcn (radix-nova).
  - lucide-react, next-themes, GSAP 3.15 + @gsap/react, Lenis 1.3 (paket `motion` dihapus sesi 7).
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
  - **Hapus artikel/resep: owner-only (default registry, bisa diberikan owner ke editor lewat `/admin/akses`).** Izin lain juga dinamis (P8.14).
  - Tab "SEO & situs": editor boleh `seo.*`/`cta.*`, `site.*` owner (P8.9, `src/features/settings/roles.ts`).

## 5. API yang sudah ada (pakai, jangan duplikasi)
- **UI:**
  - `@/components/site/primitives` (Container, Section, Heading, Eyebrow, Lead, Prose, Grid, Stack, Divider).
  - `@/components/ui/*` (pakai `field`, bukan `form`).
  - `@/components/brand/*`.
  - `@/components/motion` (gsap diimpor dari `@/components/motion/gsap`; dimuat lazy lewat `useMotionEffect`/`lenis-provider.tsx`).
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
- Status akhir sesi 7: lint ✓, typecheck ✓, ±416 test ✓, build ✓, e2e (CI) hijau; CI GitHub hijau di `main`.
- `pnpm lint` mengabaikan `playwright-report/` dan `test-results/`.

## 8. Menunggu dari user (jangan memblokir)
- **Sudah diputuskan sesi 7:** repo publik; LICENSE proprietary (done); hapus artikel/resep owner-only + RBAC dinamis (done, P8.14); desain sticky bar/WA ikut rekomendasi (done, P8.12); ruleset `main` + required checks + secret scanning + Dependabot security updates + PVR sudah disetel user; topics sudah ditambah.
- **Merge PR dilakukan USER** (auto-mode menolak `gh pr merge --admin`): orkestrator buat branch + PR (template) + pastikan CI hijau, lalu minta user merge.
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
1. Cek awal: `git status` (sisa P8.7?), `git fetch && git log --oneline origin/main | head`, `gh pr list`, `gh run list -L 5`, `pnpm typecheck && pnpm test`, `make db-status` (0000–0004 ✓).
2. Selesaikan P8.7 (lihat §3) → PR. Pastikan PR #6/#7 sudah di-merge user (ingatkan bila belum).
3. Gelombang: P8.8 (sonnet) ‖ P9.5 (opus) ‖ P9.6 Dependabot (sonnet). Lalu rilis v0.1.0 (merge PR release-please) → pastikan workflow docker jalan → P9.7 (opus).
4. Akhir sesi: perbarui `HANDOVER.md` + `STATE.md` (log sesi) lewat PR.
````
