# HANDOVER — Tempe Mak Nuk (sesi 2 → sesi 3)

> Paste blok di bawah ini apa adanya ke sesi Claude Code baru, di root project
> `/Users/ilhamramadhan/WebstormProjects/tempe-mak-nuk`.

---

````markdown
Kamu melanjutkan project **Tempe Mak Nuk** (website brand + CMS admin, produsen tempe handmade sejak 2001, Klaten). Fase 0–3 + P4.1 (kerangka situs publik) + P5.1 (auth & shell admin) sudah selesai, diverifikasi, dan di-commit. Jangan analisa ulang dari nol; baca file berikut, lalu lanjut ke **gelombang 2** Fase 4 + 5 secara paralel.

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
- Jangan percaya klaim sub-agent mentah-mentah: cek versi/hasil yang meragukan (contoh sesi 1: versi GitHub Actions usang; sesi 2: agent melaporkan bug di luar ownership-nya → orkestrator reproduksi dulu, baru perbaiki sendiri).
- Laporan ke user dalam Bahasa Indonesia, ringkas.

## 3. Status (per 2026-10-16, HEAD `5b21ee0` + update STATE/HANDOVER)
- **Done:** P0.1–P0.5, P1.1–P1.3, P1.5, P2.1–P2.5, P3.1–P3.5, **P4.1, P5.1**.
- **Review:** P1.4 (CI siap; link Vercel menunggu akun user).
- **Todo:** P0.6 (opsional, jangan memblokir), P4.2–P4.11, P5.2–P5.10, Fase 6, Fase 7.
- **Langkah pertama sesi ini (orkestrator, sebelum spawn):** `pnpm add @tanstack/react-table @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` (dipakai P5.3/P5.4/P5.7/P5.9). Tiptap (P5.6), sharp (P5.8), @vercel/analytics+speed-insights (P4.11) dipasang tepat sebelum task itu diluncurkan. Cek versi terbaru via `pnpm view <pkg> version`; paket dengan build script → approve di `pnpm-workspace.yaml` `allowBuilds`. Commit `package.json`+lockfile sendiri sebelum spawn.
- **Gelombang 2 (paralel, maks ±5 agent bersamaan, isi ulang slot saat ada yang selesai):**
  - Prioritas 1: P4.2 (O, beranda) · P4.4 (O, Order Builder) · P5.3 (O, page builder) · P5.5 (O, slot admin) · P4.3 (S, produk)
  - Prioritas 2: P5.6 (O, Tiptap) · P5.8 (O, media) · P4.7, P4.8, P4.9, P4.10, P4.11, P4.6 (S) · P5.2, P5.4, P5.7, P5.9, P5.10 (S)
  - P4.5 (S) setelah P4.4 selesai.
  Lalu Fase 6 (P6.1–P6.3 S, P6.4 O) → Fase 7.
- **Catatan ownership bertumpuk:** P4.10 (`kebijakan-privasi`, `syarat`) vs P4.11 (`(legal)/**`) → serahkan SEMUA halaman legal ke P4.11, P4.10 hanya `/faq`, `/kontak`, `not-found`/`error`. P4.4 boleh mengubah `src/lib/dates.ts` (tambah saja, jangan ubah API yang ada). P4.5 memiliki `src/features/slots/components/*`; P4.2 mengimpornya belakangan (pakai placeholder/slot lalu orkestrator sambungkan) — atau jalankan P4.2 bagian kalender setelah P4.5.

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

- **Situs publik (P4.1)** `@/components/site/layout`: layout `(site)` SUDAH menyediakan LenisProvider, TooltipProvider, skip link, AnnouncementBar, SiteHeader, `<main id="main">`, SiteFooter, FloatingWhatsApp → **halaman tidak boleh merender `<main>` sendiri**. `<Breadcrumb items={[{label,href?}]} />` (async server, "Beranda" otomatis, keluarkan JSON-LD BreadcrumbList; props `includeHome`, `jsonLd`). `breadcrumbJsonLd(crumbs, siteUrl)`, `serializeJsonLd(data)` (escape `<`) → pakai juga untuk JSON-LD lain/P6.1. **Semua CTA WA wajib** `<WaLink href={buildWaLink(...)} source="home:hero" kind="order|general|b2b" variant?>` (tracking otomatis). FloatingWhatsApp disembunyikan di route dalam `HIDE_FLOATING_WA_ON` di `src/app/(site)/layout.tsx` (sudah `/custom-order`); halaman dengan sticky CTA mobile → beri ruang `pb-24` atau minta orkestrator tambah route.
- **Admin (P5.1)** `@/components/admin/shell`: layout `/admin` sudah memaksa role `editor` (noindex, sidebar 13 modul, Toaster terpasang → cukup `toast.success()`). Tiap halaman: `<PageHeader title description? eyebrow? actions? />` (satu-satunya `<h1>`). Halaman owner-only: `await requireRole("owner", { onFail: "redirect", next: "/admin/xxx" })`. `<RoleGate role="owner" fallback?>` hanya menyembunyikan UI (client). Client hooks: `useAdminUser()`, `useHasRole(role)`. Server Action: pakai `adminAction({ role, schema, input, entity, action, run })` dari `src/features/_shared/admin-action.ts` (requireRole → Zod → tx → audit → updateTag). Auth: `/login`, `/auth/callback`, `/akses-ditolak`, `signOut` di `src/lib/auth/actions.ts`, `sanitizeNextPath` di `src/lib/auth/next-path.ts`. Tanpa env Supabase, `/admin/**` → `/login?pesan=config` — jadi **verifikasi visual halaman admin butuh Supabase Auth** (lihat §8); sampai itu ada, sub-agent admin cukup typecheck/lint/test/build + unit test logika, dan boleh render komponen di route `/dev/*` sementara untuk screenshot (hapus sebelum selesai).
- `src/app/(admin)/admin/page.tsx` saat ini placeholder → milik P5.2.

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
- **Sudah diperbaiki sesi 2:** (a) drizzle `jsonb` double-parse → `src/db/client.ts` set parser raw text untuk oid 114/3802; skrip lain yang membuat `postgres()` sendiri (seed, validate-sections, tests/rls) tidak membaca jsonb via drizzle-ORM — kalau nanti iya, pasang override yang sama. (b) `cn()` kini `extendTailwindMerge` dengan token custom (`text-h1…eyebrow`, `gutter/section`, `measure/content/wide`) → kalau menambah token di `@theme`, tambahkan juga di `src/lib/utils.ts`.
- `forbidden()`/`unauthorized()` butuh flag eksperimental `authInterrupts` — tidak dipakai; role gagal → redirect `/akses-ditolak`.
- `usePathname` di client island bisa suspend di bawah `cacheComponents` → bungkus dengan `<Suspense>`. Tahun berjalan / `new Date()` di komponen statis → hitung di fungsi `"use cache"` (lihat `copyright-year.tsx`).
- Port 54321 di mesin ini adalah SSH tunnel yang menjawab seperti Supabase Auth — jangan dikira Supabase lokal.
- Headless Chrome `--window-size` minimal ~500px; untuk 375px pakai DevTools protocol (`Emulation.setDeviceMetricsOverride`) atau Playwright setelah P7.1. Gunakan port dev unik per agent (3101, 3102, …) dan matikan setelah selesai.

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
1. `git log --oneline | head`, `git status`, `docker ps` (tmn-dev), lalu `pnpm typecheck && pnpm test`.
2. Tambah baris log sesi 3 di `STATE.md`; ubah task yang diluncurkan ke `doing`.
3. `pnpm add` dependensi Fase 5 (§3), commit.
4. Luncurkan gelombang 2 prioritas 1 (5 Agent call dalam satu pesan, `model` sesuai O/S), isi slot berikutnya saat ada yang selesai. Di setiap prompt sub-agent sertakan: ownership persis, API §5 yang relevan (terutama `<main>` sudah ada, `WaLink`, `Breadcrumb`, `PageHeader`, `adminAction`), port dev unik, larangan commit/pnpm add/pnpm format global.
5. Setelah tiap kelompok selesai: verifikasi sendiri (typecheck/lint/test/build + cek bug yang dilaporkan agent), set status `done`, commit per task.
````
