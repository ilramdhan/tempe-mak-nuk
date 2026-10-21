# Audit Fase 4 (situs publik) + Fase 6 (SEO/OG/performa)

Tanggal: 2026-10-21 · Mode: READ-ONLY · Server: `http://localhost:3101` (build produksi yang sudah berjalan)

> Laporan ditulis bertahap. Bagian "Hasil curl" adalah bukti mentah; tabel verdict di bawahnya.

## 1. Hasil curl semua route publik

Kolom: route | HTTP | `<title>` | canonical | og:image | JSON-LD @type | robots | jumlah `<h1>`

| Route | HTTP | title | canonical | og:image | JSON-LD | robots | h1 |
|---|---|---|---|---|---|---|---|
| `/` | 200 | Tempe Klaten Handmade Sejak 2001 — Tempe Mak Nuk | `http://localhost:3000` | `/opengraph-image-12o0cb` | FoodEstablishment, Organization, WebSite, FAQPage, GeoCoordinates, OpeningHoursSpecification, PostalAddress, EducationalOccupationalCredential | – | 1 |
| `/produk` | 200 | Jenis Tempe: Klasik dan Tanpa Kulit — Tempe Mak Nuk | `/produk` | `/og-default.png` | BreadcrumbList, CollectionPage, ItemList | – | 1 |
| `/produk/tempe-klasik` | 200 | Tempe Klasik Kedelai Kulit Ari, Handmade — Mak Nuk **— Tempe Mak Nuk** | `/produk/tempe-klasik` | `/produk/tempe-klasik/opengraph-image-12nz4h` | Product, Offer, Brand, BreadcrumbList | – | 1 |
| `/produk/tempe-original-tanpa-kulit` | 200 | Tempe Original Tanpa Kulit, Putih dan Padat — Mak Nuk **— Tempe Mak Nuk** | ok | per-produk OG | Product, Offer, Brand, BreadcrumbList | – | 1 |
| `/produk/tidak-ada-xyz` | **200** | Halaman tidak ditemukan — Tempe Mak Nuk | – | global OG | – | noindex, nofollow | **0** |
| `/custom-order` | 200 (1,4 s) | Pesan Tempe Custom, Tanpa Minimal Order — Tempe Mak Nuk **— Tempe Mak Nuk** | ok | og-default | BreadcrumbList | – | 1 |
| `/cara-pesan` | 200 | Cara Pesan dan PO Tempe, Cek Slot — Tempe Mak Nuk **— Tempe Mak Nuk** | ok | og-default | HowTo, HowToStep, BreadcrumbList | – | 1 |
| `/kemitraan` | 200 | Supplier Tempe Katering Klaten, Solo — Tempe Mak Nuk | ok | og-default | WebPage, BreadcrumbList | – | 1 |
| `/proses` | 200 | Cara Membuat Tempe Tradisional, 6 Langkah — Mak Nuk | ok | og-default | HowTo, BreadcrumbList | – | 1 |
| `/manfaat-tempe` | 200 | Manfaat dan Kandungan Gizi Tempe — Tempe Mak Nuk | ok | og-default | Article, Organization, BreadcrumbList | – | 1 |
| `/halal-kualitas` | 200 | Tempe Halal Bersertifikat BPJPH — Tempe Mak Nuk | ok | og-default | WebPage, Organization, EducationalOccupationalCredential, BreadcrumbList | – | 1 |
| `/tentang` | 200 | Tentang Mak Nuk, Pembuat Tempe Klaten Sejak 2001 | ok | og-default | AboutPage, Organization, BreadcrumbList | – | 1 |
| `/resep` | 200 | Resep Tempe Rumahan Mudah dan Enak — Tempe Mak Nuk | ok | og-default | CollectionPage, ItemList, BreadcrumbList | – | 1 |
| `/jurnal` | 200 | Jurnal Tempe: Panduan, Gizi, dan Cerita — Mak Nuk | ok | og-default | Blog, BlogPosting, BreadcrumbList | – | 1 |
| `/faq` | 200 | FAQ Tempe Mak Nuk: Pesan, Simpan, Kirim, Halal | ok | og-default | FAQPage, BreadcrumbList | – | 1 |
| `/kontak` | 200 | Kontak dan Alamat Tempe Mak Nuk, Pedan Klaten | ok | og-default | ContactPage, FoodEstablishment, GeoCoordinates, OpeningHoursSpecification, BreadcrumbList | – | 1 |
| `/kebijakan-privasi` | 200 | Kebijakan Privasi — Tempe Mak Nuk | ok | og-default | BreadcrumbList | – | 1 |
| `/syarat-ketentuan` | 200 | Syarat dan Ketentuan — Tempe Mak Nuk | ok | og-default | BreadcrumbList | – | 1 |
| `/kebijakan-cookie` | 200 | Kebijakan Cookie — Tempe Mak Nuk | ok | og-default | BreadcrumbList | – | 1 |
| `/kebijakan-pemesanan` | 200 | Kebijakan Pemesanan dan PO — Tempe Mak Nuk | ok | og-default | BreadcrumbList | – | 1 |
| `/halaman-tak-ada` | 404 | Halaman tidak ditemukan — Tempe Mak Nuk | – | – | – | noindex, nofollow | 1 |

Catatan cepat:
- Canonical/og:image ber-host `http://localhost:3000` walau server di :3101 — `siteBaseUrl` jatuh ke fallback localhost (env `NEXT_PUBLIC_SITE_URL` tak di-set saat build lokal). Wajar lokal, **wajib di-set di Vercel** (lihat docs/deploy.md).
- **Judul ganda "— Tempe Mak Nuk — Tempe Mak Nuk"** pada `/produk/[slug]`, `/custom-order`, `/cara-pesan`: `seo.title` di DB sudah memuat nama brand lalu title template menambah lagi.

## 2. Artefak SEO global (curl)

| Artefak | Hasil |
|---|---|
| `/robots.txt` | 200 · `Allow: /` · Disallow `/admin`, `/api`, `/dev`, `/auth`, `/login` · `Sitemap: http://localhost:3000/sitemap.xml` · `Host:` ✅ (§9 blokir /admin,/api) |
| `/sitemap.xml` | 200 · 32 URL: 17 statis + 2 produk + 3 artikel + 6 resep + 4 kategori jurnal. Artikel hanya yang `live` (`src/features/posts/queries.ts:35,170`); **tidak ada filter `seo.noindex`** (`src/app/sitemap.ts:30-51`) |
| `/manifest.webmanifest` | 200 · name/short_name/lang id/theme `#2F4A2C` · ikon SVG + PNG 192/512/maskable (semua 200) ✅ |
| `/og-default.png` | 200 image/png 48 607 B ✅ |
| `/opengraph-image-12o0cb` (global, dirujuk og:image beranda) | 200 image/png ✅ |
| `/produk/tempe-klasik/opengraph-image-12nz4h` | 200 image/png 49 195 B ✅; artikel & resep juga punya og:image per-slug (`/jurnal/<slug>/opengraph-image-…`, `/resep/<slug>/opengraph-image-…`) |
| `/icon`, `/apple-icon` | 200 PNG; `<link rel="icon">`, `apple-touch-icon`, `manifest` ada di `<head>` ✅ |
| `/twitter-image` | 404 — tidak ada file `twitter-image`; tetapi `twitter:card=summary_large_image` + `twitter:image` (=OG) ter-render ✅ (cukup) |
| `/favicon.ico` | 404 (hanya `icon.tsx`) — minor, browser lama/crawler meminta `/favicon.ico` |
| Header keamanan (sampel `/admin`) | CSP (frame-src maps.google.com), HSTS preload, `frame-ancestors 'none'` ✅ |

### JSON-LD (di-parse dengan Python `json.loads`, semua valid JSON)

- Beranda: `Organization` (address, telephone, foundingDate, hasCredential, sameAs), `WebSite`, `FoodEstablishment` (address, **geo**, **openingHoursSpecification**, telephone, hasMap), `FAQPage`.
- `/produk/[slug]`: `Product` (brand, description, name, offers, url) — **tanpa `image`** walau galeri ada (`src/app/(site)/produk/[slug]/page.tsx:89` mengisi `images` hanya bila `product.gallery` berisi; seed tak punya foto → wajar). `Offer` muncul karena `pricing.show`.
- `/resep/[slug]`: `Recipe` (recipeIngredient, recipeInstructions HowToStep, prep/cook/totalTime ISO, yield, category, cuisine, keywords) — **tanpa `image`** (Google Rich Results mewajibkan `image` untuk Recipe → tak eligible sampai foto diunggah).
- `/jurnal/[slug]`: `BlogPosting` (headline, author, publisher, dates, wordCount) — tanpa `image` (sama, menunggu cover).
- `/faq`: `FAQPage`; `/kontak`: `ContactPage` + `FoodEstablishment`; `/cara-pesan`, `/proses`: `HowTo`; `/tentang`: `AboutPage`; `/manfaat-tempe`: `Article`; listing: `CollectionPage`+`ItemList`; semua halaman: `BreadcrumbList`.
- Semua tipe §9 tercakup (Organization, LocalBusiness/FoodEstablishment, Product+Offer, FAQPage, Article, Recipe, BreadcrumbList, WebSite) ✅.

## 3. Temuan terbuka — konfirmasi/bantah

### 3.1 `/produk/<slug-tak-ada>` HTTP 200 — **DIKONFIRMASI (sebagian, lebih luas dari dugaan)**
- Request **pertama** untuk slug yang belum pernah diminta → **200** (shell PPR sudah ter-stream sebelum `notFound()` dilempar dari dalam Suspense); request kedua untuk slug yang sama → 404 (hasil di-cache). Bukti: `x31121 try1 200 / try2 404 / try3 404`.
- Berlaku juga untuk `/jurnal/<x>`, `/resep/<x>`, `/jurnal/kategori/<x>` (masing-masing 200 pada hit pertama, termasuk dengan UA Googlebot).
- Mitigasi yang sudah ada: body memuat `<meta name="robots" content="noindex">` + `NEXT_HTTP_ERROR_FALLBACK;404`, judul "Halaman tidak ditemukan" → Google memperlakukannya sebagai soft-404, tidak terindeks. Tetapi **h1 = 0** di respons itu (UI not-found tidak ikut ter-render di stream pertama, hanya meta) — pengguna tetap melihat halaman not-found setelah hidrasi.
- Akar: `cacheComponents: true` (`next.config.ts:77`) + `generateStaticParams` tanpa penolakan param tak dikenal; `notFound()` dipanggil di `page.tsx:75` (produk), `jurnal/[slug]/page.tsx:80`, `resep/[slug]/page.tsx:67`, `kategori/[slug]/page.tsx:50` setelah shell dikirim.
- Saran fix: periksa keberadaan slug **di `proxy.ts`** (map slug ter-cache seperti redirects, TTL 60 s) dan rewrite ke 404 sebelum render, atau pindahkan lookup ke luar Suspense (top-level `await` di page tanpa `connection()`) dan verifikasi dengan curl hit-pertama. Baca dulu `node_modules/next/dist/docs/` bagian `dynamicParams`/cacheComponents. **M · opus**.

### 3.2 Sitemap tidak mengecualikan `seo.noindex` — **DIKONFIRMASI**
- `src/app/sitemap.ts:30-51` hanya memakai `getProductSlugs/getPostSlugs/getRecipeSlugs/getCategories` yang memilih `{slug, updatedAt}` saja; tidak ada kolom/filter `seo`. Admin punya toggle noindex untuk halaman (`page-meta-form.tsx:148-154`), produk (`admin/produk/_lib/form-state.ts:19`), jurnal/resep (`content-fields.tsx:413-418`), dan `buildMetadata` menghormatinya (`src/lib/seo/metadata.ts:45,53`) → URL noindex tetap terdaftar di sitemap (sinyal bertentangan di Search Console).
- Juga: 17 route statis di-hard-code; halaman CMS yang di-noindex/di-unpublish tetap masuk.
- Saran fix: tambah `seo` ke query slug (atau filter `(seo->>'noindex') is distinct from 'true'`), pakai `getPublishedPageSlugs()` (`src/features/pages/queries.ts:49`, saat ini **tidak dipakai di mana pun**) untuk route statis berbasis CMS dan saring noindex; `lastModified` dari `updatedAt`. Tambah unit test. **S · sonnet**.

### 3.3 Halaman CMS di tabel `pages` tanpa route publik — **DIKONFIRMASI (dua sisi)**
- (a) Admin bisa membuat halaman baru (`admin/halaman/_components/page-list.tsx:230` → `createPage`) dengan slug bebas, tetapi **tidak ada route catch-all** di `src/app/(site)` (tak ada `[slug]`/`[...slug]`) → halaman baru tidak pernah tampil publik.
- (b) Halaman seed `produk`, `faq`, `kontak` (`src/db/seed/pages.ts:108,339,350`) **tidak dibaca route-nya**: `src/app/(site)/{produk,faq,kontak}/page.tsx` tidak memanggil `getPage` — judul/deskripsi/hero di-hard-code (mis. `faq/page.tsx:22-31`, `kontak/page.tsx:20-25`, `produk/page.tsx:32-38`). Editan pemilik di Admin → Halaman untuk ketiganya **tidak berefek** (melanggar §15 "semua konten publik dapat diedit dari admin" & acceptance Fase 4 "tanpa teks hard-code yang semestinya dari CMS"). Toggle noindex di halaman-halaman itu juga tidak berefek.
- Saran fix: (a) tambah `src/app/(site)/[slug]/page.tsx` generik (BlockRenderer + `pageMetadata`, `notFound` untuk slug yang di-reserve/tak ada) **atau** larang create di admin & tandai halaman sistem; (b) baca `getPage("produk"|"faq"|"kontak")` untuk hero/SEO/section, sisakan bagian data-driven (grid produk, FaqBrowser, peta). **M · sonnet** (a: S, b: M).

## 4. Verdict per task

Legenda: ✅ lengkap & berfungsi · ⚠️ berfungsi dengan gap · ❌ belum ada/stub. Ukuran S/M/L, model = saran routing.

| Task | Verdict | Bukti | Gap konkret → saran fix (ukuran · model) |
|---|---|---|---|
| **P4.1** Header/footer/announcement/floating WA/breadcrumb | ✅ | `src/app/(site)/layout.tsx:72` `<main id="main">` + skip link "Langsung ke konten utama" (HTML); `site-header.tsx:41` ThemeToggle; `mobile-menu.tsx` (Radix Dialog full-screen); `floating-whatsapp.tsx:25-57` (sembunyi di rute tertentu, safe-area, `pb-24` di `/custom-order`); `breadcrumb.tsx` + BreadcrumbList JSON-LD di semua halaman (curl) | Announcement bar = teks statis seed (`src/db/seed/navigation.ts:92` "PO untuk Selasa ditutup Jumat…"), bukan "status slot minggu ini" dinamis (§4) → opsional: varian announcement yang menurunkan ringkasan dari `getAvailability` 7 hari (S · sonnet). ThemeToggle `hidden sm:inline-flex` di header; di mobile tersedia di menu (`mobile-menu.tsx:105`) ✅ |
| **P4.2** Beranda | ✅ | `src/app/(site)/page.tsx:63-160`: hero SplitReveal+Counter+Magnetic+Parallax (`home-hero.tsx:61,85`), TrustMarquee, PinnedStory proses, pilar, cara pesan + aturan PO dari settings, SlotWeekStrip 7 hari (`slot-teaser.tsx:61`, sudah tidak TODO), untuk siapa + B2B WA, testimoni berlabel "Contoh testimoni" (`blocks/renderers/data.tsx:94`), resep, jurnal, FAQ, CTA penutup. curl: 1 h1, 11 h2 sesuai urutan §4, JSON-LD FoodEstablishment+Organization+WebSite+FAQPage | Label CTA hero dari CMS ("Cek slot via WhatsApp" ✅, sekunder "Lihat dua varian" ≈ "Kenali Varian") — OK. STATE masih menulis "[TODO P4.5]" di catatan — usang, hanya dokumentasi |
| **P4.3** `/produk` + `/produk/[slug]` | ⚠️ | Tabel perbandingan (`<table>` di `/produk`), detail: rasa & tekstur, cocok untuk, bentuk/ukuran (tabel), penyimpanan, gizi per 100 g + sumber TKPI, CTA `custom-order?produk=` + WA prefilled, Product+Offer JSON-LD, OG per produk | (1) **FAQ produk tidak ada** di `/produk/[slug]` (§4) — h2 hanya Rasa/Cocok/Bentuk/Penyimpanan/Gizi/Pesan → tambah `getFaqs({category:"produk"})` + FAQPage JSON-LD (S · sonnet). (2) **Tidak ada link ke resep** dari produk (§9 internal linking produk↔resep) → section "Resep dengan varian ini" (S · sonnet). (3) `/produk` mengabaikan CMS page `produk` (lihat §3.3b) dan **galeri bentuk & ukuran** dari seed (featureGrid "Bentuk dan ukuran") tak tampil → render via `getPage("produk")` (M · sonnet). (4) Judul ganda "— Tempe Mak Nuk — Tempe Mak Nuk" di detail (S · sonnet, lihat P6.1) |
| **P4.4** Order Builder `/custom-order` | ✅ | `src/features/orders/{catalog,date-rules,schema,message,draft}.ts`; opsi dari DB (`custom-order/page.tsx:38-72` getProductOptions/getSettings/getAvailability); lead time+cutoff+hari libur+kapasitas via slot engine (`features/slots/availability.ts:6-13,95-100`); tanggal tak valid tetap fokusable `aria-disabled` + alasan (`slot-calendar.tsx:84,135`); format WA persis §5.1 (`message.ts:27,80-99`) + baris tambahan "Ambil/kirim"; draft localStorage 14 hari (`order-builder.tsx:126-154`); `?produk=` dipra-pilih; `trackWaClick` anonim ke `wa_clicks` (`features/analytics/actions.ts:32-43`, tanpa PII, rate-limit). E2E `order-builder.spec.ts` **1 passed (2.0s)** vs :3101; vitest orders/slots/seo/consent/redirects **80/80 pass** | Judul ganda (lihat P6.1). Hit pertama `/custom-order` 1,4 s (DB remote, berurutan sengaja `page.tsx:37`) — terima |
| **P4.5** `/cara-pesan` + kalender publik | ✅ | curl: 2 `<table>` (cutoff "dipakai X → PO paling lambat Y" ×27), "Status diperbarui manual" ✅ §5.2, status Tersedia/Hampir penuh/Penuh/Libur, pembayaran & pickup; HowTo JSON-LD; `PublicSlotCalendar`/`SlotWeekStrip` dipakai ulang di beranda | Judul ganda (P6.1) |
| **P4.6** `/kemitraan` + form → WA | ✅ | `kemitraan/_components/inquiry-form.tsx:32,78,91-95` (Zod + RHF → `buildWaLink`, tanpa simpan data); konten katering/resto/reseller/kantor/jadwal rutin dari CMS | – |
| **P4.7** `/proses`, `/manfaat-tempe`, `/halal-kualitas`, `/tentang` | ⚠️ | Semua via `getPage()` + BlockRenderer; proses memuat 7 tahap (sortir…fermentasi) + HowTo; manfaat: TKPI/USDA, protein, perbandingan daging, disclaimer "bukan nasihat medis"; halal: BPJPH, nomor ID33…, link verifikasi halal.go.id, higienis; tentang: cerita 2001, stats, nilai ("Yang kami pegang") | (1) `/manfaat-tempe` **tanpa kata "probiotik"** (§4 menyebut probiotik) → tambah paragraf bersumber soal fermentasi/probiotik di seed + catatan sumber (S · sonnet). (2) `/tentang` tanpa **timeline** & **tim/keluarga** sebagai section (hanya kalimat "anak-anak Mak Nuk") → blok timeline di seed (S · sonnet). (3) `/proses` tanpa PinnedStory/foto berganti (dicatat di STATE; §4 hanya minta timeline — OK) |
| **P4.8** `/jurnal` | ✅ | list + kategori (`jurnal/kategori/[slug]`), detail: TOC "Daftar isi", "menit baca", related "terkait", BlogPosting JSON-LD, OG per artikel; link ke produk/resep/FAQ (curl) | Kategori: judul "Tips Tempe **Tempe**: Artikel…" & deskripsi "tips tempe tempe" (`jurnal/kategori/[slug]/page.tsx:34-35`) — nama kategori sudah memuat "Tempe" → jangan tempel kata "Tempe" lagi (S · sonnet). Hanya 3 artikel live di sitemap (8 pilar seed, 5 draft — sesuai §9 "draft untuk direview") |
| **P4.9** `/resep` | ✅ | `resep/_components/recipe-browser.tsx:73-106` filter kategori/kesulitan/waktu; detail bahan/langkah/tips/produk terkait; Recipe JSON-LD lengkap kecuali `image` | `Recipe.image` kosong → Rich Results Recipe tidak eligible sampai foto ada; fallback pakai URL OG resep sebagai `image` (S · sonnet) |
| **P4.10** `/faq`, `/kontak`, 404/500 | ⚠️ | `/faq`: FaqBrowser search + grup + FAQPage; `/kontak`: tombol "Tampilkan peta" (iframe lazy setelah klik), jam, WA, IG, ContactPage+FoodEstablishment; `(site)/not-found.tsx`, `(site)/error.tsx`, `app/not-found.tsx`, `global-error.tsx` (noindex); `/halaman-tak-ada` → 404 + 1 h1 | (1) `/faq` & `/kontak` hard-code hero/SEO, abaikan CMS page `faq`/`kontak` (§3.3b) (M · sonnet). (2) Dynamic 404 hit pertama = 200 (§3.1) (M · opus) |
| **P4.11** Cookie consent + legal | ⚠️ | `features/consent/cookie.ts:2` `tmn_consent` {version, timestamp}, versi berubah → tanya ulang (`cookie.ts:63-68`); banner SSR + dialog kategori Wajib/Analitik/Pemasaran (`db/seed/settings.ts:98`); 3 tombol setara variant `secondary` (`consent-ui.tsx:107-131`); AnalyticsGate memuat Vercel Analytics/SpeedInsights **hanya setelah consent** (`analytics-gate.tsx:18-27`); teks/kategori/versi editable di Admin → Legal (`admin/legal/_components/consent-editor.tsx`); link "Pengaturan cookie" di footer; 4 legal page dengan "Versi · berlaku sejak" + label "Dokumen contoh" + rujukan UU 27/2022 | (1) **Masa simpan 180 hari** (`cookie.ts:3` `CONSENT_MAX_AGE_DAYS = 180`) ≠ §5.4 "12 bulan" → ubah ke 365 atau catat keputusan (S · sonnet). (2) Label tombol "Tolak" ≠ "Tolak opsional" (§5.4) → ganti teks (S · sonnet). (3) **Legal tanpa TOC** (§4 "tanggal berlaku, versi, TOC"; `legal-page.tsx:28-55`) → reuse `extractHeadings` dari jurnal (S · sonnet). (4) Legal metadata tanpa `description` → semua 4 halaman pakai deskripsi default situs (duplikat) (`legal-page.tsx:20-26`) (S · sonnet) |
| **P6.1** `lib/seo` + JSON-LD | ⚠️ | `src/lib/seo/{metadata,json-ld-builders,server,url}.ts`; title template `%s — ${name}` (`server.ts:50`); canonical/OG/Twitter/robots di `buildMetadata` (`metadata.ts:43-80`); semua tipe JSON-LD §9 ter-render & valid JSON (§2); 15 unit test lolos | (1) **Judul ganda** di `/produk/[slug]`, `/custom-order`, `/cara-pesan`, `/jurnal/[slug]`, `/resep/[slug]`: `seo.title` CMS sudah berakhiran "— Tempe Mak Nuk"/"— Mak Nuk" lalu template menambah lagi. Fix: di `buildMetadata` pakai `absolute` bila `seo.title` sudah memuat siteName, atau bersihkan seed + hint di admin (S · sonnet). (2) Canonical/OG ber-host `localhost:3000` di build lokal — wajib `NEXT_PUBLIC_SITE_URL` di Vercel (docs/deploy.md) (verifikasi saat deploy). (3) `image` kosong di Product/Recipe/BlogPosting → fallback ke URL OG (S · sonnet) |
| **P6.2** sitemap/robots/manifest/redirects | ⚠️ | §2: robots blokir /admin,/api; sitemap dinamis 32 URL (artikel/resep/produk/kategori dari DB); manifest + PNG ikon; redirect DB di `src/proxy.ts:23-45` (TTL 60 s) + `features/redirects/match.test.ts` lolos | (1) Sitemap tak menyaring `seo.noindex` & tak memakai status halaman CMS (§3.2) (S · sonnet). (2) Route statis tanpa `lastModified` (S · sonnet, bareng 1) |
| **P6.3** OG dinamis + icon | ✅ | `src/lib/og/index.tsx` + `(site)/opengraph-image.tsx`, `produk|jurnal|resep/[slug]/opengraph-image.tsx` semua 200 image/png; `/og-default.png` fallback; `/icon`, `/apple-icon` 200 | `twitter-image` file tidak ada (twitter:image tetap = OG → cukup); `/favicon.ico` 404 (minor: tambah `app/favicon.ico`, S · sonnet). OG "per halaman" konten statis (/faq, /proses, …) memakai `og-default.png` generik, bukan judul halaman — §8 meminta "per halaman"; opsional `opengraph-image.tsx` generik membaca judul halaman (S · sonnet) |
| **P6.4** Audit performa | ⚠️ | `docs/performance.md`: Lighthouse devtools median 3 → skor 98–99, LCP 1,6–1,9 s, CLS 0 di 5 route; font subset latin, Fraunces `preload:false`, GSAP/Lenis lazy, analytics setelah consent | (1) **Bundle analyzer tidak dipasang/dijalankan** (tak ada di `package.json`/`next.config.ts`) padahal judul task menyebutnya → tambah `@next/bundle-analyzer` atau `next experimental-analyze` dan catat hasil (S · sonnet). (2) **INP tidak diukur** (hanya TBT ~135 ms di beranda) — §9 target INP < 200 ms → ukur di Vercel Speed Insights/RUM pasca-deploy. (3) Hanya kategori **performance** diukur; §9/§15 minta Lighthouse ≥ 95 **semua kategori** (a11y/best-practices/SEO) → jalankan semua kategori untuk 5 route & catat (S · sonnet). (4) Sisa rekomendasi (prefetch day-picker 22 kB, browserslist) belum dikerjakan |

## 5. Cek lintas-section PROMPT

| Ref | Status | Catatan |
|---|---|---|
| §3 pesan kunci | ✅ | Trust strip seed: "Bersertifikat Halal BPJPH · Sejak 2001 · Tanpa pengawet · Tanpa minimum order" (`src/db/seed/pages.ts:20-30`); hero "Tiga bahan, tanpa jalan pintas." (kedelai, air, ragi); dua varian di mana-mana; kelangkaan jujur ("Tempe yang layak ditunggu", "Status diperbarui manual") |
| §4 IA | ⚠️ | Semua route ada & 200; gap: FAQ produk & link resep di `/produk/[slug]`, galeri bentuk di `/produk`, probiotik di `/manfaat-tempe`, timeline/tim di `/tentang`, TOC legal, announcement slot dinamis |
| §5.1 Order Builder | ✅ | Semua field (varian→bentuk→ukuran→jumlah→tanggal→keperluan→catatan, nama/area), lead time/cutoff/libur/penuh disabled+alasan, format WA, draft, `wa_clicks` |
| §5.2 Kalender | ✅ | 4 status publik, teks jujur, tanpa data pelanggan |
| §5.4 Consent | ⚠️ | 180 hari ≠ 12 bulan; label "Tolak" ≠ "Tolak opsional" |
| §7 Motion | ⚠️ | GSAP/ScrollTrigger/SplitText/Lenis, marquee, counter, magnetic, parallax, pinned story, `gsap.matchMedia` reduced-motion (5 file motion), `useGSAP` cleanup ✅. **Belum:** View Transitions (tak ada `viewTransition`/`startViewTransition` di `src`/`next.config.ts`) dan **Motion (framer) tidak dipakai** (`motion` ada di `package.json:46` tetapi 0 import `motion/react`) → hapus dep atau pakai untuk micro-interaction; aktifkan `experimental.viewTransition` setelah baca docs Next 16 (S · opus) |
| §8 Gambar | ✅ | Placeholder ber-art-direction (`features/pages/blocks/shared.tsx:172`), `next/image` + blur + `sizes`, OG dinamis, `docs/photo-brief.md` ada. Belum ada foto nyata (sesuai rencana) |
| §9 SEO | ⚠️ | Metadata per route, sitemap/robots, semua JSON-LD, 1 h1 di semua halaman 200, internal linking artikel/resep→produk/FAQ ✅. Gap: judul ganda (5 tipe route), sitemap noindex, legal description duplikat, produk→resep link, `image` di JSON-LD, Lighthouse semua kategori belum dicatat |
| §15 DoD (bagian F4/F6) | ⚠️ | Route ✅; "semua konten publik dapat diedit dari admin" ❌ untuk `/produk`, `/faq`, `/kontak` hero/SEO; Lighthouse ≥95 hanya performance terbukti; JSON-LD valid secara sintaks (Rich Results Test belum dijalankan; Recipe tanpa `image` akan kena peringatan/eligibility) |

## 6. Grep `TODO|FIXME|placeholder|lorem`

Lingkup `src/app/(site)`, `src/components/site`, `src/features` (tanpa test & atribut `placeholder=` input):
- **0** `TODO`/`FIXME`/`lorem`.
- `placeholder` yang muncul semuanya **disengaja & berlabel**: komentar testimoni berlabel (`src/app/(site)/page.tsx:147`, `features/testimonials/queries.ts:19` → badge "Contoh testimoni" `blocks/renderers/data.tsx:94`, terlihat 2× di HTML beranda), art placeholder proses (`components/site/home/process-story.tsx:24`), fallback media (`features/pages/blocks/shared.tsx:172`, `blocks/schema.ts:8`), prop input (`orders/components/step-customer.tsx:25,31`), validasi blur (`features/media/schema.ts:25`). Legal berlabel "Dokumen contoh — perlu ditinjau ahli hukum." (`(legal)/legal-page.tsx:48`). Data bisnis seed (WA `+62 812-3456-7890`, ID33…) = dummy §0, diganti via Admin → Pengaturan.

## 7. Ringkasan

- Verdict: **✅ 8** (P4.1, P4.2, P4.4, P4.5, P4.6, P4.8, P4.9, P6.3) · **⚠️ 7** (P4.3, P4.7, P4.10, P4.11, P6.1, P6.2, P6.4) · **❌ 0**.
- Temuan terbuka: 3/3 **dikonfirmasi** (404 hit-pertama berlaku untuk semua route dinamis, bukan hanya produk).

### Prioritas fix

| # | Gap | Ukuran · model |
|---|---|---|
| 1 | Halaman CMS `produk`/`faq`/`kontak` diabaikan route-nya (hero/SEO hard-code) + halaman baru dari admin tak punya route publik (catch-all atau blokir create) | M · sonnet |
| 2 | Slug tak dikenal di `/produk`, `/jurnal`, `/resep`, `/jurnal/kategori` → 200 pada hit pertama (soft-404) | M · opus |
| 3 | Sitemap tak menyaring `seo.noindex` / status halaman; pakai `getPublishedPageSlugs` | S · sonnet |
| 4 | Judul ganda "— Tempe Mak Nuk — Tempe Mak Nuk" (produk, custom-order, cara-pesan, jurnal, resep) + kategori "Tempe Tempe" | S · sonnet |
| 5 | `/produk/[slug]`: FAQ produk + link resep terkait (§4, §9 internal linking) | S · sonnet |
| 6 | Consent: Max-Age 365 hari, label "Tolak opsional"; legal: TOC + description unik | S · sonnet |
| 7 | JSON-LD `image` fallback (OG URL) untuk Recipe/Product/BlogPosting | S · sonnet |
| 8 | P6.4: bundle analyzer + Lighthouse semua kategori + INP (RUM pasca-deploy) | S · sonnet |
| 9 | Konten: probiotik di `/manfaat-tempe`, timeline+tim di `/tentang`, galeri bentuk `/produk`, announcement slot dinamis | S · sonnet |
| 10 | Motion: View Transitions + putuskan dep `motion` (unused) | S · opus |
| 11 | Minor: `/favicon.ico` 404, OG per halaman statis generik | S · sonnet |
