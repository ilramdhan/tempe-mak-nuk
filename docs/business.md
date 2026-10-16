# Data Bisnis (DUMMY — semua dapat diubah dari Admin → Pengaturan)

> Nilai di bawah adalah **seed default** (`src/db/seed`). Tidak ada yang di-hard-code di komponen;
> semua dibaca dari tabel `settings` / tabel domain dan dapat diedit di dashboard admin.

| Kunci (`settings.key`) | Nilai dummy |
|---|---|
| `business.name` | Tempe Mak Nuk |
| `business.legalName` | Usaha Tempe Mak Nuk |
| `business.foundedYear` | 2001 |
| `business.owner` | Ibu Nuk (Mak Nuk) |
| `contact.whatsapp` | 6281234567890 |
| `contact.whatsappDisplay` | +62 812-3456-7890 |
| `contact.email` | halo@tempemaknuk.com |
| `contact.phone` | +62 272 000 000 |
| `address.street` | Jl. Raya Pedan No. 21, Dk. Kauman |
| `address.village` | Desa Kalangan |
| `address.district` | Kec. Pedan |
| `address.city` | Kabupaten Klaten |
| `address.province` | Jawa Tengah |
| `address.postalCode` | 57468 |
| `address.country` | ID |
| `geo.lat` / `geo.lng` | -7.7023 / 110.6894 |
| `maps.url` | https://maps.google.com/?q=-7.7023,110.6894 |
| `maps.embedUrl` | https://www.google.com/maps?q=-7.7023,110.6894&output=embed |
| `halal.number` | ID33110012345670124 |
| `halal.issuer` | BPJPH Kementerian Agama RI |
| `halal.issuedAt` | 2024-03-12 |
| `halal.verifyUrl` | https://bpjph.halal.go.id/search/sertifikat |
| `legal.nib` | 1234567890123 |
| `legal.pirt` | 2063310010123-29 |
| `hours` | Sen–Sab 06.00–16.00 WIB · Minggu & libur nasional: produksi libur (chat tetap dibalas) |
| `order.leadDays` | 4 (dipakai Selasa → PO paling lambat Jumat) |
| `order.cutoffTime` | 15:00 WIB |
| `order.slotsPerDay` | 8 pelanggan |
| `order.nearlyFullThreshold` | 2 slot tersisa |
| `order.closedWeekdays` | [0] (Minggu) |
| `pricing.show` | true (mode "mulai dari", detail via WA) |
| `delivery.areas` | Ambil di tempat (gratis) · Klaten kota (antar, ongkir flat) · Solo Raya & Yogyakarta (kurir instan, ongkir sesuai aplikasi) |
| `payment.methods` | Transfer bank · QRIS · Tunai saat ambil |
| `social.instagram` | https://instagram.com/tempemaknuk |
| `social.tiktok` | https://tiktok.com/@tempemaknuk |
| `social.facebook` | https://facebook.com/tempemaknuk |
| `social.youtube` | https://youtube.com/@tempemaknuk |
| `social.googleBusiness` | https://g.page/tempemaknuk |
| `site.url` | https://tempemaknuk.com |
| `site.locale` | id-ID (struktur siap i18n, konten ID saja) |

## Produk (dummy, tabel `products` / `product_shapes` / `product_sizes`)

| Varian | Slug | Harga mulai |
|---|---|---|
| Tempe Klasik (dengan kulit ari) | `tempe-klasik` | Rp 5.000 / balok sedang |
| Tempe Original Tanpa Kulit | `tempe-original-tanpa-kulit` | Rp 7.000 / balok sedang |

**Bentuk:** Balok klasik · Lembaran tipis (mendoan/keripik) · Silinder (lontong) · Bungkus daun bulat · Mini/dadu · Custom request
**Ukuran:** Kecil (±100 g) · Sedang (±250 g) · Besar (±500 g) · Jumbo katering (±1 kg) · Custom dimensi
**Kemasan:** Daun pisang (tradisional) · Plastik food-grade berlubang · Kombinasi daun + plastik

## Cerita Mak Nuk (dummy, edit di Admin → Halaman → Tentang)

Sejak 2001, Mak Nuk membuat tempe di dapur rumahnya di Pedan, Klaten — awalnya hanya untuk tetangga dan warung sekitar.
Resepnya tidak pernah berubah: kedelai pilihan, air bersih, ragi, dan kesabaran menunggu fermentasi.
Ketika pelanggan meminta tempe yang lebih bersih untuk MPASI anak, lahirlah varian tanpa kulit ari yang dikupas satu per satu.
Hari ini, anak-anak Mak Nuk meneruskan dapur yang sama dengan tangan yang sama — tanpa pengawet, tanpa jalan pintas.
