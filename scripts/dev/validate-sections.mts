/**
 * Dev check: validate DB content against feature Zod schemas.
 * Usage: DOTENV_CONFIG_PATH=.env.local pnpm tsx scripts/dev/validate-sections.mts
 */
import "dotenv/config";
import postgres from "postgres";

import { blockSchema } from "../../src/features/pages/blocks/schema";
import { mergeSettings } from "../../src/features/settings/schema";
import { productInputSchema } from "../../src/features/products/schema";
import { postInputSchema } from "../../src/features/posts/schema";
import { recipeInputSchema } from "../../src/features/recipes/schema";
import { faqInputSchema } from "../../src/features/faqs/schema";
import { testimonialInputSchema } from "../../src/features/testimonials/schema";
import {
  navItemInputSchema,
  announcementInputSchema,
} from "../../src/features/navigation/schema";
import { legalDocumentInputSchema } from "../../src/features/legal/schema";
import type { z } from "zod";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL missing");
const sql = postgres(url, { prepare: false, max: 1 });

const rows = await sql<
  { slug: string; sort: number; type: string; data: unknown }[]
>`
  select p.slug, s.sort, s.type, s.data from page_sections s join pages p on p.id = s.page_id
  order by p.slug, s.sort`;
let bad = 0;
for (const r of rows) {
  const res = blockSchema.safeParse({ type: r.type, data: r.data });
  if (!res.success) {
    bad++;
    for (const i of res.error.issues)
      console.log(
        `FAIL ${r.slug}#${r.sort} ${r.type}: ${i.path.join(".")} — ${i.message}`,
      );
  }
}
console.log(`page_sections: ${rows.length} rows, ${bad} invalid`);

const settingRows = await sql<
  { key: string; value: unknown }[]
>`select key, value from settings`;
const { invalidKeys } = mergeSettings(settingRows);
console.log(
  `settings: ${settingRows.length} rows, invalid: ${invalidKeys.join(", ") || "none"}`,
);

const camel = (o: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(o).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
      v,
    ]),
  );
async function check(table: string, schema: z.ZodType, label: string) {
  const list = await sql.unsafe(`select * from ${table}`);
  let n = 0;
  for (const r of list) {
    const res = schema.safeParse(camel(r as Record<string, unknown>));
    if (!res.success) {
      n++;
      for (const i of res.error.issues)
        console.log(
          `FAIL ${table} ${String((r as Record<string, unknown>)[label])}: ${i.path.join(".")} — ${i.message}`,
        );
    }
  }
  console.log(`${table}: ${list.length} rows, ${n} invalid`);
}
await check("products", productInputSchema, "slug");
await check("posts", postInputSchema, "slug");
await check("recipes", recipeInputSchema, "slug");
await check("faqs", faqInputSchema, "question");
await check("testimonials", testimonialInputSchema, "name");
await check("nav_items", navItemInputSchema, "label");
await check("announcements", announcementInputSchema, "text");
await check("legal_documents", legalDocumentInputSchema, "slug");
await sql.end();
