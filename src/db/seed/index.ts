import { seedContent } from "./content";
import { seedFaqs } from "./faqs";
import { seedLegal } from "./legal";
import { seedNavigation } from "./navigation";
import { seedPages } from "./pages";
import { seedProducts } from "./products";
import { type SeedDb } from "./rich";
import { seedSettings } from "./settings";
import { seedSlots } from "./slots";
import { seedTestimonials } from "./testimonials";

export type { SeedDb } from "./rich";

/**
 * Seed runner. Fully idempotent: every step upserts on a natural key (settings.key, slug,
 * unique indexes) or a deterministic id (stableId) and runs inside one transaction.
 * Content is DUMMY (docs/business.md) — the owner edits it from the admin afterwards.
 */
export async function runSeed(db: SeedDb): Promise<void> {
  await db.transaction(async (tx) => {
    const log = (k: string, v: unknown) => console.log(`[seed] ${k}:`, v);
    log("settings", await seedSettings(tx));
    log("navigation", await seedNavigation(tx));
    const prod = await seedProducts(tx);
    log("products", { ...prod, productIds: undefined });
    log("content", await seedContent(tx, prod.productIds));
    log("faqs", await seedFaqs(tx));
    log("testimonials", await seedTestimonials(tx));
    log("pages", await seedPages(tx));
    log("legal", await seedLegal(tx));
    log("slots", await seedSlots(tx));
  });
}
