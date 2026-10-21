import "server-only";

import { asc, desc } from "drizzle-orm";

import { getDb } from "@/db/client";
import { announcements, navItems } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";

export async function listNavItemsForAdmin() {
  await requireRole("editor", { onFail: "redirect" });
  return getDb()
    .select()
    .from(navItems)
    .orderBy(asc(navItems.location), asc(navItems.sort));
}

export async function listAnnouncementsForAdmin() {
  await requireRole("editor", { onFail: "redirect" });
  return getDb()
    .select()
    .from(announcements)
    .orderBy(desc(announcements.updatedAt));
}
