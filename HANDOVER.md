# HANDOVER — Tempe Mak Nuk (sesi 1 → sesi 2)

> Paste blok di bawah ini apa adanya ke sesi Claude Code baru, di root project
> `/Users/ilhamramadhan/WebstormProjects/tempe-mak-nuk`.

---

````markdown
Kamu melanjutkan project **Tempe Mak Nuk** (website brand + CMS admin, produsen tempe handmade sejak 2001, Klaten). Fase 0–3 sudah selesai, diverifikasi, dan di-commit. Jangan analisa ulang dari nol; baca file berikut, lalu lanjut ke Fase 4 + 5 secara paralel.

## 1. Baca dulu (urut, jangan skip)
1. `STATE.md` — ledger status per task (sumber kebenaran progres).
2. `PLAN.md` — task Fase 4–7: ID, model, dependensi, file ownership, acceptance, template prompt sub-agent.
3. `PROMPT.md` — spesifikasi lengkap (IA §4, fitur §5, cookie/legal §5.4, design §6, motion §7, SEO §9, security §12).
4. `docs/brand.md` (tagline, tone, microcopy, token), `docs/business.md` (data dummy = seed settings), `docs/seo.md` (keyword/title/meta per route), `docs/photo-brief.md`.
5. `AGENTS.md` — WAJIB baca docs Next.js bawaan di `node_modules/next/dist/docs` sebelum menulis kode Next.

## 2. Cara kerja (wajib)
- Kamu = orkestrator. Kerjakan via sub-agent (Agent tool), **paralel** untuk task yang dependensinya sudah `done` dan ownership file-nya tidak bertumpuk — kirim banyak Agent call dalam satu pesan.
- **Model dinamis:** `model: "opus"` untuk task bertanda O di PLAN (layout global, beranda, Order Builder, auth admin, page builder, slot admin, editor Tiptap, media, audit performa, review). `model: "sonnet"` untuk task S (halaman konten, CRUD sederhana, SEO helper, OG, test, docs).
- Gunakan template prompt "Protokol Sub-agent" di `PLAN.md`. Setiap sub-agent: hanya menyentuh file ownership-nya, hanya mengedit baris task-nya di `STATE.md`, tidak commit, tidak menambah dependency (orkestrator yang `pnpm add` di muka bila perlu — hindari konflik `package.json`).
- Setelah sub-agent selesai: orkestrator verifikasi sendiri `pnpm typecheck && pnpm lint && pnpm test && pnpm build`, cek `git status` (jangan commit file milik agent yang masih jalan), lalu commit per kelompok dengan trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Jangan percaya klaim sub-agent mentah-mentah: cek versi/hasil yang meragukan (contoh sesi 1: versi GitHub Actions ternyata usang → sudah diperbaiki ke checkout@v7/setup-node@v7/pnpm action-setup@v6).
- Laporan ke user dalam Bahasa Indonesia, ringkas.

## 3. Status (per 2026-10-16, HEAD `ca370c4`)
- **Done:** P0.1–P0.5, P1.1–P1.3, P1.5, P2.1–P2.5, P3.1–P3.5.
- **Review:** P1.4 (CI siap; link Vercel menunggu akun user).
- **Todo:** P0.6 (install skills eksternal — opsional, jangan memblokir), seluruh Fase 4 (P4.1–P4.11), Fase 5 (P5.1–P5.10), Fase 6, Fase 7.
- **Langkah berikutnya (gelombang 1, paralel):** `P4.1` (O, header/footer/announcement/WA float/breadcrumb + mount `LenisProvider` & `TooltipProvider` di layout `(site)`) **dan** `P5.1` (O, auth admin + guard + layout sidebar).
  **Gelombang 2** setelah P4.1: P4.2 (O) · P4.4 (O) · P4.3, P4.6, P4.7, P4.8, P4.9, P4.10, P4.11 (S). Setelah P4.4: P4.5 (S).
  **Gelombang 2b** setelah P5.1: P5.3, P5.5, P5.6, P5.8 (O) · P5.2, P5.4, P5.7, P5.9, P5.10 (S).
  Lalu Fase 6 (P6.1–P6.3 S, P6.4 O) → Fase 7.
  Batasi ±4–5 sub-agent bersamaan agar build/verify tidak saling ganggu.

## 4. Keputusan terkunci
- **Tagline hero:** "Tiga bahan, tanpa jalan pintas." (kedelai, air, ragi). Slot/PO: "Tempe yang layak ditunggu." · /tentang: "Dari dapur Mak, tanpa jalan pintas."
- **Stack terpasang:** Next 16.4.2 (App Router, Turbopack, `cacheComponents: true`, `partialPrefetching: true`), React 19.3, TS 5.9 strict, Tailwind 4.3.3 via `@tailwindcss/turbopack` (BUKAN postcss), shadcn (style radix-nova, `radix-ui`), lucide-react, next-themes, GSAP 3.15 + @gsap/react, Lenis 1.3, Motion 14, Zod 4, Drizzle 0.45 + postgres-js, @supabase/ssr 0.12, react-hook-form, sonner, cmdk, react-day-picker, Vitest 5, pnpm 12.8.
- **Belum terpasang (tambahkan oleh orkestrator saat dibutuhkan):** Tiptap (P5.6), TanStack Table/Query + dnd-kit (Fase 5), sharp/upload pipeline (P5.8), Playwright + @axe-core/playwright (P7.1), @vercel/analytics + speed-insights (P4.11/P6).
- **Data dummy** (`docs/business.md`) = seed tabel `settings` (50 kunci). Tidak boleh ada nilai bisnis di-hard-code di komponen — selalu `getSettings()`.
- **Testimoni** = placeholder (`isPlaceholder=true`) → UI wajib memberi label. Gizi TKPI sama untuk 2 varian (perlu verifikasi owner). Legal = "Dokumen contoh — perlu ditinjau ahli hukum".
- **Cookie consent** config di `settings["consent.config"]` `{version, bannerText, categories[]}`; cookie `tmn_consent`.

## 5. API yang sudah ada (pakai, jangan duplikasi)
- **Design tokens** (`src/styles/globals.css`): warna shadcn-compatible + `surface, accent-strong (teks emas AA), halal, slot-available|nearly|full|closed`; radius 4/10/20/full; text `display-xl, display, h1–h4, lead, body, small, caption, eyebrow`; `py-section`, `py-section-tight`, `px-gutter`, `max-w-measure|content|wide`; utilitas `grain`; `.prose-tmn`. `--border` hanya dekoratif, kontrol pakai `--input`. Tombol accent pakai teks gelap.
- **Primitives** `@/components/site/primitives`: `Container(size, bleed)`, `Section(as, tone default|surface|primary|inverse, spacing, grain, id)`, `Heading(level 1–4, size)`, `Eyebrow(rule, tone)`, `Lead(muted)`, `Prose`, `Grid(cols, gap)`, `Stack`, `Divider`. Gap hanya skala `2xs…2xl, section`. **Tidak boleh spacing ad-hoc.**
- **UI** `@/components/ui/*` (29 komponen shadcn). `Button` variant `primary|secondary|ghost|accent|link|destructive`, size `xs|sm|md|lg|icon…`, pill, `asChild`. `Badge` + `SlotBadge status`. Pakai `field` (bukan `form`, deprecated).
- **Brand** `@/components/brand/logo` (`Logo variant horizontal|stacked|monogram|favicon`, min size di brand.md §8), `@/components/brand/textures` (`MyceliumPattern, SoyDots, BananaLeafLines, ImagePlaceholder`). SVG logo hasil generator (`scripts/brand/`) — jangan edit path manual.
- **Theme** `@/components/theme` (`ThemeProvider` sudah di root layout, `ThemeToggle`).
- **Motion** `@/components/motion` (import gsap/ScrollTrigger/useGSAP DARI SINI, bukan dari "gsap"): `LenisProvider`, `useLenis`, `useReducedMotion`, `Reveal(stagger)`, `SplitReveal(trigger load|scroll — hero: as="h1" trigger="load")`, `Parallax`, `Marquee` (CSS, aman di RSC), `PinnedStory(steps, renderMedia)` (CSS sticky), `Counter` (sejak 2001: `value={2001} from={1980} format={{useGrouping:false}}`), `Magnetic`. Demo: `/dev/motion`, `/dev/ui` (404 di production).
- **Data (server-only, cached, tag di `src/lib/cache-tags.ts`)** per `src/features/<domain>/queries.ts`: `getSettings/getSetting/getOrderRules`, `getPage(slug)/getPageMeta/getRedirects`, `<BlockRenderer blocks firstHeadingLevel/>` + `BLOCK_REGISTRY/BLOCK_LIST/getBlockDefaults` (17 tipe blok), `getNavigation/getNav/getActiveAnnouncement`, `getProducts/getProductBySlug/getProductOptions/getProductSlugs`, `getPosts/getPostBySlug/getRelatedPosts/getPostSlugs`, `getRecipes/getRecipeBySlug/getRelatedRecipes/getRecipeSlugs`, `getCategories/getTags`, `getFaqs/queryFaqs/groupFaqs/faqAnswerPlainText`, `getTestimonials/queryTestimonials`, `getSlotData/getAvailability({now,days})`, `getLegalDocument/LEGAL_ROUTES`, `getMediaByIds`.
- **Pure libs:** `features/slots/availability.ts` (`computeAvailability, latestOrderDeadline, earliestOrderableDate, toBadgeStatus, AVAILABILITY_LABEL`), `lib/dates` (Asia/Jakarta, `formatDateLong`, `formatDeadline`), `lib/wa-link` (`buildWaLink, buildWaMessage, normalizeWaNumber`), `lib/rich-text` (`<RichText doc/>`, `extractHeadings`, `richTextToPlainText`), `features/_shared/format` (`formatIdr, formatPriceFrom, formatMinutes`). Public action `trackWaClick({source,kind,variant})`.
- **Admin:** `queries.admin.ts` per domain (`list*ForAdmin, get*ForAdmin, getWaClickStats, getPageForAdmin`), `actions.ts` per domain (requireRole → Zod → transaksi → audit → `updateTag` → `ActionResult {ok,data|error,fieldErrors}`). Auth: `src/lib/auth/require-role.ts` (`requireRole(role,{onFail})`, `getSessionUser`, `hasRole`). Hook guard proxy: isi `guardAdminRoute()` di `src/lib/supabase/proxy.ts` (P5.1). Owner-only: hapus produk/halaman, legal, settings grup business/legal/halal/order/consent/site.

## 6. Gotcha teknis (sudah pernah kena)
- `cacheComponents: true`: baca DB di page/route butuh `"use cache"` atau `await connection()` dalam `<Suspense>`. `getAvailability` butuh `now` → panggil `connection()` dulu. Supabase server client membaca `cookies()` → route jadi dinamis; jangan dipakai di halaman publik statis.
- Next 16: middleware = `src/proxy.ts`. Server Action pakai `updateTag`; route handler pakai `revalidateTag(tag, "max")`.
- Jangan import db di top-level modul; selalu `getDb()` di dalam fungsi. Tanpa DATABASE_URL query mengembalikan fallback (build CI tetap jalan).
- `pnpm typecheck` = `next typegen && tsc --noEmit` (typegen wajib).
- pnpm 12 `allowBuilds` di `pnpm-workspace.yaml` (esbuild: true). Paket baru dengan build script perlu di-approve di sana.
- CSP di `next.config.ts` memakai `'unsafe-inline'` script (bukan nonce, agar halaman tetap statis); embed baru → tambah ke `frame-src`. CSP/host gambar ditentukan saat build dari `NEXT_PUBLIC_SUPABASE_URL`.
- shadcn CLI cenderung menimpa `globals.css`, `layout.tsx`, dan `lib/utils.ts` — setelah `shadcn add`, cek `git diff` dan pulihkan.
- `pnpm format` = `prettier --write .` seluruh repo → sub-agent sebaiknya hanya format file miliknya (`pnpm prettier --write <files>`).
- Drizzle connection bypass RLS → setiap Server Action WAJIB cek role sendiri.

## 7. Lingkungan lokal
- DB lokal: container Docker **`tmn-dev`** (image `public.ecr.aws/supabase/postgres:15.19.0.002`, port **54329**, volume `tmn-dev-data`), sudah dimigrasi & di-seed. Jika mati: `docker start tmn-dev`.
- `.env.local` (tidak di-commit): `SKIP_ENV_VALIDATION=1`, `NEXT_PUBLIC_SITE_URL`, `DATABASE_URL`/`DIRECT_URL` ke 54329, `CRON_SECRET`, `REVALIDATE_SECRET`. Belum ada Supabase Auth lokal → untuk P5.1 pertimbangkan `supabase start` (CLI belum terpasang; `brew install supabase/tap/supabase`) atau minta project Supabase ke user.
- Perintah: `pnpm dev`, `pnpm db:migrate`, `pnpm db:seed` (idempotent), `pnpm db:generate`, validasi seed vs schema blok: `DOTENV_CONFIG_PATH=.env.local pnpm tsx --tsconfig tsconfig.json scripts/dev/validate-sections.mts`. Test RLS: lihat `tests/rls/README.md`.
- Chrome tersedia di `/Applications/Google Chrome.app` untuk screenshot headless (Playwright belum terpasang).

## 8. Menunggu dari user (jangan memblokir; lanjut dengan dummy)
- Project Supabase (URL, anon key, service role, connection string pooler 6543 + direct 5432) → `pnpm db:migrate && pnpm db:seed`, matikan public sign-up, buat akun owner pertama.
- Akun/Project Vercel + domain → env Vercel, link repo GitHub (repo belum di-push ke remote).
- Data asli (WA, alamat, nomor halal, foto) → cukup diubah dari Admin → Pengaturan setelah Fase 5.

## 9. Mulai sekarang
1. `git log --oneline | head` dan `pnpm typecheck && pnpm test` untuk memastikan kondisi bersih.
2. Update header `STATE.md` (fase aktif: 4+5, log sesi baru).
3. Luncurkan P4.1 (opus) dan P5.1 (opus) paralel, lalu gelombang berikutnya sesuai §3.
````
