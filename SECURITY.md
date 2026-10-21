# Kebijakan Keamanan

## Versi yang didukung

Hanya rilis terbaru di branch `main` yang menerima perbaikan keamanan.

## Melaporkan kerentanan

**Jangan membuka isu publik.** Laporkan secara privat lewat
[GitHub Security Advisories](https://github.com/ilramdhan/tempe-mak-nuk/security/advisories/new).

Sertakan: deskripsi, langkah reproduksi, dampak, dan versi/commit terkait.

## Cakupan

- Situs publik dan panel admin (`/admin`)
- Server Actions dan route handler (termasuk cron/revalidate)
- Kebijakan RLS database dan peran pengguna
- Unggah media dan Storage
- Proxy (`src/proxy.ts`): autentikasi dan redirect

## Di luar cakupan

- Serangan DoS/volumetrik, spam, dan rekayasa sosial
- Temuan dari pemindai otomatis tanpa dampak nyata
- Kerentanan di layanan pihak ketiga (Supabase, Vercel) - laporkan ke vendor
- Perilaku yang butuh akses fisik atau perangkat yang sudah terkompromi

## Target respons

| Tahap                       | Target                           |
| --------------------------- | -------------------------------- |
| Konfirmasi laporan          | 3 hari kerja                     |
| Penilaian awal              | 7 hari                           |
| Perbaikan (berdasar risiko) | sesegera mungkin, kabari pelapor |

Detail desain keamanan: [docs/security.md](docs/security.md).
