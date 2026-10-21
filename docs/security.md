# Review Keamanan — Tempe Mak Nuk (P7.3)

Tanggal: 2026-10-21 · Reviewer: agent P7.3 (Opus) · Basis: `main` @ `acf8532` + perubahan sesi 5 (belum di-commit)

## 0. Status terkini (diperbarui P8.8)

- Migrasi **0003** (`signup_no_access`: user baru tanpa profil = tanpa akses) dan **0004** (`rbac_permissions`, P8.14) sudah **diterapkan ke database remote**. Gunakan `make db-status` untuk memeriksa.
- Temuan #1 sudah tertutup di database. Sisa tindakan ada di sisi dashboard (matikan sign-up, tinjau akun yang ada).
- Aksi hapus artikel/resep kini khusus pemilik secara bawaan (bagian 3a). Cron publikasi terjadwal `/api/cron/publish` ditambahkan di P8.4 (#19 mencakup auth-nya).
- GitHub (diverifikasi read-only lewat `gh api`): secret scanning dan push protection **aktif**, Dependabot security updates aktif, dan ruleset `main` **aktif** (PR wajib dengan squash, 1 persetujuan + code owner, status check `Verify` dan `Build + E2E` wajib, tanpa force-push/hapus branch, code scanning CodeQL). Validity checks dan non-provider patterns belum aktif.
- Belum aktif/tidak terverifikasi dari repo: konfigurasi Supabase Auth (sign-up, CAPTCHA/Attack Protection, MFA, SMTP) dan env Vercel. Itu tetap checklist pemilik di bawah.
- Review temuan (bagian 2) dilakukan pada `main` @ `acf8532` (P7.3). Fitur sesudahnya (`/admin/akses`, `/admin/kategori`, `/api/cron/publish`) dibahas di bagian 3a dan baris ruang lingkup, belum di-review ulang secara penuh — lihat audit P9.7.

## 1. Ruang lingkup

- Seluruh Server Action (`"use server"`): `src/features/*/actions.ts`, `src/features/media/library-actions.ts`, `src/lib/auth/actions.ts`.
- Route handler: `POST /api/upload`, `GET /api/cron/keepalive`, `GET /api/cron/publish`, `GET /auth/callback`.
- Query admin (`src/features/*/queries.admin.ts`) dan guard halaman admin (`src/app/(admin)/**`).
- `src/proxy.ts` + `src/lib/supabase/proxy.ts` (redirect DB, guard `/admin`).
- RLS & trigger di `drizzle/0000–0004*.sql`, skema `src/db/schema/profiles.ts`.
- Header keamanan / CSP (`next.config.ts`).
- Penanganan secret & env (`src/lib/env.ts`, `server-only`, `NEXT_PUBLIC_*`, `.gitignore`, riwayat git).
- XSS: render rich text Tiptap, JSON-LD, semua `dangerouslySetInnerHTML`.

Di luar lingkup: konfigurasi dashboard Supabase/Vercel (masuk checklist pemilik), pentest dinamis, dependensi pihak ketiga (cukup `pnpm audit` berkala).

## 2. Metode

1. Enumerasi semua file `"use server"` + `route.ts`, lalu cek tiap export: lewat `adminAction({ role })` / `requireRole()`, validasi Zod, role sesuai matriks STATE (owner-only: hapus halaman/produk/media/FAQ/testimoni/navigasi, Legal, Pengguna, Redirect, grup settings business/legal/halal/order/consent/private/site).
2. Bandingkan dengan UI (`RoleGate role="owner"`). Jika UI menyembunyikan tombol tapi server mengizinkan editor, itu temuan, karena Drizzle terhubung sebagai role `postgres` yang **melewati RLS**.
3. Baca migrasi RLS/trigger untuk jalur klien Supabase anon/authenticated (REST/PostgREST langsung dengan anon key publik).
4. Review manual route upload, proxy, callback auth, CSP, sanitasi HTML.
5. `git grep` pola secret (JWT `eyJ…`, `sb_secret_`, URL Postgres berpassword) di tree saat ini + `git log -S`.
6. Verifikasi: `pnpm typecheck`, ESLint (`src`, `tests/rls`), `pnpm test` (331 lulus), `pnpm build` (sukses).

## 3. Temuan

Severity: **Kritis / Tinggi / Sedang / Rendah / Info**. Status: **fixed** (diperbaiki di sesi ini, belum di-commit), **fixed*** (perlu `db:migrate` oleh orkestrator), **open**.

| # | Severity | Lokasi | Masalah | Status | Rekomendasi / Perbaikan |
|---|---|---|---|---|---|
| 1 | **Kritis** | `drizzle/0002_auth_profile_trigger.sql:16-20`, `src/db/schema/profiles.ts` | Trigger `on_auth_user_created` memberi role **editor** ke setiap user auth baru (setelah owner pertama). Sign-up publik Supabase masih aktif, dan endpoint `/auth/v1/signup` bisa dipanggil langsung dengan anon key publik. Akibatnya siapa pun bisa mendaftar dan langsung punya akses admin editor. | fixed (migrasi 0003 diterapkan ke remote) | Migrasi baru `drizzle/0003_signup_no_access.sql`: trigger hanya membuat profil **owner** untuk user pertama. User lain **tidak dibuat profil**, sehingga `requireRole` menolak dengan status "no-access". `inviteUser` sekarang membuat profil `editor` secara eksplisit. Test RLS diperbarui. Sudah diterapkan (`make db-migrate`; jangan pakai `pnpm db:migrate`, port 5432 sering diblokir). Lalu periksa akun yang sempat mendaftar (checklist). Tetap **matikan sign-up** di Supabase. |
| 2 | **Tinggi** | `src/features/faqs/actions.ts:56` `deleteFaq`; `testimonials/actions.ts:58` `deleteTestimonial`; `navigation/actions.ts:53,108` `deleteNavItem`/`deleteAnnouncement`; `media/actions.ts:47` `deleteMedia`; `products/actions.ts:167,223` `deleteProductShape`/`deleteProductSize` | UI memakai `RoleGate role="owner"`, tetapi action server memakai default `editor`. Editor bisa memanggil action langsung (ID action ada di bundle klien) dan menghapus data. | fixed | Ditambah `role: "owner"`. Test: `src/features/_shared/__tests__/owner-only-actions.test.ts`. |
| 3 | **Tinggi** | `src/features/pages/actions.ts:155,169` `upsertRedirect`/`deleteRedirect` | Action redirect versi lama bisa dipakai editor dan **tanpa** blokir `/admin`/`/api` maupun cek loop. Redirect bisa mengarah ke URL eksternal (dipakai di proxy untuk semua path publik), jadi editor bisa membuat open redirect / phishing dari domain resmi. | fixed | Ditambah `role: "owner"` (sama dengan `features/redirects`). Tidak dipakai UI. Saran: hapus kedua action ini saat refactor. |
| 4 | **Sedang** | `src/features/*/queries.admin.ts` (27 fungsi), `src/app/(admin)/admin/layout.tsx:30` | Halaman admin hanya di-guard di **layout**. Menurut docs Next (`authentication.md` → "Layouts and auth checks"), layout tidak mengontrol render segmen anak, sehingga query admin (termasuk settings `private`, draf, daftar pengguna) bisa tereksekusi tanpa cek peran. Halaman Legal hanya owner di UI, tapi query-nya tidak dicek. | fixed | Pola DAL: setiap fungsi `queries.admin.ts` memanggil `requireRole("editor", { onFail: "redirect" })`. Legal & Pengguna memanggil `requireRole("owner", …)`. `getAuthState` di-`cache` per request, jadi tidak ada query tambahan. |
| 5 | **Sedang** | `.gitignore` | `.env.local.docker.bak` (berisi `DATABASE_URL`, `CRON_SECRET`, `REVALIDATE_SECRET`) **tidak** ter-ignore (pola hanya `.env` & `.env*.local`), jadi berisiko ikut ter-commit. | fixed | Ditambah `.env.*` + `!.env.example`. Riwayat git bersih (tidak ada secret yang pernah di-commit). |
| 6 | **Sedang** | `next.config.ts:26` | CSP `script-src 'unsafe-inline'` (tanpa nonce, agar halaman tetap statis dengan `cacheComponents`), sehingga perlindungan CSP terhadap XSS melemah. | open (diterima) | Mitigasi saat ini: tidak ada HTML mentah dari CMS (lihat #11). Opsi ke depan: CSP berbasis hash untuk skrip inline yang tetap (consent, announcement), atau nonce via proxy untuk rute admin saja. |
| 7 | **Sedang** | `src/lib/auth/actions.ts:46` `signInWithPassword` | Tidak ada rate limit login di level aplikasi. Hanya mengandalkan rate limit bawaan Supabase Auth (per IP, dan IP yang terlihat adalah server Vercel). | open | Atur rate limit & CAPTCHA (Turnstile/hCaptcha) di Supabase Auth → *Attack Protection*. Opsional: limiter per email+IP (tabel / Vercel KV). Password admin wajib kuat + aktifkan MFA bila memungkinkan. |
| 8 | Rendah | `src/app/api/upload/route.ts:26` | Cek same-origin hanya jika header `Origin` ada. Request tanpa `Origin` lolos ke cek sesi. | open | Risiko kecil: browser modern selalu mengirim `Origin` untuk POST lintas situs, dan cookie Supabase `SameSite=Lax`. Bisa diperketat dengan menolak bila `Origin` kosong **dan** `Sec-Fetch-Site` ≠ `same-origin`. Selebihnya upload sudah baik: editor+, ≤5 MB (header + `File.size`), MIME whitelist tanpa SVG/GIF, magic bytes via sharp (`failOn:error`, `limitInputPixels`), tolak animasi, re-encode WebP tanpa metadata, path `uploads/YYYY/MM/<uuid>.webp` (tidak dari nama file, jadi tidak ada path traversal). |
| 9 | Rendah | `src/proxy.ts:45`, `src/features/redirects/match.ts` | Redirect DB boleh ke URL eksternal `https://` (by design). Path `/admin`, `/api`, `/_next` dilindungi, dan loop dicek. | open (diterima) | Sekarang hanya owner yang bisa menulis redirect (#3). Pertimbangkan whitelist host bila tidak butuh tujuan eksternal. |
| 10 | Rendah | `src/lib/auth/actions.ts:38` `requestOrigin` | Tanpa `NEXT_PUBLIC_SITE_URL`, link magic-link memakai header `x-forwarded-host` (host header injection). | open | **Wajib set `NEXT_PUBLIC_SITE_URL`** di Vercel production, dan batasi *Redirect URLs* di Supabase Auth ke domain resmi (Supabase menolak `emailRedirectTo` di luar whitelist). |
| 11 | Info (OK) | `src/lib/rich-text/render.tsx` | Rich text Tiptap dirender dari **JSON ke elemen React** tanpa `dangerouslySetInnerHTML`. `sanitizeHref` hanya mengizinkan http(s)/mailto/tel/relatif (memblokir `javascript:`), dan `sanitizeImageSrc` hanya http(s), root-relative, atau `data:image` raster. | OK | Sanitizer HTML (DOMPurify) **tidak diperlukan** selama tidak ada jalur render HTML mentah. |
| 12 | Info (OK) | `src/lib/seo/serialize.ts`, `json-ld.tsx`, `breadcrumb.tsx`, `inline-script.tsx` | JSON-LD di-escape (`<` menjadi `<`), jadi tidak bisa keluar dari `</script>`. `InlineScript` hanya berisi string konstan / `JSON.stringify` / angka versi. | OK | — |
| 13 | Info (OK) | `src/lib/auth/next-path.ts`, `src/app/(auth)/auth/callback/route.ts` | Parameter `next` disanitasi ke `/admin*` (tolak `//`, `\`, karakter kontrol, `%2f`, origin lain). Login memakai `getClaims()` (JWT terverifikasi), role dibaca dari DB. Magic link memakai `shouldCreateUser:false` dengan pesan anti-enumerasi. | OK | — |
| 14 | Info (OK) | `src/features/users/actions.ts`, `logic.ts` | `setUserRole` hanya untuk owner, memakai `FOR UPDATE` pada owner, tidak bisa menurunkan diri sendiri atau owner terakhir. `inviteUser` hanya untuk owner (service role, server-only). | OK | — |
| 15 | Info (OK) | Server action lain (posts, recipes, pages, products, slots, taxonomy, settings, legal, media library) | Semua lewat `adminAction`/`requireRole` + Zod (UUID, enum, batas panjang). Konten bersifat global (tanpa kepemilikan per user), jadi tidak ada IDOR antar-user. `savePageContent` mengecek section milik page. `updateSettings` meminta owner bila ada kunci di grup owner. `trackWaClick` (publik) hanya insert field tervalidasi + rate limit in-memory, tanpa IP/PII yang disimpan. | OK | Rate limit in-memory per instance serverless itu lemah, tapi dampaknya hanya statistik klik. |
| 16 | Info (OK) | Migrasi RLS `drizzle/0001_schema.sql:407-460`, `0002` | RLS aktif di 27/27 tabel. Anon: `SELECT` baris publik saja (settings tanpa `private`) + `INSERT wa_clicks` tervalidasi. Hak tulis anon dicabut di level GRANT. `audit_log` read-only untuk klien. User tidak bisa mengubah role sendiri (`profiles_update_own` WITH CHECK). Tidak ada policy INSERT profil untuk non-owner, jadi user tanpa profil tidak bisa menambahkan dirinya sendiri. | OK | Jalankan `tests/rls` di DB sementara setelah migrasi 0003. |
| 17 | Info (OK) | `src/lib/env.ts`, `src/lib/supabase/admin.ts`, `src/db/client.ts`, `upload.server.ts`, `storage.ts`, `queries.admin.ts` | `SUPABASE_SERVICE_ROLE_KEY` & `DATABASE_URL` hanya dibaca `getServerEnv()` (melempar error di browser), dan semua pemakainya `import "server-only"`. `NEXT_PUBLIC_*` yang ada hanya URL situs, URL Supabase, dan anon key. | OK | — |
| 18 | Info (OK) | `next.config.ts` | HSTS 2 tahun + preload, `nosniff`, `Referrer-Policy strict-origin-when-cross-origin`, `X-Frame-Options DENY` + `frame-ancestors 'none'`, `Permissions-Policy` ketat, `object-src 'none'`, `base-uri`/`form-action 'self'`, `poweredByHeader:false`. `frame-src` hanya Google Maps. | OK | Daftarkan domain ke hstspreload.org **hanya** setelah yakin semua subdomain HTTPS. |
| 19 | Info (OK) | `src/app/api/cron/_lib/auth.ts` | Cron memakai `Bearer CRON_SECRET` dengan perbandingan constant-time dan fail-closed. | OK | — |

## 3a. RBAC dinamis (P8.14)

- **Kunci izin** = `<entity>.<action>`, sama dengan pasangan audit di `adminAction({ entity, action })`. Daftar lengkap ada di `src/features/permissions/registry.ts` (label Indonesia, grup, `defaultRole`, `grantable`). Test `src/features/permissions/__tests__/registry.test.ts` memindai `src/features/**` dan gagal bila ada `adminAction` yang belum terdaftar.
- **Bawaan** sama dengan role di call site sebelum P8.14, kecuali **hapus artikel (`posts.delete`) dan hapus resep (`recipes.delete`) yang sekarang khusus pemilik**.
- **Override (DB, migrasi `drizzle/0004_rbac_permissions.sql`)**: `role_permissions(role, permission, allowed)` untuk peran Editor, dan `user_permissions(user_id, permission, allowed)` untuk Izinkan/Tolak per pengguna. RLS aktif: pemilik baca/tulis, admin membaca `role_permissions`, editor hanya membaca baris `user_permissions` miliknya. Anon tidak punya akses.
- **Urutan resolusi** (`src/features/permissions/resolve.ts`, diuji unit):
  1. Pemilik selalu diizinkan (tidak bisa mengunci diri sendiri).
  2. Kunci tidak dikenal memakai role call site.
  3. Bila role call site lebih ketat dari bawaan registry (mis. grup pengaturan khusus pemilik → `settings.update` dengan `role:"owner"`), role tersebut menjadi batas bawah yang tidak bisa di-override.
  4. Izin `grantable:false` (pengguna/peran, manajemen hak akses, legal) hanya memakai bawaan registry.
  5. Override pengguna → override peran → bawaan registry.
- **Penegakan**: `adminAction` memanggil `requireRole("editor")` lalu `userCan(user, "<entity>.<action>", role)`. Override dibaca per request (React `cache`, tanpa `"use cache"`), dan pemilik tidak memicu query. Helper server: `can()`, `requirePermission()`, `getEffectivePermissions()` di `src/lib/auth/permissions.ts`.
- **UI** (kosmetik, server tetap sumber kebenaran): layout admin mengirim izin efektif ke `AdminUserProvider`, `useCan()` dan `<RoleGate permission="…">` menyembunyikan tombol (mis. hapus artikel/resep/FAQ/produk/media).
- **Kelola via web**: **Admin → Sistem → Hak Akses** (`/admin/akses`, khusus pemilik) berisi matriks peran Editor dan override per pengguna (juga bisa dibuka dari tombol "Atur akses" di **Pengguna**). Action `setRolePermission` / `setUserPermission` memakai owner-only + Zod (kunci registry yang `grantable`) dan tercatat di `audit_log`.

## 4. File yang diubah (P7.3)

- `drizzle/0003_signup_no_access.sql`, `drizzle/meta/_journal.json`, `drizzle/meta/0003_snapshot.json` (dibuat oleh `drizzle-kit generate --custom`; sudah di-migrate ke remote)
- `src/db/schema/profiles.ts` (komentar), `src/features/users/actions.ts` (invite membuat profil editor)
- `src/features/{faqs,testimonials,navigation,media,products,pages}/actions.ts` (`role: "owner"`)
- `src/features/*/queries.admin.ts` (14 file, guard DAL)
- `.gitignore`
- `tests/rls/rls.test.ts` (ekspektasi trigger baru)
- `src/features/_shared/__tests__/owner-only-actions.test.ts` (baru)

## 5. Checklist pemilik (sebelum & sesudah go-live)

**Supabase → Authentication**
- [ ] **Matikan sign-up publik**: *Sign In / Providers → Email → "Allow new users to sign up" = OFF*. Pengguna baru hanya lewat **Admin → Pengguna → Undang**.
- [ ] Migrasi 0003 sudah diterapkan (`make db-status`): buka *Authentication → Users* dan **Admin → Pengguna**. Hapus akun yang tidak dikenal (bisa saja terdaftar selama sign-up masih terbuka), atau ubah perannya.
- [ ] *URL Configuration*: Site URL = domain produksi. *Redirect URLs* hanya `https://<domain>/auth/callback` (+ preview Vercel bila perlu).
- [ ] *Attack Protection*: **saran, belum dikonfirmasi aktif**. Aktifkan CAPTCHA (Turnstile) dan cek rate limit email/OTP. Panjang password minimal 12.
- [ ] Aktifkan MFA (TOTP) untuk akun owner bila tersedia.
- [ ] Ganti SMTP default ke SMTP sendiri (Resend/Brevo free) supaya email undangan & magic link tidak kena limit 2/jam.

**Kunci & secret**
- [ ] **Rotasi** `SUPABASE_SERVICE_ROLE_KEY` (Settings → API → JWT/API keys), **password database**, `CRON_SECRET`, dan `REVALIDATE_SECRET` jika pernah dibagikan via chat, screenshot, atau file `.env*.bak`.
- [ ] Hapus file cadangan env lokal (`.env.local.docker.bak`) bila tidak diperlukan. Jangan pernah commit file `.env*` selain `.env.example`.

**Vercel → Project → Settings → Environment Variables (Production)**
- [ ] `NEXT_PUBLIC_SITE_URL` = `https://<domain>` (wajib, lihat temuan #10).
- [ ] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publik, aman).
- [ ] **`CRON_SECRET` wajib ada di Vercel**: tanpa itu `/api/cron/keepalive` dan `/api/cron/publish` membalas 500 (fail-closed), jadi konten terjadwal tidak terbit tepat waktu dan Supabase gratis bisa ter-pause. Paket Hobby hanya mengizinkan cron harian (lihat `docs/deploy.md`).
- [ ] `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (pooler 6543), `DIRECT_URL`, `CRON_SECRET`, `REVALIDATE_SECRET` sebagai **Sensitive**, tanpa prefix `NEXT_PUBLIC_`.
- [ ] Jangan set `SKIP_ENV_VALIDATION` di production.
- [ ] Preview deployment: pakai project/DB Supabase terpisah, atau aktifkan *Vercel Authentication* untuk preview.

**GitHub (sudah aktif, diverifikasi)**
- [x] Secret scanning dan push protection aktif; Dependabot security updates aktif.
- [x] Ruleset `main` aktif (PR + code owner, status check wajib, squash only). Lihat PR #6 (release-please), #7 (cron), #10 (P8.7).
- [ ] Opsional: aktifkan secret scanning *validity checks* dan *non-provider patterns*.

**Operasional**
- [ ] Bucket Storage `media`: public-read, tulis hanya service role (sudah diatur via `scripts/dev/ensure-media-bucket.mts`). Jangan tambah policy upload untuk `anon`/`authenticated`.
- [ ] Cek tabel `audit_log` (Supabase → Table Editor) secara berkala; belum ada halaman admin untuk ini.
- [ ] Jalankan `pnpm audit` dan update dependensi bulanan.
