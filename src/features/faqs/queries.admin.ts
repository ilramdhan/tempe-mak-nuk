import "server-only";

import { asc } from "drizzle-orm";

import { getDb } from "@/db/client";
import { faqs } from "@/db/schema";

/** Admin: all FAQs incl. hidden. */
export async function listFaqsForAdmin() {
  return getDb().select().from(faqs).orderBy(asc(faqs.categoryId), asc(faqs.sort));
}
