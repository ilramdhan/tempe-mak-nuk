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

## P8.11 — animasi tertunda, SlotCalendar lazy, browserslist (2026-10-21)

Metodologi sama (devtools throttling, mobile, Lighthouse 13.5, `next start`, median 3 run; beranda 5 run karena LCP-nya bervariasi). "Sebelum" = HEAD `bedecee` dibuild ulang di mesin yang sama.

| Route | Skor | FCP | LCP | TBT | CLS | JS kB |
|---|---|---|---|---|---|---|
| `/` sebelum | 98 | 1644 | 1644 | **133** | 0 | **322** |
| `/` sesudah | 99 | 1642 | 1903* | **0** | 0 | **288** |
| `/custom-order` sebelum | 92 | 2693 | 2693 | 2 | 0 | 381 |
| `/custom-order` sesudah | 99 | 1602 | 1602 | 0 | 0 | 354 |
| `/produk` sebelum | 99 | 1622 | 1622 | 8 | 0 | 331 |
| `/produk` sesudah | 99 | 1624 | 1624 | 3 | 0 | 297 |

\* LCP beranda sesudah = 1631–2693 ms (5 run: 2693, 1643, 1903, 1956, 1631). Elemen LCP tetap paragraf banner cookie, dan seluruh waktunya `elementRenderDelay` (banner `invisible` sampai font UI siap). Ini bukan regresi dari P8.11 (FCP tidak berubah, TBT 0), melainkan varians gate font. Baseline juga punya run 2196 ms.

Perubahan:

1. **GSAP keluar dari JS kritis + init ditunda** (`src/components/motion/*`).
   - Komponen kit (`Reveal`, `SplitReveal`, `Parallax`, `Counter`, `Magnetic`, `PinnedStory`) tidak lagi meng-import `./gsap` secara statis, tetapi memakai `useMotionEffect`.
   - `useMotionEffect` memakai `scheduleInit`: tunggu IntersectionObserver (`rootMargin` 25 % di bawah viewport), lalu `requestIdleCallback` (timeout 300 ms; `idle` 1200 ms; tanpa rIC → `setTimeout` ≤200 ms). Setelah itu `import("./gsap")` (satu promise, dipakai bersama `LenisProvider`) dan setup dijalankan di `gsap.context` (di-revert saat unmount).
   - Hero `SplitReveal trigger="load"` memakai idle timeout 150 ms; `Magnetic` hanya `idle`.
   - Konstanta dipindah ke `tokens.ts` (tanpa GSAP). Barrel `@/components/motion` tidak lagi me-re-export `gsap`/`ScrollTrigger`/`SplitText`/`useGSAP`; impor itu dari `@/components/motion/gsap` bila benar-benar perlu.
   - Reduced motion: GSAP tidak dimuat sama sekali, elemen langsung `data-motion-ready`.
   - Konten tetap terlihat tanpa JS: pre-state CSS hanya aktif di `(scripting: enabled) and (prefers-reduced-motion: no-preference)`. Failsafe CSS (2,5 s hero / 4 s lainnya) tetap ada sampai hidrasi. Setelah hidrasi (jika < 2,4 s) elemen diberi `data-motion-pending`, yang mematikan failsafe agar konten di bawah lipatan tidak "muncul lalu disembunyikan lagi" oleh GSAP. Jika chunk GSAP gagal dimuat, elemen langsung `data-motion-ready`.
   - Hasil: chunk GSAP (~47 kB gz) dimuat ±4 s setelah navigasi (idle), bukan saat hidrasi. TBT beranda 133 → 0 ms, CLS tetap 0.
2. **`SlotCalendar` di-code-split** (`slot-calendar-lazy.tsx`, `next/dynamic`, SSR tetap aktif, skeleton ukuran sama).
   - `SlotLegend` dipindah ke `slot-legend.tsx` (re-export dari `slot-calendar.tsx` tetap ada) agar legenda tidak menarik react-day-picker.
   - Import site: `step-date.tsx`, `public-slot-calendar.tsx`.
   - Chunk react-day-picker/date-fns (`34j-…`, 22 kB gz) tidak lagi diminta oleh beranda maupun `/produk` (diverifikasi dari network log Lighthouse); hanya dimuat di `/custom-order` dan `/cara-pesan` saat kalender dirender.
3. **`browserslist` modern** di `package.json` (`chrome 111, edge 111, firefox 111, safari 16.4` = default Next 16, `docs/03-architecture/supported-browsers.md`).
   - Byte JS **tidak berubah**. Chunk framework (`03vu-…`) identik (hash sama). Audit "legacy JavaScript" tetap ~14 KiB: polyfill `Array.prototype.at/flat/flatMap`, `Object.fromEntries/hasOwn`, `String.prototype.trimStart/trimEnd` berasal dari `next/dist/build/polyfills/polyfill-module.js` yang selalu di-import `next/dist/client/app-globals.js` (prebuilt, tidak ditranspile ulang mengikuti browserslist). Polyfill ini kecil (1,4 kB mentah / 0,6 kB gz); angka 14 KiB dari Lighthouse adalah estimasi heuristik untuk seluruh chunk.
   - Field ini tetap dipasang sebagai dokumentasi target dan untuk kode aplikasi/CSS (Lightning CSS).
4. **Paket `motion`** (`motion@^14`) tidak dipakai di `src` (tidak ada `from "motion"` / `motion/react`). Kandidat dihapus dari dependencies.

### Chunk teratas (semua chunk klien, gzip -9; total 90 file, 1037 kB gz sebelum)

| Chunk | gz | Isi | Dimuat di situs publik |
|---|---|---|---|
| `3t_98y31ac03m` | 129 kB | Tiptap/ProseMirror | admin saja |
| `03vu-ogm44ez1` | 72 kB | react-dom + polyfill Next | semua route |
| `16orsahzi2f_7` | 47 kB | GSAP + ScrollTrigger + SplitText | beranda / produk detail, **lazy (idle)** |
| `0cz1d0mv5g_q7` | 39 kB | runtime Next (router) | semua route |
| `2fykjmz9r8e35` | 35 kB | runtime Next/React (app) | semua route |
| `30n6-cr5sg750` | 31 kB | zod | form (custom-order, admin) |
| `2ep565e6co0dq` | 24 kB | layout situs (Lenis wrapper, header, consent, motion kit tanpa GSAP) | semua route |
| `32533c_deuywu` | 22 kB | Radix | admin + dialog/menu |
| `34j-cz_xi0eu6` | 22 kB | react-day-picker + date-fns | **custom-order / cara-pesan saja** |

Analyzer: Next 16.4 punya `pnpm next analyze` (Turbopack, UI di port 4000) dan `pnpm next analyze --output --snapshot <nama>` + `pnpm next analyze export --snapshot <nama>` (JSON Lines, output di `.next/diagnostics/analyze`). `@next/bundle-analyzer` hanya untuk webpack, jadi tidak dipakai. Tabel di atas diambil dari `.next/static/chunks` + network log Lighthouse.

## Sisa rekomendasi

- ~~TBT beranda~~, ~~chunk react-day-picker di prefetch~~: selesai di P8.11.
- Legacy JS ~14 KiB (estimasi Lighthouse) berasal dari polyfill bawaan Next; tidak bisa dihapus lewat `browserslist` (lihat P8.11 §3).
- LCP beranda masih ditentukan banner cookie (gate font UI ≤1,5 s) dan bervariasi 1,6–2,7 s di devtools throttling. Opsi lanjutan: pendekkan gate font atau render banner dengan font fallback ber-metric.
- CSS global 25 kB gz: audit utilitas admin/dev yang ikut ter-scan Tailwind (`@source`) bila ingin lebih kecil.
- URL OG punya sufiks hash (`/opengraph-image-12o0cb`), sedangkan `og:image` di halaman mengarah ke `/opengraph-image` (404 di build lokal), dan host `og:image` = `localhost:3000` (dari env). Ini perlu dicek di P6.1/P6.3.
- Ukur ulang di Vercel (TTFB CDN, Speed Insights RUM setelah consent) sebelum launch; DB remote (±700 ms) hanya memengaruhi bagian dinamis/revalidasi, karena shell route di atas sudah prerender.
