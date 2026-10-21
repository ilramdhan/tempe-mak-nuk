import "server-only";

import { and, asc, desc, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { cacheTag } from "next/cache";

import { announcements, navItems, type NavLocation } from "@/db/schema";
import { cachedRead } from "@/features/_shared/db";
import { tags } from "@/lib/cache-tags";

export type NavLink = {
  id: string;
  label: string;
  href: string;
  children: NavLink[];
};
export type Navigation = Record<NavLocation, NavLink[]>;

export const EMPTY_NAVIGATION: Navigation = {
  header: [],
  footer_col1: [],
  footer_col2: [],
  footer_col3: [],
  footer_col4: [],
  legal: [],
  social: [],
};

/** All visible nav items grouped by location, nested one level (parent → children). */
export async function getNavigation(): Promise<Navigation> {
  "use cache";
  cacheTag(tags.nav);
  return cachedRead("navigation", "days", EMPTY_NAVIGATION, async (db) => {
    const rows = await db
      .select({
        id: navItems.id,
        location: navItems.location,
        label: navItems.label,
        href: navItems.href,
        parentId: navItems.parentId,
      })
      .from(navItems)
      .where(eq(navItems.visible, true))
      .orderBy(asc(navItems.location), asc(navItems.sort));
    const nav: Navigation = structuredClone(EMPTY_NAVIGATION);
    const byId = new Map<string, NavLink>();
    for (const r of rows)
      byId.set(r.id, { id: r.id, label: r.label, href: r.href, children: [] });
    for (const r of rows) {
      const link = byId.get(r.id)!;
      const parent = r.parentId ? byId.get(r.parentId) : undefined;
      if (parent) parent.children.push(link);
      else if (!r.parentId) nav[r.location].push(link);
      // children of hidden parents are dropped
    }
    return nav;
  });
}

export async function getNav(location: NavLocation): Promise<NavLink[]> {
  return (await getNavigation())[location];
}

export type PublicAnnouncement = {
  id: string;
  text: string;
  href: string | null;
  endsAt: Date | null;
};

/**
 * Currently active announcement (latest-starting first). Uses SQL now() at cache time with a
 * short profile so start/end windows take effect within minutes.
 */
export async function getActiveAnnouncement(): Promise<PublicAnnouncement | null> {
  "use cache";
  cacheTag(tags.announcements);
  return cachedRead("announcement", "minutes", null, async (db) => {
    const [row] = await db
      .select({
        id: announcements.id,
        text: announcements.text,
        href: announcements.href,
        endsAt: announcements.endsAt,
      })
      .from(announcements)
      .where(
        and(
          eq(announcements.active, true),
          or(
            isNull(announcements.startsAt),
            lte(announcements.startsAt, sql`now()`),
          ),
          or(
            isNull(announcements.endsAt),
            gt(announcements.endsAt, sql`now()`),
          ),
        ),
      )
      .orderBy(desc(announcements.startsAt), desc(announcements.updatedAt))
      .limit(1);
    return row ?? null;
  });
}
