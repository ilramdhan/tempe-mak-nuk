# Audit Kelengkapan — Fase 5 (CMS Admin) + Fase 7 (QA/Docs)

Tanggal: 2026-10-21 · Mode: READ-ONLY (tidak ada kode yang diubah) · Basis: `main` @ `cf720d5`

## Ringkasan

| Verdict | Jumlah | Task |
|---|---|---|
| ✅ | 7 | P5.1, P5.4, P5.5, P5.10, P7.2, P7.3, P7.5 |
| ⚠️ | 8 | P5.2, P5.3, P5.6, P5.7, P5.8, P5.9, P7.1, P7.4 |
| ❌ | 0 | — |

Semua modul `/admin/*` dari PROMPT §5.3 ada, terhubung ke Server Action nyata (bukan stub), lewat `adminAction`/`requireRole` + Zod. Matriks owner-only HANDOVER §4 dipatuhi di server. Nama cache tag konsisten karena semua actions dan queries memakai registry yang sama (`src/lib/cache-tags.ts`). Gap utamanya: ada konten publik yang **tidak bisa diedit dari admin** atau **tidak langsung muncul** setelah diedit (melanggar DoD §15 butir 2).

## Metode

- Bandingkan baris P5.1–P5.10 & P7.1–P7.5 di `STATE.md:63-81` / `PLAN.md` dengan `PROMPT.md` §5.3 (`:111-124`), §5.4 (`:126-130`), §11, §12 (`:227-233`), §15 (`:261-270`), dan `HANDOVER.md` §4 (`:71-74`).
- Baca kode `src/app/(admin)/admin/**`, `src/features/*/{actions,queries,queries.admin}.ts`, `src/features/_shared/*`, `src/lib/cache-tags.ts`, dan halaman publik `src/app/(site)/**`.
- `pnpm test`: 36 file lulus (1 skip), **331 test lulus, 17 skip** (RLS butuh DB sementara), exit 0.
- `curl` ke server produksi `http://localhost:3101`:
  - `/admin` → 307 `/login`; `/admin/pengguna` dan `/admin/legal` → 307 `/login?next=…`; `/login` → 200.
  - `POST /api/upload` tanpa sesi → 401 `Silakan masuk terlebih dahulu.`; dengan `Origin: http://evil.com` → 403 `Permintaan ditolak.`
  - `GET /api/cron/keepalive` tanpa bearer → 401.
  - Header `/`: CSP (`script-src 'unsafe-inline'`), HSTS preload, nosniff, Referrer-Policy, X-Frame-Options DENY, `frame-ancestors 'none'`, Permissions-Policy. Semuanya ada.
- Satu query baca-saja ke DB (`wa_clicks`, `posts`, `pages`). Query DB berikutnya ditolak permission classifier, jadi sisa audit hanya lewat kode.
- Grep `TODO|FIXME|not implemented` di `src/app/(admin)/admin`, `src/features`, `src/components/admin` → **0 hasil**.

## Pemeriksaan lintas modul

### Guard & role
- Proxy: `guardAdminRoute` (`src/lib/supabase/proxy.ts`). Terverifikasi lewat curl 307.
- Layout: `requireRole("editor", {onFail:"redirect"})` (`src/app/(admin)/admin/layout.tsx:30`).
- DAL: setiap fungsi `queries.admin.ts` memanggil `requireRole`. Legal/Users memanggil `owner` (`src/features/legal/queries.admin.ts:10,15`, `src/features/users/queries.admin.ts:20`).
- Halaman owner: `legal/page.tsx:33`, `legal/[id]/page.tsx:29`, `pengguna/page.tsx:31`.
- Action owner-only sesuai HANDOVER §4:
  - `deletePage` (`src/features/pages/actions.ts:56`), `deleteProduct` (`products/actions.ts:111`), `deleteProductShape/Size` (`:169,:225`).
  - `deleteMedia`/`deleteMediaAndFile` (`media/actions.ts:49`, `media/library-actions.ts:102`), `deleteFaq` (`faqs/actions.ts:58`), `deleteTestimonial` (`testimonials/actions.ts:60`), `deleteNavItem`/`deleteAnnouncement` (`navigation/actions.ts:55,110`).
  - Legal (semua, `legal/actions.ts:17,31,52,68`), Pengguna (`users/actions.ts:22,54`), Redirect (`redirects/actions.ts:33,61` + legacy `pages/actions.ts:157,171`).
  - Settings grup owner (`settings/actions.ts:15,23`).
- Ada unit test regresi: `src/features/_shared/__tests__/owner-only-actions.test.ts`.
- Hapus artikel/resep masih editor-level (`posts/actions.ts:80`, `recipes/actions.ts:56`). Ini sesuai catatan "menunggu keputusan user" (HANDOVER §4/§8).

### Konsistensi tag (admin → publik)
Semua action memakai `tags.*` dari `src/lib/cache-tags.ts`, dan queries publik memakai `cacheTag(tags.*)` yang sama. Pipeline: `adminAction` → `expireTags` → `updateTag` (`src/features/_shared/admin-action.ts:63`, `revalidate.ts:11`). Upload memakai `revalidateTag(media,"max")` (`media/upload.server.ts:67`). Tidak ada nama tag yang salah ketik atau yatim.

**Pengecualian (gap):**
1. `updateMediaAlt` hanya meng-expire `media` + `media:<id>` (`src/features/media/actions.ts:41`). Produk, artikel, resep, dan testimoni men-*join* kolom `media.alt/url` langsung di query ber-tag `products`/`posts`/`recipes`/`testimonials`:
   - `products/queries.ts:56-69`, `posts/queries.ts:47-79`, `recipes/queries.ts:55-89`, `testimonials/queries.ts:38-46`.
   - Akibatnya alt yang diedit baru tampil di halaman produk/testimoni setelah `cacheLife("days")` habis (revalidate 1 hari), dan di halaman artikel/resep setelah `"hours"` habis (1 jam).
   - Blok halaman CMS sudah benar, karena `getMediaByIds` diberi tag `media:<id>`.
2. Konten terjadwal tidak punya pemicu revalidate (lihat P5.6).

### Klik WA 30 hari
- **Dicatat:** `<WaLink>` (`src/components/site/layout/wa-link.tsx:40`) memanggil `trackWaClick` (`src/features/analytics/actions.ts:32`), yang memvalidasi dengan Zod, membatasi laju, lalu menulis `insert wa_clicks`.
- `WaLink` dipakai di 17 file publik: header/footer/floating/hero/produk/order-builder/faq/kontak/jurnal/resep/404.
- Dasbor membaca `getWaClickStats(30)` (`src/features/analytics/queries.admin.ts:10`, `_dashboard/wa-stats.tsx:13-24`).
- Data DB: hanya **2 baris**, terakhir 2026-10-16. Bisa jadi wajar karena e2e tidak mengklik CTA WA, tapi belum ada test yang membuktikan insert jalan end-to-end.
- Rate limiter hanya di memori per instance, best-effort (`analytics/rate-limit.ts`).

## Tabel per task

| Task | Verdict | Bukti (path:line) | Gap konkret | Saran fix | Ukuran | Model |
|---|---|---|---|---|---|---|
| **P5.1** Auth, guard, layout, role gate, audit | ✅ | `src/lib/supabase/proxy.ts` (guardAdminRoute); `src/app/(admin)/admin/layout.tsx:30`; `src/lib/auth/require-role.ts`; `src/lib/auth/actions.ts` (signIn/magic link `shouldCreateUser:false`); `src/features/_shared/admin-action.ts:31-71` (requireRole → Zod → tx → audit → updateTag); curl `/admin` 307 → `/login` | Rate limit login di level aplikasi belum ada (§12; `docs/security.md` #7 open). Belum ada UI untuk `audit_log`. | Aktifkan CAPTCHA/attack protection di Supabase. Opsional: limiter email+IP berbasis tabel. Opsional: halaman `/admin/audit` (owner) | S (config) / M (limiter) | sonnet |
| **P5.2** Dasbor | ⚠️ | `src/app/(admin)/admin/page.tsx:23-34`; `_dashboard/slot-week.tsx`, `wa-stats.tsx:13`, `drafts.tsx:62`, `shortcuts.tsx` | PROMPT §5.3 meminta **"peringatan konten kosong"**, tapi tidak ada kartunya. Contoh yang seharusnya diperingatkan: halaman tanpa section, produk tanpa foto, media tanpa alt, setting placeholder (WA/halal/alamat seed). Belum ada test bahwa klik WA tercatat. | Tambah `ContentWarningsCard` dengan query admin ringan: pages 0 section, products tanpa `product_media`, posts published tanpa cover/SEO desc, settings yang masih bernilai seed. Tambah unit test `trackWaClick` (mock db) | S | sonnet |
| **P5.3** Page builder | ⚠️ | Editor `halaman/[id]/page.tsx` + `_components/page-editor.tsx`; `savePageContent` `src/features/pages/actions.ts:207-297` (tags `pages`,`page:<slug>`); pratinjau `halaman/[id]/pratinjau/page.tsx:45-66` (versi tersimpan, incl. draf); dnd + keyboard; publik `getPage` `pages/queries.ts:24-41` (tag `page:<slug>`) | **(1) Halaman `produk`, `faq`, `kontak` ada di DB dengan section (7/3/3) dan bisa diedit di builder, tapi route publiknya tidak memanggil `getPage`.** Hero/teksnya hard-code: `src/app/(site)/produk/page.tsx:72-80`, `faq/page.tsx:76-82`, `kontak/page.tsx:111`. Edit admin tidak pernah muncul di situs, sehingga melanggar DoD §15 butir 2 dan menyesatkan pemilik. (2) Halaman CMS baru (`createPage`) tidak punya route publik, karena hanya 8 slug yang di-wire (`home`, `cara-pesan`, `custom-order`, `halal-kualitas`, `kemitraan`, `manfaat-tempe`, `proses`, `tentang`). (3) Hero `/jurnal` & `/resep` hard-code dan tidak punya baris `pages`. | (1) Render `getPage("produk"/"faq"/"kontak")` via `<BlockRenderer>` di route tersebut (pertahankan bagian data dinamis sebagai blok `productGrid`/`faqList`/`split`). Alternatif: sembunyikan 3 halaman itu dari daftar admin dengan label "tidak dipakai". (2) Catch-all `src/app/(site)/[slug]/page.tsx` untuk halaman CMS published yang tidak bentrok dengan route statis, atau nonaktifkan "Buat halaman" | M | opus |
| **P5.4** Produk | ✅ | `src/app/(admin)/admin/produk/**`; `product-form.tsx:216-219` (harga mulai dari), galeri MediaPicker, ukuran dnd; `nutrition-form.tsx` → `upsertNutrition` `products/actions.ts:253-270`; opsi `produk/opsi` → `options-manager.tsx:115,325` (RoleGate hapus); tags `products`,`product:<slug>`,`product-options`,`recipes` (`products/actions.ts:103`) | Minor: `upsertNutrition` hanya meng-expire `product:<slug>` (`:270`), bukan `products`. Aman selama daftar produk tidak menampilkan gizi. | — (opsional tambah `tags.products`) | S | sonnet |
| **P5.5** Slot & PO | ✅ | `src/app/(admin)/admin/slot/_components/slot-admin.tsx:62` (RoleGate owner + RulesSummary); `day-editor.tsx`, `holiday-manager.tsx`, `rules-form.tsx`; actions `slots/actions.ts:14-96` (tag `slots`); `updateSettings` `order.*` → owner + tag `slots` (`settings/actions.ts:15,43`); publik `getSlotData` tag `slots` (`slots/queries.ts:28`) | — | — | — | — |
| **P5.6** Jurnal & Resep | ⚠️ | Editor `jurnal/_components/post-editor.tsx`, `resep/_components/recipe-editor.tsx`; `RichTextEditor` `src/components/admin/editor`; status draft/terbit/terjadwal + WIB; `setPostStatus` Zod refine tanggal wajib (`posts/actions.ts:95-116`); publik `isLiveSql` (`_shared/live.ts:11-17`), `cacheLife("hours")` (`posts/queries.ts:87-169`, `recipes/queries.ts:99-166`) | **(1) Jadwal tidak dipublikasikan tepat waktu.** Tidak ada cron/trigger yang meng-expire `posts`/`recipes` saat `published_at` tercapai. Item terjadwal baru muncul setelah revalidate preset `hours` (≤1 jam), lalu stale-while-revalidate: pengunjung pertama setelah itu masih melihat versi lama. Hal yang sama berlaku untuk entri `post:<slug>` yang pernah di-cache sebagai `null`. Komentar di `live.ts:9` mengakui ini. Cron Vercel saat ini hanya `keepalive` harian (`vercel.json`). (2) **Kategori & tag tidak bisa dibuat/dikelola dari UI.** `TagPicker`/select hanya memilih yang sudah ada. Action `features/taxonomy/actions.ts:21-97` ada, tapi tidak dipakai di mana pun di `src/app`. PROMPT §5.3 meminta "kategori/tag". | (1) Pilihan: (a) `cacheLife("minutes")` untuk list + detail (jadwal tampil ≤1 menit + SWR); (b) route `GET /api/cron/publish-scheduled` (bearer CRON_SECRET) yang memanggil `revalidateTag(posts/recipes,"max")` bila ada item jatuh tempo, dijadwalkan per jam (perlu Vercel Pro; Hobby hanya harian) atau lewat pg_cron/Supabase → webhook. Dokumentasikan perilaku di admin-guide. (2) Lihat P5.7: halaman `/admin/kategori` (kategori jurnal/resep/faq + tag) | S (a) / M (b); M (kategori) | sonnet |
| **P5.7** FAQ, Testimoni, Navigasi/CTA | ⚠️ | `faq/_components/faq-manager.tsx:198-266` (pilih kategori), `reorderFaqs` dnd; `testimoni/_components/testimonial-manager.tsx:96,178` (verified, tampil, MediaPicker foto); `navigasi/_components/nav-panel.tsx:47-52` (header, footer kol 1–4, legal), `announcement-panel.tsx`, `cta-panel.tsx:104-107` (floating WA + pesan → `updateSettings` grup `cta`); announcement `cacheLife("minutes")` + jendela waktu (`navigation/queries.ts:57-75`) | **Kategori FAQ tidak bisa dibuat/diubah/diurutkan** (PROMPT §5.3 "FAQ: CRUD + urutan + kategori"). Hanya bisa memilih kategori seed. Gap ini diakui di STATE P5.7 & HANDOVER §3. | Halaman `/admin/kategori` (editor; hapus owner opsional) yang memakai `createCategory/updateCategory/deleteCategory/reorderCategories/createTag/deleteTag` yang sudah ada (tag `categories` + `faqs/posts/recipes` sudah benar di `taxonomy/actions.ts:16-18`). Tambahkan ke `ADMIN_NAV` | M | sonnet |
| **P5.8** Media | ⚠️ | `POST /api/upload` `src/app/api/upload/route.ts:23-79` (origin, editor+, alt wajib `:54-58`, ≤5 MB, MIME, sharp); `uploadAltSchema` `media/upload-rules.ts:92`; `mediaUpdateSchema` alt wajib `media/schema.ts:30`; library `media/_components/media-library.tsx:265`; `deleteMediaAndFile` owner + cek pemakaian; picker dipakai di produk/jurnal/resep/testimoni/halaman/pengaturan; curl 401/403 OK | **Edit alt tidak menjalar ke cache publik** produk/artikel/resep/testimoni. `updateMediaAlt` hanya expire `media`,`media:<id>` (`media/actions.ts:41`), padahal query-query tersebut men-join `media.alt` di bawah tag domainnya. Origin kosong lolos ke cek sesi (security #8, rendah). | Samakan dengan `deleteMedia`: tambah `tags.products, tags.posts, tags.recipes, tags.testimonials, tags.pages` di `updateMediaAlt`. Upload: tolak bila `Origin` kosong dan `Sec-Fetch-Site` ≠ `same-origin` | S | sonnet |
| **P5.9** Pengaturan, Redirect, Pengguna | ⚠️ | `pengaturan/_lib/fields.ts:47-205` (Bisnis/Kontak/Sosial/Halal/PO/SEO/Cookie: info bisnis, WA, halal, jam buka, sosial, SEO default, OG default `:186`); `settings-form.tsx:52` (`canEdit = !tab.ownerOnly \|\| isOwner`); `redirect-manager.tsx` → `features/redirects/actions.ts:31-69` (owner, tag `redirects`); proxy membaca redirect DB (`src/proxy.ts:23-45`, TTL 60 s); pengguna `pengguna/_components/user-table.tsx:62-108` + `users/actions.ts:20-70` (owner, `FOR UPDATE`, tidak bisa turunkan owner terakhir) | (1) **UI lebih ketat dari matriks:** tab "SEO & situs" `ownerOnly: true` (`fields.ts:171`) karena memuat `site.*`, sehingga editor tidak bisa mengubah `seo.*` & `cta.*` di Pengaturan. Padahal HANDOVER §4 bilang editor boleh, dan server mengizinkan. (2) Action legacy `upsertRedirect`/`deleteRedirect` di `pages/actions.ts:155-179` duplikat dan tidak dipakai UI. (3) Undangan tidak bisa memilih peran (selalu editor, ubah sesudahnya), dan tidak ada nonaktifkan/hapus pengguna. Ini wajar untuk spesifikasi, tapi admin-guide salah menggambarkannya (lihat P7.4). (4) Belum diverifikasi dengan login/SMTP. | (1) Pecah tab: "Situs" (owner: `site.*`) dan "SEO & CTA" (editor), atau kunci per field berdasarkan `groupOf(key)`. (2) Hapus action legacy redirect. (3) Opsional: aksi "cabut akses" (hapus profil) khusus owner | S | sonnet |
| **P5.10** Legal & Privasi | ✅ | Owner: `legal/page.tsx:33`, `legal/[id]/page.tsx:29`, `legal/actions.ts:17-80`; `document-list.tsx:26` (`createLegalVersion`), `document-editor.tsx:61`; `consent-editor.tsx:48,171-174` (naikkan versi → minta ulang) → `updateSettings({"consent.config"})` (grup consent = owner); publik `getLegalDocument` versi published tertinggi yang sudah berlaku (`legal/queries.ts:21-44`, tag `legal:<slug>`); `ConsentManager` membaca `consent.config` (`features/consent/consent-manager.tsx:9-17`); memenuhi §5.4 | Minor: `consent.config` juga bisa diedit sebagai JSON mentah di Pengaturan → Cookie (`fields.ts:205`). Ada dua tempat edit, dan versi JSON rawan salah. | Ganti tab Cookie dengan tautan ke Legal → Consent | S | sonnet |
| **P7.1** Playwright | ⚠️ | `tests/e2e/{smoke,order-builder,a11y,screenshots,admin}.spec.ts`; `a11y.spec.ts:24` `KNOWN = {}` | Deskripsi task menyebut **"admin CRUD"**, tapi `admin.spec.ts` hanya login + buka 13 modul (status 200 + h1, read-only), dan di-skip bila `E2E_ADMIN_*` kosong. Belum ada test CRUD atau propagasi admin → publik. Belum ada test redirect `/admin` → `/login` untuk anon. | Tambah smoke anon: `/admin` → `/login`, `POST /api/upload` → 401. Setelah akun editor E2E tersedia: CRUD non-destruktif (buat FAQ draf → tampil → hapus via owner), plus cek bahwa edit muncul di publik (DB staging) | S (anon) / M (CRUD) | sonnet |
| **P7.2** Visual review | ✅ | `docs/qa.md:9-23` (axe strict 11 rute, `KNOWN={}`), `:60+` rekomendasi sisa; konsisten dengan `tests/e2e/a11y.spec.ts:24,50` | Sisa terbuka yang sudah terdokumentasi: `--card` dark, bar sticky `/custom-order`, floating WA di mobile | (sesuai HANDOVER §9) | S/M | sonnet/opus |
| **P7.3** Security review | ✅ | `docs/security.md` (19 temuan). Diverifikasi di kode: owner-only #2/#3, DAL #4, header #18 (curl), upload #8 (curl 401/403), cron #19 (curl 401) | Dokumen sudah **stale**: header `:3` "belum di-commit", status `:29` "fixed\* perlu db:migrate", dan `:55` "**belum** di-migrate", padahal migrasi 0003 sudah diterapkan (HANDOVER §7). #6/#7/#8 masih open. | Perbarui header/status (commit `cd526e1`, 0003 applied) | S | sonnet |
| **P7.4** README + admin-guide | ⚠️ | `README.md` (setup, env, migrasi, seed, bucket, akun owner pertama `:46`, deploy link `:103`); `docs/admin-guide.md` (menu "Konten > …" / "Sistem > …" cocok dengan `src/components/admin/shell/nav.ts:31-66`) | **admin-guide tidak akurat soal peran/fitur:** (a) `:23` & `:94` "Aturan Slot & PO, Navigasi, Pengumuman: Editor hanya melihat / Pemilik mengubah". Benar untuk aturan Slot, tapi **salah untuk Navigasi/Pengumuman/CTA**: editor bisa membuat/mengubah/mengurutkan (`navigation/actions.ts:23-103`), hanya hapus yang owner. (b) `:22` "SEO … Editor hanya melihat" bertentangan dengan matriks (lihat P5.9). (c) `:110` "Pilih peran: Pemilik atau Editor" saat undang, padahal form hanya email (`user-table.tsx:62`); `:111` "nonaktifkan akun" tidak ada di UI. (d) `:102` "setiap perubahan membuat versi baru", padahal simpan mengubah versi itu sendiri dan versi baru dibuat lewat tombol "Buat versi baru". (e) `:104` teks banner disebut diatur di "Pengaturan > Cookie", padahal editor utamanya Legal → Consent. (f) `:115` "muncul ±1 menit", padahal konten langsung tampil (`updateTag`). Pengecualiannya redirect (≤60 s), jadwal (≤1 jam), dan alt (lihat P5.8). (g) `:58` "Opsi pesanan dikelola Pemilik", padahal bentuk/ukuran bisa dibuat editor, hanya hapus yang owner. (h) Halaman Produk/FAQ/Kontak di builder tidak berpengaruh (P5.3) tapi tidak disebut. **README:** `:40` Setup menyuruh `pnpm db:migrate`, padahal `:62` menyatakan perintah itu gagal diam-diam di jaringan ini (pakai `make db-migrate`). | Koreksi admin-guide butir a–h (setelah keputusan P5.3/P5.9). README Setup: ganti ke `make setup`/`make db-migrate` | S | sonnet |
| **P7.5** Deploy checklist | ✅ | `docs/deploy.md` (8 bagian: Supabase, Vercel env, domain, verifikasi, Search Console, GBP, rollback) | Minor: `:85` "Admin → Redirect", padahal Redirect adalah tab di Admin → Pengaturan. Belum dieksekusi (butuh akun user). Preview Vercel (DoD §15 terakhir) belum. | Ganti menjadi "Admin → Pengaturan → Redirect" | S | sonnet |

## Cakupan PROMPT §5.3 per modul

| Modul §5.3 | Ada | Catatan |
|---|---|---|
| Login email+password / magic link, role owner & editor | ✅ | P5.1 |
| Dashboard: slot minggu ini, klik WA 30 hari, artikel draft | ✅ | `_dashboard/*` |
| Dashboard: peringatan konten kosong | ❌ | P5.2 gap |
| Halaman: section blocks Zod, urutan, show/hide | ✅ (⚠️) | 3 halaman tidak terhubung ke publik (P5.3) |
| Produk: varian, bentuk, ukuran, harga, gizi, galeri | ✅ | |
| Slot & PO: kalender, libur, lead/cutoff | ✅ | |
| Jurnal & Resep: Tiptap, draft/publish/schedule, SEO, cover, kategori/tag | ✅ (⚠️) | Jadwal terlambat ≤1 jam; kategori/tag tidak bisa dibuat |
| FAQ: CRUD + dnd + kategori | ⚠️ | Kategori tidak bisa dikelola |
| Testimoni: CRUD, tampil, terverifikasi | ✅ | |
| Navigasi: header, footer, announcement, CTA, floating WA | ✅ | |
| Media: Storage, resize/WebP, alt wajib | ✅ (⚠️) | Edit alt tidak menjalar |
| Pengaturan: bisnis, WA, halal, jam, sosial, SEO, OG, redirect | ✅ | |
| Pengguna: undang editor (owner) | ✅ | |
| Setiap simpan → revalidate + audit | ✅ (⚠️) | `adminAction` (kecuali `inviteUser`, yang menulis audit manual) |
| §5.4 consent dikelola dari Legal & Privasi | ✅ | |

## Gap prioritas (urutan saran pengerjaan)

1. **P5.3: `/produk`, `/faq`, `/kontak` tidak membaca CMS.** Edit di builder tidak tampil (DoD §15). Selain itu halaman CMS baru tidak punya route publik. **M · opus**
2. **P5.8: `updateMediaAlt` tidak meng-expire tag `products/posts/recipes/testimonials/pages`.** Alt basi hingga 1 hari. **S · sonnet**
3. **P5.6: konten terjadwal tidak punya pemicu.** Muncul ≤1 jam + SWR. Pilih `cacheLife("minutes")` atau cron `publish-scheduled`, lalu dokumentasikan. **S/M · sonnet**
4. **P5.7/P5.6: `/admin/kategori`** (kategori FAQ/jurnal/resep + tag). Action sudah ada. **M · sonnet**
5. **P7.4: koreksi admin-guide** (peran Navigasi/SEO, undang, versi legal, "±1 menit", opsi produk) dan langkah migrasi di README. **S · sonnet**
6. **P5.9: tab "SEO & situs" mengunci editor**, padahal server mengizinkan. Pecah tab/kunci per field. Hapus action redirect legacy. **S · sonnet**
7. **P5.2: kartu "peringatan konten kosong"** + unit test `trackWaClick`. **S · sonnet**
8. **P7.1: e2e anon untuk guard admin/upload**, dan CRUD admin setelah akun E2E ada. **S/M · sonnet**
9. **P7.3: perbarui status `docs/security.md`** (0003 sudah diterapkan). Sisa open: CAPTCHA/rate limit login (#7), Origin kosong di upload (#8). **S · sonnet**
10. Keputusan user: hapus artikel/resep owner-only atau tidak (HANDOVER §8).
