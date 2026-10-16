# STATE — Tempe Mak Nuk

> Ledger progres. **Sumber kebenaran** untuk resume setelah token habis / ganti sesi / ganti akun.
> Aturan: setiap sub-agent hanya mengedit baris task miliknya. Orkestrator mengedit header & log.
> Status: `todo` · `doing` · `review` · `done` · `blocked` · `skipped`

## Ringkasan

- **Fase aktif:** 4 + 5 (Fase 0–3 selesai)
- **Terakhir diperbarui:** 2026-10-16
- **Branch / commit terakhir:** main / lihat `git log`
- **Preview URL:** —

## Keputusan & Data Terkunci

| Kunci | Nilai | Sumber |
|---|---|---|
| Tagline | "Tiga bahan, tanpa jalan pintas." | P0.2 |
| Nomor WA | 6281234567890 (dummy, settings) | P0.1 |
| No. Halal | ID33110012345670124 (dummy) | P0.1 |
| Lead time / cutoff | 4 hari / 15:00 WIB | P0.1 |
| Slot/hari | 8 | P0.1 |
| Tampilkan harga | ya, "mulai dari" | P0.1 |
| Domain | tempemaknuk.com (dummy) | P0.1 |
| Skills aktif | — | P0.6 |

## Task

| ID | Task | Model | Dep | Status | Agent | Catatan / file utama |
|---|---|---|---|---|---|---|
| P0.1 | Lengkapi §0 Data Bisnis bersama pemilik; tulis `docs/business.md` | S | — | done | orchestrator | dummy data, editable via admin |
| P0.2 | Brand: 8 tagline + skor, tone of voice, kamus kata (dipakai/dilarang) | O | — | done | opus | `docs/brand.md`: tagline, tone, kamus, microcopy, token OKLCH + kontras terhitung (+ `--accent-strong`, `--input`, slot tokens), Fraunces + Geist fluid scale |
| P0.3 | Logo SVG (wordmark, stacked, monogram, favicon) light/dark | O | P0.2 | done | opus | `public/brand/*.svg`, `src/components/brand/logo.tsx`; teks di-outline jadi path, currentColor, cek render 16–400px |
| P0.4 | Photo brief + prompt AI image per shot | S | P0.2 | done | sonnet | 26 shot (S01–S26), prompt AI Inggris, panduan foto HP: docs/photo-brief.md |
| P0.5 | Riset keyword & peta keyword → halaman | S | — | done | sonnet | peta keyword per route, 8 pilar, 6 resep, linking, JSON-LD, off-page: docs/seo.md |
| P0.6 | Install/aktifkan skills §13, catat yang gagal | S | — | todo | | |
| P1.1 | Scaffold Next.js 16 + TS strict + Tailwind v4 + pnpm + ESLint/Prettier + struktur folder §11 | O | — | done | opus | Next 16.4.2 (Turbopack, cacheComponents+partialPrefetching on), React 19.3.0, Tailwind 4.3.3 via @tailwindcss/turbopack, TS 5.9.3, ESLint 9, Vitest 5, Drizzle 0.45/kit 0.31; typecheck/lint/build/test hijau |
| P1.2 | `lib/env.ts` (Zod), Supabase clients (`@supabase/ssr`), security headers | O | P1.1 | done | opus | `src/lib/env.ts` lazy getServerEnv/getClientEnv + SKIP_ENV_VALIDATION; supabase server/client/admin + `src/proxy.ts` (getClaims refresh, hook `guardAdminRoute` di `src/lib/supabase/proxy.ts`); CSP/HSTS/headers + remotePatterns di next.config (Supabase host dibaca saat build) |
| P1.3 | Drizzle setup: client pooler (`prepare:false`), drizzle.config, script migrate/seed | O | P1.1 | done | opus | `drizzle.config.ts` (DIRECT_URL→fallback DATABASE_URL), `src/db/client.ts` lazy `getDb()/getSql()` prepare:false, schema barrel kosong, `src/db/seed.ts` → `runSeed` no-op; migrate belum dijalankan (butuh Supabase) |
| P1.4 | CI: GitHub Actions (typecheck, lint, test, build); Vercel project + env | S | P1.1 | review | sonnet | CI ready; Vercel link pending user account |
| P1.5 | Vercel Cron keepalive Supabase | S | P1.3 | done | opus | `/api/cron/keepalive` Bearer CRON_SECRET (sha256+timingSafeEqual), select 1 → 200/401/503; vercel.json `17 3 * * *` (10:17 WIB) |
| P2.1 | Token warna/tipografi/spacing/radius (`@theme`, OKLCH), next-themes tanpa flash | O | P1.1, P0.2 | done | opus | `src/styles/globals.css` (shadcn-named OKLCH tokens + surface/accent-strong/halal/slot-*, fluid text-display-xl…caption, py-section, px-gutter, grain, .prose-tmn), `src/lib/fonts.ts` (Fraunces opsz+SOFT, Geist), `src/components/theme/*`, viewport themeColor; `/dev/ui` showcase (dev only); `cn()` di `src/lib/utils.ts` sementara, ganti di P2.2 |
| P2.2 | shadcn init + primitives (button, input, select, dialog, sheet, accordion, tabs, calendar, toast, badge, card) disesuaikan token | S | P2.1 | done | sonnet | shadcn radix-nova init (neutral, lucide), 30 comps in `src/components/ui`; Button variants primary/secondary/ghost/accent/link/destructive, sizes xs/sm/md/lg/icon(-xs/-sm/-lg), pill, asChild; Badge incl. halal + available/nearly/full/closed, `SlotBadge`; inputs on bg-card, h-11; `cn` = clsx+twMerge; `/dev/ui` #components demo (light+dark). Tokens untouched; globals.css only +2 imports (tw-animate-css, shadcn/tailwind.css) |
| P2.3 | Layout primitives: `Container`, `Section`, `Heading`, `Eyebrow`, `Prose`, `Grid` — satu sumber gap & typo | O | P2.1 | done | opus | `src/components/site/primitives/*`: Container, Section (tone default/surface/primary/inverse, grain), Heading (level≠size), Eyebrow, Lead, Prose, Grid, Stack, Divider; gap scale `GAP` di types.ts; dicek 375/1440px light+dark |
| P2.4 | Motion kit: Lenis provider, `Reveal`, `SplitReveal`, `Parallax`, `Marquee`, `PinnedStory`, `Counter`, reduced-motion guard | O | P1.1 | done | opus | `src/components/motion/*` (barrel `@/components/motion`): gsap.ts (single registerPlugin + EASE/DURATION/STAGGER/MEDIA), LenisProvider+useLenis+scrollToTarget (GSAP ticker, off under reduced motion, anchors), useReducedMotion, Reveal, SplitReveal (load/scroll, autoSplit mask lines), Parallax, Marquee (CSS, server-safe), PinnedStory (CSS sticky md+, stacked fallback), Counter (SSR final value, no CLS), Magnetic; pre-hide CSS only under `scripting:enabled` + motion + 4s failsafe; `/dev/motion` demo (404 in prod). LenisProvider NOT in root layout (P4.1) |
| P2.5 | Tekstur/motif (grain SVG, pola miselium, daun pisang) + placeholder gambar ber-art-direction | S | P2.1, P0.3 | done | sonnet | `src/components/brand/textures`: MyceliumPattern, BananaLeafLines, SoyDots, ImagePlaceholder (all <2KB) |
| P3.1 | Schema Drizzle: `settings`, `pages`, `page_sections`(JSON blocks), `nav_items`, `announcements`, `products`, `product_shapes`, `product_sizes`, `nutrition`, `media`, `posts`, `recipes`, `categories`, `tags`, `faqs`, `faq_categories`, `testimonials`, `slot_days`, `holidays`, `wa_clicks`, `profiles`(role), `audit_log`, `redirects` | O | P1.3 | done | opus | 27 tabel di `src/db/schema/*.ts` (enums, profiles, settings, pages(+nav/announcements/redirects), media, products, content, slots, legal, analytics); `faq_categories` = `categories.kind='faq'`; consent config = settings key `consent.config`; `SETTINGS_KEYS` (group+kind) di `settings.ts`; migrasi `drizzle/0001_schema.sql` |
| P3.2 | RLS policies + fungsi `is_admin()` + test RLS (anon vs editor vs owner) | O | P3.1 | done | opus | Policy via Drizzle `pgPolicy` (di 0001); `is_admin()`/`has_role()` di `drizzle/0000_rls_helpers.sql`; trigger auth.users→profiles (first=owner) + grants di `0002_auth_profile_trigger.sql`; `tests/rls` 17/17 lulus di supabase/postgres 15.19 & postgres:16 + `auth-stub.sql` |
| P3.3 | Zod schema section blocks (hero, richText, featureGrid, compare, steps, cta, faqList, testimonialList, gallery, stats) + renderer server | O | P3.1, P2.3 | done | opus | 17 block types di `src/features/pages/blocks/` (schema.ts `blockSchema` discriminated union, field names = seed; registry.ts label ID + defaults; `<BlockRenderer>` server, safeParse per block, skip invalid + dev log; renderers pakai primitives/ui saja, no motion); `src/lib/rich-text` Tiptap→React tanpa dangerouslySetInnerHTML + light-markdown; 63/63 seed sections valid (`scripts/dev/validate-sections.mts`) |
| P3.4 | Data layer per domain: `queries.ts` (cache + tags) & `actions.ts` (guarded) | O | P3.1 | done | opus | `src/features/{settings,pages,navigation,products,posts,recipes,taxonomy,faqs,testimonials,slots,legal,media,analytics}` schema/queries("use cache"+cacheTag, fallback tanpa DB)/queries.admin/actions(requireRole→Zod→tx→audit→updateTag, ActionResult); tags `src/lib/cache-tags.ts`; `src/lib/{dates,wa-link,audit}.ts`, `src/lib/auth/require-role.ts`; slot engine `features/slots/availability.ts` (+tests); build hijau dengan & tanpa DATABASE_URL |
| P3.5 | Seed: settings, 2 varian, bentuk/ukuran, FAQ (≥ 20), testimoni placeholder, 8 artikel draft, 6 resep, nav, halaman | S | P3.1, P0.2 | done | pnpm db:seed ×2 idempotent; section data = plain objects (validate vs blocks schemas) | |
| P4.1 | Header (sticky, glass on scroll, mobile full-screen), footer, announcement bar, floating WA, breadcrumb | O | P2.3, P3.4 | done | opus | `src/app/(site)/layout.tsx` (Lenis+Tooltip, skip link, `<main id="main">`); `src/components/site/layout/*` barrel: SiteHeader (glass+hide-on-scroll, Radix Dialog full-screen menu, lenis.stop), AnnouncementBar (localStorage + pre-paint script), SiteFooter (nav cols + settings facts, © via "use cache"), FloatingWhatsApp, WaLink (trackWaClick), Breadcrumb (+BreadcrumbList JSON-LD). Note: `cn()` drops custom `text-*` sizes (Eyebrow affected); jsonb numeric strings parse as numbers (contact.whatsapp) → WA hidden until fixed |
| P4.2 | Beranda `/` (hero split-text, trust marquee, pinned process story, untuk siapa, CTA) | O | P4.1, P2.4 | doing | opus | |
| P4.3 | `/produk` + `/produk/[slug]` (tabel perbandingan, galeri, gizi bersumber) | S | P4.1 | done | sonnet | `src/app/(site)/produk/{page.tsx,[slug]/page.tsx,_components/*}`; CTA ke `/custom-order?produk=<slug>` (param belum dibaca P4.4); gizi TKPI diberi catatan perlu verifikasi |
| P4.4 | **Order Builder** `/custom-order` + lib `wa-link` + validasi lead time (Asia/Jakarta) + unit test | O | P4.1, P3.4 | doing | opus | |
| P4.5 | `/cara-pesan` + kalender slot publik (komponen dipakai ulang di beranda) | S | P4.4 | todo | | |
| P4.6 | `/kemitraan` (B2B) + form inquiry → WA | S | P4.1 | todo | | |
| P4.7 | `/proses`, `/manfaat-tempe`, `/halal-kualitas`, `/tentang` | S | P4.1 | todo | | |
| P4.8 | `/jurnal` (list, kategori, detail, TOC, related, waktu baca) | S | P4.1 | todo | | |
| P4.9 | `/resep` (list, filter, detail, JSON-LD Recipe) | S | P4.1 | todo | | |
| P4.10 | `/faq` (search, grup), `/kontak` (peta lazy), legal, 404/500 | S | P4.1 | todo | | |
| P4.11 | Cookie consent & halaman legal | S | P4.1 | todo | | |
| P5.1 | Auth (login, magic link, logout), guard proxy/middleware, layout sidebar, role gate, audit log helper | O | P3.2, P2.2 | done | opus | `/login` (tab sandi + magic link `shouldCreateUser:false`, RHF+Zod, sonner, error generik), `/auth/callback` (PKCE code / token_hash), `/akses-ditolak`, logout = Server Action `signOut` (`src/lib/auth/actions.ts`); `guardAdminRoute` di `src/lib/supabase/proxy.ts` (anon → `/login?next=`, tanpa env → `?pesan=config`); `sanitizeNextPath` (`/admin*` saja); `requireRole` redirect → `/login` / `/akses-ditolak`, `getAuthState` (React cache); `src/app/(admin)/admin/layout.tsx` (Suspense + noindex) + `src/components/admin/shell/*` (sidebar, mobile sheet, user menu, `PageHeader`, `RoleGate`, `useAdminUser`, `navForRole`); 43 unit test; `audit.ts` tidak diubah. E2E butuh Supabase Auth nyata |
| P5.2 | Dashboard ringkasan (slot minggu ini, klik WA 30 hari, konten draft) | S | P5.1 | todo | | |
| P5.3 | Page builder: edit/urut/hide section blocks per halaman + preview | O | P5.1, P3.3 | doing | opus | |
| P5.4 | Produk, bentuk, ukuran, gizi, galeri | S | P5.1 | todo | | |
| P5.5 | Slot & PO: kalender kapasitas, libur, aturan lead/cutoff | O | P5.1 | doing | opus | |
| P5.6 | Jurnal & Resep: Tiptap editor, draft/publish/schedule, SEO fields | O | P5.1 | todo | | |
| P5.7 | FAQ (dnd urutan), Testimoni, Navigasi/Footer/Announcement/CTA | S | P5.1 | todo | | |
| P5.8 | Media library: upload Storage, resize/WebP, alt wajib | O | P5.1 | todo | | |
| P5.9 | Pengaturan bisnis/SEO/redirect + manajemen pengguna (owner) | S | P5.1 | todo | | |
| P5.10 | Admin Legal & Privasi | S | P5.1 | todo | | |
| P6.1 | `lib/seo` (metadata builder) + JSON-LD helpers semua tipe §9 | S | P4.* | todo | | |
| P6.2 | `sitemap.ts`, `robots.ts`, `manifest.ts`, redirects dari DB | S | P3.4 | todo | | |
| P6.3 | OG image dinamis (`next/og`) global + produk + artikel + resep; icon/apple-icon | S | P0.3 | todo | | |
| P6.4 | Audit performa: LCP/CLS/INP, bundle analyzer, font subset, gambar | O | P4.* | todo | | |
| P7.1 | Playwright: smoke semua route, Order Builder → URL WA, admin CRUD, axe a11y, screenshot 375/768/1440 × light/dark | S | P4.*, P5.* | todo | | |
| P7.2 | Visual consistency review (skill `web-design-guidelines` + `frontend-design`): gap, typo, tombol, ritme | O | P7.1 | todo | | |
| P7.3 | Security review (RLS, actions, headers, upload) | O | P5.* | todo | | |
| P7.4 | README + panduan admin untuk pemilik (Bahasa Indonesia, non-teknis) | S | semua | todo | | |
| P7.5 | Deploy produksi Vercel, domain, Search Console, Google Business Profile checklist | S | P7.2, P7.3 | todo | | |

## Blocker

| Tanggal | Task | Masalah | Butuh dari |
|---|---|---|---|

## Log Sesi

| Tanggal | Sesi/Akun | Yang dikerjakan | Lanjut dari |
|---|---|---|---|
| 2026-10-16 | init | PROMPT.md, PLAN.md, STATE.md dibuat | P0.1 |
| 2026-10-16 | sesi 1 | Fase 0–3 selesai (brand, scaffold, infra, design system, motion, DB+RLS, data layer, seed). HANDOVER.md dibuat | P4.1 + P5.1 |
| 2026-10-16 | sesi 2 | P4.1 + P5.1 done (diverifikasi orkestrator). Fix: drizzle jsonb double-parse (`src/db/client.ts` parser raw text utk oid 114/3802 → string angka spt nomor WA tidak lagi jadi number), `cn()` extendTailwindMerge utk token custom (text-h1…eyebrow, spacing, container), placeholder `/` tanpa `<main>` ganda. HANDOVER.md diperbarui | Gelombang 2: P4.2–P4.11 + P5.2–P5.10 |
| 2026-10-16 | sesi 3 | DB Supabase (remote) di-seed + tabel jejak drizzle dibuat; `.env.local` diarahkan ke Supabase; dep tanstack-table + dnd-kit. Gelombang 2 prio 1 diluncurkan: P4.2, P4.3, P4.4, P5.3, P5.5 | P4.5–P4.11, P5.2–P5.10 |
