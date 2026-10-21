# Tempe Mak Nuk — pintasan perintah. `make` / `make help` untuk daftar.
# Semua target memanggil script pnpm; env dibaca dari .env (+ .env.local oleh Next).

SHELL := /bin/bash
ENV_FILE ?= .env
PORT ?= 3100
TSX := pnpm tsx --env-file=$(ENV_FILE)

.DEFAULT_GOAL := help
.PHONY: help install dev build start stop typecheck lint format-check test e2e e2e-strict e2e-admin \
	screenshots check verify db-status db-migrate db-migrate-direct db-generate db-seed \
	db-validate bucket setup clean

help: ## Tampilkan daftar perintah
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

## ── Setup ───────────────────────────────────────────────
install: ## pnpm install + browser Playwright (chromium)
	pnpm install
	pnpm exec playwright install chromium

setup: install db-migrate db-seed bucket ## Setup lengkap project/DB baru (install, migrasi, seed, bucket media)

## ── Jalankan ────────────────────────────────────────────
dev: ## next dev (http://localhost:3000)
	pnpm dev

build: ## next build (jangan jalankan dua build bersamaan)
	@if pgrep -f "next build" >/dev/null; then echo "next build lain sedang berjalan — tunggu."; exit 1; fi
	pnpm build

start: ## next start di PORT (default 3100), butuh build
	pnpm start -p $(PORT)

stop: ## Matikan next start di PORT (default 3100)
	@pids=$$(lsof -ti tcp:$(PORT) -sTCP:LISTEN); \
	if [ -n "$$pids" ]; then kill $$pids && echo "Server di port $(PORT) dimatikan."; else echo "Tidak ada server di port $(PORT)."; fi

## ── Kualitas & test ─────────────────────────────────────
typecheck: ## next typegen + tsc --noEmit
	pnpm typecheck

lint: ## ESLint
	pnpm lint

format-check: ## Prettier --check (jangan `pnpm format` global)
	pnpm format:check

test: ## Vitest (unit)
	pnpm test

check: typecheck lint test ## typecheck + lint + unit test

e2e: ## Playwright (butuh `make build`; auto start di :3100)
	pnpm test:e2e

e2e-strict: ## Playwright dengan axe ketat (allowlist KNOWN diabaikan)
	E2E_AXE_STRICT=1 pnpm test:e2e

e2e-admin: ## Playwright admin saja (butuh E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD)
	pnpm exec playwright test tests/e2e/admin.spec.ts

screenshots: ## Screenshot 375/768/1440 × light/dark → test-results/screenshots/
	pnpm exec playwright test tests/e2e/screenshots.spec.ts

verify: check build e2e ## Verifikasi penuh sebelum commit (check + build + e2e)

## ── Database (Supabase remote!) ─────────────────────────
db-status: ## Daftar migrasi: ✓ sudah diterapkan, · belum
	$(TSX) scripts/dev/migrate.mts --status

db-migrate: ## Terapkan migrasi lewat pooler 6543 (DATABASE_URL), error terbaca
	$(TSX) scripts/dev/migrate.mts

db-migrate-direct: ## Terapkan migrasi lewat DIRECT_URL (5432; sering diblokir)
	$(TSX) scripts/dev/migrate.mts --direct

db-generate: ## Buat file migrasi dari perubahan skema Drizzle
	pnpm db:generate

db-seed: ## Seed data awal (idempoten)
	pnpm db:seed

db-validate: ## Validasi section seed halaman
	pnpm tsx --tsconfig tsconfig.json scripts/dev/validate-sections.mts

bucket: ## Buat/perbarui bucket Storage `media` (idempoten)
	$(TSX) scripts/dev/ensure-media-bucket.mts

## ── Lain-lain ───────────────────────────────────────────
clean: ## Hapus .next, test-results, playwright-report
	rm -rf .next test-results playwright-report
