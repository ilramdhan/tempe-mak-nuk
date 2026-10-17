# HANDOVER — Tempe Mak Nuk (sesi 3 → sesi 4)

> Paste blok di bawah ini apa adanya ke sesi Claude Code baru, di root project
> `/Users/ilhamramadhan/WebstormProjects/tempe-mak-nuk`.

---

````markdown
Kamu melanjutkan project **Tempe Mak Nuk** (website brand + CMS admin, produsen tempe handmade sejak 2001, Klaten). Fase 0–3 selesai, Fase 4 tinggal **P4.5**, Fase 5 sudah separuh. Semua sudah diverifikasi & di-commit. Jangan analisa ulang dari nol; baca file berikut, lalu lanjut **gelombang 3**.

## 1. Baca dulu (urut, jangan skip)
1. `STATE.md` — ledger status per task (sumber kebenaran progres) + log sesi.
2. `PLAN.md` — task Fase 4–7: ID, model, dependensi, file ownership, acceptance, template "Protokol Sub-agent".
3. `PROMPT.md` — spesifikasi lengkap (IA §4, fitur §5, cookie/legal §5.4, design §6, motion §7, SEO §9, security §12).
4. `docs/brand.md`, `docs/business.md` (data dummy = seed settings), `docs/seo.md`, `docs/photo-brief.md`.
5. `AGENTS.md` — WAJIB baca docs Next.js bawaan di `node_modules/next/dist/docs` sebelum menulis kode Next.

## 2. Cara kerja (wajib)
- Kamu = orkestrator. Kerjakan via sub-agent (Agent tool, `run_in_background`), paralel bila dependensi `done` dan ownership tidak bertumpuk.
- **Model dinamis:** `model: "opus"` untuk task O (berat/sedang: media, editor, review, audit performa), `model: "sonnet"` untuk task S (ringan: halaman konten, CRUD sederhana, SEO helper, OG, test, docs).
- **Maks 3 agent bersamaan.** Sesi 3 berulang kali kena `ECONNREFUSED` dan rate limit 429 dengan 5 agent. Bila agent gagal karena API error → `SendMessage` ke agent yang sama ("lanjutkan dari titik terakhir, cek file yang ada dulu") — konteksnya tetap ada. Di setiap prompt minta: **tulis file satu per satu ke disk segera, respons pendek, path absolut untuk Write**.
- Sub-agent: hanya file ownership-nya + baris task-nya di `STATE.md`; tidak commit; tidak `pnpm add` (orkestrator pasang & commit dulu); tidak `pnpm format` global; **jangan prettier file `src/features/**` yang sudah ada** (repo itu tidak di-prettier — sesi 3 harus revert diff format massal di `pages/actions.ts`).
- **Dev server:** Next 16 menolak dua `next dev` per repo dan dua `next build` bersamaan. Di prompt: "cek `curl localhost:3101/3103/3104` dulu, pakai yang ada; jangan matikan milik agent lain". Admin: agent tidak punya kredensial login → typecheck/lint/test/build + unit test; route `/dev/*` sementara boleh, hapus sebelum selesai.
- Setelah agent selesai: orkestrator verifikasi sendiri `pnpm typecheck && pnpm lint && pnpm test && pnpm build` (tunggu `pgrep -f "next build"` kosong), review file yang disentuh di luar ownership (terutama Server Action baru: role, Zod, cakupan id), lalu commit per task dengan trailer `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Jangan percaya klaim sub-agent mentah-mentah. Contoh sesi 3: agent menulis renderer rich-text sendiri (ganti ke `@/lib/rich-text`), hard-code nama produk di form (ganti ke `getProducts()`), import barrel server dari komponen client (build gagal).
- Laporan ke user dalam Bahasa Indonesia, ringkas.

## 3. Status (per 2026-10-17, HEAD `88ae09c` + update STATE/HANDOVER)
- **Done:** P0.1–P0.5, P1.1–P1.3, P1.5, P2.*, P3.*, P4.1–P4.4, P4.6–P4.11, P5.1–P5.6.
- **Review:** P1.4 (CI siap; link Vercel menunggu akun user).
- **Todo:** P0.6 (opsional), **P4.5**, **P5.7, P5.8, P5.9, P5.10**, Fase 6 (P6.1–P6.4), Fase 7 (P7.1–P7.5).
- **Gelombang 3 (maks 3 paralel):**
  1. P4.5 (S) `/cara-pesan` + kalender slot publik — pakai ulang `SlotCalendar`/`SlotLegend` dari `@/features/orders/components/slot-calendar` (jangan buat kalender baru); ownership `src/app/(site)/cara-pesan/**`, `src/features/slots/components/*`. Setelah selesai, orkestrator ganti `SlotWeek` di `src/components/site/home/slot-teaser.tsx` (ada TODO P4.5).
  2. P5.7 (S) FAQ (dnd), Testimoni, Navigasi/Footer/Announcement/CTA.
  3. P5.9 (S) Pengaturan bisnis/SEO/redirect + manajemen pengguna (owner).
  4. P5.8 (O) Media library — **orkestrator pasang `sharp` dulu** (cek `pnpm view sharp version`, approve build di `pnpm-workspace.yaml` `allowBuilds`), ownership `.../admin/media/**`, `src/app/api/upload/*`. Bucket Supabase Storage perlu dibuat (cek dulu via service role; jika belum ada, buat bucket `media` public-read lewat migrasi/script & laporkan).
  5. P5.10 (S) Admin Legal & Privasi (owner-only).
  Lalu Fase 6 (P6.1–P6.3 S, P6.4 O) → Fase 7.
- **Tugas kecil orkestrator (belum dikerjakan):**
  - Ganti `RichTextField` di `src/app/(admin)/admin/halaman/_components/fields.tsx` ke `RichTextEditor` (snippet di bawah), lalu hapus `halaman/_lib/rich-text-markdown.ts` (+ test-nya) bila tak dipakai lagi:
    ```tsx
    const f = useField<TiptapDoc | null>(path);
    <Wrap id={f.id} label={label} error={f.error} description={description}>
      <RichTextEditor id={f.id} value={f.value ?? null} media={f.ctx.options.media}
        invalid={!!f.error} ariaDescribedBy={describedBy(f.id, !!description, f.error)}
        onChange={(v) => f.set(nullable ? v : (v ?? emptyDoc()))} />
    </Wrap>
    ```
  - **Keputusan untuk user:** hapus artikel/resep saat ini boleh oleh editor (`deletePost`/`deleteRecipe` tanpa owner check), sedangkan hapus halaman/produk owner-only. Tanyakan apakah perlu diseragamkan ke owner-only.
  - Dasbor P5.2 menautkan ke `/admin/jurnal/[id]` dan `/admin/resep/[id]` — pastikan cocok dengan rute P5.6.

## 4. Keputusan terkunci
- **Tagline hero:** "Tiga bahan, tanpa jalan pintas." · Slot/PO: "Tempe yang layak ditunggu." · /tentang: "Dari dapur Mak, tanpa jalan pintas."
- **Stack terpasang:** Next 16.4.2 (App Router, Turbopack, `cacheComponents: true`, `partialPrefetching: true`), React 19.3, TS 5.9 strict, Tailwind 4.3.3 via `@tailwindcss/turbopack`, shadcn (radix-nova), lucide-react, next-themes, GSAP 3.15 + @gsap/react, Lenis 1.3, Motion 14, Zod 4, Drizzle 0.45 + postgres-js, @supabase/ssr 0.12, react-hook-form, sonner, cmdk, react-day-picker, Vitest 5, pnpm 12.8, **@tanstack/react-table 9.3 (API v9!), @dnd-kit core 6.3/sortable 10/utilities 3.2 (tanpa modifiers), Tiptap 3.32 (react, pm, core, starter-kit — sudah termasuk Link & Underline, extension-image, extension-placeholder), @vercel/analytics 2.0 + speed-insights 2.0**.
- **Belum terpasang:** sharp (P5.8), Playwright + @axe-core/playwright (P7.1), TanStack Query (belum dibutuhkan).
- Tidak ada nilai bisnis di-hard-code — selalu `getSettings()` / query DB.
- Testimoni placeholder wajib berlabel. Gizi TKPI sama untuk 2 varian (perlu verifikasi owner). Legal = "Dokumen contoh — perlu ditinjau ahli hukum".
- Cookie consent: `settings["consent.config"]`, cookie `tmn_consent`; analytics hanya setelah consent.

## 5. API yang sudah ada (pakai, jangan duplikasi)
- **Design tokens / primitives / UI / brand / theme / motion:** sama seperti sesi 2 — `@/components/site/primitives` (Container, Section, Heading, Eyebrow, Lead, Prose, Grid, Stack, Divider; gap hanya skala token), `@/components/ui/*` (pakai `field`, bukan `form`), `@/components/brand/{logo,textures}`, `@/components/motion` (import gsap dari sini). `cn()` sudah kenal token custom; token baru di `@theme` → tambahkan di `src/lib/utils.ts`.
- **Data (server-only, cached):** `src/features/<domain>/queries.ts` — settings, pages (+`<BlockRenderer>`, 17 blok), navigation, products, posts, recipes, taxonomy, faqs, testimonials, slots (`getAvailability({now,days})`), legal (`getLegalDocument`, `LEGAL_ROUTES`), media (`getMediaByIds`). Pure: `features/slots/availability.ts`, `lib/dates` (+ `dateKeyToLocalDate/localDateToDateKey`), `lib/wa-link`, `lib/rich-text` (`RichText`, `renderRichText`, `extractHeadings`, `richTextToPlainText`, `TiptapDoc`), `features/_shared/format`.
- **Situs publik:** layout `(site)` sudah render `<main id="main">`, header, footer, FloatingWhatsApp, **ConsentManager** → halaman tidak render `<main>`. `<Breadcrumb>` + `serializeJsonLd` dari barrel `@/components/site/layout` **hanya di server component**; di client impor langsung `@/components/site/layout/wa-link` (barrel menarik kode server-only → build gagal). Semua CTA WA via `<WaLink source kind variant?>`.
- **Order (P4.4)** `@/features/orders`: `SlotCalendar({days, today?, selected?, onSelect?, numberOfMonths?})` (tanpa `onSelect` = read-only) + `SlotLegend` di `components/slot-calendar`; `checkUseDate`, `leadTimeMessage`, `orderWindowEnd`, `ORDER_WINDOW_DAYS`; katalog/skema/pesan (`buildOrderWaLink`), draft localStorage.
- **Consent (P4.11)** `@/features/consent`: `ConsentManager` (sudah di layout), `ConsentSettingsButton` (sudah di footer), `useConsent(category)`.
- **Admin shell:** `<PageHeader>` (satu h1), `<RoleGate role="owner">` (UI saja), `useAdminUser/useHasRole`, `adminAction({role, schema, input, entity, action, run})`. Owner-only di server WAJIB lewat action.
- **Pola admin yang sudah jadi (ikuti, jangan tulis ulang):**
  - `admin/halaman/**` — editor dengan `_components/use-unsaved-guard`, `fields.tsx` (useField, Wrap, describedBy), error mapping server → field, sortable list dnd + keyboard, preview, `savePageContent` (transaksi + optimistic lock `updatedAt`).
  - `admin/slot/_components/use-action.ts` — `useAdminMutation`.
  - `admin/produk/_components/sortable-list.tsx` — list dnd reusable.
  - `admin/jurnal/_shared/*` — editor konten bersama (slug otomatis, status + jadwal WIB, SEO fields, cover dari media).
  - `@/components/admin/editor` — `RichTextEditor({value, onChange, media?, invalid?, ariaDescribedBy?})` (mount client-only; Tiptap `useEditor` memanggil `Math.random()` saat render yang ditolak cacheComponents).
  - Media dipilih via select dari media yang ada (maks 200) → P5.8 menggantinya dengan media picker penuh (buat komponen picker reusable dan laporkan titik penggantian di produk/jurnal/resep/halaman).

## 6. Gotcha teknis (sudah pernah kena)
- `cacheComponents`: baca DB di page butuh `"use cache"` atau `await connection()` dalam `<Suspense>`. `generateStaticParams` WAJIB mengembalikan ≥1 hasil → kalau query gagal saat build (fallback `[]`), build gagal "must return at least one result".
- **Build & DB (sesi 3):** `next build` = 14 worker paralel. `src/db/client.ts` memakai `max: 1` koneksi saat `NEXT_PHASE=phase-production-build` (tanpanya query `use cache` legal timeout). Build tetap via `DATABASE_URL` pooler 6543: host direct `db.<ref>.supabase.co` **IPv6-only** (ENOTFOUND di mesin ini) dan port session pooler 5432 **diblokir** jaringan ini. Jangan ubah tanpa uji `pnpm build` 2×.
- Next 16: middleware = `src/proxy.ts`; Server Action `updateTag`; route handler `revalidateTag(tag, "max")`; `error.tsx` prop = `retry` (bukan `reset`).
- Jangan import db top-level; `getDb()` dalam fungsi. Drizzle bypass RLS → setiap action cek role.
- `pnpm typecheck` = `next typegen && tsc --noEmit`. pnpm 12 `allowBuilds` di `pnpm-workspace.yaml` untuk paket dengan build script.
- CSP `next.config.ts`: `'unsafe-inline'` script; `frame-src` sudah Google Maps; host gambar dari `NEXT_PUBLIC_SUPABASE_URL` saat build.
- shadcn CLI menimpa `globals.css`/`layout.tsx`/`lib/utils.ts` → cek `git diff` setelah `shadcn add`.
- jsonb parser raw text (oid 114/3802) sudah di `src/db/client.ts`; skrip yang membuat `postgres()` sendiri perlu override yang sama bila membaca jsonb via drizzle.
- `usePathname`/`useSearchParams` di client island → bungkus `<Suspense>`. `new Date()` di komponen statis → fungsi `"use cache"`.
- Koordinasi STATE.md: agent yang lama berjalan bisa menimpa baris yang sudah diubah orkestrator (P5.2 sempat kembali ke `doing`). Cek ulang ledger sebelum commit.
- Port 54321 di mesin ini = SSH tunnel (bukan Supabase lokal). Proses lain `next-server v16.3.4` (9router) bukan milik project.
- Headless Chrome `--window-size` min ~500px; 375px via CDP `Emulation.setDeviceMetricsOverride` (Playwright setelah P7.1).

## 7. Lingkungan lokal
- **DB = Supabase remote** (project `mzzktbvkdpwxufaipbla`, region ap-northeast-1). Sudah dimigrasi (3 migrasi tercatat di `drizzle.__drizzle_migrations`) dan di-seed (50 settings, 2 produk, 11 halaman/63 section, 27 FAQ, 8 artikel, 6 resep, legal 4, slot). Latensi ±700 ms/koneksi.
- `.env` (tidak di-commit) berisi kredensial Supabase + secrets. `.env.local` sekarang hanya `SKIP_ENV_VALIDATION=1`, `NEXT_PUBLIC_SITE_URL`, secrets (baris DB Docker dikomentari). Backup versi Docker: `.env.local.docker.bak` (untracked; jangan commit). Container `tmn-dev` (port 54329) masih ada sebagai cadangan offline.
- **Auth:** akun owner sudah dibuat user (profiles.role = owner, terkonfirmasi). **Public sign-up masih aktif** (`disable_signup: false`) → ingatkan user mematikannya.
- Perintah: `pnpm dev`, `pnpm db:migrate`, `pnpm db:seed` (idempotent), `pnpm db:generate`, validasi seed: `pnpm tsx --tsconfig tsconfig.json scripts/dev/validate-sections.mts`. Cek DB cepat: skrip node kecil `postgres(process.env.DATABASE_URL)` dengan `node --env-file=.env` (hapus skrip setelahnya).
- Chrome: `/Applications/Google Chrome.app` (Playwright belum terpasang).

## 8. Menunggu dari user (jangan memblokir)
- Matikan "Allow new users to sign up" di Supabase Auth.
- Uji manual admin setelah login (belum ada yang verifikasi visual dengan sesi nyata): `/admin`, `/admin/halaman` (simpan/hapus/pratinjau), `/admin/slot`, `/admin/produk`, `/admin/jurnal`, `/admin/resep`.
- Keputusan: hapus artikel/resep owner-only atau tidak (§3).
- Akun/Project Vercel + domain → env Vercel (termasuk `DATABASE_URL` pooler 6543, `DIRECT_URL`, Supabase keys, secrets), push repo ke GitHub (belum ada remote).
- Data asli (WA, alamat, nomor halal, foto) → lewat Admin → Pengaturan setelah P5.9.

## 9. Mulai sekarang
1. `git log --oneline | head`, `git status` (hanya `.env.local.docker.bak` untracked), lalu `pnpm typecheck && pnpm test`.
2. Tambah baris log sesi 4 di `STATE.md`; ubah task yang diluncurkan ke `doing`.
3. Luncurkan P4.5, P5.7, P5.9 (3 Agent call dalam satu pesan, sonnet). Sambil menunggu: kerjakan tugas kecil orkestrator (§3: RichTextEditor di page builder). Saat slot kosong: pasang `sharp` → P5.8 (opus), lalu P5.10.
4. Setelah Fase 5 selesai → Fase 6 (P6.1/P6.2/P6.3 sonnet paralel, lalu P6.4 opus) → Fase 7.
5. Setiap task: verifikasi sendiri (typecheck/lint/test/build), review kode di luar ownership, set `done`, commit per task.
````
