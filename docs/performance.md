# Performa situs publik (P6.4)

Audit 2026-10-21 pada build produksi lokal (`next build` + `next start -p 3193`, DB lokal).
Lighthouse 13.5 (cache npx), Chrome headless, mobile 375×812 @2x, kategori performance.

## Metodologi

- **Utama — `--throttling-method=devtools`** (CPU 4×, ~1,6 Mbps, RTT 150 ms diterapkan nyata), median dari 3 run per route.
- Pembanding — `simulate` (default Lighthouse, 1 run). Mode ini memodelkan ulang waterfall dan sangat pesimis terhadap jumlah chunk JS; angka LCP-nya ±2× devtools pada situs ini. Dipakai untuk tren, bukan target.
- Baseline diukur ulang dengan metodologi yang sama (perubahan di-stash sementara, build ulang).
- JS = transfer (gzip) script yang termuat sampai idle; Font = transfer woff2.

## Hasil (devtools, median 3 run)

| Route | Skor | FCP | LCP | TBT | CLS | JS kB |
|---|---|---|---|---|---|---|
| `/` sebelum | 81 | 1792 | **4573** | 132 | 0 | 333 |
| `/` sesudah | 98 | 1635 | **1644** | 137 | 0 | 322 |
| `/produk/tempe-klasik` sebelum | 84 | 1726 | **4409** | 1 | 0 | 399 |
| `/produk/tempe-klasik` sesudah | 99 | 1596 | **1868** | 2 | 0 | 397 |
| `/custom-order` sebelum | 99 | 1724 | 1724 | 7 | 0 | 392 |
| `/custom-order` sesudah | 99 | 1596 | 1596 | 0 | 0 | 380 |
| `/jurnal` sebelum | 81 | 2677 | **4355** | 2 | 0 | 332 |
| `/jurnal` sesudah | 99 | 1599 | **1863** | 1 | 0 | 321 |
| `/resep/tempe-bacem` sebelum | 99 | 1731 | 1731 | 2 | 0 | 342 |
| `/resep/tempe-bacem` sesudah | 99 | 1608 | 1608 | 2 | 0 | 331 |

Semua route sekarang LCP < 2,0 s dan CLS 0 (target PROMPT.md §9). Font transfer tetap 149 kB, tetapi Fraunces (119 kB) tidak lagi di-preload.

Simulate (1 run, sebelum → sesudah): `/` LCP 4509 → 4581, `/produk/tempe-klasik` 4655 → 4209, `/custom-order` 4956 → 4057, `/jurnal` 4206 → 3905, `/resep/tempe-bacem` 4354 → 3609; CLS 0 di semua route.

## Temuan & perbaikan

1. **LCP = banner cookie yang dirender klien** (3/5 route). `ConsentUi` baru merender banner setelah hidrasi (`useSyncExternalStore` → `undefined` di SSR), jadi paragraf banner menjadi elemen LCP sekitar 4,4 s. Banner kini ikut dirender di HTML statis, dan skrip inline pra-paint menyembunyikannya bila cookie sudah memuat keputusan untuk versi config yang aktif. Banner tetap `invisible` (ruangnya sudah dipesan) sampai font UI siap (maks. 1,5 s), sehingga swap Geist tidak menggeser banner yang menempel di bawah (sempat CLS 0,04).
2. **Lenis + GSAP keluar dari jalur kritis.** `LenisProvider` (dipakai semua route via layout) dulu meng-import `lenis` dan `./gsap` secara statis. Sekarang keduanya di-`import()` setelah mount, dan tidak dimuat sama sekali saat `prefers-reduced-motion`. Import layout/mobile-menu memakai `@/components/motion/lenis-provider` langsung, bukan barrel. GSAP tetap ter-bundle di route yang memakai komponen motion (beranda), seperti sebelumnya.
3. **Analytics hanya setelah consent, juga di bundle.** `@vercel/analytics` dan `@vercel/speed-insights` sekarang `next/dynamic` (`ssr:false`) di `AnalyticsGate`, sehingga chunk-nya baru diminta setelah "analytics" diizinkan (sudah diverifikasi).
4. **`TooltipProvider` dilepas dari layout situs.** Tidak ada Tooltip di situs publik, jadi Radix Tooltip/Popper tidak lagi masuk JS awal semua route.
5. **Font:** Fraunces (opsz + SOFT, sekitar 120 kB woff2 latin) `preload: false`; hanya Geist (UI/body, sekitar 30 kB) yang di-preload. Heading dirender dulu dengan fallback ber-metric (`Fraunces Fallback`, `size-adjust`) lalu swap tanpa CLS. Subset sudah `latin` + `display: swap`. Axis `SOFT`/`opsz` dipakai di CSS, jadi tidak dipangkas (tanpa SOFT sekitar 62 kB, tapi itu mengubah tampilan).
6. **`next/image`:** `priority` (deprecated di Next 16) diganti `preload`. `PostGrid` kini hanya mem-preload kartu pertama (sebelumnya 3, saling berebut bandwidth). Blur placeholder dari `blurDataUrl` dan `sizes` sudah benar.
7. **OG cover WebP** (`src/lib/og/index.tsx`): `loadCover` menerima jpeg/png/webp/avif, lalu mengonversi via `sharp` (dynamic import, Node runtime) menjadi JPEG 680×680 `fit: cover`. Diverifikasi: cover WebP muncul di kartu OG.

## Dicoba & ditolak

- `experimental.inlineCss`: CSS Tailwind 153 kB mentah (25 kB gz) ter-inline dan terduplikasi di payload RSC, sehingga HTML beranda 1,16 MB mentah. FCP 3/5 route naik ke sekitar 2,7 s. Dikembalikan.

## Sisa rekomendasi

- **TBT beranda sekitar 135 ms**: SplitText/ScrollTrigger/PinnedStory dieksekusi saat hidrasi. Opsi: inisialisasi `scroll`-trigger reveal saat idle (`requestIdleCallback`) atau lazy per section di bawah lipatan.
- **Chunk react-day-picker/date-fns (sekitar 22 kB gz, hampir 100 % unused)** terprefetch di semua route lewat prefetch link `/custom-order` & `/cara-pesan`. Ini bukan blocking, tetapi bisa dikurangi dengan `prefetch={false}` pada link tersebut atau dynamic import `SlotCalendar`.
- **Legacy JS sekitar 14 kB** (polyfill `Array.prototype.at/flat`, `Object.hasOwn`, …) di chunk framework: set `browserslist` modern di package.json bila target browser mengizinkan.
- CSS global 25 kB gz: audit utilitas admin/dev yang ikut ter-scan Tailwind (`@source`) bila ingin lebih kecil.
- URL OG punya sufiks hash (`/opengraph-image-12o0cb`), sedangkan `og:image` di halaman mengarah ke `/opengraph-image` (404 di build lokal), dan host `og:image` = `localhost:3000` (dari env). Ini perlu dicek di P6.1/P6.3.
- Ukur ulang di Vercel (TTFB CDN, Speed Insights RUM setelah consent) sebelum launch; DB remote (±700 ms) hanya memengaruhi bagian dinamis/revalidasi, karena shell route di atas sudah prerender.
