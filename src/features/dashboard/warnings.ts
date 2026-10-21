import "server-only";

import { and, gte, inArray, lt, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { holidays, settings, slotDays } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";
import { addDays, todayKey } from "@/lib/dates";

import {
  type ContentWarning,
  countOpenSlotDays,
  DUMMY_SETTING_KEYS,
  DUMMY_SETTING_LABEL,
  dummySettingKeys,
  SAMPLE_MARKER,
  sortWarnings,
} from "./warnings-logic";

const SLOT_WINDOW_DAYS = 14;

const num = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/**
 * Actionable content gaps for the admin dashboard. Admin-only, uncached.
 * One round-trip of scalar counts + a few small parallel reads (no per-row queries).
 */
export async function getContentWarnings(
  now: Date = new Date(),
): Promise<ContentWarning[]> {
  await requireRole("editor", { onFail: "redirect" });
  const db = getDb();
  const from = todayKey(now);
  const to = addDays(from, SLOT_WINDOW_DAYS);

  const settingKeys = [
    ...DUMMY_SETTING_KEYS,
    "pricing.show",
    "order.closedWeekdays",
    "order.slotsPerDay",
  ];

  const [counts, settingRows, holidayRows, overrideRows] = await Promise.all([
    db.execute<Record<string, number>>(sql`
      select
        (select count(*)::int from products p where p.is_active and not exists
          (select 1 from product_media pm where pm.product_id = p.id)) as products_no_cover,
        (select count(*)::int from products p where p.is_active and p.price_from is null
          and not exists (select 1 from product_size_links l join product_sizes s on s.id = l.size_id
            where l.product_id = p.id and s.active and coalesce(l.price, s.price) is not null)) as products_no_price,
        (select count(*)::int from media where btrim(alt) = '') as media_no_alt,
        (select count(*)::int from posts where status = 'published' and cover_media_id is null) as posts_no_cover,
        (select count(*)::int from posts where status = 'published'
          and btrim(coalesce(seo->>'description', '')) = '' and btrim(coalesce(excerpt, '')) = '') as posts_no_seo,
        (select count(*)::int from recipes where status = 'published' and cover_media_id is null) as recipes_no_cover,
        (select count(*)::int from recipes where status = 'published'
          and btrim(coalesce(seo->>'description', '')) = '' and btrim(coalesce(excerpt, '')) = '') as recipes_no_seo,
        (select count(*)::int from testimonials where visible and is_placeholder) as testimonials_placeholder,
        (select count(*)::int from legal_documents where status = 'published'
          and content::text like ${"%" + SAMPLE_MARKER + "%"}) as legal_sample,
        (select count(*)::int from categories c where c.kind = 'faq' and not exists
          (select 1 from faqs f where f.category_id = c.id and f.visible)) as faq_empty_categories
    `),
    db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .where(inArray(settings.key, settingKeys)),
    db
      .select({ date: holidays.date })
      .from(holidays)
      .where(and(gte(holidays.date, from), lt(holidays.date, to))),
    db
      .select({
        date: slotDays.date,
        capacity: slotDays.capacity,
        booked: slotDays.booked,
        status: slotDays.status,
      })
      .from(slotDays)
      .where(and(gte(slotDays.date, from), lt(slotDays.date, to))),
  ]);

  const c = (counts as unknown as Record<string, number>[])[0] ?? {};
  const n = (k: string) => Number(c[k] ?? 0);
  const values: Record<string, unknown> = Object.fromEntries(
    settingRows.map((r) => [r.key, r.value]),
  );
  const showPrice = values["pricing.show"] !== false;

  const out: ContentWarning[] = [];
  const add = (
    id: string,
    severity: ContentWarning["severity"],
    count: number,
    message: string,
    href: string,
  ) => {
    if (count > 0) out.push({ id, severity, message, href, count });
  };

  const dummy = dummySettingKeys(values);
  for (const key of dummy) {
    add(
      `setting:${key}`,
      key === "contact.whatsapp" || key === "halal.number" ? "high" : "medium",
      1,
      `Pengaturan ${DUMMY_SETTING_LABEL[key]} masih berisi nilai contoh atau kosong.`,
      "/admin/pengaturan",
    );
  }

  const openDays = countOpenSlotDays({
    from,
    days: SLOT_WINDOW_DAYS,
    closedWeekdays: Array.isArray(values["order.closedWeekdays"])
      ? (values["order.closedWeekdays"] as number[])
      : [0],
    holidays: holidayRows.map((h) => h.date),
    overrides: overrideRows,
    defaultCapacity: num(values["order.slotsPerDay"], 8),
  });
  if (openDays === 0)
    add(
      "slots:none",
      "high",
      1,
      `Tidak ada hari dengan slot tersedia dalam ${SLOT_WINDOW_DAYS} hari ke depan.`,
      "/admin/slot",
    );

  add(
    "products:cover",
    "high",
    n("products_no_cover"),
    `${n("products_no_cover")} produk aktif belum punya foto.`,
    "/admin/produk",
  );
  if (showPrice)
    add(
      "products:price",
      "medium",
      n("products_no_price"),
      `${n("products_no_price")} produk aktif belum punya harga (tampil harga sedang aktif).`,
      "/admin/produk",
    );
  add(
    "testimonials:placeholder",
    "high",
    n("testimonials_placeholder"),
    `${n("testimonials_placeholder")} testimoni contoh masih ditampilkan di situs.`,
    "/admin/testimoni",
  );
  add(
    "legal:sample",
    "high",
    n("legal_sample"),
    `${n("legal_sample")} dokumen legal terbit masih berlabel "Dokumen contoh".`,
    "/admin/legal",
  );
  add(
    "media:alt",
    "medium",
    n("media_no_alt"),
    `${n("media_no_alt")} gambar belum punya teks alternatif.`,
    "/admin/media",
  );
  add(
    "posts:cover",
    "medium",
    n("posts_no_cover"),
    `${n("posts_no_cover")} artikel terbit belum punya gambar sampul.`,
    "/admin/jurnal",
  );
  add(
    "posts:seo",
    "low",
    n("posts_no_seo"),
    `${n("posts_no_seo")} artikel terbit belum punya deskripsi SEO.`,
    "/admin/jurnal",
  );
  add(
    "recipes:cover",
    "medium",
    n("recipes_no_cover"),
    `${n("recipes_no_cover")} resep terbit belum punya gambar sampul.`,
    "/admin/resep",
  );
  add(
    "recipes:seo",
    "low",
    n("recipes_no_seo"),
    `${n("recipes_no_seo")} resep terbit belum punya deskripsi SEO.`,
    "/admin/resep",
  );
  add(
    "faq:empty",
    "low",
    n("faq_empty_categories"),
    `${n("faq_empty_categories")} kategori FAQ belum punya pertanyaan yang tampil.`,
    "/admin/faq",
  );

  return sortWarnings(out);
}
