import "server-only";

import { asc, desc } from "drizzle-orm";

import { getDb } from "@/db/client";
import { announcements, navItems } from "@/db/schema";

export async function listNavItemsForAdmin() {
  return getDb().select().from(navItems).orderBy(asc(navItems.location), asc(navItems.sort));
}

export async function listAnnouncementsForAdmin() {
  return getDb().select().from(announcements).orderBy(desc(announcements.updatedAt));
}
