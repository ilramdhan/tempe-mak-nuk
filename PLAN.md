# PLAN — Tempe Mak Nuk

> Rencana eksekusi untuk `PROMPT.md`. Progres dicatat di `STATE.md` (bukan di sini).
> Setiap task: **ID · model · dependensi · file ownership · acceptance**.
> Task dalam satu fase tanpa dependensi satu sama lain → jalankan **paralel**.

Legenda model: **O** = Opus (berat/kritis) · **S** = Sonnet (ringan/sedang).

---

## Fase 0 — Discovery & Fondasi Brand (paralel)

| ID | Task | Model | Dep | Ownership | Acceptance |
|---|---|---|---|---|---|
| P0.1 | Lengkapi §0 Data Bisnis bersama pemilik; tulis `docs/business.md` | S | — | `docs/business.md` | Semua ⟨placeholder⟩ terisi atau ditandai "belum ada" |
| P0.2 | Brand: 8 tagline + skor, tone of voice, kamus kata (dipakai/dilarang) | O | — | `docs/brand.md` | 1 tagline terpilih + alasan |
| P0.3 | Logo SVG (wordmark, stacked, monogram, favicon) light/dark | O | P0.2 | `src/components/brand/*`, `public/brand/*` | Terbaca di 16px & 400px; kontras AA |
| P0.4 | Photo brief + prompt AI image per shot | S | P0.2 | `docs/photo-brief.md` | ≥ 15 shot terdefinisi |
| P0.5 | Riset keyword & peta keyword → halaman | S | — | `docs/seo.md` | Tiap route punya 1 primary + 3–5 secondary keyword |
| P0.6 | Install/aktifkan skills §13, catat yang gagal | S | — | `.claude/` | Daftar skill aktif tercatat di STATE |

## Fase 1 — Scaffold & Infrastruktur

| ID | Task | Model | Dep | Ownership | Acceptance |
|---|---|---|---|---|---|
| P1.1 | Scaffold Next.js 16 + TS strict + Tailwind v4 + pnpm + ESLint/Prettier + struktur folder §11 | O | — | root config, `src/app/layout.tsx` | `pnpm build` lolos |
| P1.2 | `lib/env.ts` (Zod), Supabase clients (`@supabase/ssr`), security headers | O | P1.1 | `src/lib/env.ts`, `src/lib/supabase/*`, `next.config.ts` | Build gagal bila env hilang |
| P1.3 | Drizzle setup: client pooler (`prepare:false`), drizzle.config, script migrate/seed | O | P1.1 | `src/db/client.ts`, `drizzle.config.ts` | `pnpm db:migrate` ke Supabase sukses |
| P1.4 | CI: GitHub Actions (typecheck, lint, test, build); Vercel project + env | S | P1.1 | `.github/`, `vercel.json` | Preview deploy hijau |
| P1.5 | Vercel Cron keepalive Supabase | S | P1.3 | `src/app/api/cron/*` | Endpoint menolak tanpa `CRON_SECRET` |

## Fase 2 — Design System (paralel setelah P1.1)

| ID | Task | Model | Dep | Ownership | Acceptance |
|---|---|---|---|---|---|
| P2.1 | Token warna/tipografi/spacing/radius (`@theme`, OKLCH), next-themes tanpa flash | O | P1.1, P0.2 | `src/styles/globals.css`, `src/components/theme/*` | Semua pasangan teks/latar AA di light & dark |
| P2.2 | shadcn init + primitives (button, input, select, dialog, sheet, accordion, tabs, calendar, toast, badge, card) disesuaikan token | S | P2.1 | `src/components/ui/*` | Storybook-lite page `/dev/ui` (dev only) |
| P2.3 | Layout primitives: `Container`, `Section`, `Heading`, `Eyebrow`, `Prose`, `Grid` — satu sumber gap & typo | O | P2.1 | `src/components/site/primitives/*` | Dipakai di semua halaman, tidak ada spacing ad-hoc |
| P2.4 | Motion kit: Lenis provider, `Reveal`, `SplitReveal`, `Parallax`, `Marquee`, `PinnedStory`, `Counter`, reduced-motion guard | O | P1.1 | `src/components/motion/*` | 0 CLS, cleanup terverifikasi, reduced-motion mematikan scrub |
| P2.5 | Tekstur/motif (grain SVG, pola miselium, daun pisang) + placeholder gambar ber-art-direction | S | P2.1, P0.3 | `src/components/brand/textures/*` | < 4 KB per motif |

## Fase 3 — Data Model & CMS Core

| ID | Task | Model | Dep | Ownership | Acceptance |
|---|---|---|---|---|---|
| P3.1 | Schema Drizzle: `settings`, `pages`, `page_sections`(JSON blocks), `nav_items`, `announcements`, `products`, `product_shapes`, `product_sizes`, `nutrition`, `media`, `posts`, `recipes`, `categories`, `tags`, `faqs`, `faq_categories`, `testimonials`, `slot_days`, `holidays`, `wa_clicks`, `profiles`(role), `audit_log`, `redirects` | O | P1.3 | `src/db/schema/*` | Migrasi bersih, index FK & slug, timestamps |
| P3.2 | RLS policies + fungsi `is_admin()` + test RLS (anon vs editor vs owner) | O | P3.1 | `src/db/migrations/*rls*`, `tests/rls/*` | Anon tidak bisa insert/baca draft |
| P3.3 | Zod schema section blocks (hero, richText, featureGrid, compare, steps, cta, faqList, testimonialList, gallery, stats) + renderer server | O | P3.1, P2.3 | `src/features/pages/*` | Block tak dikenal → diabaikan aman |
| P3.4 | Data layer per domain: `queries.ts` (cache + tags) & `actions.ts` (guarded) | O | P3.1 | `src/features/*/queries.ts|actions.ts` | Setiap action cek role + `revalidateTag` |
| P3.5 | Seed: settings, 2 varian, bentuk/ukuran, FAQ (≥ 20), testimoni placeholder, 8 artikel draft, 6 resep, nav, halaman | S | P3.1, P0.2 | `src/db/seed/*` | `pnpm db:seed` idempotent |

## Fase 4 — Situs Publik (paralel per halaman setelah P2.x + P3.3/3.4)

| ID | Task | Model | Dep | Ownership |
|---|---|---|---|---|
| P4.1 | Header (sticky, glass on scroll, mobile full-screen), footer, announcement bar, floating WA, breadcrumb | O | P2.3, P3.4 | `src/components/site/layout/*` |
| P4.2 | Beranda `/` (hero split-text, trust marquee, pinned process story, untuk siapa, CTA) | O | P4.1, P2.4 | `src/app/(site)/page.tsx`, `src/components/site/home/*` |
| P4.3 | `/produk` + `/produk/[slug]` (tabel perbandingan, galeri, gizi bersumber) | S | P4.1 | `src/app/(site)/produk/**` |
| P4.4 | **Order Builder** `/custom-order` + lib `wa-link` + validasi lead time (Asia/Jakarta) + unit test | O | P4.1, P3.4 | `src/app/(site)/custom-order/**`, `src/features/orders/*`, `src/lib/dates.ts` |
| P4.5 | `/cara-pesan` + kalender slot publik (komponen dipakai ulang di beranda) | S | P4.4 | `src/app/(site)/cara-pesan/**`, `src/features/slots/components/*` |
| P4.6 | `/kemitraan` (B2B) + form inquiry → WA | S | P4.1 | `src/app/(site)/kemitraan/**` |
| P4.7 | `/proses`, `/manfaat-tempe`, `/halal-kualitas`, `/tentang` | S | P4.1 | `src/app/(site)/{proses,manfaat-tempe,halal-kualitas,tentang}/**` |
| P4.8 | `/jurnal` (list, kategori, detail, TOC, related, waktu baca) | S | P4.1 | `src/app/(site)/jurnal/**` |
| P4.9 | `/resep` (list, filter, detail, JSON-LD Recipe) | S | P4.1 | `src/app/(site)/resep/**` |
| P4.10 | `/faq` (search, grup), `/kontak` (peta lazy), legal, 404/500 | S | P4.1 | `src/app/(site)/{faq,kontak,kebijakan-privasi,syarat}/**`, `src/app/not-found.tsx` |

| P4.11 | Cookie consent (banner + dialog preferensi + gate script) & halaman legal (privasi, S&K, cookie, pemesanan) | S | P4.1 | `src/features/consent/*`, `src/app/(site)/(legal)/**` |

Acceptance umum Fase 4: hanya memakai primitives P2.3 & block P3.3; responsif 320–1920; light/dark; satu `h1`; metadata unik; tanpa teks hard-code yang semestinya dari CMS.

## Fase 5 — Dashboard Admin (paralel per modul setelah P5.1)

| ID | Task | Model | Dep | Ownership |
|---|---|---|---|---|
| P5.1 | Auth (login, magic link, logout), guard proxy/middleware, layout sidebar, role gate, audit log helper | O | P3.2, P2.2 | `src/app/(admin)/admin/layout.tsx`, `src/app/(auth)/**`, `src/lib/auth/*` |
| P5.2 | Dashboard ringkasan (slot minggu ini, klik WA 30 hari, konten draft) | S | P5.1 | `src/app/(admin)/admin/page.tsx` |
| P5.3 | Page builder: edit/urut/hide section blocks per halaman + preview | O | P5.1, P3.3 | `src/app/(admin)/admin/halaman/**` |
| P5.4 | Produk, bentuk, ukuran, gizi, galeri | S | P5.1 | `.../admin/produk/**` |
| P5.5 | Slot & PO: kalender kapasitas, libur, aturan lead/cutoff | O | P5.1 | `.../admin/slot/**` |
| P5.6 | Jurnal & Resep: Tiptap editor, draft/publish/schedule, SEO fields | O | P5.1 | `.../admin/{jurnal,resep}/**`, `src/components/admin/editor/*` |
| P5.7 | FAQ (dnd urutan), Testimoni, Navigasi/Footer/Announcement/CTA | S | P5.1 | `.../admin/{faq,testimoni,navigasi}/**` |
| P5.8 | Media library: upload Storage, resize/WebP, alt wajib | O | P5.1 | `.../admin/media/**`, `src/app/api/upload/*` |
| P5.9 | Pengaturan bisnis/kontak/sosial/halal/PO/SEO/redirect + manajemen pengguna (owner) — semua kunci `docs/business.md` | S | P5.1 | `.../admin/{pengaturan,pengguna}/**` |
| P5.10 | Legal & Privasi: editor dokumen legal (versi, tanggal berlaku), teks & kategori consent | S | P5.1 | `.../admin/legal/**` |

## Fase 6 — SEO, OG & Performa (paralel)

| ID | Task | Model | Dep | Ownership |
|---|---|---|---|---|
| P6.1 | `lib/seo` (metadata builder) + JSON-LD helpers semua tipe §9 | S | P4.* | `src/lib/seo/*` |
| P6.2 | `sitemap.ts`, `robots.ts`, `manifest.ts`, redirects dari DB | S | P3.4 | `src/app/{sitemap,robots,manifest}.ts` |
| P6.3 | OG image dinamis (`next/og`) global + produk + artikel + resep; icon/apple-icon | S | P0.3 | `src/app/**/opengraph-image.tsx` |
| P6.4 | Audit performa: LCP/CLS/INP, bundle analyzer, font subset, gambar | O | P4.* | (perbaikan lintas file — koordinasi orkestrator) |

## Fase 7 — QA & Rilis

| ID | Task | Model | Dep | Ownership |
|---|---|---|---|---|
| P7.1 | Playwright: smoke semua route, Order Builder → URL WA, admin CRUD, axe a11y, screenshot 375/768/1440 × light/dark | S | P4.*, P5.* | `tests/e2e/*` |
| P7.2 | Visual consistency review (skill `web-design-guidelines` + `frontend-design`): gap, typo, tombol, ritme | O | P7.1 | laporan → `docs/qa.md` |
| P7.3 | Security review (RLS, actions, headers, upload) | O | P5.* | laporan → `docs/security.md` |
| P7.4 | README + panduan admin untuk pemilik (Bahasa Indonesia, non-teknis) | S | semua | `README.md`, `docs/admin-guide.md` |
| P7.5 | Deploy produksi Vercel, domain, Search Console, Google Business Profile checklist | S | P7.2, P7.3 | — |

---

## Graf Paralel (ringkas)

```
P0.* ─┐
P1.1 ─┼─ P1.2, P1.3, P1.4, P2.1, P2.4 ─┬─ P2.2, P2.3, P2.5
      │                                ├─ P3.1 ─ P3.2, P3.3, P3.4, P3.5
      │                                └─ P1.5
P2.x + P3.3/3.4 ─ P4.1 ─ {P4.2 … P4.10 paralel}
P3.2 + P2.2 ─ P5.1 ─ {P5.2 … P5.9 paralel}
P4.* + P5.* ─ {P6.1 … P6.4} ─ {P7.1 → P7.2, P7.3} ─ P7.4 ─ P7.5
```

Fase 4 dan Fase 5 boleh berjalan bersamaan (ownership file tidak bertumpuk).

## Protokol Sub-agent

Template prompt untuk setiap sub-agent:

```
Task <ID>: <judul>. Baca PROMPT.md §<relevan>, PLAN.md baris <ID>.
Boleh mengubah HANYA: <ownership>. Jangan sentuh file lain; bila perlu, laporkan.
Gunakan skill: <daftar>. Cek API terbaru via find-docs sebelum memakai library.
Selesai bila: <acceptance> + `pnpm typecheck && pnpm lint && pnpm build` lolos.
Di akhir: ubah baris <ID> di STATE.md (status, catatan singkat, file utama). Jangan ubah baris lain.
Laporkan: ringkasan perubahan, keputusan penting, blocker.
```

Aturan:
- Orkestrator yang menjalankan `git commit` per fase; sub-agent tidak commit.
- Konflik file → task kedua menunggu (ubah status jadi `blocked` + alasan).
- Gagal 2× → eskalasi ke Opus / tanya pengguna, catat di STATE.
