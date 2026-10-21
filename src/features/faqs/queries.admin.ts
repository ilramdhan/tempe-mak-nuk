import "server-only";

import { asc } from "drizzle-orm";

import { getDb } from "@/db/client";
import { faqs } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";

/** Admin: all FAQs incl. hidden. */
export async function listFaqsForAdmin() {
  await requireRole("editor", { onFail: "redirect" });
  return getDb()
    .select()
    .from(faqs)
    .orderBy(asc(faqs.categoryId), asc(faqs.sort));
}
