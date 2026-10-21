# Audit Fase 0-3 (read-only)

Metode: inspeksi file/grep. Grep `TODO|FIXME|XXX|not implemented|lorem` di `src/` = 0 hasil. Tidak ada build/test dijalankan.

| Task | Verdict | Bukti | Gap / saran / ukuran / model |
|---|---|---|---|
| P0.1 business.md | ✅ | docs/business.md (65 baris, data dummy, produk, cerita) | - |
| P0.2 brand | ✅ | docs/brand.md (273 baris; tagline, tone, kamus, token OKLCH, kontras) | - |
| P0.3 logo | ✅ | public/brand/{logo-horizontal,logo-stacked,monogram,favicon}.svg (currentColor), src/components/brand/logo.tsx:14-39 | Light/dark via currentColor + favicon prefers-color-scheme, bukan file terpisah per mode. Terima, atau ekspor `*-dark.svg` jika dibutuhkan (S, sonnet) |
| P0.4 photo brief | ✅ | docs/photo-brief.md (216 baris, S01-S26 + prompt AI) | - |
| P0.5 keyword | ✅ | docs/seo.md §1 peta keyword per route, §5 linking (315 baris) | Kolom volume sengaja kosong (seo.md:290), perlu data nyata pasca-launch |
| P0.6 skills | ❌ | STATE.md:36 status `todo`; "Skills aktif" = "—" (STATE.md:25); tidak ada .claude/skills proyek | Install/catat skills PROMPT §13 (frontend-design, webapp-testing, superpowers dst) atau tandai N/A dengan alasan. S, sonnet |
| P1.1 scaffold | ✅ | package.json, struktur src/{app,components,features,db,lib} | - |
| P1.2 env + headers | ✅ | src/lib/env.ts (109 baris, Zod lazy), next.config.ts:33-52 (CSP, frame-ancestors, HSTS, nosniff, Referrer, X-Frame, Permissions-Policy), src/proxy.ts | - |
| P1.3 Drizzle | ✅ | drizzle.config.ts, src/db/client.ts:24 `prepare:false`, src/db/seed.ts + seed/ | - |
| P1.4 CI | ⚠️ | .github/workflows/ci.yml (typecheck, lint, format:check, test, build) | Kode CI lengkap; bagian "Vercel project + env" belum (menunggu akun user, STATE status `review`). Bukan gap kode. Tutup setelah link Vercel (S, manual) |
| P1.5 cron | ✅ | vercel.json (`17 3 * * *`), src/app/api/cron/keepalive/route.ts, _lib/auth.ts | - |
| P2.1 tokens | ✅ | src/styles/globals.css:131 `@theme inline`, :172 `@theme`; src/lib/fonts.ts; src/components/theme/* | - |
| P2.2 primitives | ✅ | src/components/ui (31 komponen: button, input, select, dialog, sheet, accordion, tabs, calendar, sonner, badge, card, dst) | - |
| P2.3 layout primitives | ✅ | src/components/site/primitives/{container,section,heading,eyebrow,lead,prose,grid,stack,divider}.tsx | - |
| P2.4 motion kit | ✅ | src/components/motion/{lenis-provider,reveal,split-reveal,parallax,marquee,pinned-story,counter,magnetic,use-reduced-motion,gsap}.ts(x) + index.ts | - |
| P2.5 tekstur | ✅ | src/components/brand/textures/{mycelium-pattern,banana-leaf-lines,soy-dots,image-placeholder}.tsx | - |
| P3.1 schema | ✅ | drizzle/0001_schema.sql: 27 tabel (semua daftar; `faq_categories` = `categories.kind='faq'`, `product_shapes/sizes` + link tables, tambahan legal_documents, product_media, post_tags) | Deviasi terdokumentasi, bukan gap |
| P3.2 RLS | ✅ | drizzle/0000_rls_helpers.sql (`is_admin`), pgPolicy di schema, 0002 trigger, tests/rls/{rls.test.ts,auth-stub.sql} | Tidak dijalankan di audit ini; verifikasi ulang `pnpm test:rls` bila perlu (S) |
| P3.3 Zod blocks | ✅ | src/features/pages/blocks/ (schema.ts, registry.ts, renderer; 17 tipe, melebihi 10 yang diminta) | - |
| P3.4 data layer | ✅ | src/features/{settings,pages,navigation,products,posts,recipes,taxonomy,faqs,testimonials,slots,legal,media,analytics,...}/{queries,actions,schema}.ts; cache-tags di src/lib | - |
| P3.5 seed | ✅ | src/db/seed/*.ts: faqs.ts 33 entri (>=20), 6 kategori; posts-data (9 slug), recipes-data (7 slug), testimonials, navigation, pages, settings, products | Jumlah artikel (8) / resep (6) tidak dihitung presisi: cek manual (S) |

## Hitungan
✅ 20, ⚠️ 1 (P1.4), ❌ 1 (P0.6). Total 22 task.

## Daftar gap
1. P0.6: skills §13 belum dicatat/dipasang (S, sonnet).
2. P1.4: Vercel project + env belum ada, menunggu akun user (S, manual).
3. P0.3: tidak ada file logo `-dark` terpisah (opsional, S, sonnet).
4. Minor: verifikasi hitungan 8 artikel/6 resep seed; jalankan ulang tests/rls.
