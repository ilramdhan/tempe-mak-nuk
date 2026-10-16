import type { RecipeIngredient } from "../schema/content";

export type RecipeSeed = {
  slug: string;
  title: string;
  excerpt: string;
  product: "tempe-klasik" | "tempe-original-tanpa-kulit";
  prep: number;
  cook: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  ingredients: RecipeIngredient[];
  steps: string[];
  intro: string[];
  tips: string[];
  seoTitle: string;
  seoDescription: string;
};

const META = "Cara membuat {n}: bahan, langkah, waktu masak, dan tips memilih tempe segar. Ditulis keluarga pembuat tempe Mak Nuk, Klaten.";

export const RECIPES: RecipeSeed[] = [
  {
    slug: "tempe-mendoan",
    title: "Tempe Mendoan Setengah Matang",
    excerpt: "Mendoan khas Banyumas: lembaran tipis, adonan berdaun bawang, digoreng sebentar supaya tetap lemas dan gurih.",
    product: "tempe-original-tanpa-kulit",
    prep: 15, cook: 15, servings: 4, difficulty: "easy",
    intro: [
      "Mendoan berasal dari kata Banyumasan yang berarti setengah matang. Tempenya diiris tipis, dibalur adonan tepung berbumbu, lalu digoreng sebentar saja dalam minyak panas. Hasilnya lemas, hangat, dan gurih.",
    ],
    ingredients: [
      { group: "Tempe", item: "Tempe Original Tanpa Kulit, lembaran tipis", qty: "250 g" },
      { group: "Adonan", item: "Tepung terigu", qty: "100 g" },
      { group: "Adonan", item: "Tepung beras", qty: "2 sdm" },
      { group: "Adonan", item: "Daun bawang, iris halus", qty: "3 batang" },
      { group: "Adonan", item: "Bawang putih, haluskan", qty: "3 siung" },
      { group: "Adonan", item: "Ketumbar bubuk", qty: "1/2 sdt" },
      { group: "Adonan", item: "Garam", qty: "1 sdt", note: "sesuai selera" },
      { group: "Adonan", item: "Air dingin", qty: "150 ml", note: "tambahkan bertahap" },
      { item: "Minyak goreng", qty: "secukupnya", note: "cukup untuk merendam" },
    ],
    steps: [
      "Campur tepung terigu, tepung beras, bawang putih, ketumbar, garam, dan daun bawang dalam mangkuk.",
      "Tuang air dingin sedikit demi sedikit sambil diaduk sampai adonan cukup encer seperti kental susu, tidak bergerindil.",
      "Panaskan minyak dengan api sedang cenderung besar sampai benar-benar panas.",
      "Celupkan lembaran tempe ke adonan sampai terbalut merata, angkat sebentar agar kelebihan adonan menetes.",
      "Goreng sekitar 30–60 detik per sisi sampai adonan set dan tempe masih lemas. Jangan sampai kering garing.",
      "Tiriskan dan sajikan hangat dengan cabai rawit atau sambal kecap.",
    ],
    tips: [
      "Pakai varian **tanpa kulit** agar irisan tipis rapi dan tekstur lemas. Varian Klasik juga bisa, hasilnya sedikit lebih kasar.",
      "Tempe yang diiris saat dingin dari kulkas lebih mudah dibuat tipis.",
      "Minyak harus panas sebelum tempe masuk. Kalau kurang panas, adonan menyerap minyak dan mendoan jadi berminyak.",
      "Makan segera. Mendoan paling enak hangat, dan tidak cocok untuk disimpan lama.",
    ],
    seoTitle: "Resep Tempe Mendoan Lemas dan Gurih, Mudah — Mak Nuk",
    seoDescription: META.replace("{n}", "tempe mendoan"),
  },
  {
    slug: "tempe-bacem",
    title: "Tempe Bacem Manis Gurih Tanpa Santan",
    excerpt: "Tempe direbus pelan dalam bumbu gula kelapa dan rempah sampai meresap, lalu digoreng atau dipanggang sebentar.",
    product: "tempe-klasik",
    prep: 15, cook: 45, servings: 6, difficulty: "easy",
    intro: [
      "Bacem adalah teknik merebus bahan dalam bumbu manis rempah sampai air menyusut dan bumbu meresap ke dalam. Versi ini tanpa santan, sehingga lebih ringan dan lebih awet dibanding bacem berkuah santan.",
    ],
    ingredients: [
      { item: "Tempe Klasik, potong 4×5 cm", qty: "400 g" },
      { group: "Bumbu halus", item: "Bawang merah", qty: "4 siung" },
      { group: "Bumbu halus", item: "Bawang putih", qty: "3 siung" },
      { group: "Bumbu halus", item: "Ketumbar sangrai", qty: "1 sdt" },
      { group: "Bumbu rebus", item: "Gula kelapa (gula jawa), sisir", qty: "100 g" },
      { group: "Bumbu rebus", item: "Kecap manis", qty: "3 sdm" },
      { group: "Bumbu rebus", item: "Daun salam", qty: "3 lembar" },
      { group: "Bumbu rebus", item: "Lengkuas, memarkan", qty: "2 cm" },
      { group: "Bumbu rebus", item: "Garam", qty: "1 sdt" },
      { group: "Bumbu rebus", item: "Air", qty: "500 ml" },
      { item: "Minyak untuk menggoreng", qty: "secukupnya" },
    ],
    steps: [
      "Tumis bumbu halus dengan sedikit minyak sampai harum, masukkan daun salam dan lengkuas.",
      "Tuang air, masukkan gula kelapa, kecap, dan garam. Aduk sampai gula larut.",
      "Masukkan tempe. Masak dengan api kecil sambil sesekali dibalik, sekitar 30–40 menit sampai air hampir habis dan bumbu meresap.",
      "Angkat tempe, tiriskan. Sisakan sedikit bumbu untuk olesan.",
      "Goreng sebentar atau panggang sambil diolesi sisa bumbu sampai pinggirnya agak karamel.",
      "Sajikan dengan nasi hangat, sayur, atau gudeg.",
    ],
    tips: [
      "Api kecil adalah kuncinya. Api besar membuat air cepat habis sebelum bumbu meresap.",
      "Tempe yang sudah beberapa hari (agak tajam aromanya, belum rusak) pas untuk bacem karena bumbu pekatnya menyeimbangkan.",
      "Bacem bisa disimpan di kulkas beberapa hari dalam wadah tertutup. Panaskan sebelum disajikan.",
    ],
    seoTitle: "Resep Tempe Bacem Empuk Tanpa Santan — Tempe Mak Nuk",
    seoDescription: META.replace("{n}", "tempe bacem"),
  },
  {
    slug: "orek-tempe-kering",
    title: "Orek Tempe Kering untuk Nasi Kotak",
    excerpt: "Tempe dadu digoreng kering lalu dimasak dengan kecap, cabai, dan bawang. Awet beberapa hari dan pas untuk bekal.",
    product: "tempe-klasik",
    prep: 15, cook: 25, servings: 6, difficulty: "easy",
    intro: [
      "Orek tempe adalah lauk wajib nasi kotak. Rasanya manis pedas gurih, teksturnya kering, dan tidak cepat basah. Kuncinya ada pada potongan seragam dan penggorengan awal sampai kering.",
    ],
    ingredients: [
      { item: "Tempe, potong dadu 1 cm", qty: "300 g", note: "bentuk mini/dadu dapat dipesan" },
      { item: "Bawang merah, iris tipis", qty: "5 siung" },
      { item: "Bawang putih, iris tipis", qty: "3 siung" },
      { item: "Cabai merah keriting, iris serong", qty: "4 buah" },
      { item: "Daun salam", qty: "2 lembar" },
      { item: "Kecap manis", qty: "4 sdm" },
      { item: "Gula merah, sisir halus", qty: "1 sdm" },
      { item: "Garam", qty: "1/2 sdt" },
      { item: "Minyak goreng", qty: "secukupnya" },
    ],
    steps: [
      "Goreng tempe dadu dalam minyak panas sampai kuning kecokelatan dan agak kering. Tiriskan.",
      "Sisakan 2 sdm minyak. Tumis bawang merah, bawang putih, dan daun salam sampai harum.",
      "Masukkan cabai, tumis sebentar.",
      "Masukkan tempe goreng, kecap, gula merah, dan garam. Aduk rata dengan api kecil sekitar 5 menit sampai bumbu menyatu dan tempe terlapisi.",
      "Koreksi rasa. Angkat dan dinginkan sebelum dikemas.",
    ],
    tips: [
      "Goreng tempe sampai benar-benar kering sebelum ditumis supaya orek tidak lembek.",
      "Dinginkan sepenuhnya sebelum masuk kotak agar uap tidak membuat nasi basah.",
      "Dalam wadah tertutup di kulkas, orek umumnya bertahan beberapa hari. Panaskan lagi sebelum disajikan.",
    ],
    seoTitle: "Resep Orek Tempe Kering Kecap, Awet — Tempe Mak Nuk",
    seoDescription: META.replace("{n}", "orek tempe kering"),
  },
  {
    slug: "sambal-goreng-tempe",
    title: "Sambal Goreng Tempe Pedas Manis",
    excerpt: "Tempe goreng dibalut sambal merah pedas manis, kering tapi mengilap. Lauk andalan prasmanan dan nasi kotak.",
    product: "tempe-klasik",
    prep: 20, cook: 25, servings: 6, difficulty: "medium",
    intro: [
      "Sambal goreng tempe adalah lauk klasik hajatan. Tempe digoreng kering, lalu dimasak dalam sambal tumis yang ditambah gula dan sedikit asam. Versi kering ini awet dan mudah dibagi.",
    ],
    ingredients: [
      { item: "Tempe, potong korek api tebal", qty: "350 g" },
      { group: "Bumbu halus", item: "Cabai merah keriting", qty: "8 buah" },
      { group: "Bumbu halus", item: "Cabai rawit (opsional)", qty: "5 buah", note: "sesuai selera pedas" },
      { group: "Bumbu halus", item: "Bawang merah", qty: "6 siung" },
      { group: "Bumbu halus", item: "Bawang putih", qty: "3 siung" },
      { group: "Bumbu halus", item: "Kemiri sangrai", qty: "2 butir" },
      { item: "Daun salam", qty: "2 lembar" },
      { item: "Lengkuas, memarkan", qty: "2 cm" },
      { item: "Gula merah", qty: "2 sdm" },
      { item: "Air asam jawa", qty: "1 sdm" },
      { item: "Garam", qty: "3/4 sdt" },
      { item: "Minyak goreng", qty: "secukupnya" },
    ],
    steps: [
      "Goreng tempe sampai kuning keemasan dan kering. Tiriskan.",
      "Tumis bumbu halus bersama daun salam dan lengkuas sampai matang dan minyak sedikit memisah, sekitar 8–10 menit.",
      "Tambahkan gula merah, air asam, dan garam. Aduk sampai larut dan sedikit mengental.",
      "Masukkan tempe goreng. Aduk cepat dengan api sedang sampai sambal melapisi seluruh tempe.",
      "Angkat, sajikan dengan nasi putih.",
    ],
    tips: [
      "Sambal yang matang sempurna (minyak memisah) membuat sambal goreng lebih awet.",
      "Untuk versi tanpa pedas, kurangi cabai rawit dan pakai cabai merah besar.",
      "Padukan dengan tempe Klasik karena teksturnya tahan bumbu pekat.",
    ],
    seoTitle: "Resep Sambal Goreng Tempe Pedas Manis — Tempe Mak Nuk",
    seoDescription: META.replace("{n}", "sambal goreng tempe"),
  },
  {
    slug: "tim-tempe-mpasi",
    title: "Tim Tempe Wortel untuk MPASI",
    excerpt: "Tempe tanpa kulit dan wortel dikukus lembut bersama nasi, lalu dilumat sesuai tekstur yang disarankan untuk usia anak.",
    product: "tempe-original-tanpa-kulit",
    prep: 15, cook: 30, servings: 2, difficulty: "easy",
    intro: [
      "Catatan penting: resep ini informasi umum, bukan nasihat medis. Usia mulai MPASI, tekstur, porsi, dan pengenalan kedelai (yang termasuk alergen) sebaiknya dikonsultasikan dengan dokter anak atau ahli gizi dan mengikuti buku KIA. Perkenalkan bahan baru dalam jumlah sedikit dan amati reaksi anak.",
      "Tim ini memakai tempe tanpa kulit yang teksturnya lembut, wortel, dan nasi. Tanpa garam, gula, atau penyedap.",
    ],
    ingredients: [
      { item: "Tempe Original Tanpa Kulit", qty: "30 g", note: "segar, tidak berlendir" },
      { item: "Wortel, parut halus", qty: "30 g" },
      { item: "Beras putih, cuci bersih", qty: "2 sdm" },
      { item: "Air matang", qty: "200 ml" },
      { item: "Minyak zaitun atau minyak kelapa murni (opsional)", qty: "1/2 sdt", note: "sesuai saran tenaga kesehatan" },
    ],
    steps: [
      "Cuci tangan dan peralatan. Iris tempe kecil-kecil.",
      "Campur beras, wortel, tempe, dan air dalam mangkuk tahan panas.",
      "Kukus atau tim sekitar 30 menit sampai beras sangat lunak dan tempe matang sepenuhnya.",
      "Dinginkan sebentar, lalu lumatkan atau haluskan sesuai tekstur yang sesuai dengan usia dan kemampuan makan anak.",
      "Tambahkan minyak bila disarankan, aduk. Sajikan hangat, bukan panas.",
      "Buang sisa makanan yang sudah menyentuh sendok anak. Simpan porsi yang belum disajikan di kulkas, panaskan sampai benar-benar panas sebelum disajikan.",
    ],
    tips: [
      "Gunakan tempe segar. Bila ragu dengan aromanya, jangan dipakai.",
      "Hindari garam dan gula tambahan sesuai arahan umum MPASI. Tanyakan tenaga kesehatan bila ragu.",
      "Pengenalan pertama sebaiknya dalam porsi sangat kecil dan tidak bersamaan dengan bahan baru lain, untuk memudahkan mengamati reaksi.",
    ],
    seoTitle: "Resep Tim Tempe MPASI Wortel, Lembut — Tempe Mak Nuk",
    seoDescription: META.replace("{n}", "tim tempe MPASI"),
  },
  {
    slug: "tempe-penyet",
    title: "Tempe Penyet Sambal Bawang ala Warung",
    excerpt: "Tempe goreng hangat dipenyet bersama sambal bawang mentah yang segar, pedas, dan harum.",
    product: "tempe-klasik",
    prep: 10, cook: 15, servings: 2, difficulty: "easy",
    intro: [
      "Penyet berarti dipukul atau ditekan. Tempe goreng ditekan di atas sambal sehingga bumbunya meresap ke permukaan yang retak. Cepat dibuat, cocok untuk makan siang.",
    ],
    ingredients: [
      { item: "Tempe Klasik, potong tebal", qty: "200 g" },
      { group: "Sambal", item: "Cabai rawit merah", qty: "8 buah", note: "sesuai selera" },
      { group: "Sambal", item: "Bawang putih", qty: "2 siung" },
      { group: "Sambal", item: "Bawang merah", qty: "3 siung" },
      { group: "Sambal", item: "Tomat kecil", qty: "1 buah" },
      { group: "Sambal", item: "Terasi bakar (opsional)", qty: "1/2 sdt" },
      { group: "Sambal", item: "Garam", qty: "1/2 sdt" },
      { group: "Sambal", item: "Gula pasir", qty: "1/2 sdt" },
      { group: "Sambal", item: "Jeruk limau atau jeruk nipis", qty: "1/2 buah" },
      { item: "Minyak goreng panas", qty: "2 sdm", note: "untuk menyiram sambal" },
    ],
    steps: [
      "Goreng tempe sampai kuning kecokelatan, tiriskan.",
      "Ulek kasar cabai, bawang putih, bawang merah, tomat, terasi, garam, dan gula.",
      "Siram sambal dengan 2 sdm minyak panas bekas menggoreng, aduk.",
      "Letakkan tempe hangat di atas sambal, tekan dengan ulekan sampai agak pecah.",
      "Peras jeruk, aduk rata. Sajikan dengan nasi hangat dan lalapan.",
    ],
    tips: [
      "Siram minyak panas agar aroma bawang keluar dan sambal sedikit matang.",
      "Tempe yang digoreng garing luar dan masih lembut dalam adalah yang terbaik untuk penyet.",
      "Sesuaikan jumlah cabai dengan kemampuan anggota keluarga.",
    ],
    seoTitle: "Resep Tempe Penyet Sambal Bawang, Pedas Segar — Mak Nuk",
    seoDescription: META.replace("{n}", "tempe penyet"),
  },
];
