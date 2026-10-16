# SEO — Tempe Mak Nuk

Acuan: PROMPT.md §4 dan §9, `docs/business.md`.

**Catatan metode.** Dokumen ini tidak memuat angka volume pencarian karena belum ada data (Search Console belum aktif). Intent dilabeli kualitatif: **Informasional**, **Navigasional**, **Transaksional**, **Komersial/investigasi**, **Lokal**. Prioritas dilabeli Tinggi/Sedang/Rendah berdasarkan kedekatan dengan konversi, bukan volume. Setelah live, validasi dengan Google Search Console, Google Keyword Planner, dan Autocomplete/"People also ask".

**Aturan konten.** Jangan mengarang testimoni, angka penjualan, sertifikat, atau klaim medis. Klaim gizi wajib bersumber (TKPI Kemenkes / USDA).

**Judul.** Panjang di bawah adalah judul akhir (sudah termasuk " — Tempe Mak Nuk" dari template `%s — Tempe Mak Nuk`), maksimal 60 karakter. Beranda memakai judul penuh tanpa template. Deskripsi maksimal 155 karakter.

---

## 1. Peta Keyword dan Metadata per Route

### `/` Beranda
- **Primary:** tempe klaten (Lokal/Komersial, prioritas Tinggi)
- **Secondary:** tempe handmade klaten; tempe tanpa pengawet; tempe halal klaten; pesan tempe segar klaten; tempe artisan
- **Title:** `Tempe Klaten Handmade Sejak 2001 — Tempe Mak Nuk` 
- **Meta:** `Tempe handmade dari Klaten sejak 2001. Tanpa pengawet, bersertifikat halal, bisa custom bentuk tanpa minimum order. Cek slot dan PO via WhatsApp.`
- **JSON-LD:** `Organization`, `WebSite`, `LocalBusiness`/`FoodEstablishment`, `FAQPage` (FAQ singkat)

### `/produk`
- **Primary:** jenis tempe (Informasional)
- **Secondary:** tempe tanpa kulit; tempe dengan kulit ari; beli tempe segar klaten; perbedaan tempe klasik dan tempe tanpa kulit; bentuk tempe
- **Title:** `Jenis Tempe: Klasik dan Tanpa Kulit — Tempe Mak Nuk`
- **Meta:** `Kenali dua varian Tempe Mak Nuk: Klasik dengan kulit ari dan Original Tanpa Kulit yang lebih putih dan padat. Pilih bentuk dan ukuran sesuai kebutuhan.`
- **JSON-LD:** `CollectionPage`/`ItemList`, `BreadcrumbList`

### `/produk/tempe-klasik`
- **Primary:** tempe klasik (Komersial)
- **Secondary:** tempe kedelai dengan kulit ari; tempe tradisional klaten; tempe daun pisang; tempe handmade tanpa pengawet; harga tempe klaten
- **Title:** `Tempe Klasik Kedelai Kulit Ari, Handmade — Mak Nuk`
- **Meta:** `Tempe Klasik Mak Nuk: kedelai dengan kulit ari, rasa gurih khas, tanpa pengawet. Cocok digoreng, dibacem, dan dibuat orek. Pesan via WhatsApp.`
- **JSON-LD:** `Product` (+ `Offer` jika harga tampil), `BreadcrumbList`, `FAQPage`

### `/produk/tempe-original-tanpa-kulit`
- **Primary:** tempe tanpa kulit (Komersial/Informasional)
- **Secondary:** tempe tanpa kulit ari; tempe putih padat; tempe untuk mpasi; tempe tidak langu; beli tempe tanpa kulit klaten
- **Title:** `Tempe Original Tanpa Kulit, Putih dan Padat — Mak Nuk`
- **Meta:** `Tempe Original Tanpa Kulit Mak Nuk: kedelai dikupas bersih, lebih putih, padat, lembut, minim langu. Tanpa pengawet. Pesan via WhatsApp.`
- **JSON-LD:** `Product` (+ `Offer`), `BreadcrumbList`, `FAQPage`

### `/custom-order`
- **Primary:** pesan tempe custom (Transaksional)
- **Secondary:** tempe tanpa minimal order; tempe custom bentuk; pesan tempe ukuran khusus; pesan tempe lembaran tipis; tempe untuk acara klaten
- **Title:** `Pesan Tempe Custom, Tanpa Minimal Order — Tempe Mak Nuk`
- **Meta:** `Pilih varian, bentuk, ukuran, jumlah, dan tanggal pakai. Tanpa minimum order. Pesanan tersusun rapi dan langsung terkirim ke WhatsApp Mak Nuk.`
- **JSON-LD:** `WebPage`, `BreadcrumbList`, `Service` (opsional)

### `/cara-pesan`
- **Primary:** PO tempe (Transaksional/Informasional)
- **Secondary:** cara pesan tempe segar; pre order tempe klaten; lead time pesan tempe; antar tempe solo jogja; pembayaran pesan tempe
- **Title:** `Cara Pesan dan PO Tempe, Cek Slot — Tempe Mak Nuk`
- **Meta:** `Cara pesan tempe Mak Nuk dalam 4 langkah. Aturan PO, batas waktu pesan, kalender slot, antar Klaten, Solo, Jogja atau ambil di tempat.`
- **JSON-LD:** `HowTo`, `FAQPage`, `BreadcrumbList`

### `/kemitraan`
- **Primary:** supplier tempe katering (Komersial/B2B)
- **Secondary:** supplier tempe solo; supplier tempe klaten; tempe untuk restoran; tempe grosir klaten; reseller tempe
- **Title:** `Supplier Tempe Katering Klaten, Solo — Tempe Mak Nuk`
- **Meta:** `Pasok tempe handmade untuk katering, restoran, kantor, dan reseller. Ukuran seragam, jadwal rutin, bisa custom. Hubungi Mak Nuk via WhatsApp.`
- **JSON-LD:** `Service`/`Organization`, `BreadcrumbList`

### `/proses`
- **Primary:** cara membuat tempe tradisional (Informasional)
- **Secondary:** proses pembuatan tempe; tahapan fermentasi tempe; cara membuat tempe daun pisang; berapa lama fermentasi tempe; cara kupas kulit ari kedelai
- **Title:** `Cara Membuat Tempe Tradisional, 6 Langkah — Mak Nuk`
- **Meta:** `Dari sortir kedelai, kupas, rebus, ragi, bungkus, sampai fermentasi: lihat proses tempe handmade Mak Nuk di Klaten, langkah demi langkah.`
- **JSON-LD:** `HowTo`, `BreadcrumbList`

### `/manfaat-tempe`
- **Primary:** manfaat tempe (Informasional)
- **Secondary:** kandungan gizi tempe; protein tempe; tempe probiotik; tempe sehat setiap hari; tempe untuk diet
- **Title:** `Manfaat dan Kandungan Gizi Tempe — Tempe Mak Nuk`
- **Meta:** `Manfaat dan gizi tempe berdasarkan sumber TKPI Kemenkes dan USDA: protein, serat, hasil fermentasi. Informasi umum, bukan nasihat medis.`
- **JSON-LD:** `Article`, `BreadcrumbList`

### `/halal-kualitas`
- **Primary:** tempe halal (Komersial/Kepercayaan)
- **Secondary:** sertifikat halal tempe; tempe higienis; tempe tanpa bahan kimia; bahan tempe mak nuk; cek sertifikat halal bpjph
- **Title:** `Tempe Halal Bersertifikat BPJPH — Tempe Mak Nuk`
- **Meta:** `Sertifikat halal BPJPH Tempe Mak Nuk, standar higienis, dan bahan: hanya kedelai, air, ragi. Cek nomor sertifikat langsung di situs resmi.`
- **JSON-LD:** `WebPage`, `Organization` (`hasCredential` opsional), `BreadcrumbList`

### `/tentang`
- **Primary:** tempe mak nuk (Navigasional)
- **Secondary:** tempe mak nuk klaten; cerita tempe mak nuk; produsen tempe pedan klaten; tempe rumahan sejak 2001
- **Title:** `Tentang Mak Nuk, Pembuat Tempe Klaten Sejak 2001`
- **Meta:** `Sejak 2001 Mak Nuk membuat tempe di dapur rumah di Pedan, Klaten. Resep, tangan, dan kesabaran yang sama, kini diteruskan anak-anaknya.`
- **JSON-LD:** `AboutPage`, `Organization`, `BreadcrumbList`

### `/resep`
- **Primary:** resep tempe (Informasional)
- **Secondary:** resep olahan tempe; resep tempe mudah; masakan tempe sehari-hari; resep tempe mendoan; resep tempe untuk mpasi
- **Title:** `Resep Tempe Rumahan Mudah dan Enak — Tempe Mak Nuk`
- **Meta:** `Kumpulan resep tempe rumahan: mendoan, bacem, orek, sambal goreng, penyet, sampai tim untuk MPASI. Langkah jelas, bahan mudah dicari.`
- **JSON-LD:** `CollectionPage`/`ItemList`, `BreadcrumbList`

### `/resep/[slug]`
- **Primary:** per resep (lihat bagian 4)
- **Secondary:** 3 sampai 5 turunan dari resep tersebut
- **Title (pola):** `Resep {Nama} Renyah/Empuk, Mudah — Tempe Mak Nuk` (potong sampai ≤60)
- **Meta (pola):** `Cara membuat {nama}: bahan, langkah, waktu masak, dan tips memilih tempe segar. Ditulis keluarga pembuat tempe Mak Nuk, Klaten.`
- **JSON-LD:** `Recipe`, `BreadcrumbList`

### `/jurnal`
- **Primary:** artikel tentang tempe (Informasional)
- **Secondary:** edukasi tempe; tips tempe; tempe indonesia; blog tempe
- **Title:** `Jurnal Tempe: Panduan, Gizi, dan Cerita — Mak Nuk`
- **Meta:** `Panduan menyimpan, memilih, dan mengolah tempe, ditambah gizi, sejarah, dan cerita dari dapur Tempe Mak Nuk di Klaten.`
- **JSON-LD:** `Blog`, `BreadcrumbList`

### `/jurnal/[slug]`
- **Primary / Secondary:** lihat bagian 3
- **Title (pola):** `{Judul Artikel} — Tempe Mak Nuk` (≤60)
- **Meta (pola):** ringkasan 120–150 karakter dengan keyword utama di awal; dikelola per post di admin (field SEO)
- **JSON-LD:** `Article`, `BreadcrumbList` (+ `FAQPage` jika ada blok FAQ)

### `/jurnal/kategori/[slug]`
- **Primary:** `{kategori} tempe` (mis. gizi tempe, resep tempe, tips tempe)
- **Secondary:** 3 sampai 4 turunan dari kategori
- **Title (pola):** `{Kategori} Tempe: Artikel dan Panduan — Mak Nuk`
- **Meta (pola):** `Kumpulan artikel {kategori} tempe dari Tempe Mak Nuk, Klaten. Panduan praktis, bersumber, dan mudah dipraktikkan.`
- **JSON-LD:** `CollectionPage`, `BreadcrumbList`

### `/faq`
- **Primary:** pertanyaan seputar tempe (Informasional)
- **Secondary:** tempe tahan berapa lama; cara menyimpan tempe; tempe mak nuk bisa dikirim; apakah tempe boleh untuk bayi; kenapa tempe harus PO
- **Title:** `FAQ Tempe Mak Nuk: Pesan, Simpan, Kirim, Halal`
- **Meta:** `Jawaban pertanyaan umum tentang pesan, PO, kirim, simpan, dan varian Tempe Mak Nuk. Cari pertanyaanmu atau tanya langsung via WhatsApp.`
- **JSON-LD:** `FAQPage`, `BreadcrumbList`

### `/kontak`
- **Primary:** tempe mak nuk alamat (Navigasional/Lokal)
- **Secondary:** tempe mak nuk klaten; toko tempe pedan klaten; jam buka tempe mak nuk; whatsapp tempe mak nuk; lokasi produsen tempe klaten
- **Title:** `Kontak dan Alamat Tempe Mak Nuk, Pedan Klaten`
- **Meta:** `Alamat dapur produksi Tempe Mak Nuk di Pedan, Klaten, jam buka, peta, WhatsApp, dan Instagram. Chat dulu untuk cek slot sebelum datang.`
- **JSON-LD:** `ContactPage`, `LocalBusiness`/`FoodEstablishment` (alamat, geo, jam, telepon, `sameAs`), `BreadcrumbList`

### Halaman legal
`/kebijakan-privasi`, `/syarat-ketentuan`, `/kebijakan-cookie`, `/kebijakan-pemesanan`
- **Primary:** tidak ditarget (cukup indeks dasar); gunakan nama halaman
- **Title:** `Kebijakan Privasi — Tempe Mak Nuk`; `Syarat dan Ketentuan — Tempe Mak Nuk`; `Kebijakan Cookie — Tempe Mak Nuk`; `Kebijakan Pemesanan dan PO — Tempe Mak Nuk`
- **Meta:** `Kebijakan privasi Tempe Mak Nuk sesuai UU PDP No. 27 Tahun 2022: data yang dikumpulkan, tujuan, dan hak kamu.` (sesuaikan per halaman)
- **JSON-LD:** `WebPage`, `BreadcrumbList`

### `404` / `500`
- `noindex`; title `Halaman Tidak Ditemukan — Tempe Mak Nuk`; tidak ada JSON-LD. Arahkan ke Beranda, Produk, dan Cara Pesan.

### `/admin`, `/api`
- `noindex`, blokir di `robots.ts`.

**JSON-LD global (semua halaman):** `Organization`, `WebSite` (di layout), `BreadcrumbList` (kecuali Beranda).

---

## 2. Cannibalization yang Perlu Dijaga
- `tempe tanpa kulit` → halaman produk Original (transaksional); artikel pilar "Beda tempe dengan dan tanpa kulit ari" menarget kueri perbandingan dan harus menaut ke halaman produk.
- `manfaat tempe` → `/manfaat-tempe`; artikel jurnal harus menarget turunan spesifik (protein, MPASI, vs daging).
- `PO tempe` → `/cara-pesan`; artikel "Kenapa harus PO tempe" menarget kueri alasan, bukan cara.
- `tempe klaten` → Beranda saja; halaman lain memakai modifier lain.

---

## 3. Delapan Artikel Pilar (draft untuk review pemilik)

Panjang target 1.200–1.800 kata. Sumber gizi: TKPI Kemenkes / USDA FoodData Central. Tiap artikel diakhiri CTA WhatsApp dan blok FAQ 3 pertanyaan.

### P1. Beda Tempe dengan dan Tanpa Kulit Ari
- **Target:** beda tempe dengan kulit dan tanpa kulit (Informasional/Komersial)
- **Secondary:** tempe tanpa kulit ari; tempe kupas; tempe tidak langu; mana tempe lebih sehat
- **H2:** Apa itu kulit ari kedelai · Cara Mak Nuk mengupas kedelai · Tempe Klasik vs Original Tanpa Kulit · Tekstur dan rasa · Cocok untuk masakan apa · Soal gizi dan serat (bersumber) · Mana yang harus dipilih
- **H3:** (di Tekstur dan rasa) Saat digoreng · Saat dikukus/ditim; (di Cocok untuk) Keluarga dan MPASI · Katering dan restoran
- **Link keluar:** `/produk/tempe-klasik`, `/produk/tempe-original-tanpa-kulit`, `/produk`, `/resep/tim-tempe-mpasi`, `/faq`, `/custom-order`

### P2. Cara Menyimpan Tempe Tanpa Pengawet
- **Target:** cara menyimpan tempe (Informasional)
- **Secondary:** tempe tahan berapa lama; simpan tempe di kulkas; tempe bisa dibekukan; tanda tempe rusak
- **H2:** Kenapa tempe tanpa pengawet cepat berubah · Hari pertama sampai ketiga: suhu ruang · Kulkas dan freezer · Cara membungkus ulang · Tanda tempe masih layak dan tidak layak · Tempe semangit: bisa dipakai apa
- **H3:** (di Kulkas dan freezer) Mencairkan dengan benar · Kesalahan umum
- **Link keluar:** `/faq`, `/produk`, `/cara-pesan`, `/resep/tempe-bacem`, P4

### P3. Tempe untuk MPASI
- **Target:** tempe untuk mpasi (Informasional)
- **Secondary:** tempe bayi 6 bulan; kapan bayi boleh makan tempe; tempe tanpa kulit untuk mpasi; resep mpasi tempe
- **H2:** Kapan tempe boleh dikenalkan · Kenapa varian tanpa kulit lebih lembut · Cara mengolah aman dan higienis · Tekstur sesuai usia · Alergi kedelai: yang perlu diperhatikan · Ide menu MPASI tempe
- **Catatan:** wajib disclaimer non-medis dan anjuran konsultasi dokter anak/ahli gizi; kutip rekomendasi IDAI/Kemenkes dengan tautan sumber.
- **Link keluar:** `/produk/tempe-original-tanpa-kulit`, `/resep/tim-tempe-mpasi`, `/manfaat-tempe`, `/faq`

### P4. Kenapa Harus PO Tempe
- **Target:** kenapa tempe harus pre order (Informasional)
- **Secondary:** tempe handmade pesan dulu; fermentasi tempe butuh waktu; slot produksi tempe
- **H2:** Tempe tidak bisa dipercepat · Kapasitas dapur kecil, kualitas dijaga · Aturan PO Mak Nuk (lead time dan cutoff) · Contoh: dipakai Selasa, PO paling lambat Jumat · Cara cek slot lewat WhatsApp · Tips pesan untuk acara
- **Link keluar:** `/cara-pesan`, `/custom-order`, `/proses`, `/kemitraan`

### P5. Tempe vs Daging: Perbandingan Protein
- **Target:** protein tempe vs daging (Informasional)
- **Secondary:** kandungan protein tempe per 100 gram; tempe pengganti daging; protein nabati vs hewani
- **H2:** Protein tempe per 100 g (angka dari TKPI/USDA, dengan tautan) · Daging ayam dan sapi sebagai pembanding · Kualitas protein dan asam amino · Serat dan lemak · Soal harga per gram protein · Cara memakai tempe sebagai pengganti sebagian daging
- **Catatan:** tampilkan angka hanya dengan sumber dan tahun; hindari klaim "lebih sehat dari daging".
- **Link keluar:** `/manfaat-tempe`, `/resep/sambal-goreng-tempe`, `/produk`

### P6. Mengenal Ragi Tempe
- **Target:** ragi tempe (Informasional)
- **Secondary:** Rhizopus oligosporus; laru tempe; fermentasi tempe; ragi tempe alami
- **H2:** Apa itu ragi tempe · Jamur Rhizopus dan perannya · Kenapa suhu dan kelembapan penting · Ragi di dapur Mak Nuk: sedikit tapi tepat · Miselium putih: tanda tempe jadi · Mitos soal ragi
- **Link keluar:** `/proses`, `/halal-kualitas`, P2, P8

### P7. Ide Menu Katering dari Tempe
- **Target:** menu katering tempe (Komersial)
- **Secondary:** menu nasi box tempe; ide lauk tempe katering; olahan tempe untuk hajatan; tempe untuk katering solo
- **H2:** Kenapa tempe cocok untuk katering · Menu nasi kotak · Menu prasmanan dan hajatan · Menu sehat kantor · Menjaga ukuran dan matang seragam · Cara pesan tempe jumlah besar
- **H3:** (di Menjaga ukuran) Potongan dadu dan lembaran · Jadwal pengiriman rutin
- **Link keluar:** `/kemitraan`, `/custom-order`, `/cara-pesan`, `/resep/tempe-mendoan`, `/resep/sambal-goreng-tempe`

### P8. Sejarah Tempe di Jawa Tengah
- **Target:** sejarah tempe jawa tengah (Informasional)
- **Secondary:** asal usul tempe; tempe warisan indonesia; sejarah tempe di jawa
- **H2:** Asal-usul tempe di Jawa · Tempe dalam dapur Jawa Tengah · Klaten dan sentra tempe rumahan · Dari daun jati dan pisang ke kemasan modern · Tempe hari ini · Mak Nuk dan warisan sejak 2001
- **Catatan:** kutip sumber sejarah (jurnal/buku) dengan tautan; tandai bagian yang belum terverifikasi sebagai "perlu dicek".
- **Link keluar:** `/tentang`, `/proses`, P6, `/produk`

---

## 4. Enam Ide Resep

| Slug | Primary | Secondary | Intent |
|---|---|---|---|
| `tempe-mendoan` | resep tempe mendoan | mendoan banyumas; mendoan setengah matang; adonan tepung mendoan; mendoan lembaran tipis | Informasional, tinggi |
| `tempe-bacem` | resep tempe bacem | bacem tempe khas jogja; tempe bacem tanpa santan; tempe bacem empuk | Informasional |
| `orek-tempe-kering` | resep orek tempe | orek tempe kecap; orek tempe kering tahan lama; orek tempe untuk nasi kotak | Informasional |
| `sambal-goreng-tempe` | resep sambal goreng tempe | sambal goreng tempe kering; sambal goreng tempe pedas manis; lauk tempe katering | Informasional |
| `tim-tempe-mpasi` | resep tempe mpasi | tim tempe bayi; mpasi tempe wortel; tempe tanpa kulit untuk bayi | Informasional (sensitif, perlu disclaimer) |
| `tempe-penyet` | resep tempe penyet | tempe penyet sambal bawang; tempe penyet ala warung; sambal penyet | Informasional |

Tiap resep: waktu persiapan/masak, porsi, bahan dengan takaran, langkah bernomor, tips memilih varian (Klasik atau Original), nilai gizi hanya bila bersumber, foto dari `docs/photo-brief.md` (S16–S21), tautan ke produk dan artikel terkait.

---

## 5. Peta Internal Linking

| Dari | Ke (minimum) |
|---|---|
| Beranda | `/produk`, `/produk/*` (2), `/custom-order`, `/cara-pesan`, `/proses`, `/halal-kualitas`, `/tentang`, 3 resep, 3 artikel terbaru, `/faq`, `/kontak` |
| `/produk` | 2 halaman produk, `/custom-order`, P1, `/faq`, `/cara-pesan` |
| `/produk/[slug]` | produk saudara, `/custom-order`, 2–3 resep, P1, P2, `/halal-kualitas`, `/faq` |
| `/custom-order` | `/cara-pesan`, `/produk`, `/kemitraan`, `/faq` |
| `/cara-pesan` | `/custom-order`, P4, `/kontak`, `/faq`, `/kebijakan-pemesanan` |
| `/kemitraan` | `/custom-order`, `/cara-pesan`, P7, `/halal-kualitas`, `/kontak` |
| `/proses` | P6, P8, `/produk`, `/halal-kualitas`, `/tentang` |
| `/manfaat-tempe` | P3, P5, `/resep`, `/produk`, `/faq` |
| `/halal-kualitas` | `/proses`, `/produk`, `/kontak`, `/faq` |
| `/tentang` | `/proses`, P8, `/produk`, `/kontak`, `/halal-kualitas` |
| `/resep` & `/resep/[slug]` | produk yang direkomendasikan, artikel terkait, `/resep` (balik), `/custom-order` |
| `/jurnal` & `/jurnal/[slug]` | related posts (3), produk/resep terkait, `/faq`, CTA WA; kategori untuk breadcrumb |
| `/faq` | halaman terkait tiap jawaban (produk, cara-pesan, proses, halal) |
| `/kontak` | `/cara-pesan`, `/faq`, `/tentang` |

**Aturan:** anchor deskriptif (bukan "klik di sini"); satu halaman tidak memuat >100 tautan; setiap artikel punya 3+ tautan keluar internal; tidak ada halaman yatim (cek di Search Console dan sitemap); breadcrumb di semua halaman dalam.

---

## 6. Checklist Teknis On-Page
- Satu `h1` per halaman, mengandung keyword utama alami.
- Canonical per halaman; paginasi `/jurnal` dan `/resep` tidak diindeks ganda.
- `sitemap.ts` dinamis (artikel, resep, produk), `robots.ts` blokir `/admin` dan `/api`.
- Alt text deskriptif per gambar; nama berkas bermakna.
- OG image per halaman (`opengraph-image.tsx`).
- Validasi JSON-LD di Rich Results Test; data bisnis dibaca dari settings, bukan hard-code.
- `lang="id"`, `hreflang` tidak perlu sampai ada versi English.
- Lighthouse mobile ≥ 95; LCP < 2.0 s, CLS < 0.05, INP < 200 ms.

---

## 7. Checklist Off-Page

**Google Business Profile**
- [ ] Buat/klaim profil, verifikasi (kartu pos/telepon/video).
- [ ] Kategori utama: pilih yang paling dekat (mis. "Produsen makanan" / "Toko tempe") dan cek ketersediaan di GBP; tambahkan kategori sekunder.
- [ ] Isi nama persis "Tempe Mak Nuk", alamat, titik peta akurat, jam operasional, nomor telepon/WA, URL situs (tambahkan parameter UTM).
- [ ] Area layanan: Klaten, Solo Raya, Yogyakarta (sesuai kenyataan antar).
- [ ] Unggah foto asli (dapur, produk, proses, tim); tambah produk dan atribut (halal bila berlaku).
- [ ] Posting rutin (mingguan): info slot, resep baru.
- [ ] Minta ulasan dari pelanggan asli secara sukarela; balas semua ulasan. Dilarang membeli atau memalsukan ulasan.
- [ ] Aktifkan pesan/WhatsApp link.

**Google Search Console dan analitik**
- [ ] Verifikasi domain (DNS) dan kirim `sitemap.xml`.
- [ ] Cek laporan Pengindeksan, Core Web Vitals, dan Rich Results.
- [ ] Catat kueri nyata setelah 4 minggu, lalu perbarui peta keyword (isi volume/impresi dari data sendiri).
- [ ] Bing Webmaster Tools (opsional, impor dari GSC).
- [ ] Analitik hanya setelah consent (lihat PROMPT §5.4).

**NAP konsisten (Name, Address, Phone)**
- [ ] Satu format baku: nama, alamat lengkap (Jl., Desa, Kec., Kabupaten, kode pos), telepon/WA. Ambil dari Admin → Pengaturan.
- [ ] Samakan di situs, footer, GBP, Instagram, TikTok, Facebook, direktori, dan marketplace.
- [ ] Catat semua tempat listing di spreadsheet; perbarui serempak bila berubah.

**Direktori dan kanal lokal**
- [ ] Google Maps, Apple Maps (Business Connect), Bing Places.
- [ ] Direktori UMKM/Dinas Koperasi dan UKM Klaten, Dinas Perindustrian, sentra tempe.
- [ ] Portal halal: cantumkan di katalog produk halal resmi (BPJPH) bila memenuhi syarat.
- [ ] Marketplace/ojek makanan (GoFood, GrabFood, ShopeeFood, Tokopedia) bila ingin kanal tambahan, dengan NAP sama.
- [ ] Komunitas lokal: grup Facebook/WA Klaten, Solo, Jogja; kerjasama dengan komunitas MPASI/ibu, gym, katering lokal.
- [ ] Media lokal dan blog kuliner (liputan, bukan tautan berbayar).
- [ ] Backlink wajar: mitra katering, restoran pelanggan, dinas, universitas lokal (kerja sama riset/KKN); hindari PBN dan beli backlink.

**Media sosial**
- [ ] Instagram, TikTok, Facebook, YouTube: bio memuat nama, kota, dan tautan situs.
- [ ] Konsisten membagikan artikel dan resep; video pendek proses untuk YouTube Shorts/Reels.
- [ ] Tautkan akun di JSON-LD `sameAs`.

**Pemeliharaan**
- [ ] Tinjau peringkat dan kueri tiap bulan; segarkan artikel yang turun.
- [ ] Terbitkan konten baru (resep atau artikel) minimal 2 per bulan setelah rilis.
