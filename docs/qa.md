# QA Visual & Aksesibilitas (P7.2)

> Tanggal: 2026-10-21. Cakupan: situs publik (bukan admin).

## Metode

1. `pnpm build` lalu `pnpm exec playwright test tests/e2e/screenshots.spec.ts`: 66 screenshot full-page (11 rute × 375/768/1440 × light/dark, `reducedMotion: reduce`) di `test-results/screenshots/`.
2. Screenshot ditinjau manual (dipotong per 2400 px): semua rute utama di 375 light, beranda/produk di 1440 light & dark, FAQ di 375 dark.
3. Axe (`tests/e2e/a11y.spec.ts`, tag wcag2a/aa + 21a/aa) di 11 rute. Pelanggaran yang sebelumnya di-allowlist (`KNOWN`) diperbaiki, lalu `KNOWN` dikosongkan.
4. Acuan: PROMPT.md §6 (design), §7 (motion), docs/brand.md (token kontras, microcopy, tone "Anda").

## Temuan & status

### Aksesibilitas (axe)

| # | Severity | Rute | Viewport/tema | Temuan | Perbaikan | Status |
|---|---|---|---|---|---|---|
| A1 | critical | /custom-order | semua | `button-name`: radio produk `#order-product-*` (Radix `<button role="radio">`) tidak punya nama aksesibel; axe tidak menghitung `<label for>` untuk tombol | `OptionCard` memberi `aria-labelledby` → judul opsi dan `aria-describedby` → deskripsi/harga. Berlaku juga untuk radio bentuk & ukuran | fixed |
| A2 | serious | /produk | semua | `label-content-name-mismatch`: link gambar kartu produk `aria-label="{nama}"` tidak memuat teks tampak (caption placeholder) | Link gambar jadi duplikat dekoratif: `tabIndex={-1}` + `aria-hidden`; judul H2 tetap jadi link utama (sekaligus mengurangi tab stop ganda) | fixed |
| A3 | serious | / | md+, motion aktif | `color-contrast` (9 node): langkah non-aktif di scroll-story proses memakai `opacity-35` | Redup lewat warna, bukan opacity: nomor + judul langkah non-aktif → `text-muted-foreground` (AA, 5.1:1 light), body sudah muted | fixed |
| A4 | serious | /produk, /faq, /kontak, /jurnal, /resep, /kebijakan-privasi | ≥ md (label tampak) | `color-contrast` pada "Cek slot via WhatsApp". Sumbernya **tombol WhatsApp mengambang** (bukan CTA header, yang berlabel "Pesan"): animasi masuk `fade-in` membuat label semi-transparan saat axe memindai | Animasi masuk hanya slide (`slide-in-from-bottom-4`), tanpa fade opacity. Warna primary/primary-foreground sendiri 9.2:1 (light) / 9.6:1 (dark) | fixed |

Hasil: `E2E_AXE_STRICT=1` hijau di 11 rute, `KNOWN = {}`.

### Konsistensi visual

| # | Severity | Rute | Viewport/tema | Temuan | Perbaikan | Status |
|---|---|---|---|---|---|---|
| V1 | sedang | /produk, /jurnal, /jurnal/kategori/*, /resep, /faq, /kontak | semua | Eyebrow hero halaman tulisan-tangan memakai gaya muted tanpa garis, sedangkan beranda, /cara-pesan, dan halaman page-builder (/tentang, /kemitraan) memakai `rule tone="accent"` | Disamakan: `<Eyebrow rule tone="accent">` | fixed |
| V2 | sedang | /kontak, /faq | semua | CTA WhatsApp memakai varian `accent` (emas) di hero/isi, padahal di halaman lain CTA WA utama memakai primary (hijau); `accent` disimpan untuk penutup bernada hijau (ClosingCta) | `variant="accent"` → default (primary) di hero /kontak, CTA bawah /faq, dan state kosong pencarian FAQ | fixed |
| V3 | rendah | / (Empat pegangan) | semua | Kolom angka `01–04` berlebar `auto` per baris, sehingga judul tidak sejajar (01 lebih sempit dari 02/03) | Angka diberi `min-w-[1.5em]` agar kolom judul rata | fixed |
| V4 | rendah | / (Cocok untuk siapa) | dark | Lingkaran ikon `bg-surface` di atas `bg-card` tidak terlihat di dark (`--card` = `--surface`) | `bg-primary/10` (terlihat di dua tema) | fixed |
| V5 | rendah | / (Kata pelanggan) | dark | Badge "Contoh testimoni" (`secondary` = `bg-surface`) menyatu dengan kartu di dark | `dark:bg-foreground/10` pada badge itu | fixed |
| V6 | rendah | /faq, /kontak | semua | Tone "kamu/-mu" melanggar brand (sapaan "Anda"): "Cari pertanyaanmu", "setelah kamu klik" | Diganti "pertanyaan Anda", "setelah Anda klik" | fixed |
| V7 | rendah | global | dark | Token `--card` sama dengan `--surface` di dark, sehingga komponen `bg-surface` di dalam kartu (chip, badge `secondary`, ikon) tidak terlihat secara umum | P8.12: `--card` dark → `oklch(23.5% 0.011 88.8)` (#201E18), `--popover` = `var(--card)`. Kontras di atas card: foreground 14.4:1, muted-foreground 6.4:1, primary 8.4:1, accent 7.5:1, destructive 6.9:1, halal 7.5:1; card vs surface 1.07:1, vs background 1.15:1. `--input` dark 51.6% → `oklch(53% 0.024 86)` (#726B5C) agar border field tetap ≥ 3:1 di atas card (3.16:1; sebelumnya 2.97:1). Override lokal V4/V5 dibiarkan (tetap valid) | fixed |
| V8 | rendah | /custom-order | 375 | Bar "Lanjut" sticky menimpa gambar hero saat halaman baru dibuka (gambar placeholder tinggi) | P8.12: di < md bar hanya muncul saat form Order Builder terlihat (IntersectionObserver, `rootMargin` bawah −20%); saat tersembunyi `inert` + `invisible` + translate (tidak fokusable), transisi dimatikan untuk `prefers-reduced-motion`. Padding `env(safe-area-inset-bottom)` pada bar; form diberi `pb` setinggi bar (72 px + safe area) agar field terakhir tidak tertutup | fixed |
| V9 | info | / | 375 | Tombol WhatsApp mengambang menutup sebagian gambar/teks kanan saat scroll (mis. tepi kanan kartu) | P8.12: tidak dirender di `/custom-order` dan `/admin`; disembunyikan (`inert`, slide-out) saat banner consent tampil dan, di < md, saat footer (berisi link WA) terlihat. `html { scroll-padding-bottom: 5.5rem }` agar fokus/anchor tidak jatuh di bawah tombol/bar. Target 56 px, `aria-label` tetap | fixed |
| V10 | info | semua | semua | Placeholder gambar & testimoni `[PLACEHOLDER]` masih tampil (sesuai rencana sampai foto/ulasan asli ada) | Ganti lewat Admin (docs/photo-brief.md) | open |

Diperiksa dan tidak ada masalah: overflow horizontal 375 px (tabel perbandingan produk dibungkus scroll container), skala heading (display/h1/h2/h3 konsisten dari primitives), radius tombol (pill) dan ukuran, ritme section (`--section-y`), kontras teks body/muted di dua tema, header sticky light/dark.

## File yang diubah

- `src/features/orders/components/step-product.tsx` (A1)
- `src/app/(site)/produk/page.tsx` (A2, V1)
- `src/components/site/home/process-story.tsx` (A3)
- `src/components/site/layout/floating-whatsapp.tsx` (A4)
- `src/app/(site)/faq/page.tsx`, `src/app/(site)/faq/_components/faq-browser.tsx` (V1, V2, V6)
- `src/app/(site)/kontak/page.tsx`, `src/app/(site)/kontak/_components/lazy-map.tsx` (V1, V2, V6)
- `src/app/(site)/jurnal/page.tsx`, `src/app/(site)/jurnal/kategori/[slug]/page.tsx`, `src/app/(site)/resep/page.tsx` (V1)
- `src/components/site/home/pillars-section.tsx` (V3)
- `src/components/site/home/audience-section.tsx` (V4)
- `src/features/pages/blocks/renderers/data.tsx` (V5)
- `tests/e2e/a11y.spec.ts` (`KNOWN` dikosongkan; flag `E2E_AXE_STRICT` tetap)

## Verifikasi

`pnpm typecheck`, `pnpm lint`, `pnpm test` (331 lulus), `pnpm build`, `E2E_AXE_STRICT=1 pnpm exec playwright test tests/e2e/a11y.spec.ts` (11/11), dan `pnpm test:e2e` (41 lulus, 1 skip admin).

## Rekomendasi sisa

1. ~~V7~~, ~~V8~~ (dan V9) selesai di P8.12.
2. Opsional: hapus override lokal V4/V5 karena `--card` dark kini lebih terang dari `--surface`.
3. Tambahkan axe pada state interaktif (menu mobile terbuka, dialog consent, langkah 2–4 Order Builder, tema dark) karena tes saat ini hanya memindai state awal light.
4. Uji manual pembaca layar (VoiceOver iOS / TalkBack) untuk Order Builder dan accordion FAQ.
