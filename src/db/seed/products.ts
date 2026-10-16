import { sql } from "drizzle-orm";

import {
  nutrition,
  productShapeLinks,
  productShapes,
  productSizeLinks,
  productSizes,
  products,
} from "../schema";
import { doc, stableId, type Tx } from "./rich";

/**
 * NUTRITION: values are real-ish TKPI 2019 figures for "Tempe kedelai murni" per 100 g, used
 * for BOTH variants. FLAGGED: the owner MUST verify against the published TKPI table (and, for
 * the skinless variant, ideally lab data) before relying on them. The skinless variant may
 * differ slightly in fibre; no per-variant data is claimed.
 */
const TKPI = {
  perGrams: 100,
  energyKcal: 201,
  proteinG: 20.8,
  fatG: 8.8,
  carbsG: 13.5,
  fiberG: 1.4,
  calciumMg: 155,
  ironMg: 4,
  source: "TKPI 2019 (Kemenkes RI) — Tempe kedelai murni",
  sourceUrl: null as string | null,
};

const SHAPES = [
  ["balok-klasik", "Balok klasik", "Balok persegi panjang, bentuk paling umum. Cocok untuk goreng, bacem, dan tumis."],
  ["lembaran-tipis", "Lembaran tipis (mendoan/keripik)", "Dipipihkan tipis dan lebar, pas untuk mendoan atau keripik tempe."],
  ["silinder", "Silinder (lontong)", "Bulat panjang seperti lontong, mudah diiris rata untuk katering."],
  ["bungkus-daun-bulat", "Bungkus daun bulat", "Bulat kecil dibungkus daun, tampilan tradisional untuk oleh-oleh dan hantaran."],
  ["mini-dadu", "Mini/dadu", "Potongan kecil seragam untuk orek, sambal goreng, dan MPASI."],
  ["custom", "Custom request", "Punya bentuk sendiri? Ceritakan, kami coba wujudkan tanpa minimum order."],
] as const;

const SIZES = [
  ["Kecil", 100, "±100 g", null],
  ["Sedang", 250, "±250 g", null],
  ["Besar", 500, "±500 g", null],
  ["Jumbo katering", 1000, "±1 kg", null],
  ["Custom dimensi", null, "Sesuai permintaan", null],
] as const;

const PACKS = "Kemasan: daun pisang (tradisional), plastik food-grade berlubang, atau kombinasi daun dan plastik.";

export async function seedProducts(tx: Tx) {
  const classic = doc([
    "Tempe Klasik adalah tempe yang paling dikenal di dapur Jawa: kedelai dengan kulit ari yang tetap menempel. Kami cuci, rebus, beri ragi, bungkus, lalu biarkan miselium putihnya tumbuh pelan selama fermentasi. Bahannya hanya tiga: kedelai, air, dan ragi.",
    "## Rasa dan tekstur",
    "Rasanya gurih dengan sedikit aroma kedelai yang khas. Teksturnya lebih kasar dan berserat karena kulit ari ikut terfermentasi, sehingga terasa mantap saat digigit.",
    "## Cocok untuk",
    "- Tempe goreng, bacem, dan penyet yang butuh rasa kuat",
    "- Orek tempe dan sambal goreng untuk nasi kotak",
    "- Tumisan dan sayur berkuah",
    "## Bentuk dan ukuran",
    "Tersedia dalam beberapa bentuk (balok, lembaran, silinder, bungkus daun, dadu) dan ukuran dari kecil sampai jumbo katering. Tanpa minimum order. " + PACKS,
    "## Penyimpanan",
    "Karena tanpa pengawet, tempe segar paling enak dimasak dalam 1–2 hari. Bila ingin disimpan lebih lama, masukkan ke kulkas atau freezer. Panduan lengkap ada di [Cara menyimpan tempe tanpa pengawet](/jurnal/cara-menyimpan-tempe-tanpa-pengawet).",
  ]);
  const skinless = doc([
    "Tempe Original Tanpa Kulit dibuat dari kedelai yang kulit arinya kami kupas bersih satu per satu sebelum direbus. Hasilnya tempe yang lebih putih, padat, lembut, dan minim langu. Bahannya tetap sama: kedelai, air, dan ragi.",
    "## Rasa dan tekstur",
    "Rasanya bersih dan lembut, aroma kedelainya tidak menyengat. Teksturnya rapat dan padat sehingga mudah diiris tipis dan rapi saat digoreng.",
    "## Cocok untuk",
    "- Keluarga yang mencari tempe lembut, termasuk untuk olahan MPASI (konsultasikan dengan tenaga kesehatan anak Anda)",
    "- Mendoan dan keripik tempe dengan irisan tipis yang rapi",
    "- Katering dan restoran yang butuh tampilan seragam",
    "## Bentuk dan ukuran",
    "Sama seperti varian Klasik, bentuk dan ukuran bisa dipilih bebas tanpa minimum order. " + PACKS,
    "## Penyimpanan",
    "Simpan seperti tempe segar lainnya: masak dalam 1–2 hari, atau kulkas dan freezer untuk lebih lama. Lihat [panduan penyimpanan](/jurnal/cara-menyimpan-tempe-tanpa-pengawet).",
  ]);

  const prods = [
    {
      slug: "tempe-klasik",
      name: "Tempe Klasik",
      short: "Kedelai dengan kulit ari, gurih khas, tanpa pengawet.",
      description: classic,
      variant: "classic" as const,
      priceFrom: 5000,
      sort: 0,
      seo: {
        title: "Tempe Klasik Kedelai Kulit Ari, Handmade — Mak Nuk",
        description:
          "Tempe Klasik Mak Nuk: kedelai dengan kulit ari, rasa gurih khas, tanpa pengawet. Cocok digoreng, dibacem, dan dibuat orek. Pesan via WhatsApp.",
      },
    },
    {
      slug: "tempe-original-tanpa-kulit",
      name: "Tempe Original Tanpa Kulit",
      short: "Kedelai dikupas bersih: lebih putih, padat, lembut, minim langu.",
      description: skinless,
      variant: "skinless" as const,
      priceFrom: 7000,
      sort: 1,
      seo: {
        title: "Tempe Original Tanpa Kulit, Putih dan Padat — Mak Nuk",
        description:
          "Tempe Original Tanpa Kulit Mak Nuk: kedelai dikupas bersih, lebih putih, padat, lembut, minim langu. Tanpa pengawet. Pesan via WhatsApp.",
      },
    },
  ];
  const ids: Record<string, string> = {};
  for (const p of prods) {
    const [row] = await tx
      .insert(products)
      .values({ ...p, isActive: true })
      .onConflictDoUpdate({
        target: products.slug,
        set: {
          name: sql`excluded.name`,
          short: sql`excluded.short`,
          description: sql`excluded.description`,
          variant: sql`excluded.variant`,
          priceFrom: sql`excluded.price_from`,
          sort: sql`excluded.sort`,
          seo: sql`excluded.seo`,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: products.id });
    ids[p.slug] = row.id;
  }

  const shapeRows = SHAPES.map(([slug, name, description], sort) => ({
    slug, name, description, sort, active: true,
  }));
  const shapeIds = await tx
    .insert(productShapes)
    .values(shapeRows)
    .onConflictDoUpdate({
      target: productShapes.slug,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        sort: sql`excluded.sort`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: productShapes.id, slug: productShapes.slug });

  // product_sizes has no unique natural key -> deterministic ids.
  const sizeRows = SIZES.map(([name, weightGrams, dims, price], sort) => ({
    id: stableId(`size:${name}`), name, weightGrams, dims, price, sort, active: true,
  }));
  await tx
    .insert(productSizes)
    .values(sizeRows)
    .onConflictDoUpdate({
      target: productSizes.id,
      set: {
        name: sql`excluded.name`,
        weightGrams: sql`excluded.weight_grams`,
        dims: sql`excluded.dims`,
        price: sql`excluded.price`,
        sort: sql`excluded.sort`,
        updatedAt: sql`now()`,
      },
    });

  for (const slug of Object.keys(ids)) {
    await tx
      .insert(productShapeLinks)
      .values(shapeIds.map((s, sort) => ({ productId: ids[slug], shapeId: s.id, sort })))
      .onConflictDoNothing();
    // Medium price follows the product's "from" price; other sizes use size defaults (null = on request).
    await tx
      .insert(productSizeLinks)
      .values(
        sizeRows.map((s, sort) => ({
          productId: ids[slug],
          sizeId: s.id,
          sort,
          price: s.name === "Sedang" ? (slug === "tempe-klasik" ? 5000 : 7000) : null,
        })),
      )
      .onConflictDoUpdate({
        target: [productSizeLinks.productId, productSizeLinks.sizeId],
        set: { price: sql`excluded.price`, sort: sql`excluded.sort` },
      });
    await tx
      .insert(nutrition)
      .values({ productId: ids[slug], ...TKPI })
      .onConflictDoUpdate({
        target: [nutrition.productId, nutrition.perGrams],
        set: {
          energyKcal: sql`excluded.energy_kcal`,
          proteinG: sql`excluded.protein_g`,
          fatG: sql`excluded.fat_g`,
          carbsG: sql`excluded.carbs_g`,
          fiberG: sql`excluded.fiber_g`,
          calciumMg: sql`excluded.calcium_mg`,
          ironMg: sql`excluded.iron_mg`,
          source: sql`excluded.source`,
          sourceUrl: sql`excluded.source_url`,
          updatedAt: sql`now()`,
        },
      });
  }
  return { products: prods.length, shapes: shapeRows.length, sizes: sizeRows.length, productIds: ids };
}
