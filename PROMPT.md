# PROMPT — Tempe Mak Nuk: Website Brand + CMS Admin

> Copy-paste seluruh file ini ke Claude Code (di root project kosong).
> §0 sudah diisi **data dummy** di `docs/business.md`. Semua nilai = seed tabel `settings` dan **wajib dapat diubah dari Admin → Pengaturan** (tidak ada hard-code di komponen).
> Rencana eksekusi & ledger progres ada di `PLAN.md` dan `STATE.md`.

---

## 0. Data Bisnis (isi sebelum mulai)

| Data | Nilai |
|---|---|
| Nama brand | Tempe Mak Nuk |
| Berdiri | ± 2001 — Klaten, Jawa Tengah |
| Alamat produksi lengkap | ⟨Jl. …, Desa …, Kec. …, Klaten⟩ |
| Koordinat / link Google Maps | ⟨https://maps.app.goo.gl/…⟩ |
| Nomor WhatsApp (format 62…) | ⟨62812xxxxxxx⟩ |
| No. Sertifikat Halal (BPJPH) | ⟨ID33…⟩ + tanggal terbit ⟨…⟩ |
| Izin lain (NIB / P-IRT) | ⟨opsional⟩ |
| Jam operasional & hari libur produksi | ⟨Senin–Sabtu 06.00–16.00⟩ |
| Area antar / ambil di tempat | ⟨Klaten kota, Solo, Jogja? / pickup only?⟩ |
| Aturan PO (lead time) | Minimal ⟨4⟩ hari sebelum tanggal pakai. Contoh: dipakai **Selasa** → PO paling lambat **Jumat** ⟨jam 15.00⟩ |
| Kapasitas / slot per hari | ⟨mis. 8 slot pelanggan / hari⟩ |
| Tampilkan harga? | ⟨ya: daftar harga / tidak: "tanya via WA"⟩ |
| Bentuk & ukuran yang tersedia | ⟨balok, lembaran tipis mendoan, bulat daun, silinder, mini/dadu, custom⟩ |
| Kemasan | ⟨daun pisang / plastik berlubang / keduanya⟩ |
| Cerita "Mak Nuk" (siapa, kenapa mulai) | ⟨2–5 kalimat dari pemilik⟩ |
| Media sosial | ⟨IG, TikTok, FB, Google Business Profile⟩ |
| Domain | ⟨tempemaknuk.com / .id⟩ |
| Bahasa situs | Bahasa Indonesia (utama) ⟨+ English opsional⟩ |

**Aturan keras konten:** jangan mengarang testimoni, angka penjualan, sertifikat, atau klaim medis. Testimoni & foto awal = placeholder yang jelas ditandai dan dikelola dari admin. Data gizi wajib bersumber (TKPI Kemenkes / USDA) dan dicantumkan sumbernya.

---

## 1. Peran

Kamu adalah tim gabungan: **Brand & Art Director, Senior Product Designer, Conversion Copywriter (Bahasa Indonesia natural, bukan terjemahan), Technical SEO Lead, dan Staff Fullstack Engineer (Next.js/Postgres)**. Kamu bekerja sebagai **orkestrator** yang membagi pekerjaan ke sub-agent sesuai `PLAN.md`.

## 2. Tujuan

Membangun website brand **Tempe Mak Nuk** — produsen tempe handmade sejak 2001 di Klaten — yang:

1. Terasa seperti brand artisan premium (referensi rasa: Aesop, Blue Bottle, Kinfolk, Oatly-nya Indonesia) — **bukan template AI**.
2. Menjadi sumber informasi tempe paling lengkap untuk pencari di Google ("tempe klaten", "tempe tanpa kulit", "pesan tempe custom", "supplier tempe katering solo", "tempe untuk MPASI", dll).
3. Mengkonversi pengunjung ke **chat WhatsApp untuk cek slot & PO**.
4. Semua konten dapat dikelola pemilik lewat **dashboard admin** tanpa menyentuh kode.
5. Gratis untuk di-host: **Vercel Hobby + Supabase Free**.

## 3. Positioning & Pesan Kunci

- **Kategori:** tempe segar siap masak, artisan, *slow-fermented*, superfood lokal.
- **USP (urutan prioritas):**
  1. 100% handmade, **tanpa pengawet, tanpa bahan kimia** — hanya kedelai, air, ragi.
  2. Dua varian: **Tempe Klasik** (kedelai dengan kulit ari) & **Tempe Original Tanpa Kulit** (kedelai dikupas bersih — lebih padat, lembut, putih, minim langu).
  3. **Custom bentuk & ukuran, tanpa minimum order.**
  4. **Bersertifikat Halal resmi** + standar higienis.
  5. Warisan **sejak 2001**, resep & tangan yang sama.
- **Kelangkaan yang jujur:** produksi terbatas → slot per hari terbatas → **PO jauh hari / cek slot via WA dulu**. Ini harus jadi pesan yang jelas tapi elegan, bukan "FOMO murahan".
- **Tagline:** buat 8 kandidat (≤ 6 kata, Bahasa Indonesia, ada nuansa waktu/kesabaran/kejujuran bahan), beri skor (ingat-able, relevan, beda), pilih 1 untuk hero; sisanya simpan di `docs/brand.md`. Arah contoh (jangan dipakai mentah): *"Difermentasi sabar sejak 2001"*, *"Kedelai, ragi, dan waktu."*
- **Tone of voice:** hangat, tenang, percaya diri, sedikit Jawa (sapaan "Mak", "monggo") secukupnya. Hindari superlatif kosong ("terbaik nomor 1", "revolusioner").

## 4. Arsitektur Informasi (multi-halaman)

Multi-halaman dipilih karena setiap topik = peluang ranking keyword sendiri. Semua halaman memakai **satu design system** (spacing, tipografi, tombol, radius, warna, motion identik).

| Route | Tujuan & keyword utama | Section |
|---|---|---|
| `/` Beranda | brand, "tempe klaten" | Announcement bar (status slot minggu ini) → Hero (tagline, 2 CTA: "Cek Slot via WhatsApp", "Kenali Varian") → Trust strip (Halal · Sejak 2001 · Tanpa Pengawet · Tanpa Min. Order) → Dua varian (teaser) → Kenapa Mak Nuk (4 pilar) → Proses singkat (scroll-story) → Cara pesan + aturan PO → Kalender slot (preview) → Untuk siapa (rumah tangga / MPASI / fitness / katering / resto) → Testimoni → Resep pilihan → Artikel terbaru → FAQ singkat → CTA penutup |
| `/produk` | "jenis tempe", "tempe tanpa kulit" | Grid varian, tabel perbandingan, galeri bentuk & ukuran |
| `/produk/[slug]` | per varian | Galeri, deskripsi, karakter rasa/tekstur, cocok untuk, bentuk tersedia, info gizi (sumber), penyimpanan, FAQ produk, CTA WA prefilled, JSON-LD `Product` |
| `/custom-order` | "pesan tempe custom", "tempe tanpa minimal order" | Order Builder interaktif (varian → bentuk → ukuran → jumlah → tanggal pakai → keperluan → catatan) → validasi lead time & ketersediaan slot → generate pesan WA rapi |
| `/cara-pesan` | "PO tempe" | Alur 4 langkah, aturan cutoff (tabel "dipakai hari X → PO paling lambat hari Y"), kalender slot, pengiriman/pickup, pembayaran |
| `/kemitraan` | "supplier tempe katering solo/klaten" | Untuk katering, resto, reseller, kantor: keunggulan konsistensi ukuran, jadwal rutin, form inquiry → WA |
| `/proses` | "cara membuat tempe tradisional" | Timeline 6 langkah sortir→cuci→kupas→rebus→ragi→bungkus→fermentasi, foto/ilustrasi, video opsional |
| `/manfaat-tempe` | "manfaat tempe", "gizi tempe" | Edukasi gizi bersumber, probiotik, protein, perbandingan, disclaimer non-medis |
| `/halal-kualitas` | "tempe halal" | Kartu sertifikat (nomor, penerbit, tanggal, link verifikasi BPJPH), standar higienis, bahan |
| `/tentang` | brand story | Cerita Mak Nuk sejak 2001, timeline, nilai, tim/keluarga |
| `/resep`, `/resep/[slug]` | long-tail resep | Resep dengan JSON-LD `Recipe`, filter kategori |
| `/jurnal`, `/jurnal/[slug]`, `/jurnal/kategori/[slug]` | blog/edukasi | Artikel, TOC, waktu baca, related posts, JSON-LD `Article` |
| `/faq` | long-tail Q&A | FAQ terkelompok + search, JSON-LD `FAQPage` |
| `/kontak` | "tempe mak nuk alamat" | Peta (embed lazy), jam buka, WA, IG, JSON-LD `LocalBusiness` |
| `/kebijakan-privasi`, `/syarat-ketentuan`, `/kebijakan-cookie`, `/kebijakan-pemesanan` | legal (UU PDP No. 27/2022) | Konten rich text dari CMS, tanggal berlaku, versi, TOC |
| `404`, `500` | | Halaman error yang tetap on-brand |

Global: header sticky (glass saat scroll), menu mobile full-screen, footer lengkap, **floating WhatsApp** (tidak menutupi CTA mobile), breadcrumb, theme toggle.

## 5. Fitur Inti

### 5.1 Order Builder → WhatsApp
- Pilihan berasal dari DB (varian, bentuk, ukuran dikelola admin).
- **Validasi lead time** berdasar setting admin (`lead_days`, `cutoff_time`, hari libur). Tanggal yang lewat cutoff atau penuh → disabled + penjelasan.
- Generate `https://wa.me/<nomor>?text=<encoded>` dengan format:
  ```
  Halo Mak Nuk, saya ingin cek slot & PO:
  • Varian: Tempe Original Tanpa Kulit
  • Bentuk/ukuran: Lembaran tipis (mendoan), 10×15 cm
  • Jumlah: 40 pcs
  • Tanggal pakai: Selasa, 21 Okt 2026
  • Keperluan: Katering
  • Catatan: …
  Nama: …  |  Area: …
  ```
- Simpan **draft** di localStorage; catat event klik (tanpa data pribadi) ke tabel `wa_clicks` untuk statistik di admin.

### 5.2 Kalender Slot
- Admin menentukan kapasitas per tanggal (default dari setting, override per hari), menandai slot terisi/penuh/libur.
- Publik melihat status: **Tersedia / Hampir penuh / Penuh / Libur** — tanpa membuka data pelanggan.
- Teks jujur: "Status diperbarui manual; konfirmasi akhir via WhatsApp."

### 5.3 Dashboard Admin (`/admin`)
Login Supabase Auth (email + password / magic link), role `owner` & `editor`. Modul:
- **Dashboard**: ringkasan slot minggu ini, klik WA 30 hari, artikel draft, peringatan konten kosong.
- **Halaman**: edit section tiap halaman (hero, teks, gambar, urutan, show/hide) — model *section blocks* JSON yang tervalidasi Zod.
- **Produk**: varian, bentuk, ukuran, harga (opsional), gizi, galeri.
- **Slot & PO**: kalender kapasitas, hari libur, aturan lead time/cutoff.
- **Jurnal & Resep**: editor rich text (Tiptap), draft/publish/schedule, SEO fields per post, cover image, kategori/tag.
- **FAQ**: CRUD + urutan drag-and-drop + kategori.
- **Testimoni**: CRUD, toggle tampil, tandai "terverifikasi".
- **Navigasi**: header menu, footer kolom, announcement bar, CTA global, floating WA.
- **Media**: upload ke Supabase Storage, auto resize/WebP, alt text wajib.
- **Pengaturan**: info bisnis, nomor WA, nomor halal, jam buka, sosial, SEO default, OG default, redirects.
- **Pengguna**: undang editor (owner only).
- Setiap simpan → `revalidateTag()` halaman terkait (ISR on-demand), audit log sederhana.

### 5.4 Cookie Consent & Privasi
- Banner consent (bawah, tidak menutup CTA) + dialog preferensi: **Wajib** (selalu aktif), **Analitik**, **Pemasaran**. Tombol setara: "Terima semua" / "Tolak opsional" / "Atur".
- Pilihan disimpan di cookie `tmn_consent` (versi + timestamp, 12 bulan); versi naik → tanya ulang. Link "Pengaturan cookie" di footer.
- Script analitik/pemasaran hanya dimuat setelah consent (Vercel Analytics cookieless boleh default, tetap dicantumkan).
- Teks banner, kategori, dan versi kebijakan dikelola dari Admin → Legal & Privasi.

## 6. Design System — "Warm Organic Minimalism"

**Anti AI-slop rules (wajib):**
- Dilarang: gradient ungu/biru generik, glassmorphism di mana-mana, emoji sebagai ikon, kartu-kartu identik berderet tanpa hierarki, "✨" di badge, ilustrasi blob 3D, font Inter untuk semua hal, copy "Unlock / Elevate / Seamless".
- Wajib: grid editorial asimetris, whitespace berani, tipografi besar dengan kontras ukuran, tekstur halus (grain/noise SVG ringan, motif miselium/serat kedelai), foto close-up tekstur, ritme section bervariasi (full-bleed → kolom → marquee → split → sticky story).

**Token (definisikan di `globals.css` via Tailwind v4 `@theme`, nilai OKLCH; turunkan dari palet ini, cek kontras WCAG AA):**

| Token | Light | Dark |
|---|---|---|
| `--background` | soy milk `#FAF7F2` | night soil `#100F0C` |
| `--surface` | raw soybean `#F1EBDF` | `#1A1813` |
| `--foreground` | `#1E1B16` | `#F3EEE4` |
| `--muted-foreground` | `#6B6458` | `#A79F90` |
| `--primary` (miselium/daun) | `#2F4A2C` | `#9CC28F` |
| `--accent` (kedelai keemasan) | `#B7792B` | `#DDA25A` |
| `--border` | `#E3DACB` | `#2B2820` |
| `--halal` | hijau resmi untuk badge halal | |

- **Tipografi:** Display serif variabel (*Fraunces* atau *Instrument Serif*) untuk headline; sans humanis (*Geist* / *Plus Jakarta Sans*) untuk UI; skala fluid `clamp()` (mis. 14→16 body, 40→96 display). Via `next/font` (self-host, `display: swap`).
- **Spacing:** skala 4px; section padding fluid `clamp(4rem, 10vw, 9rem)`; container max 1280px, gutter 16px mobile.
- **Radius:** 4 / 10 / 20 / full — konsisten. **Tombol**: 3 varian (primary, secondary, ghost) × 3 ukuran, satu komponen.
- **Ikon:** lucide-react + beberapa ikon custom SVG (kedelai, daun pisang, ragi).
- **Logo:** buat wordmark SVG (serif + monogram "MN" bergaya cap/stempel batik), versi horizontal, stacked, monogram, favicon; tersedia light/dark. Simpan di `src/components/brand/`.
- **Dark mode:** `next-themes`, `class` strategy, ikut sistem, tanpa flash; gambar & tekstur menyesuaikan.

## 7. Motion (tidak monoton, tetap elegan)

- **GSAP + ScrollTrigger + SplitText** (semua plugin GSAP sudah gratis) dan **Lenis** smooth scroll; **Motion** (framer) untuk micro-interaction komponen React.
- Pola: reveal teks per baris di hero, scroll-story "dari kedelai jadi tempe" (pinned section, gambar berganti per langkah), parallax ringan foto, marquee trust strip, counter "sejak 2001", hover magnetik halus pada CTA, transisi halaman (View Transitions API bila didukung).
- Aturan: semua animasi hanya `transform/opacity`; hormati `prefers-reduced-motion` (matikan scrub & parallax); tidak ada animasi yang menahan konten LCP; cleanup ScrollTrigger di unmount (`useGSAP`).

## 8. Gambar & Aset (foto belum ada)

- Sementara: placeholder ber-art-direction (gradient tekstur + ilustrasi garis) — **bukan stock foto tempe orang lain**. Opsional Unsplash bertema kedelai/daun dengan atribusi.
- Buat `docs/photo-brief.md`: shot list (hero, close-up tekstur 2 varian, proses tangan membungkus, daun pisang, plating 6 resep, foto Mak Nuk) + prompt AI image generator per shot + panduan foto HP (cahaya jendela, background linen/kayu, 4:5 & 16:9).
- Semua gambar via `next/image`, AVIF/WebP, `sizes` benar, blur placeholder.
- **OG image dinamis** dengan `next/og` (`opengraph-image.tsx`) per halaman, produk, artikel & resep: logo, judul, motif, warna brand. Juga `twitter-image`, `icon.svg`, `apple-icon`, `manifest.webmanifest`.

## 9. SEO (target: halaman 1 untuk keyword lokal)

- Metadata API Next.js per route (title template `%s — Tempe Mak Nuk`, description unik, canonical, OG, Twitter).
- `sitemap.ts` dinamis (termasuk artikel/resep dari DB), `robots.ts` (blokir `/admin`, `/api`).
- JSON-LD: `Organization`, `LocalBusiness`/`FoodEstablishment` (alamat, geo, jam, telepon), `Product` + `Offer` (jika harga ditampilkan), `FAQPage`, `Article`, `Recipe`, `BreadcrumbList`, `WebSite`.
- Semantic HTML, satu `h1` per halaman, internal linking (produk ↔ resep ↔ artikel ↔ FAQ).
- Konten seed: minimal 8 artikel pilar (draft, untuk direview pemilik), mis. "Beda tempe dengan & tanpa kulit ari", "Cara menyimpan tempe tanpa pengawet", "Tempe untuk MPASI", "Kenapa harus PO tempe", "Tempe vs daging: protein", "Mengenal ragi tempe", "Ide menu katering dari tempe", "Sejarah tempe di Jawa Tengah".
- Checklist off-page di `docs/seo.md`: Google Business Profile, Search Console, NAP konsisten, backlink lokal.
- Target **Lighthouse ≥ 95** semua kategori (mobile), **CWV**: LCP < 2.0s, CLS < 0.05, INP < 200ms.

## 10. Tech Stack (versi stabil terbaru saat instalasi — cek dengan skill `find-docs`/Context7, jangan menebak API)

| Lapisan | Pilihan |
|---|---|
| Framework | Next.js 16 (App Router, RSC, Server Actions, Turbopack), React 19, TypeScript strict |
| Styling/UI | Tailwind CSS v4, shadcn/ui (Radix), lucide-react, `cn()` util |
| Animasi | GSAP + `@gsap/react`, Lenis, Motion |
| Data | Supabase Postgres (free) + **Drizzle ORM** + drizzle-kit migrations |
| Auth & Storage | Supabase Auth (`@supabase/ssr`), Supabase Storage |
| Validasi/Form | Zod, react-hook-form |
| Editor | Tiptap (output JSON → render server-side, disanitasi) |
| Data admin | TanStack Table, TanStack Query (admin saja), dnd-kit |
| Analitik | Vercel Analytics + Speed Insights (free) |
| Kualitas | ESLint, Prettier, Vitest, Playwright (smoke + a11y via axe) |
| Package manager | pnpm |

Catatan Supabase + Vercel:
- Drizzle runtime pakai **transaction pooler (port 6543), `prepare: false`**; migrasi pakai koneksi direct/session.
- Supabase free **pause setelah 7 hari tanpa aktivitas** → Vercel Cron harian ringan (`/api/cron/keepalive`, dilindungi `CRON_SECRET`).
- Batas Storage 1 GB → kompres & resize saat upload.

## 11. Arsitektur & Struktur

```
src/
  app/
    (site)/            # halaman publik — layout header/footer
    (admin)/admin/     # dashboard — layout sidebar, dilindungi
    api/               # route handler: cron, revalidate, upload
    sitemap.ts robots.ts manifest.ts opengraph-image.tsx
  components/
    ui/                # shadcn primitives (jangan diubah liar)
    brand/             # logo, motif, tekstur
    site/              # header, footer, wa-float, section blocks
    admin/             # form, table, editor
    motion/            # wrapper GSAP/Lenis/reveal
  features/            # per domain: products, slots, posts, recipes, faq, testimonials, pages, settings
    <domain>/{schema.ts, queries.ts, actions.ts, components/}
  db/                  # drizzle schema, client, migrations, seed
  lib/                 # supabase clients, seo/jsonld, wa-link, dates (Asia/Jakarta), env (zod)
  styles/globals.css
docs/                  # brand.md, photo-brief.md, seo.md, content/
```

Prinsip: server-first (RSC fetch langsung via Drizzle, cache dengan tag), client component hanya untuk interaksi; satu sumber kebenaran per konten; komponen section dapat dipakai ulang di semua halaman (DRY); tanpa `any`.

## 12. Keamanan

- Admin di-guard di middleware/proxy **dan** di setiap Server Action (cek session + role) — jangan percaya UI.
- **RLS aktif di semua tabel**: publik hanya `SELECT` baris `published`; tulis hanya role admin. Service role key hanya di server.
- Env divalidasi Zod saat boot; tidak ada secret berprefix `NEXT_PUBLIC_` selain URL & anon key.
- Sanitasi HTML rich text; validasi upload (MIME, ukuran ≤ 5 MB); rate limit form/login sederhana (tabel atau Vercel KV free bila tersedia).
- Security headers: CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors none (kecuali embed peta).

## 13. Skills yang Dipakai

| Skill | Sumber | Dipakai untuk |
|---|---|---|
| `frontend-design` | anthropics/skills (resmi) | Arah visual anti-slop, tipografi, layout |
| `theme-factory`, `brand-guidelines` | anthropics/skills | Token warna/font konsisten |
| `canvas-design` | anthropics/skills | Logo, motif, OG template |
| `webapp-testing` | anthropics/skills | Playwright QA visual & fungsional |
| `brainstorming`, `writing-plans`, `subagent-driven-development`, `verification-before-completion`, `test-driven-development` | obra/superpowers | Alur kerja & disiplin verifikasi |
| `react-best-practices`, `web-design-guidelines` | vercel-labs/agent-skills | Performa React/Next & audit UI |
| `postgres-best-practices` | supabase/agent-skills | Schema, index, RLS |
| `find-docs` (Context7) | lokal | API terbaru Next/Tailwind/Drizzle/GSAP |
| `content-research-writer` | ComposioHQ | Artikel pilar bersumber |
| `code-review`, `security-review`, `simplify` | bawaan Claude Code | Review akhir |

Install skill yang belum ada sebelum fase terkait; jika satu skill tidak tersedia, lanjut dengan prinsip yang sama dan catat di `STATE.md`.

## 14. Cara Kerja (orkestrasi sub-agent)

1. Baca `PLAN.md` dan `STATE.md`. Lanjutkan dari task pertama yang belum `done` (resumable).
2. Jalankan task yang dependensinya sudah selesai **secara paralel** (satu pesan, banyak Agent call).
3. Routing model: **Opus** untuk arsitektur, design system, schema DB + RLS, CMS admin, motion kompleks, review keamanan. **Sonnet** untuk halaman konten, seed data, metadata/JSON-LD, komponen turunan, test, dokumentasi.
4. Setiap sub-agent menerima: ID task, file yang **boleh** disentuh (ownership), acceptance criteria, dan perintah verifikasi. Sub-agent hanya mengubah baris task-nya sendiri di `STATE.md`.
5. Sebelum menandai `done`: `pnpm typecheck && pnpm lint && pnpm build` lolos + kriteria task terpenuhi. Dilarang `// TODO` kosong di kode yang diserahkan.
6. Akhir tiap fase: review gate (Opus) → update `STATE.md` → commit `feat(<scope>): …`.

## 15. Definition of Done

- [ ] Semua route di §4 jalan, konsisten secara visual, responsif 320px → 1920px, light/dark sempurna.
- [ ] Semua konten publik dapat diedit dari admin dan langsung ter-revalidate.
- [ ] Order Builder menghormati lead time & slot; link WA benar di mobile & desktop.
- [ ] Lighthouse mobile ≥ 95, axe tanpa violation serius, `prefers-reduced-motion` dihormati.
- [ ] JSON-LD valid (Rich Results Test), sitemap/robots/OG berfungsi.
- [ ] RLS teruji (anon tidak bisa menulis/membaca draft).
- [ ] `README.md`: setup lokal, env, Supabase, migrasi, seed, deploy Vercel, cara membuat akun admin.
- [ ] Deploy preview Vercel sukses dari repo GitHub.
