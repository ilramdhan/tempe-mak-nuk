import { and, eq, notInArray, sql } from "drizzle-orm";

import { pageSections, pages } from "../schema";
import { doc, stableId, type Tx } from "./rich";

/**
 * NOTE FOR ORCHESTRATOR: src/features/pages/blocks did not exist when this was written, so each
 * section's `data` is a plain object using the agreed type names. Validate/adjust field names
 * against the final Zod block schemas (hero, richText, featureGrid, compare, steps, stats, cta,
 * faqList, testimonialList, gallery, productTeaser, slotCalendarPreview, recipeTeaser,
 * postTeaser, trustStrip, split) and re-run `pnpm db:seed`.
 */
type Section = { type: string; data: Record<string, unknown>; visible?: boolean };
type PageSeed = { slug: string; title: string; seoTitle: string; seoDescription: string; sections: Section[] };

const WA = { label: "Cek slot via WhatsApp", href: "/custom-order" };
const closing = (headline: string, body: string): Section => ({
  type: "cta",
  data: { headline, body, primary: WA, secondary: { label: "Cara pesan", href: "/cara-pesan" } },
});
const rt = (blocks: string[]): Section => ({ type: "richText", data: { content: doc(blocks) } });

const TRUST = {
  type: "trustStrip",
  data: {
    items: [
      { icon: "badge-check", label: "Bersertifikat Halal BPJPH" },
      { icon: "calendar", label: "Sejak 2001" },
      { icon: "leaf", label: "Tanpa pengawet" },
      { icon: "package", label: "Tanpa minimum order" },
    ],
  },
} satisfies Section;

const PAGES: PageSeed[] = [
  {
    slug: "home",
    title: "Beranda",
    seoTitle: "Tempe Klaten Handmade Sejak 2001 — Tempe Mak Nuk",
    seoDescription: "Tempe handmade dari Klaten sejak 2001. Tanpa pengawet, bersertifikat halal, bisa custom bentuk tanpa minimum order. Cek slot dan PO via WhatsApp.",
    sections: [
      { type: "hero", data: {
        eyebrow: "Tempe handmade · Klaten · sejak 2001",
        headline: "Tiga bahan, tanpa jalan pintas.",
        subheadline: "Kedelai, air, dan ragi — difermentasi pelan oleh tangan yang sama sejak 2001. Tanpa pengawet, tanpa bahan kimia.",
        primaryCta: WA, secondaryCta: { label: "Lihat dua varian", href: "/produk" },
        image: null,
      } },
      TRUST,
      { type: "productTeaser", data: {
        heading: "Dua varian, satu cara membuat",
        intro: "Pilih yang paling cocok dengan masakan Anda. Keduanya bisa dipesan dalam bentuk dan ukuran bebas.",
        productSlugs: ["tempe-klasik", "tempe-original-tanpa-kulit"], ctaLabel: "Pilih varian ini",
      } },
      { type: "featureGrid", data: {
        heading: "Kenapa Mak Nuk",
        items: [
          { icon: "hand", title: "Dibuat dengan tangan", body: "Dari sortir sampai bungkus, dikerjakan manual di satu dapur rumahan di Pedan, Klaten." },
          { icon: "leaf", title: "Hanya tiga bahan", body: "Kedelai, air, dan ragi. Tanpa pengawet, tanpa bahan kimia tambahan." },
          { icon: "shapes", title: "Bentuk dan ukuran bebas", body: "Dari dadu kecil sampai balok jumbo. Tanpa minimum order." },
          { icon: "badge-check", title: "Halal dan higienis", body: "Bersertifikat halal BPJPH. Nomor sertifikat bisa Anda cek langsung di situs resmi." },
        ],
      } },
      { type: "steps", data: {
        heading: "Dari kedelai ke tempe",
        intro: "Prosesnya tidak bisa diburu. Itu sebabnya setiap hari jumlahnya terbatas.",
        items: [
          { title: "Sortir dan cuci", body: "Kedelai dipilih dan dicuci bersih." },
          { title: "Rebus dan kupas", body: "Direbus, lalu untuk varian Original dikupas satu per satu." },
          { title: "Ragi dan bungkus", body: "Diberi ragi secukupnya, lalu dibungkus." },
          { title: "Fermentasi pelan", body: "Dibiarkan bekerja sendiri sampai miselium putih menyatukan semuanya." },
        ],
        cta: { label: "Lihat proses lengkap", href: "/proses" },
      } },
      { type: "steps", data: {
        heading: "Cara pesan, empat langkah",
        intro: "Tempe dibuat sesuai pesanan. PO paling lambat 4 hari sebelum tanggal pakai, sebelum pukul 15.00 WIB.",
        items: [
          { title: "Susun pesanan", body: "Pilih varian, bentuk, ukuran, dan tanggal pakai di Custom Order." },
          { title: "Kirim ke WhatsApp", body: "Pesan tersusun rapi dan langsung terkirim ke Mak Nuk." },
          { title: "Konfirmasi slot", body: "Kami cek kapasitas dan kirim rincian pembayaran." },
          { title: "Terima tempe segar", body: "Ambil di tempat, atau diantar ke Klaten, Solo Raya, dan Yogyakarta." },
        ],
        cta: { label: "Aturan PO lengkap", href: "/cara-pesan" },
      } },
      { type: "slotCalendarPreview", data: {
        heading: "Tempe yang layak ditunggu",
        intro: "Status slot diperbarui manual. Konfirmasi akhir via WhatsApp.",
        days: 14, cta: WA,
      } },
      { type: "featureGrid", data: {
        heading: "Cocok untuk siapa",
        items: [
          { icon: "home", title: "Rumah tangga", body: "Lauk harian yang segar, ukuran sesuai kebutuhan keluarga." },
          { icon: "baby", title: "Keluarga dengan anak kecil", body: "Varian tanpa kulit bertekstur lembut. Konsultasikan MPASI dengan tenaga kesehatan." },
          { icon: "dumbbell", title: "Pencinta protein nabati", body: "Tempe adalah sumber protein nabati lokal (TKPI Kemenkes)." },
          { icon: "utensils", title: "Katering dan restoran", body: "Ukuran seragam, jadwal rutin, bisa custom." },
        ],
      } },
      { type: "testimonialList", data: { heading: "Kata pelanggan", limit: 3 } },
      { type: "recipeTeaser", data: { heading: "Resep pilihan", limit: 3, cta: { label: "Lihat semua resep", href: "/resep" } } },
      { type: "postTeaser", data: { heading: "Dari Jurnal", limit: 3, cta: { label: "Baca selengkapnya", href: "/jurnal" } } },
      { type: "faqList", data: { heading: "Pertanyaan singkat", source: "home", cta: { label: "Semua FAQ", href: "/faq" } } },
      closing("Monggo, pilih tanggalnya.", "Chat dulu untuk cek slot. Kami balas di jam kerja, Senin–Sabtu 06.00–16.00 WIB."),
    ],
  },
  {
    slug: "produk",
    title: "Produk",
    seoTitle: "Jenis Tempe: Klasik dan Tanpa Kulit — Tempe Mak Nuk",
    seoDescription: "Kenali dua varian Tempe Mak Nuk: Klasik dengan kulit ari dan Original Tanpa Kulit yang lebih putih dan padat. Pilih bentuk dan ukuran sesuai kebutuhan.",
    sections: [
      { type: "hero", data: { eyebrow: "Produk", headline: "Dua varian tempe, satu dapur.", subheadline: "Klasik dengan kulit ari, atau Original Tanpa Kulit yang dikupas bersih. Bahannya sama: kedelai, air, ragi.", primaryCta: WA, secondaryCta: null, image: null } },
      { type: "productTeaser", data: { heading: "Pilih varian", intro: null, productSlugs: ["tempe-klasik", "tempe-original-tanpa-kulit"], ctaLabel: "Pilih varian ini" } },
      { type: "compare", data: {
        heading: "Klasik atau Original Tanpa Kulit?",
        columns: ["Tempe Klasik", "Tempe Original Tanpa Kulit"],
        rows: [
          { label: "Kedelai", values: ["Dengan kulit ari", "Dikupas bersih satu per satu"] },
          { label: "Tampilan", values: ["Sedikit bertotol", "Putih bersih"] },
          { label: "Tekstur", values: ["Berserat, mantap digigit", "Padat dan lembut"] },
          { label: "Rasa", values: ["Gurih, aroma kedelai terasa", "Bersih, minim langu"] },
          { label: "Cocok untuk", values: ["Bacem, penyet, orek, sambal goreng", "Mendoan, keripik, tim, katering"] },
          { label: "Harga mulai dari (balok sedang)", values: ["Rp 5.000", "Rp 7.000"] },
        ],
      } },
      { type: "featureGrid", data: {
        heading: "Bentuk dan ukuran",
        items: [
          { icon: "square", title: "Bentuk", body: "Balok klasik, lembaran tipis, silinder, bungkus daun bulat, mini/dadu, atau custom." },
          { icon: "ruler", title: "Ukuran", body: "Kecil ±100 g, sedang ±250 g, besar ±500 g, jumbo katering ±1 kg, atau dimensi custom." },
          { icon: "package", title: "Kemasan", body: "Daun pisang, plastik food-grade berlubang, atau kombinasi daun dan plastik." },
        ],
      } },
      { type: "postTeaser", data: { heading: "Masih bingung memilih?", slugs: ["beda-tempe-dengan-dan-tanpa-kulit-ari"], limit: 1, cta: { label: "Baca perbandingan lengkap", href: "/jurnal/beda-tempe-dengan-dan-tanpa-kulit-ari" } } },
      { type: "faqList", data: { heading: "Soal produk", category: "produk" } },
      closing("Belum yakin? Coba ukuran kecil.", "Tidak ada minimum order. Pesan dua varian dan bandingkan sendiri."),
    ],
  },
  {
    slug: "custom-order",
    title: "Custom Order",
    seoTitle: "Pesan Tempe Custom, Tanpa Minimal Order — Tempe Mak Nuk",
    seoDescription: "Pilih varian, bentuk, ukuran, jumlah, dan tanggal pakai. Tanpa minimum order. Pesanan tersusun rapi dan langsung terkirim ke WhatsApp Mak Nuk.",
    sections: [
      { type: "hero", data: { eyebrow: "Custom Order", headline: "Susun pesanan Anda, kami yang rapikan.", subheadline: "Pilih varian, bentuk, ukuran, jumlah, dan tanggal pakai. Hasilnya langsung jadi pesan WhatsApp untuk Mak Nuk.", primaryCta: null, secondaryCta: null, image: null } },
      rt([
        "## Sebelum memesan",
        "- PO paling lambat 4 hari sebelum tanggal pakai, sebelum pukul 15.00 WIB.",
        "- Tanggal yang penuh atau lewat batas akan dinonaktifkan otomatis, lengkap dengan penjelasannya.",
        "- Konfirmasi akhir slot dan harga selalu lewat WhatsApp.",
        "Butuh bentuk khusus yang tidak ada di daftar? Pilih **Custom request** dan ceritakan di catatan. Lihat juga [Cara Pesan](/cara-pesan), [produk](/produk), atau [kemitraan](/kemitraan) untuk katering dan reseller.",
      ]),
      { type: "slotCalendarPreview", data: { heading: "Cek slot", intro: "Status diperbarui manual.", days: 14, cta: null } },
      { type: "faqList", data: { heading: "Soal pemesanan", category: "pemesanan-po" } },
    ],
  },
  {
    slug: "cara-pesan",
    title: "Cara Pesan",
    seoTitle: "Cara Pesan dan PO Tempe, Cek Slot — Tempe Mak Nuk",
    seoDescription: "Cara pesan tempe Mak Nuk dalam 4 langkah. Aturan PO, batas waktu pesan, kalender slot, antar Klaten, Solo, Jogja atau ambil di tempat.",
    sections: [
      { type: "hero", data: { eyebrow: "Cara pesan", headline: "Tempe yang layak ditunggu.", subheadline: "Tempe dibuat sesuai pesanan. Pesan 4 hari sebelumnya, dan kami siapkan dengan sabar.", primaryCta: WA, secondaryCta: null, image: null } },
      { type: "steps", data: {
        heading: "Empat langkah",
        intro: null,
        items: [
          { title: "Susun pesanan", body: "Pakai Custom Order, atau chat langsung." },
          { title: "Kirim ke WhatsApp", body: "Pesan tersusun rapi dan terkirim ke Mak Nuk." },
          { title: "Konfirmasi dan bayar", body: "Kami konfirmasi slot dan kirim rincian pembayaran: transfer bank, QRIS, atau tunai saat ambil." },
          { title: "Terima pesanan", body: "Ambil di Pedan (gratis), antar Klaten kota (ongkir flat), atau kurir instan ke Solo Raya dan Yogyakarta." },
        ],
        cta: null,
      } },
      { type: "compare", data: {
        heading: "Aturan PO: dipakai hari apa, PO paling lambat kapan",
        columns: ["Dipakai hari", "PO paling lambat (pukul 15.00 WIB)"],
        rows: [
          { label: "Senin", values: ["Senin", "Kamis minggu sebelumnya"] },
          { label: "Selasa", values: ["Selasa", "Jumat minggu sebelumnya"] },
          { label: "Rabu", values: ["Rabu", "Sabtu minggu sebelumnya"] },
          { label: "Kamis", values: ["Kamis", "Senin"] },
          { label: "Jumat", values: ["Jumat", "Selasa"] },
          { label: "Sabtu", values: ["Sabtu", "Rabu"] },
        ],
      } },
      rt([
        "Aturan di atas memakai lead time 4 hari. Hari Minggu dan libur nasional produksi libur, jadi hitungannya bisa bergeser. Kalender di bawah selalu lebih akurat dan Custom Order akan memberi tahu bila tanggal Anda tidak memungkinkan.",
        "Ingin tahu alasannya? Baca [Kenapa harus PO tempe](/jurnal/kenapa-harus-po-tempe). Ketentuan lengkap ada di [Kebijakan Pemesanan](/kebijakan-pemesanan).",
      ]),
      { type: "slotCalendarPreview", data: { heading: "Kalender slot", intro: "Status diperbarui manual. Konfirmasi akhir via WhatsApp.", days: 21, cta: null } },
      { type: "faqList", data: { heading: "Pemesanan dan pengiriman", category: "pemesanan-po" } },
      closing("Siap memesan?", "Susun pesanan Anda, atau tanya dulu lewat WhatsApp."),
    ],
  },
  {
    slug: "kemitraan",
    title: "Kemitraan",
    seoTitle: "Supplier Tempe Katering Klaten, Solo — Tempe Mak Nuk",
    seoDescription: "Pasok tempe handmade untuk katering, restoran, kantor, dan reseller. Ukuran seragam, jadwal rutin, bisa custom. Hubungi Mak Nuk via WhatsApp.",
    sections: [
      { type: "hero", data: { eyebrow: "Kemitraan", headline: "Tempe handmade untuk dapur yang butuh konsisten.", subheadline: "Katering, restoran, kantor, dan reseller: ukuran seragam, jadwal rutin, bentuk sesuai kebutuhan.", primaryCta: { label: "Ajukan kerja sama", href: "/custom-order" }, secondaryCta: null, image: null } },
      { type: "featureGrid", data: {
        heading: "Yang bisa kami bantu",
        items: [
          { icon: "ruler", title: "Ukuran seragam", body: "Potongan dadu, lembaran, atau balok dengan ketebalan konsisten agar matangnya seragam." },
          { icon: "calendar", title: "Jadwal rutin", body: "Hari, jam, dan jumlah mingguan disepakati bersama." },
          { icon: "shapes", title: "Custom tanpa minimum order", body: "Mulai dari jumlah kecil untuk uji menu, sampai jumbo ±1 kg." },
          { icon: "badge-check", title: "Halal dan higienis", body: "Bersertifikat halal BPJPH, hanya kedelai, air, ragi." },
        ],
      } },
      { type: "steps", data: { heading: "Cara mulai", intro: null, items: [
        { title: "Ceritakan kebutuhan", body: "Menu, jumlah, dan frekuensi." },
        { title: "Coba contoh", body: "Pesan jumlah kecil untuk uji rasa dan ukuran." },
        { title: "Sepakati jadwal", body: "Kami atur kapasitas dan jadwal rutin." },
        { title: "Berjalan rutin", body: "Tempe tiba segar sesuai jadwal." },
      ], cta: null } },
      { type: "postTeaser", data: { heading: "Ide menu", slugs: ["ide-menu-katering-dari-tempe"], limit: 1, cta: { label: "Baca ide menu katering", href: "/jurnal/ide-menu-katering-dari-tempe" } } },
      { type: "faqList", data: { heading: "Soal kemitraan", category: "kemitraan" } },
      closing("Mari bicara kebutuhan dapur Anda.", "Kirim kebutuhan Anda lewat WhatsApp, kami balas di jam kerja."),
    ],
  },
  {
    slug: "proses",
    title: "Proses Pembuatan",
    seoTitle: "Cara Membuat Tempe Tradisional, 6 Langkah — Mak Nuk",
    seoDescription: "Dari sortir kedelai, kupas, rebus, ragi, bungkus, sampai fermentasi: lihat proses tempe handmade Mak Nuk di Klaten, langkah demi langkah.",
    sections: [
      { type: "hero", data: { eyebrow: "Proses", headline: "Cara kami membuat tempe.", subheadline: "Enam langkah, semuanya dengan tangan. Tidak ada yang dipercepat.", primaryCta: null, secondaryCta: null, image: null } },
      { type: "steps", data: { heading: "Dari kedelai sampai tempe", intro: null, items: [
        { title: "1. Sortir dan cuci", body: "Kedelai dipilih, kotoran dan biji rusak dibuang, lalu dicuci bersih." },
        { title: "2. Rendam dan kupas", body: "Kedelai direndam. Untuk varian Original, kulit ari dikupas satu per satu dan dicuci berulang." },
        { title: "3. Rebus", body: "Direbus sampai matang, lalu ditiriskan dan didinginkan hingga hangat-hangat kuku." },
        { title: "4. Beri ragi", body: "Ragi disebar secukupnya dan diaduk rata." },
        { title: "5. Bungkus", body: "Dibungkus daun pisang atau plastik berlubang, sesuai pesanan." },
        { title: "6. Fermentasi", body: "Dibiarkan sampai miselium putih menyatukan seluruh biji. Waktunya bergantung suhu dan kelembapan." },
      ], cta: null } },
      rt([
        "## Kenapa tidak bisa dipercepat",
        "Fermentasi dikerjakan oleh jamur yang butuh waktu, suhu, dan kelembapan yang tepat. Memaksa lebih cepat berarti mengorbankan rasa dan tekstur. Itu pula alasan kami memakai sistem [PO](/cara-pesan).",
        "Ingin tahu lebih dalam? Baca [Mengenal ragi tempe](/jurnal/mengenal-ragi-tempe) dan [Sejarah tempe di Jawa Tengah](/jurnal/sejarah-tempe-di-jawa-tengah). Bahan dan kehalalan dijelaskan di [Halal dan Kualitas](/halal-kualitas).",
      ]),
      { type: "gallery", data: { heading: "Di dapur Mak Nuk", items: [], note: "Foto proses menyusul (lihat docs/photo-brief.md)." } },
      closing("Cicipi hasilnya.", "Lihat dua varian dan pilih yang pas untuk dapur Anda."),
    ],
  },
  {
    slug: "manfaat-tempe",
    title: "Manfaat Tempe",
    seoTitle: "Manfaat dan Kandungan Gizi Tempe — Tempe Mak Nuk",
    seoDescription: "Manfaat dan gizi tempe berdasarkan sumber TKPI Kemenkes dan USDA: protein, serat, hasil fermentasi. Informasi umum, bukan nasihat medis.",
    sections: [
      { type: "hero", data: { eyebrow: "Manfaat tempe", headline: "Protein nabati lokal, dari fermentasi.", subheadline: "Gizi tempe menurut sumber resmi. Informasi umum, bukan nasihat medis.", primaryCta: null, secondaryCta: null, image: null } },
      { type: "stats", data: {
        heading: "Gizi tempe kedelai murni per 100 g",
        source: "TKPI 2019 (Kemenkes RI). Nilai rujukan umum, bukan uji laboratorium produk Mak Nuk.",
        items: [
          { value: "201", unit: "kkal", label: "Energi" },
          { value: "20,8", unit: "g", label: "Protein" },
          { value: "8,8", unit: "g", label: "Lemak" },
          { value: "13,5", unit: "g", label: "Karbohidrat" },
          { value: "1,4", unit: "g", label: "Serat" },
          { value: "155", unit: "mg", label: "Kalsium" },
          { value: "4", unit: "mg", label: "Zat besi" },
        ],
      } },
      rt([
        "## Yang bisa kita katakan dengan jujur",
        "Tempe berbahan kedelai adalah sumber protein nabati. Selama fermentasi, jamur mengubah sebagian komponen kedelai sehingga tekstur dan rasanya berbeda dari kedelai rebus. Tabel Komposisi Pangan Indonesia (TKPI) mencatat angka gizinya, dan Anda bisa memeriksanya sendiri.",
        "## Yang tidak kami klaim",
        "Kami tidak mengklaim tempe menyembuhkan atau mencegah penyakit tertentu. Kebutuhan gizi tiap orang berbeda; untuk kondisi kesehatan tertentu, konsultasikan dengan dokter atau ahli gizi.",
        "## Bacaan lanjutan",
        "- [Tempe vs daging: membaca angka protein](/jurnal/tempe-vs-daging-perbandingan-protein)",
        "- [Tempe untuk MPASI](/jurnal/tempe-untuk-mpasi)",
        "- [Resep tempe](/resep) dan [dua varian kami](/produk)",
      ]),
      { type: "faqList", data: { heading: "Pertanyaan umum", source: "home" } },
    ],
  },
  {
    slug: "halal-kualitas",
    title: "Halal dan Kualitas",
    seoTitle: "Tempe Halal Bersertifikat BPJPH — Tempe Mak Nuk",
    seoDescription: "Sertifikat halal BPJPH Tempe Mak Nuk, standar higienis, dan bahan: hanya kedelai, air, ragi. Cek nomor sertifikat langsung di situs resmi.",
    sections: [
      { type: "hero", data: { eyebrow: "Halal dan kualitas", headline: "Bisa dicek, bukan hanya diklaim.", subheadline: "Nomor sertifikat halal kami tercantum, dan Anda bisa memverifikasinya langsung di situs BPJPH.", primaryCta: { label: "Cek sertifikat di BPJPH", href: "https://bpjph.halal.go.id/search/sertifikat" }, secondaryCta: null, image: null } },
      { type: "split", data: {
        heading: "Sertifikat halal",
        body: "Nomor sertifikat, penerbit, dan tanggal terbit diambil dari Pengaturan situs. Verifikasi selalu lewat situs resmi BPJPH.",
        facts: [
          { label: "Nomor", settingKey: "halal.number" },
          { label: "Penerbit", settingKey: "halal.issuer" },
          { label: "Diterbitkan", settingKey: "halal.issuedAt" },
          { label: "NIB", settingKey: "legal.nib" },
          { label: "P-IRT", settingKey: "legal.pirt" },
        ],
        cta: { label: "Cek sertifikat di BPJPH", href: "https://bpjph.halal.go.id/search/sertifikat" },
        image: null, imagePosition: "right",
      } },
      { type: "featureGrid", data: { heading: "Bahan dan kebersihan", items: [
        { icon: "leaf", title: "Tiga bahan", body: "Kedelai, air, dan ragi. Tanpa pengawet, tanpa pewarna." },
        { icon: "droplets", title: "Dicuci berulang", body: "Kedelai dicuci beberapa kali sebelum direbus." },
        { icon: "sparkles", title: "Peralatan bersih", body: "Peralatan dibersihkan sebelum dan sesudah produksi." },
        { icon: "alert-triangle", title: "Informasi alergen", body: "Berbahan kedelai. Jangan dikonsumsi bila alergi kedelai." },
      ] } },
      { type: "faqList", data: { heading: "Soal halal dan kualitas", category: "halal-kualitas" } },
      closing("Pesan dengan tenang.", "Ada pertanyaan soal bahan atau sertifikat? Tanyakan lewat WhatsApp."),
    ],
  },
  {
    slug: "tentang",
    title: "Tentang Mak Nuk",
    seoTitle: "Tentang Mak Nuk, Pembuat Tempe Klaten Sejak 2001",
    seoDescription: "Sejak 2001 Mak Nuk membuat tempe di dapur rumah di Pedan, Klaten. Resep, tangan, dan kesabaran yang sama, kini diteruskan anak-anaknya.",
    sections: [
      { type: "hero", data: { eyebrow: "Tentang", headline: "Dari dapur Mak, tanpa jalan pintas.", subheadline: "Cerita tempe yang dibuat dengan resep dan tangan yang sama sejak 2001.", primaryCta: null, secondaryCta: null, image: null } },
      rt([
        "Sejak 2001, Mak Nuk membuat tempe di dapur rumahnya di Pedan, Klaten, awalnya hanya untuk tetangga dan warung sekitar.",
        "Resepnya tidak pernah berubah: kedelai pilihan, air bersih, ragi, dan kesabaran menunggu fermentasi.",
        "Ketika pelanggan meminta tempe yang lebih bersih untuk MPASI anak, lahirlah varian tanpa kulit ari yang dikupas satu per satu.",
        "Hari ini, anak-anak Mak Nuk meneruskan dapur yang sama dengan tangan yang sama, tanpa pengawet, tanpa jalan pintas.",
      ]),
      { type: "stats", data: { heading: "Dalam angka", source: null, items: [
        { value: "2001", unit: "", label: "Mulai membuat tempe" },
        { value: "3", unit: "bahan", label: "Kedelai, air, ragi" },
        { value: "2", unit: "varian", label: "Klasik dan Original Tanpa Kulit" },
      ] } },
      { type: "featureGrid", data: { heading: "Yang kami pegang", items: [
        { icon: "clock", title: "Sabar", body: "Fermentasi tidak bisa diburu, maka kami tidak memburunya." },
        { icon: "eye", title: "Jujur", body: "Bahan bisa disebut satu per satu. Klaim kami bisa dicek." },
        { icon: "heart-handshake", title: "Hangat", body: "Pelanggan dilayani seperti tetangga, lewat chat yang dibalas langsung." },
      ] } },
      { type: "postTeaser", data: { heading: "Cerita lebih panjang", slugs: ["sejarah-tempe-di-jawa-tengah"], limit: 1, cta: { label: "Baca selengkapnya", href: "/jurnal" } } },
      closing("Matur nuwun sudah mampir.", "Lihat dua varian kami, atau sapa Mak lewat WhatsApp."),
    ],
  },
  {
    slug: "faq",
    title: "FAQ",
    seoTitle: "FAQ Tempe Mak Nuk: Pesan, Simpan, Kirim, Halal",
    seoDescription: "Jawaban pertanyaan umum tentang pesan, PO, kirim, simpan, dan varian Tempe Mak Nuk. Cari pertanyaanmu atau tanya langsung via WhatsApp.",
    sections: [
      { type: "hero", data: { eyebrow: "FAQ", headline: "Pertanyaan yang sering ditanyakan.", subheadline: "Belum ketemu jawabannya? Tanyakan langsung via WhatsApp, kami balas di jam kerja.", primaryCta: null, secondaryCta: null, image: null } },
      { type: "faqList", data: { heading: null, source: "all", searchable: true } },
      closing("Masih ada pertanyaan?", "Chat saja, Mak dan keluarga yang membalas."),
    ],
  },
  {
    slug: "kontak",
    title: "Kontak",
    seoTitle: "Kontak dan Alamat Tempe Mak Nuk, Pedan Klaten",
    seoDescription: "Alamat dapur produksi Tempe Mak Nuk di Pedan, Klaten, jam buka, peta, WhatsApp, dan Instagram. Chat dulu untuk cek slot sebelum datang.",
    sections: [
      { type: "hero", data: { eyebrow: "Kontak", headline: "Chat dulu, baru datang.", subheadline: "Dapur kami di Pedan, Klaten. Agar pesanan siap saat Anda tiba, cek slot lewat WhatsApp.", primaryCta: WA, secondaryCta: { label: "Buka di Google Maps", href: "https://maps.google.com/?q=-7.7023,110.6894" }, image: null } },
      { type: "split", data: {
        heading: "Alamat dan jam",
        body: "Alamat, telepon, email, dan jam buka diambil dari Pengaturan situs.",
        facts: [
          { label: "Alamat", settingKey: "address.street" },
          { label: "WhatsApp", settingKey: "contact.whatsappDisplay" },
          { label: "Email", settingKey: "contact.email" },
          { label: "Jam", settingKey: "hours" },
        ],
        cta: { label: "Buka di Google Maps", href: "https://maps.google.com/?q=-7.7023,110.6894" },
        image: null, imagePosition: "right", map: true,
      } },
      rt(["Sebelum datang, lihat [Cara Pesan](/cara-pesan), [FAQ](/faq), atau cerita kami di [Tentang](/tentang)."]),
    ],
  },
];

export async function seedPages(tx: Tx) {
  let sections = 0;
  for (const p of PAGES) {
    const base = {
      title: p.title,
      seo: { title: p.seoTitle, description: p.seoDescription },
      status: "published" as const,
    };
    const [row] = await tx
      .insert(pages)
      .values({ slug: p.slug, ...base })
      .onConflictDoUpdate({ target: pages.slug, set: { ...base, updatedAt: sql`now()` } })
      .returning({ id: pages.id });

    const rows = p.sections.map((s, sort) => ({
      id: stableId(`section:${p.slug}:${sort}`),
      pageId: row.id,
      type: s.type,
      data: s.data,
      sort,
      visible: s.visible ?? true,
    }));
    await tx
      .insert(pageSections)
      .values(rows)
      .onConflictDoUpdate({
        target: pageSections.id,
        set: {
          type: sql`excluded.type`,
          data: sql`excluded.data`,
          sort: sql`excluded.sort`,
          visible: sql`excluded.visible`,
          updatedAt: sql`now()`,
        },
      });
    // drop stale sections if the seed shrank
    await tx.delete(pageSections).where(
      and(eq(pageSections.pageId, row.id), notInArray(pageSections.id, rows.map((r) => r.id))),
    );
    sections += rows.length;
  }
  return { pages: PAGES.length, sections };
}
