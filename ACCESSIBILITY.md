# Aksesibilitas

Target kami adalah **WCAG 2.1 level AA** untuk situs publik dan panel admin.

## Bagaimana dijaga

- Pemeriksaan otomatis axe di Playwright. Mode ketat tanpa allowlist: `make e2e-strict`.
- Foto wajib punya teks alt (divalidasi di media library).
- Navigasi keyboard, fokus terlihat, dan kontras warna menjadi bagian dari tinjauan PR.

## Keterbatasan yang diketahui

Tidak ada keterbatasan terbuka yang dicatat saat ini. Temuan QA dicatat di [docs/qa.md](docs/qa.md).

## Melaporkan kendala

Buat isu memakai formulir **Aksesibilitas**: [buka formulir](https://github.com/ilramdhan/tempe-mak-nuk/issues/new?template=a11y.yml). Sertakan halaman, perangkat/browser, dan teknologi bantu yang dipakai. Kendala aksesibilitas ditangani sebagai bug.
