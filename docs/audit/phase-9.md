# Audit Akhir — Fase 9 (Repo GitHub production-grade)

Tanggal: 2026-10-22 · Mode: READ-ONLY (tidak ada kode, setting, atau DB yang diubah) · Basis: `main` @ `4089d33` (rilis v0.1.4, #24)

## Ringkasan

| Verdict | Jumlah (checklist rinci) | Task |
|---|---|---|
| ✅ | 22 | P9.1, P9.2, P9.3, P9.4, P9.5 |
| ⚠️ | 11 | P9.6 (setting merge), operasional pasca-rilis (preview Vercel, PAT, docs, CAPTCHA, E2E admin, seed guard, verifikasi performa) |
| ❌ | 1 | P9.6: Private Vulnerability Reporting **nonaktif** |

Inti Fase 9 sudah tercapai. Repo publik dengan lisensi proprietary dan community files lengkap. CI wajib hijau lewat ruleset. Semua action di-pin SHA. Release-please berjalan (v0.1.0 sampai v0.1.4). Image GHCR `ghcr.io/ilramdhan/tempe-mak-nuk:0.1.4` sudah multi-arch, bisa di-pull anonim, dan bertanda tangan cosign. Code scanning tidak punya alert terbuka.

Ada satu temuan keras: `SECURITY.md` dan `ISSUE_TEMPLATE/config.yml` mengarahkan pelapor ke `security/advisories/new`, tetapi PVR nonaktif. Sisa temuan lain bersifat operasional atau dokumentasi.

## Metode

- Baris P9.1–P9.7 di `PLAN.md:127-137` / `STATE.md:97-103` dibandingkan dengan isi repo, ditambah `HANDOVER.md` §3/§3b.
- Isi repo yang diperiksa: root files, `.github/**`, `release-please-config.json`, `.release-please-manifest.json`, `Dockerfile`, `.dockerignore`, `next.config.ts`, `src/db/build-url.ts`, `docs/deploy.md`, `README.md`.
- Perintah `gh` (read-only) yang dijalankan: `run list -L 30` (+ filter per workflow), `api …/rulesets/25547885`, `api …/branches/main/protection` (404, karena dipakai ruleset), `api …/code-scanning/alerts`, `api …/code-scanning/default-setup`, `api …/private-vulnerability-reporting`, `api …/dependabot/alerts?state=open`, `api …/secret-scanning/alerts?state=open`, `api repos/…` (merge settings, security_and_analysis, topics), `pr list --state all`, `release list`, `secret list`, status Vercel per head SHA PR #20–#24.
- `grep uses:` di `.github/workflows/*.yml`: semua action eksternal di-pin SHA 40 karakter + komentar versi. Satu-satunya pengecualian adalah reusable lokal `./.github/workflows/docker.yml`.
- Fakta dari orkestrator (diverifikasi 2026-10-22, tidak diulang karena audit ini tidak menjalankan docker): v0.1.4 bisa di-pull anonim (amd64+arm64), dan `cosign verify` lolos. `gh` lokal tidak punya scope `read:packages`, jadi visibilitas paket tidak bisa dicek ulang lewat API.
- Tidak menjalankan build, docker, maupun DB.

## Tabel per task

| Task | Verdict | Bukti | Gap konkret | Rekomendasi |
|---|---|---|---|---|
| **P9.1** Community files + LICENSE proprietary | ✅ | `LICENSE` ("All rights reserved", PROPRIETARY), `README.md` (badge CI/Release/License), `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `ACCESSIBILITY.md`, `SUPPORT.md`, `.editorconfig`, `.gitattributes`; repo `visibility: public` | `SECURITY.md:10` menautkan ke advisories, tetapi PVR nonaktif (lihat P9.6) | Aktifkan PVR (lihat P9.6) |
| **P9.2** `.github` meta | ✅ | `.github/CODEOWNERS` (default `@ilramdhan` + path sensitif), `ISSUE_TEMPLATE/{bug,feature,content,a11y}.yml` + `config.yml` (`blank_issues_enabled: false`, link keamanan), `pull_request_template.md`, `labeler.yml`, `labels.yml` | — | — |
| **P9.3** Workflows + Dependabot | ✅ | `ci.yml` (job `verify` + `build-e2e` Postgres/Playwright/axe strict), `dependency-review.yml` (`fail-on-severity: high`), `pr-title.yml`, `labeler.yml`, `labels-sync.yml`, `stale.yml`; CodeQL lewat **default setup** (`state: configured`, actions + JS/TS), sesuai keputusan #6 yang menghapus `codeql.yml` advanced; `dependabot.yml` (npm grup minor/patch, github-actions grup, docker); `permissions: contents: read` di level workflow + timeout tiap job | `stale.yml` belum pernah jalan (cron Senin 02:41 UTC; jadwal pertama 2026-10-26). Admin e2e di-skip karena `E2E_ADMIN_*` tidak diset (`ci.yml:60-61`) | Cek run `stale` pertama setelah 2026-10-26. Lihat butir E2E admin di bawah |
| **P9.4** release-please + deskripsi/topics | ✅ | `release-please-config.json` (node, `include-v-in-tag`, changelog berbahasa Indonesia, **tanpa `release-as`**); manifest `{".":"0.1.4"}` = `package.json` `0.1.4`; rilis v0.1.0–v0.1.4 (v0.1.4 Latest); deskripsi repo + 20 topics terisi | Job `docker` di rilis v0.1.1, v0.1.2, v0.1.3 gagal (run `39618188086`, `39688268281`, `39746489836`), sehingga tag GHCR untuk versi itu tidak ada | Opsional: backfill lewat `gh workflow run docker.yml -f tag=v0.1.3 -f version=0.1.3`. Cukup dicatat di CHANGELOG/README bahwa image dimulai dari 0.1.4 |
| **P9.5** Docker standalone + GHCR | ✅ | `next.config.ts:79` `output: "standalone"`; `Dockerfile` multi-stage `node:22.23.2-alpine3.23`, runner `apk upgrade` (fix CVE musl/zlib), npm/corepack/yarn dibuang, user `nextjs` uid 1001, `HEALTHCHECK /robots.txt`; DB build lewat BuildKit secret; `.dockerignore` mengecualikan `.env` + `.env.*` (kecuali `.env.example`), `*.pem`, `.git`, `tests`, `docs`; `docker.yml`: PR build+Trivy, rilis → Trivy SARIF (exit 0) + gate tabel CRITICAL/HIGH (exit 1, `scanners: vuln`), push amd64+arm64, SBOM + provenance `mode=max`, cosign keyless by digest; run rilis v0.1.4 `39755943735` sukses | — | — |
| **P9.6** Setting repo | ⚠️ | Ruleset `main` (id 25547885, active): larang hapus/force-push, PR wajib (1 approval + code owner, merge **squash** saja), status check wajib `Verify (typecheck, lint, format, unit)` + `Build + E2E (Playwright)` (strict), code scanning gate CodeQL (errors / high+), code quality, Copilot review on push. Secret scanning + push protection **enabled**, Dependabot security updates **enabled**, 0 alert Dependabot/secret terbuka, 0 PR terbuka. Dependabot #3/#5 merge, #4/#16 ditutup (ignore major) | (1) **PVR `enabled: false`** ❌. (2) Di level repo `allow_merge_commit` dan `allow_rebase_merge` masih `true` (ruleset hanya membatasi `main`), dan `delete_branch_on_merge: false`. (3) Bypass ruleset = role Admin `always`. Wajar untuk solo dev (owner tidak bisa approve PR sendiri), tetapi artinya semua gate bisa dilewati. (4) `secret_scanning_non_provider_patterns` & `validity_checks` nonaktif (opsional) | (1) *Settings → Code security → Private vulnerability reporting → Enable*. (2) *Settings → General → Pull Requests*: matikan merge commit & rebase, aktifkan "Automatically delete head branches". (3) Biarkan bypass, tetapi merge tetap lewat PR + CI hijau (sudah jadi praktik). (4) Opsional: aktifkan validity checks |

## Checklist rinci

| # | Item | Verdict | Bukti / catatan |
|---|---|---|---|
| 1 | LICENSE proprietary, repo publik | ✅ | `LICENSE:1-3`; `visibility: public` |
| 2 | Community health files | ✅ | CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, ACCESSIBILITY, SUPPORT, `.editorconfig`, `.gitattributes` |
| 3 | CODEOWNERS | ✅ | `.github/CODEOWNERS`; ruleset `require_code_owner_review: true` |
| 4 | Issue forms + config | ✅ | 4 form + `config.yml` (blank issue off) |
| 5 | PR template | ✅ | `.github/pull_request_template.md` |
| 6 | Labeler + label sync | ✅ | `labeler.yml`, `labels.yml` (63 baris); `labels-sync` sukses 2026-10-21 |
| 7 | CI `main` hijau | ✅ | `CI` push `main` sukses 5 run terakhir (satu `cancelled` karena concurrency); PR #20–#24 hijau |
| 8 | Dependency review | ✅ | Sukses di PR #22/#24 |
| 9 | PR title (Conventional Commits) | ✅ | Sukses di PR #22/#24 (satu run `cancelled` karena concurrency, normal) |
| 10 | Stale | ⚠️ | Belum pernah jalan; cron pertama Senin 2026-10-26 |
| 11 | CodeQL | ✅ | Default setup `configured`; run push `main` & PR sukses |
| 12 | Action di-pin SHA + permissions minimal | ✅ | Semua `uses:` eksternal `@<sha40> # vX`; `permissions` per workflow/job |
| 13 | Dependabot (npm/actions/docker) | ✅ | `dependabot.yml`; 0 alert terbuka, 0 PR terbuka |
| 14 | release-please config/manifest | ✅ | Tanpa `release-as`; manifest = package.json = 0.1.4; token `RELEASE_PLEASE_TOKEN \|\| github.token` |
| 15 | Image GHCR per rilis | ⚠️ | Image hanya ada untuk v0.1.4. Docker job v0.1.1–v0.1.3 gagal (Trivy: secret `jwt-token` / CVE musl), sudah diperbaiki di #23 |
| 16 | Dockerfile | ✅ | Non-root, healthcheck, `apk upgrade`, base image literal (bisa di-bump Dependabot) |
| 17 | `.dockerignore` mengecualikan `.env*` | ✅ | `.env`, `.env.*`, `!.env.example`, `*.pem` |
| 18 | `next.config.ts` standalone | ✅ | `next.config.ts:79` |
| 19 | GHCR multi-arch, SBOM, Trivy, cosign | ✅ | `docker.yml:139-278`; v0.1.4 pull anonim + `cosign verify` lolos (orkestrator) |
| 20 | Code scanning | ✅ | 0 open; 7 alert (CodeQL `js/identity-replacement`, Trivy `jwt-token` ×3, CVE-2026-85091, CVE-2026-107891 ×2) semuanya `fixed` |
| 21 | Ruleset `main` | ✅ | Lihat P9.6; branch protection klasik tidak dipakai (404), dan itu memang disengaja |
| 22 | Setting merge repo | ⚠️ | Merge commit/rebase masih diizinkan di level repo; auto-delete branch off |
| 23 | Secret scanning + push protection | ✅ | `enabled`; 0 alert terbuka |
| 24 | Private Vulnerability Reporting | ❌ | API `{"enabled":false}`, padahal `SECURITY.md:10` dan `ISSUE_TEMPLATE/config.yml:4` menautkannya |
| 25 | Dependabot security updates | ✅ | `enabled` |
| 26 | Secret `RELEASE_PLEASE_TOKEN` | ⚠️ | PAT fine-grained, **kedaluwarsa 2026-11-20**. Setelah itu fallback ke `github.token`: PR rilis tidak memicu CI, sehingga ruleset memblokir merge |
| 27 | Vercel production | ✅ | Hobby, region Singapura; status Vercel `main` & PR #24 "Deployment has completed" |
| 28 | Vercel preview | ⚠️ | Preview PR #20, #21, #22, #23 **failure** ("Deployment has failed"). PR #24 sukses. Penyebab belum ditelusuri (dugaan: env Preview tidak lengkap / build DB) |
| 29 | `docs/deploy.md` akurat | ⚠️ | Bagian Docker akurat (build arg, BuildKit secret, cosign, secret `DOCKER_BUILD_DATABASE_URL`). Namun: `:22` masih "jika jaringan memblokir 5432", padahal session pooler 5432 bisa dijangkau (HANDOVER §3b-4). Tidak ada penjelasan bahwa build otomatis memakai **session pooler 5432** (`src/db/build-url.ts`) sementara runtime **wajib 6543** (5432 runtime → `EMAXCONNSESSION`, admin 500). `max_pipeline: 0` (#21) tidak disebut. `:184` (set paket Public) sudah dikerjakan |
| 30 | `README.md` soal port | ⚠️ | `README.md:61,81` "5432 sering diblokir", padahal kini stale. `:113` belum menyebut build→5432 |
| 31 | CAPTCHA / Attack Protection Supabase Auth | ⚠️ | Checklist `docs/deploy.md:30` belum terkonfirmasi untuk project Singapura baru (`docs/security.md` #7) |
| 32 | Uji manual admin + akun E2E admin | ⚠️ | E2E admin di-skip di CI (`E2E_ADMIN_*` kosong). Login prod ✓, tetapi uji CRUD admin manual di prod belum tercatat |
| 33 | Seed guard (insiden seed remote, HANDOVER §3b-5) | ⚠️ | **In progress** oleh agent lain: `src/db/seed-guard.ts` + test + perubahan `src/db/seed.ts`, `docs/deploy.md:25` (`SEED_ALLOW_REMOTE=1`) masih di working tree, belum di-commit |
| 34 | Verifikasi performa dasbor setelah #21 | ⚠️ | Fix sudah di `main` (v0.1.3+). Uji user di prod (dasbor → pindah 3–4 menu) belum tercatat di STATE/HANDOVER |

## Rekomendasi prioritas

1. **Aktifkan Private Vulnerability Reporting.** Ini satu-satunya ❌, dan link di `SECURITY.md` saat ini buntu. **User · 1 menit**
2. **Perpanjang/ganti `RELEASE_PLEASE_TOKEN` sebelum 2026-11-20.** Pasang pengingat. Pertimbangkan GitHub App token supaya tidak ada tanggal kedaluwarsa. **User · S**
3. **Telusuri kegagalan preview Vercel PR #20–#23** (`npx vercel inspect <dpl> --logs`). Lengkapi env Preview atau batasi preview ke Supabase staging (`docs/deploy.md:54`). **S · sonnet/orchestrator**
4. **Perbarui `docs/deploy.md` + `README.md` soal pooler:** build memakai session 5432 (otomatis via `build-url.ts`), runtime wajib transaksi 6543, `max_pipeline: 0`, dan hapus catatan "5432 diblokir". Koordinasikan dengan agent seed guard yang sedang mengubah `docs/deploy.md`. **S · sonnet**
5. **Rapikan setting merge repo:** squash-only di level repo + auto-delete head branch. **User · 1 menit**
6. **Selesaikan seed guard** (in progress), lalu commit lewat PR. **S**
7. **Aktifkan CAPTCHA/Attack Protection** di Supabase Auth project baru, lalu tandai `docs/security.md` #7. **User · S**
8. **Akun E2E admin** (editor non-owner di DB CI/staging) + secret `E2E_ADMIN_*` supaya `admin.spec.ts` jalan di CI. Lakukan juga uji manual admin di prod dan verifikasi performa dasbor setelah #21. **M**
9. Opsional: backfill image GHCR v0.1.3, aktifkan secret scanning validity checks, dan cek run `stale` pertama (2026-10-26).
