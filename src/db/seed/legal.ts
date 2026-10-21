import { sql } from "drizzle-orm";

import { legalDocuments } from "../schema";
import type { LegalSlug } from "../schema/enums";
import { doc, type Tx } from "./rich";

const WARN =
  "**Dokumen contoh — perlu ditinjau ahli hukum.** Teks ini adalah draf awal dan belum menjadi nasihat hukum. Pemilik usaha wajib memeriksa dan menyesuaikannya sebelum dipakai secara resmi.";
const DATE = "Berlaku sejak: 1 Januari 2026 · Versi 1";
const WHO =
  "Pengendali data: **Usaha Tempe Mak Nuk** (merek dagang Tempe Mak Nuk), Jl. Raya Pedan No. 21, Dk. Kauman, Desa Kalangan, Kec. Pedan, Kabupaten Klaten, Jawa Tengah 57468. Email: halo@tempemaknuk.com. WhatsApp: +62 812-3456-7890. (Data identitas ini diambil dari Pengaturan situs dan dapat berubah.)";

const DOCS: { slug: LegalSlug; title: string; blocks: string[] }[] = [
  {
    slug: "privacy",
    title: "Kebijakan Privasi",
    blocks: [
      WARN,
      DATE,
      "Kebijakan ini menjelaskan bagaimana Tempe Mak Nuk mengumpulkan, menggunakan, dan melindungi data pribadi Anda, selaras dengan Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).",
      "## 1. Pengendali data",
      WHO,
      "## 2. Data yang kami kumpulkan",
      "- **Percakapan WhatsApp**: nama, nomor WhatsApp, area pengantaran, dan rincian pesanan yang Anda kirim sendiri saat memesan atau bertanya. Percakapan terjadi di WhatsApp dan tunduk pula pada kebijakan WhatsApp.",
      "- **Data pesanan pada Order Builder**: pilihan varian, bentuk, ukuran, jumlah, dan tanggal pakai disimpan sementara di peramban Anda (localStorage) sebagai draf agar tidak hilang. Data ini tidak dikirim ke server kami sampai Anda menekan tombol kirim ke WhatsApp.",
      "- **Statistik klik WhatsApp**: kami mencatat bahwa tombol pesan diklik (jenis tombol dan waktu) tanpa data pribadi, untuk mengetahui halaman mana yang membantu.",
      "- **Cookie dan data analitik**: cookie wajib selalu aktif. Cookie analitik dan pemasaran hanya aktif bila Anda setuju. Rinciannya ada di [Kebijakan Cookie](/kebijakan-cookie).",
      "- **Data teknis dasar**: alamat IP dan jenis peramban yang tercatat pada log server untuk keamanan dan pemeliharaan.",
      "## 3. Tujuan penggunaan",
      "- Memproses dan mengonfirmasi pesanan, slot, pembayaran, dan pengiriman.",
      "- Menjawab pertanyaan dan menyampaikan informasi terkait pesanan Anda.",
      "- Memahami penggunaan situs dan memperbaikinya (hanya dengan persetujuan untuk analitik).",
      "- Menjaga keamanan situs dan memenuhi kewajiban hukum.",
      "Dasar pemrosesan: pelaksanaan perjanjian atau permintaan Anda, persetujuan Anda, dan kepentingan sah kami yang tidak melanggar hak Anda.",
      "## 4. Berbagi data",
      "Kami tidak menjual data pribadi Anda. Data hanya dapat diakses penyedia layanan yang membantu operasional situs (misalnya hosting dan basis data) serta kurir atau layanan pengantaran sebatas yang perlu untuk mengantar pesanan, dan pihak berwenang bila diwajibkan hukum.",
      "## 5. Penyimpanan dan retensi",
      "- Percakapan pesanan: disimpan selama diperlukan untuk layanan dan pembukuan, umumnya hingga 24 bulan sejak pesanan terakhir, kecuali hukum mewajibkan lebih lama.",
      "- Catatan klik WhatsApp (tanpa data pribadi): hingga 24 bulan.",
      "- Pilihan cookie: 12 bulan atau hingga versi kebijakan berubah.",
      "- Setelah masa tersebut, data dihapus atau dianonimkan.",
      "## 6. Keamanan",
      "Kami menerapkan langkah wajar seperti koneksi terenkripsi (HTTPS), pembatasan akses, dan pengelolaan kata sandi yang aman. Tidak ada sistem yang sepenuhnya bebas risiko; bila terjadi kegagalan pelindungan data yang berdampak pada Anda, kami akan memberi tahu sesuai ketentuan UU PDP.",
      "## 7. Hak Anda sebagai subjek data",
      "Sesuai UU PDP, Anda berhak: mendapatkan informasi tentang pemrosesan data Anda; mengakses dan memperoleh salinan data; memperbaiki data yang keliru; menghapus atau mengakhiri pemrosesan data; menarik persetujuan; mengajukan keberatan; dan membatasi pemrosesan, sepanjang diatur dalam undang-undang. Kami akan menanggapi permintaan dalam jangka waktu wajar sesuai ketentuan.",
      "## 8. Anak-anak",
      "Situs ini ditujukan bagi orang dewasa. Kami tidak secara sengaja mengumpulkan data anak. Bila Anda memesan atas nama anak, pastikan Anda sebagai orang tua atau wali.",
      "## 9. Perubahan kebijakan",
      "Bila kebijakan berubah secara material, kami memperbarui nomor versi dan tanggal berlaku, dan bila perlu meminta persetujuan ulang.",
      "## 10. Kontak",
      "Untuk menggunakan hak Anda atau bertanya soal privasi, hubungi halo@tempemaknuk.com atau WhatsApp +62 812-3456-7890. Lihat juga [Kontak](/kontak).",
    ],
  },
  {
    slug: "terms",
    title: "Syarat dan Ketentuan",
    blocks: [
      WARN,
      DATE,
      "Dengan menggunakan situs tempemaknuk.com dan memesan lewat WhatsApp, Anda menyetujui syarat berikut.",
      "## 1. Tentang kami",
      WHO,
      "## 2. Penggunaan situs",
      "Konten situs, termasuk teks, foto, dan desain, adalah milik Tempe Mak Nuk atau dipakai dengan izin. Anda boleh membaca dan membagikan tautan, tetapi tidak boleh menyalin konten untuk tujuan komersial tanpa izin tertulis.",
      "## 3. Informasi produk",
      "Kami berupaya menampilkan informasi seakurat mungkin. Foto bersifat ilustrasi karena tempe adalah produk buatan tangan dan bentuk, warna, serta ukuran dapat sedikit berbeda antar-produksi. Informasi gizi bersumber dari data rujukan (misalnya TKPI Kemenkes RI) dan bukan hasil uji laboratorium produk kami. Informasi di situs adalah informasi umum, bukan nasihat medis.",
      "## 4. Pemesanan dan harga",
      'Pesanan dianggap sah setelah slot dan rincian dikonfirmasi lewat WhatsApp. Harga yang ditampilkan di situs bersifat "mulai dari"; harga final dikonfirmasi saat pemesanan. Aturan PO, pembayaran, dan pembatalan diatur dalam [Kebijakan Pemesanan](/kebijakan-pemesanan).',
      "## 5. Alergen",
      "Produk kami berbahan kedelai. Pelanggan bertanggung jawab memastikan produk sesuai kondisi kesehatan dan alergi masing-masing.",
      "## 6. Batasan tanggung jawab",
      "Sepanjang diizinkan hukum, kami tidak bertanggung jawab atas kerugian tidak langsung akibat penggunaan situs atau keterlambatan di luar kendali kami, misalnya cuaca, gangguan kurir, atau gangguan jaringan. Tanggung jawab kami atas produk yang bermasalah dibatasi pada penggantian atau pengembalian dana pesanan terkait, sesuai ketentuan perlindungan konsumen yang berlaku.",
      "## 7. Hukum yang berlaku",
      "Syarat ini tunduk pada hukum Republik Indonesia. Perselisihan diupayakan diselesaikan secara musyawarah terlebih dahulu.",
      "## 8. Perubahan",
      "Kami dapat memperbarui syarat ini. Versi dan tanggal berlaku dicantumkan di bagian atas.",
      "## 9. Kontak",
      "Pertanyaan: halo@tempemaknuk.com atau WhatsApp +62 812-3456-7890.",
    ],
  },
  {
    slug: "cookies",
    title: "Kebijakan Cookie",
    blocks: [
      WARN,
      DATE,
      "Cookie adalah berkas kecil yang disimpan peramban Anda. Kami memakainya secukupnya dan meminta persetujuan Anda untuk yang bersifat opsional.",
      "## Kategori cookie",
      "### Wajib (selalu aktif)",
      "Diperlukan agar situs berjalan: menyimpan pilihan consent Anda (cookie tmn_consent, 12 bulan), keamanan sesi, dan draf pesanan di peramban. Tanpa ini, situs tidak dapat berfungsi dengan benar, sehingga tidak memerlukan persetujuan.",
      "### Analitik (opsional)",
      "Membantu kami memahami halaman yang dibaca dan titik kesulitan pengunjung, dalam bentuk agregat. Aktif hanya bila Anda menyetujui. Layanan analitik tanpa cookie (cookieless) dapat dipakai sebagai default dan tetap dicantumkan di sini.",
      "### Pemasaran (opsional)",
      "Dipakai untuk mengukur iklan dan menampilkan konten relevan di platform lain. Saat ini belum ada skrip pemasaran aktif; bila ditambahkan, hanya dimuat setelah Anda setuju.",
      "## Mengelola pilihan",
      'Anda dapat mengubah pilihan kapan saja lewat tautan "Pengaturan cookie" di bagian bawah halaman, atau menghapus cookie lewat pengaturan peramban. Bila versi kebijakan berubah, kami akan menanyakan lagi.',
      "## Informasi lebih lanjut",
      "Lihat [Kebijakan Privasi](/kebijakan-privasi) untuk hak Anda atas data pribadi, atau hubungi halo@tempemaknuk.com.",
    ],
  },
  {
    slug: "ordering",
    title: "Kebijakan Pemesanan dan PO",
    blocks: [
      WARN,
      DATE,
      "Tempe Mak Nuk dibuat sesuai pesanan (pre-order, PO). Berikut aturannya.",
      "## 1. Lead time dan batas waktu",
      "- Lead time: **4 hari**. Contoh: tempe dipakai hari Selasa, PO paling lambat Jumat.",
      "- Batas waktu (cutoff): **pukul 15.00 WIB** pada hari terakhir pemesanan.",
      "- Produksi libur pada hari Minggu dan libur nasional. Chat tetap dibalas.",
      "## 2. Slot harian",
      "Kapasitas produksi terbatas per hari (default 8 pelanggan). Status slot di situs (Tersedia, Hampir penuh, Penuh, Libur) diperbarui manual; konfirmasi akhir via WhatsApp.",
      "## 3. Cara memesan",
      "Susun pesanan lewat [Custom Order](/custom-order) lalu kirim ke WhatsApp, atau chat langsung. Pesanan sah setelah kami mengonfirmasi slot, harga, dan jumlah.",
      "## 4. Pembayaran",
      "Metode: transfer bank, QRIS, atau tunai saat ambil di tempat. Rincian dan batas waktu pembayaran diinformasikan saat konfirmasi. Untuk pesanan besar atau custom, kami dapat meminta uang muka.",
      "## 5. Pengiriman dan pengambilan",
      "Ambil di tempat (gratis); antar Klaten kota (ongkir flat); Solo Raya dan Yogyakarta lewat kurir instan (ongkir sesuai aplikasi). Jam antar disepakati lewat WhatsApp.",
      "## 6. Perubahan dan pembatalan",
      "Perubahan atau pembatalan dapat dilakukan selama produksi belum dimulai, dengan menghubungi kami lewat WhatsApp sesegera mungkin. Setelah produksi dimulai, pesanan custom tidak dapat dibatalkan karena dibuat khusus; kami akan mencari solusi yang adil. Bila kami yang membatalkan, pembayaran dikembalikan penuh.",
      "## 7. Kesegaran dan penyimpanan",
      "Tempe kami tanpa pengawet sehingga kesegarannya terbatas. Mohon periksa pesanan saat diterima dan simpan sesuai panduan: dimasak dalam 1–2 hari pada suhu ruang, atau simpan di kulkas atau freezer. Kami tidak menjamin mutu bila penyimpanan tidak sesuai atau pesanan tidak segera diambil setelah siap. Baca [panduan penyimpanan](/jurnal/cara-menyimpan-tempe-tanpa-pengawet).",
      "## 8. Keluhan",
      "Bila ada masalah, kirim foto dan keterangan lewat WhatsApp dalam 24 jam setelah diterima. Kami akan menanggapi secara adil sesuai ketentuan perlindungan konsumen.",
      "## 9. Kontak",
      "WhatsApp +62 812-3456-7890 · halo@tempemaknuk.com.",
    ],
  },
];

export async function seedLegal(tx: Tx) {
  const effectiveAt = new Date("2026-01-01T00:00:00+07:00");
  await tx
    .insert(legalDocuments)
    .values(
      DOCS.map((d) => ({
        slug: d.slug,
        title: d.title,
        content: doc(d.blocks),
        version: 1,
        effectiveAt,
        status: "published" as const,
      })),
    )
    .onConflictDoUpdate({
      target: [legalDocuments.slug, legalDocuments.version],
      set: {
        title: sql`excluded.title`,
        content: sql`excluded.content`,
        effectiveAt: sql`excluded.effective_at`,
        status: sql`excluded.status`,
        updatedAt: sql`now()`,
      },
    });
  return DOCS.length;
}
