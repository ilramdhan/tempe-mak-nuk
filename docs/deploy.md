# Checklist Deploy Produksi — Tempe Mak Nuk (P7.5)

Dokumen ini langkah demi langkah dari repo lokal sampai situs live di domain sendiri. Centang `- [ ]` saat selesai. Semua langkah memerlukan akun milik pemilik (GitHub, Vercel, Supabase, registrar domain, Google); tidak ada yang bisa dilakukan otomatis dari repo.

Acuan: `README.md`, `docs/security.md`, `docs/seo.md`, `docs/performance.md`, `docs/admin-guide.md`, `src/lib/env.ts`, `next.config.ts`, `vercel.json`.

## 1. Prasyarat

- [ ] Repo sudah ada di GitHub (saat ini belum ada remote). Buat repo **private**, lalu `git remote add origin <url>` dan `git push -u origin main`.
- [ ] Pastikan CI (`.github/workflows/ci.yml`: typecheck, lint, format:check, test, build) hijau di GitHub. CI membangun dengan `SKIP_ENV_VALIDATION=1`; itu hanya untuk CI, bukan produksi.
- [ ] Akun Vercel (terhubung ke GitHub). Catatan: `vercel.json` memuat cron harian `/api/cron/keepalive` (03:17 UTC); cek batas cron paket Vercel yang dipakai.
- [ ] Project Supabase **produksi** baru, region terdekat dengan pengunjung (mis. `ap-southeast-1` Singapura atau `ap-northeast-1` Tokyo). Catat password database.
- [ ] Akses domain (registrar) dan akun Google untuk Search Console + Business Profile.
- [ ] Mesin lokal: Node 20+, pnpm, file `.env` (dipakai skrip/drizzle) berisi nilai **project produksi** (jangan commit; `.env.*` sudah di-ignore).

## 2. Supabase (project baru)

Ambil nilai dari Dashboard: *Project Settings → API* (URL, anon key, service role key) dan *Connect* (string koneksi).

- [ ] Isi `.env` lokal: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (pooler transaksi, port **6543**), `DIRECT_URL` (port 5432), `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, `REVALIDATE_SECRET` (dua terakhir min. 16 karakter acak, mis. `openssl rand -hex 32`).
- [ ] **Migrasi** (`drizzle/0000`–`0003`):
  - `pnpm db:migrate` memakai `DIRECT_URL` (5432). Jika jaringan memblokir 5432, pakai `make db-migrate` (`scripts/dev/migrate.mts`, lewat pooler 6543 / `DATABASE_URL`).
  - Migrasi 0003 wajib terpasang (menutup akses admin lewat sign-up publik, lihat `docs/security.md` temuan #1).
- [ ] `make db-status`: semua migrasi bertanda ✓ (tidak ada `·`).
- [ ] **Seed**: `pnpm db:seed` (idempoten, aman diulang). Seed berisi **data placeholder/dummy** (nomor WA, alamat, nomor halal, NIB, PIRT, email, sosmed, `site.url`). Ganti semuanya lewat **Admin → Pengaturan** sebelum go-live (lihat bagian 7 dan 9).
- [ ] **Bucket media**: `pnpm tsx --env-file=.env scripts/dev/ensure-media-bucket.mts` (atau `make bucket`). Jalankan di **setiap project Supabase baru**; tanpa ini upload gambar gagal. `make setup` menjalankan migrasi + seed + bucket sekaligus.
- [ ] **Authentication → Sign In / Providers → Email**: "Allow new users to sign up" = **OFF** (publik tidak boleh mendaftar). Pengguna ditambah lewat Admin → Pengguna → Undang.
- [ ] **Authentication → URL Configuration**: Site URL sementara = URL Vercel produksi (nanti diganti domain, bagian 4). Redirect URLs: `https://<domain>/auth/callback`; tambahkan pola preview Vercel (mis. `https://*-<tim>.vercel.app/auth/callback`) hanya bila ingin login di preview.
- [ ] **SMTP kustom** (Resend/Brevo, dsb.): *Authentication → Emails → SMTP Settings*. Wajib, karena undangan Pengguna dan magic link memakai email; SMTP bawaan Supabase sangat dibatasi.
- [ ] **Attack Protection**: aktifkan CAPTCHA (Turnstile/hCaptcha), cek rate limit; panjang password minimal 12. Aktifkan MFA TOTP untuk owner bila tersedia.
- [ ] **Akun owner pertama**. Trigger `on_auth_user_created` (migrasi 0002/0003): user auth **pertama** yang dibuat otomatis menjadi `owner`; user berikutnya **tidak** mendapat profil/akses sampai diundang owner lewat Admin → Pengguna. Karena itu:
  1. Pastikan sign-up publik sudah OFF **dan** belum ada user lain di *Authentication → Users*.
  2. Buat akun pemilik sendiri dulu (Dashboard → Authentication → Users → *Add user*, email + password kuat, centang auto-confirm).
  3. Cek di Admin → Pengguna (setelah login) bahwa peran = owner. Baru setelah itu undang editor.
  4. Jika ada user tak dikenal sebelum owner, hapus semuanya dan buat ulang urutannya; jangan biarkan pihak lain menjadi "user pertama".

## 3. Vercel

- [ ] *Add New → Project* → import repo GitHub. Framework preset: **Next.js** (terdeteksi). Package manager **pnpm** (dari `packageManager` di `package.json`). Build command default `next build`; jangan override.
- [ ] **Environment Variables** (*Settings → Environment Variables*). Skema ada di `src/lib/env.ts`; semua wajib terisi kecuali `DIRECT_URL`:

| Variabel | Production | Preview | Keterangan |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://<domain-produksi>` | URL preview / boleh domain yang sama | Wajib, tanpa `/` akhir. Tanpa ini canonical/sitemap/OG jatuh ke localhost atau `site.url` di DB. Nilai ikut ter-bake saat build, jadi **redeploy** setelah mengubah. |
| `NEXT_PUBLIC_SUPABASE_URL` | URL project | sama (atau project staging) | Dipakai juga di build untuk CSP `img-src`/`connect-src` dan `images.remotePatterns` (`next.config.ts`). Harus terisi **saat build**. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon/publishable key | sama | Publik. |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key | sama | **Sensitive**, hanya server. |
| `DATABASE_URL` | pooler transaksi **6543** | sama | **Sensitive**. Runtime memakai `prepare: false`. |
| `DIRECT_URL` | koneksi 5432 | opsional | Opsional di skema; hanya untuk migrasi (lokal/CI), tidak diperlukan runtime. |
| `CRON_SECRET` | acak >= 16 karakter | sama | **Sensitive**. Vercel Cron mengirim `Authorization: Bearer $CRON_SECRET` otomatis ke `/api/cron/keepalive`. |
| `REVALIDATE_SECRET` | acak >= 16 karakter | sama | **Sensitive**. |

- [ ] **Jangan** set `SKIP_ENV_VALIDATION` di Production maupun Preview (itu mematikan validasi env). Periksa tidak ada di daftar variabel.
- [ ] Preview memakai database yang sama dengan produksi bila variabel disalin; sebaiknya buat project Supabase staging atau batasi preview (preview otomatis `Disallow: /` di robots, tetapi admin/login tetap bisa menulis ke DB yang sama).
- [ ] *Settings → Functions → Function Region*: pilih region terdekat dengan DB Supabase (mis. Singapore `sin1` untuk `ap-southeast-1`; Tokyo `hnd1` untuk `ap-northeast-1`). Tidak ada `regions` di `vercel.json`, jadi diatur di dashboard.
- [ ] **Analytics & Speed Insights**: aktifkan keduanya di tab *Analytics* / *Speed Insights* project. Paket `@vercel/analytics` dan `@vercel/speed-insights` hanya dimuat setelah pengunjung menyetujui kategori "analytics" di banner cookie (`src/features/consent/analytics-gate.tsx`); CSP sudah mengizinkan `va.vercel-scripts.com` dan `vitals.vercel-insights.com`.
- [ ] Deploy pertama selesai tanpa error; buka URL `*.vercel.app` dan cek beranda tampil.
- [ ] Cek *Settings → Cron Jobs*: job `/api/cron/keepalive` terdaftar (mencegah project Supabase gratis ter-pause).

## 4. Domain

- [ ] *Settings → Domains* → tambah apex `domain.com` **dan** `www.domain.com`.
- [ ] DNS di registrar sesuai instruksi Vercel (umumnya apex: `A 76.76.21.21`; `www`: `CNAME cname.vercel-dns.com`; pakai nilai yang ditampilkan Vercel bila berbeda). Tunggu status "Valid Configuration".
- [ ] Atur **www → apex** (atau sebaliknya, pilih satu kanonik) sebagai redirect permanen (308) di pengaturan domain Vercel. `NEXT_PUBLIC_SITE_URL` harus sama persis dengan host kanonik tersebut.
- [ ] HTTPS: sertifikat Let's Encrypt terbit otomatis; pastikan `http://` mengalihkan ke `https://`.
- [ ] Update `NEXT_PUBLIC_SITE_URL` (Production) ke domain final, **lalu redeploy** (Deployments → Redeploy tanpa cache build lama).
- [ ] Update Supabase *URL Configuration*: Site URL = domain final; Redirect URLs = `https://<domain>/auth/callback`; hapus URL sementara yang tak dipakai.
- [ ] Admin → Pengaturan → SEO/Situs: nilai `site.url` (seed berisi `https://tempemaknuk.com`) sesuaikan dengan domain final (dipakai sebagai cadangan bila env kosong).
- [ ] Tambahkan domain ke hstspreload.org **hanya** jika yakin semua subdomain HTTPS (HSTS preload sudah dikirim header-nya, `docs/security.md` #18).

## 5. Verifikasi pasca-deploy

Ganti `$D` dengan `https://<domain>` dan `$P` dengan URL preview.

- [ ] `curl -s $D/robots.txt`: berisi `Allow: /`, `Disallow` untuk `/admin /api /dev /auth /login`, baris `Sitemap: $D/sitemap.xml`. Indexing hanya aktif bila `VERCEL_ENV=production`.
- [ ] `curl -s $P/robots.txt` (URL preview/branch): harus `Disallow: /` saja.
- [ ] `curl -s $D/sitemap.xml`: semua `<loc>` memakai domain produksi (bukan localhost / vercel.app).
- [ ] Canonical: `curl -s $D/ | grep -i canonical` mengarah ke `$D/`. Cek juga satu halaman produk dan satu artikel.
- [ ] OG image: `curl -sI $D/og-default.png` = 200 `image/png`; cek `og:image` di HTML beranda dan satu halaman dalam (route OG ber-hash). Uji di Facebook Sharing Debugger / opengraph.xyz.
- [ ] Header keamanan: `curl -sI $D/` memuat `Strict-Transport-Security`, `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`. Buka DevTools Console: tidak ada pelanggaran CSP.
- [ ] Gambar dari Supabase Storage tampil (produk, jurnal) tanpa error CSP / `next/image` host tidak diizinkan (butuh `NEXT_PUBLIC_SUPABASE_URL` benar saat build).
- [ ] Login admin di `$D/login` (email + password / magic link). Magic link tiba lewat SMTP kustom dan mengarah ke domain produksi.
- [ ] Upload media di Admin → Media (gambar < 5 MB; hasil jadi WebP) dan tampil di situs publik.
- [ ] Banner cookie muncul pada kunjungan pertama; menolak/menyetujui berfungsi; setelah setuju, Analytics aktif (tab Network memuat skrip Vercel).
- [ ] Redirect DB: buat redirect uji di Admin → Redirect, tunggu maksimum **60 detik** (TTL cache di `src/proxy.ts`), `curl -sI $D/<path-lama>` mengembalikan 301/308 ke tujuan; hapus setelah uji.
- [ ] Order Builder: buat pesanan uji, link `wa.me` memuat nomor WA **asli** (bukan nomor placeholder seed).
- [ ] Cron: `curl -si $D/api/cron/keepalive` tanpa token = 401; dengan `Authorization: Bearer <CRON_SECRET>` = 200.
- [ ] Lighthouse (mobile) pada URL produksi untuk `/`, `/produk/tempe-klasik`, `/custom-order`, `/jurnal`, `/resep/tempe-bacem`. Bandingkan dengan `docs/performance.md` (target: LCP < 2,0 s, CLS 0, skor 98–99 pada pengukuran lokal; produksi nyata boleh sedikit berbeda). Catat hasil bila ada regresi.
- [ ] E2E terhadap produksi: `E2E_BASE_URL=https://<domain> pnpm test:e2e` (suite admin butuh kredensial; ikuti README/`tests/e2e` bila butuh variabel tambahan, atau jalankan hanya smoke/a11y publik).

## 6. Google Search Console

- [ ] Tambah properti tipe **Domain** (`domain.com`), verifikasi lewat record **TXT** di DNS.
- [ ] *Sitemaps* → submit `sitemap.xml`; status harus "Success".
- [ ] *URL Inspection* untuk `https://<domain>/` → **Request indexing**; ulangi untuk halaman utama lain (`/produk`, `/custom-order`).
- [ ] Setelah beberapa hari, cek *Pages* (tidak ada "Blocked by robots.txt" yang tidak disengaja) dan *Core Web Vitals*.
- [ ] Setelah ada data, validasi keyword di `docs/seo.md` dengan data Search Console.

## 7. Google Business Profile

NAP (Name, Address, Phone) harus **identik** dengan yang tampil di situs dan di Admin → Pengaturan (Bisnis/Kontak/Alamat). Samakan ejaan, singkatan, dan format nomor.

- [ ] Buat/klaim profil di business.google.com dan selesaikan verifikasi (kartu pos/telepon/video).
- [ ] Nama usaha = `business.name` ("Tempe Mak Nuk"), tanpa tambahan kata kunci.
- [ ] Kategori utama mis. "Produsen tempe" / "Toko makanan"; tambahkan kategori sekunder yang relevan.
- [ ] Alamat sama dengan Pengaturan (`address.*`: jalan, desa, kecamatan, Kabupaten Klaten, Jawa Tengah, kode pos) dan pin peta sesuai `geo.lat`/`geo.lng`. Jika tidak menerima pembeli di lokasi, atur sebagai **area layanan** (Klaten, Solo Raya, Yogyakarta, sesuai `delivery.areas`).
- [ ] Jam operasional sama dengan `hours` di Pengaturan, termasuk hari libur produksi.
- [ ] Nomor telepon (`contact.phone`) dan nomor WhatsApp (`contact.whatsapp` / tampilan `contact.whatsappDisplay`) konsisten; tautan situs = domain kanonik.
- [ ] Foto: logo, sampul, produk, proses produksi, tempat usaha (lihat `docs/photo-brief.md`).
- [ ] Deskripsi singkat (tanpa klaim yang tidak terbukti; nomor halal hanya bila sudah asli).
- [ ] Salin URL profil (g.page / maps) ke Admin → Pengaturan (`social.googleBusiness`, `maps.url`) lalu cek JSON-LD LocalBusiness di halaman beranda.
- [ ] Minta ulasan pelanggan pertama; balas ulasan secara berkala.

## 8. Pasca-launch, rollback, dan akses

- [ ] **Data asli** di Admin → Pengaturan: ganti seluruh placeholder (WA, email, telepon, alamat, geo, nomor halal + penerbit + tanggal, NIB, PIRT, sosmed, harga). Jangan tayangkan nomor halal/NIB/PIRT dummy.
- [ ] **Rollback aplikasi**: Vercel → Deployments → pilih deployment sehat sebelumnya → *Promote to Production* / Instant Rollback. Rollback tidak membatalkan migrasi DB; migrasi harus kompatibel mundur.
- [ ] **Backup DB**: cek *Database → Backups* di Supabase (paket Free tidak punya backup harian otomatis; pertimbangkan Pro atau `pg_dump` terjadwal manual lewat `DIRECT_URL`). Lakukan satu dump sebelum go-live.
- [ ] **Rotasi secrets** (`docs/security.md` bagian 5): `SUPABASE_SERVICE_ROLE_KEY`, password database, `CRON_SECRET`, `REVALIDATE_SECRET`, terutama bila pernah dibagikan lewat chat/screenshot. Setelah rotasi, perbarui env Vercel dan lokal lalu redeploy.
- [ ] **Pemegang akses**: catat siapa yang memegang akun GitHub, Vercel, Supabase, registrar domain, Search Console, Business Profile, dan SMTP. Minimal dua orang tepercaya (pemilik + satu cadangan); aktifkan 2FA di semua akun; simpan kredensial di password manager.
- [ ] Monitoring: pantau Vercel *Observability/Logs*, Supabase *Reports*, dan Speed Insights; jalankan `pnpm audit` berkala.
- [ ] Ulangi tes login owner dan tes undangan editor lewat Admin → Pengguna (memastikan SMTP produksi bekerja).

## Cron: publikasi terjadwal

`/api/cron/publish` (harian 17:07 UTC = 00:07 WIB, `vercel.json`) meng-expire tag cache `posts`/`recipes`/`legal` (+ slug terkait) bila ada konten yang `publishedAt`/`effectiveAt`-nya terlewati dalam 25 jam terakhir (`?window=1500`; default tanpa parameter 20 menit, maks 7 hari). Auth: `Authorization: Bearer $CRON_SECRET` (401 bila salah, 500 bila secret tidak diset).

**Vercel Hobby hanya mengizinkan cron harian** (dan waktu eksekusinya bisa meleset dalam jam yang sama), karena itu jadwalnya harian dengan jendela 25 jam yang saling tumpang-tindih. Konten berjadwal tampil paling lambat sekitar pukul 00:07 WIB setelah waktu terbitnya, atau lebih cepat bila cache `hours` kedaluwarsa. Menerbitkan konten **tanpa** tanggal masa depan selalu langsung tampil. Bila suatu saat butuh tepat waktu: pindah ke Pro (`*/15 * * * *`, hapus `?window`) atau panggil endpoint ini dari scheduler eksternal dengan header `Authorization: Bearer $CRON_SECRET`.

## Self-host dengan Docker

Alternatif Vercel: image container dari `Dockerfile` (Next.js `output: "standalone"`, `node:22-alpine`, user non-root `nextjs` uid 1001, port 3000, `HEALTHCHECK` ke `/robots.txt`). Vercel tidak terpengaruh: `output: "standalone"` diabaikan oleh builder Vercel, dan `next start` lokal/CI tetap jalan (hanya mencetak peringatan).

Pembagian variabel:

| Jenis | Variabel | Cara masuk |
| --- | --- | --- |
| Publik, **ter-bake saat build** | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` (juga host CSP + `images.remotePatterns`), `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `--build-arg`. Mengubahnya = build ulang image. |
| DB saat build | `DATABASE_URL` (pooler 6543) | BuildKit secret `id=database_url`, hanya ter-mount di langkah `pnpm build`; tidak tersimpan di layer, history, maupun provenance. Wajib: `next build` prerender halaman `"use cache"` dari DB dan `generateStaticParams` harus mengembalikan ≥1 slug (tanpa DB build gagal). |
| Secret runtime | `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `REVALIDATE_SECRET` (+ ketiga `NEXT_PUBLIC_*` agar validasi env server lolos) | `--env-file` / env orchestrator saat `docker run`. **Jangan** set `SKIP_ENV_VALIDATION` di runtime. |

### Build lokal

```bash
set -a; . ./.env; set +a    # memuat nilai ke shell, tidak mencetak
docker buildx build --load \
  --build-arg NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --secret id=database_url,env=DATABASE_URL \
  -t tempe-mak-nuk:local .
```

Atau `make docker-build`. Multi-arch: tambah `--platform linux/amd64,linux/arm64` (butuh QEMU/binfmt; pakai `--push` ke registry, bukan `--load`).

Bila build lokal gagal dengan `A "use cache" function took too long during prerendering` saat memakai pooler Supabase remote, build terhadap Postgres lokal yang sudah di-seed (lihat `ci.yml`: `scripts/ci/bootstrap.sql` → `scripts/dev/migrate.mts` → `pnpm db:seed`, set `DATABASE_URL` **dan** `DIRECT_URL` ke DB lokal) lalu jalankan dengan `--network host` agar BuildKit bisa menjangkau `127.0.0.1`. Konten statis di-render ulang dari DB produksi saat cache kedaluwarsa / tag di-revalidate.

### Run

```bash
docker run -d --name tempe -p 3000:3000 --env-file .env --restart unless-stopped tempe-mak-nuk:local
docker inspect --format '{{.State.Health.Status}}' tempe   # healthy setelah ±20 detik
```

Atau `make docker-run`. Catatan:

- Taruh reverse proxy (Caddy/nginx/Traefik) dengan TLS di depan container; header keamanan (CSP, HSTS, dll.) sudah dikirim aplikasi.
- Cache Next (`"use cache"`, ISR, gambar teroptimasi) disimpan di `/app/.next/cache` dalam container; hilang saat container diganti. Untuk >1 replika butuh cache handler bersama (lihat docs Next "Self-Hosting").
- Cron Vercel (`vercel.json`) tidak jalan di Docker. Jadwalkan sendiri: `curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/keepalive` (harian) dan `/api/cron/publish?window=1500` (harian).
- Vercel Analytics/Speed Insights tidak mengirim data di luar Vercel.

### Image GHCR (CI)

`.github/workflows/docker.yml`:

- **Pull request** yang menyentuh `Dockerfile`, `.dockerignore`, `next.config.ts`, `package.json`, lockfile: build amd64 tanpa push terhadap Postgres service ber-seed (data dummy, nilai `NEXT_PUBLIC_*` dummy) + Trivy.
- **Rilis** (job `docker` di `release-please.yml`, saat `release_created`) atau **manual** (`workflow_dispatch`, input `tag`/`version`): build amd64 → Trivy (gagal bila ada CRITICAL/HIGH yang punya perbaikan; SARIF diunggah ke Code scanning kategori `trivy-image`) → build + push `linux/amd64,linux/arm64` ke `ghcr.io/ilramdhan/tempe-mak-nuk` dengan SBOM + provenance `mode=max` → tanda tangan cosign keyless by digest.
- Tag: `X.Y.Z`, `X.Y`, `latest` (hanya rilis/`version` diisi), dan `sha-<7>`.

Yang harus dibuat sekali di GitHub (*Settings → Secrets and variables → Actions*):

- [ ] **Variables**: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (nilai produksi; ikut ter-bake di image publik, jadi hanya nilai yang memang publik).
- [ ] **Secret**: `DOCKER_BUILD_DATABASE_URL` (pooler 6543 produksi; idealnya role read-only). Tanpa ini job publish berhenti dengan error yang jelas.
- [ ] Setelah push pertama: *Profile/Org → Packages → tempe-mak-nuk → Package settings → Change visibility → Public* (sekali saja; paket GHCR baru selalu private), dan pastikan repo tertaut ke paket.

Image GHCR berisi nilai `NEXT_PUBLIC_*` produksi dari repo vars. Untuk domain/project Supabase lain, build sendiri dengan build-arg Anda.

### Verifikasi tanda tangan

```bash
cosign verify ghcr.io/ilramdhan/tempe-mak-nuk:<tag> \
  --certificate-identity-regexp '^https://github\.com/ilramdhan/tempe-mak-nuk/\.github/workflows/(docker|release-please)\.yml@' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

Untuk rilis, identitas sertifikat adalah workflow pemanggil (`release-please.yml@refs/heads/main`); untuk `workflow_dispatch` adalah `docker.yml@<ref>`. SBOM & provenance: `docker buildx imagetools inspect ghcr.io/ilramdhan/tempe-mak-nuk:<tag> --format '{{ json .Provenance }}'` (atau `.SBOM`).
