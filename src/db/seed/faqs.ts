import { sql } from "drizzle-orm";

import { categories, faqs } from "../schema";
import { stableId, type Tx } from "./rich";

const CATS = [
  ["produk", "Produk"],
  ["pemesanan-po", "Pemesanan & PO"],
  ["pengiriman", "Pengiriman"],
  ["penyimpanan", "Penyimpanan"],
  ["halal-kualitas", "Halal & Kualitas"],
  ["kemitraan", "Kemitraan"],
] as const;

type F = [cat: (typeof CATS)[number][0], q: string, a: string, home?: boolean];

const FAQS: F[] = [
  ["produk", "Apa beda Tempe Klasik dan Tempe Original Tanpa Kulit?", "Tempe Klasik dibuat dari kedelai dengan kulit ari, teksturnya lebih berserat dan rasanya gurih tegas. Tempe Original Tanpa Kulit dibuat dari kedelai yang dikupas bersih, sehingga lebih putih, padat, lembut, dan minim langu. Bahannya sama: kedelai, air, ragi. Baca perbandingan lengkap di artikel Beda Tempe dengan dan Tanpa Kulit Ari.", true],
  ["produk", "Apa saja bahan tempe Mak Nuk?", "Hanya tiga: kedelai, air, dan ragi. Tidak ada pengawet dan tidak ada bahan kimia tambahan.", true],
  ["produk", "Bentuk dan ukuran apa saja yang tersedia?", "Bentuk: balok klasik, lembaran tipis (mendoan/keripik), silinder (lontong), bungkus daun bulat, mini/dadu, atau custom. Ukuran: kecil (±100 g), sedang (±250 g), besar (±500 g), jumbo katering (±1 kg), atau dimensi custom."],
  ["produk", "Apakah ada minimum order?", "Tidak ada minimum order. Anda bisa memesan satu blok kecil sampai jumlah besar untuk katering. Cukup perhatikan aturan PO dan slot harian.", true],
  ["produk", "Berapa harga tempe Mak Nuk?", "Harga mulai dari Rp 5.000 untuk Tempe Klasik dan Rp 7.000 untuk Tempe Original Tanpa Kulit per balok sedang. Harga final bergantung bentuk, ukuran, dan jumlah, dan dikonfirmasi lewat WhatsApp."],
  ["produk", "Apa kemasan yang dipakai?", "Daun pisang (tradisional), plastik food-grade berlubang, atau kombinasi daun dan plastik. Sebutkan pilihan Anda saat memesan."],
  ["produk", "Apakah tempe ini cocok untuk MPASI?", "Banyak orang tua memilih varian tanpa kulit karena teksturnya lebih lembut. Namun usia mulai, porsi, dan pengenalan kedelai (alergen) sebaiknya dikonsultasikan dengan dokter anak atau ahli gizi. Lihat artikel Tempe untuk MPASI untuk hal-hal yang perlu diperhatikan."],
  ["pemesanan-po", "Kenapa harus PO?", "Tempe adalah hasil fermentasi yang butuh waktu, dan dapur kami kecil dengan kapasitas harian terbatas. Dengan PO, tempe dibuat sesuai pesanan dan tiba segar, tanpa pengawet untuk menahannya.", true],
  ["pemesanan-po", "Berapa lead time pemesanan?", "Lead time 4 hari. Misalnya tempe dipakai hari Selasa, PO paling lambat Jumat pukul 15.00 WIB.", true],
  ["pemesanan-po", "Bagaimana cara memesan?", "Buka halaman Custom Order, pilih varian, bentuk, ukuran, jumlah, dan tanggal pakai. Pesanan tersusun rapi dan terkirim ke WhatsApp Mak Nuk, lalu kami konfirmasi slot dan pembayaran.", true],
  ["pemesanan-po", "Bagaimana cara mengecek slot yang tersedia?", "Lihat kalender slot di halaman Cara Pesan. Statusnya Tersedia, Hampir penuh, Penuh, atau Libur. Status diperbarui manual, jadi konfirmasi akhir tetap lewat WhatsApp."],
  ["pemesanan-po", "Bisakah saya membatalkan atau mengubah pesanan?", "Bisa, selama produksi belum dimulai. Hubungi kami lewat WhatsApp sesegera mungkin. Ketentuan lengkap ada di Kebijakan Pemesanan."],
  ["pemesanan-po", "Metode pembayaran apa yang diterima?", "Transfer bank, QRIS, atau tunai saat ambil di tempat. Rincian pembayaran dikirim setelah slot dikonfirmasi."],
  ["pengiriman", "Apakah tempe bisa dikirim?", "Bisa. Kami melayani ambil di tempat (gratis), antar Klaten kota (ongkir flat), serta Solo Raya dan Yogyakarta lewat kurir instan (ongkir sesuai aplikasi).", true],
  ["pengiriman", "Apakah bisa dikirim ke luar Jawa atau luar kota lain?", "Saat ini kami hanya melayani area di atas karena tempe tanpa pengawet harus tiba segar. Untuk kebutuhan lain, tanyakan lewat WhatsApp."],
  ["pengiriman", "Di mana lokasi pengambilan?", "Di dapur produksi kami di Jl. Raya Pedan No. 21, Desa Kalangan, Kec. Pedan, Klaten. Mohon chat dulu untuk memastikan pesanan siap sebelum datang."],
  ["pengiriman", "Jam berapa pesanan dikirim?", "Jam antar disepakati lewat WhatsApp saat konfirmasi, menyesuaikan jam produksi (Senin–Sabtu 06.00–16.00 WIB)."],
  ["penyimpanan", "Tempe tahan berapa lama?", "Tanpa pengawet, tempe segar paling enak dimasak dalam 1–2 hari pada suhu ruang. Di kulkas dan freezer bisa lebih lama, tergantung kondisi. Lihat panduan lengkap di artikel Cara Menyimpan Tempe Tanpa Pengawet."],
  ["penyimpanan", "Bolehkah tempe dibekukan?", "Boleh. Iris sesuai kebutuhan, bungkus rapat per porsi, dan cairkan di kulkas sebelum dimasak. Jangan membekukan ulang tempe yang sudah dicairkan."],
  ["penyimpanan", "Bagaimana tanda tempe sudah tidak layak?", "Berlendir, berair, berbau menyengat seperti amonia atau busuk, atau muncul jamur berwarna lain seperti merah muda atau hijau. Bila ragu, sebaiknya dibuang."],
  ["halal-kualitas", "Apakah tempe Mak Nuk bersertifikat halal?", "Ya. Nomor sertifikat halal BPJPH tercantum di halaman Halal dan Kualitas, dan Anda bisa memverifikasinya langsung di situs resmi BPJPH.", true],
  ["halal-kualitas", "Apakah memakai pengawet atau pewarna?", "Tidak. Bahan kami hanya kedelai, air, dan ragi."],
  ["halal-kualitas", "Bagaimana standar kebersihan produksi?", "Kedelai dicuci berulang, peralatan dibersihkan sebelum dan sesudah produksi, dan proses dikerjakan di dapur khusus. Gambaran prosesnya ada di halaman Proses."],
  ["halal-kualitas", "Apakah tempe ini mengandung alergen?", "Ya, tempe berbahan kedelai, yang termasuk alergen makanan. Bila Anda atau anak Anda alergi kedelai, jangan mengonsumsinya dan konsultasikan dengan tenaga kesehatan."],
  ["kemitraan", "Apakah melayani katering, restoran, dan reseller?", "Ya. Kami menerima pasokan rutin untuk katering, restoran, kantor, dan reseller dengan ukuran seragam dan jadwal tetap. Hubungi kami lewat halaman Kemitraan.", true],
  ["kemitraan", "Bagaimana jadwal pengiriman rutin diatur?", "Kita tentukan hari, jam, dan jumlah mingguan saat berdiskusi. Kami akan menyesuaikan jadwal produksi, sambil tetap mengikuti aturan lead time."],
  ["kemitraan", "Apakah bisa custom bentuk dan ukuran untuk bisnis?", "Bisa. Potongan dadu, lembaran tipis, atau ukuran jumbo dapat disesuaikan dengan kebutuhan dapur Anda, tanpa minimum order."],
];

export async function seedFaqs(tx: Tx) {
  const cats = await tx
    .insert(categories)
    .values(CATS.map(([slug, name], sort) => ({ kind: "faq" as const, slug, name, sort })))
    .onConflictDoUpdate({
      target: [categories.kind, categories.slug],
      set: { name: sql`excluded.name`, sort: sql`excluded.sort`, updatedAt: sql`now()` },
    })
    .returning({ id: categories.id, slug: categories.slug });

  // faqs have no natural unique key: deterministic ids from the question text.
  const rows = FAQS.map(([cat, question, answer, home], sort) => ({
    id: stableId(`faq:${question}`),
    question,
    answer,
    categoryId: cats.find((c) => c.slug === cat)!.id,
    sort,
    visible: true,
    showOnHome: !!home,
  }));
  await tx
    .insert(faqs)
    .values(rows)
    .onConflictDoUpdate({
      target: faqs.id,
      set: {
        answer: sql`excluded.answer`,
        categoryId: sql`excluded.category_id`,
        sort: sql`excluded.sort`,
        visible: sql`excluded.visible`,
        showOnHome: sql`excluded.show_on_home`,
        updatedAt: sql`now()`,
      },
    });
  return { faqs: rows.length, home: rows.filter((r) => r.showOnHome).length };
}
