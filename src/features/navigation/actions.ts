"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { announcements, navItems } from "@/db/schema";
import { fail, type ActionResult } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";
import { applyOrder } from "@/features/_shared/reorder";
import { uuidSchema } from "@/features/_shared/schema";
import { tags } from "@/lib/cache-tags";

import {
  announcementInputSchema,
  navItemInputSchema,
  navReorderSchema,
  type AnnouncementInput,
  type NavItemInput,
} from "./schema";

const idSchema = z.object({ id: uuidSchema });

export async function createNavItem(
  input: NavItemInput,
): Promise<ActionResult<{ id: string }>> {
  return adminAction({
    schema: navItemInputSchema,
    input,
    entity: "nav_items",
    action: "create",
    run: async (data, { tx }) => {
      const [row] = await tx
        .insert(navItems)
        .values(data)
        .returning({ id: navItems.id });
      return { result: row, entityId: row.id, tags: [tags.nav] };
    },
  });
}

export async function updateNavItem(
  id: string,
  input: NavItemInput,
): Promise<ActionResult> {
  return adminAction({
    schema: navItemInputSchema
      .extend({ id: uuidSchema })
      .refine((v) => v.parentId !== v.id, {
        path: ["parentId"],
        message: "Menu tidak boleh menjadi induk dirinya sendiri",
      }),
    input: { ...input, id },
    entity: "nav_items",
    action: "update",
    run: async ({ id, ...data }, { tx }) => {
      const rows = await tx
        .update(navItems)
        .set(data)
        .where(eq(navItems.id, id))
        .returning({ id: navItems.id });
      if (!rows.length) return fail("Menu tidak ditemukan.");
      return { result: undefined, entityId: id, tags: [tags.nav] };
    },
  });
}

export async function deleteNavItem(id: string): Promise<ActionResult> {
  return adminAction({
    role: "owner",
    schema: idSchema,
    input: { id },
    entity: "nav_items",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const [row] = await tx
        .delete(navItems)
        .where(eq(navItems.id, id))
        .returning({ label: navItems.label });
      if (!row) return fail("Menu tidak ditemukan.");
      return { result: undefined, entityId: id, diff: row, tags: [tags.nav] };
    },
  });
}

export async function reorderNavItems(
  location: NavItemInput["location"],
  ids: string[],
): Promise<ActionResult> {
  return adminAction({
    schema: navReorderSchema,
    input: { location, ids },
    entity: "nav_items",
    action: "reorder",
    run: async ({ location, ids }, { tx }) => {
      await applyOrder(
        tx,
        navItems,
        navItems.id,
        navItems.sort,
        ids,
        and(eq(navItems.location, location)),
      );
      return { result: undefined, tags: [tags.nav] };
    },
  });
}

export async function createAnnouncement(
  input: AnnouncementInput,
): Promise<ActionResult<{ id: string }>> {
  return adminAction({
    schema: announcementInputSchema,
    input,
    entity: "announcements",
    action: "create",
    run: async (data, { tx }) => {
      const [row] = await tx
        .insert(announcements)
        .values(data)
        .returning({ id: announcements.id });
      return { result: row, entityId: row.id, tags: [tags.announcements] };
    },
  });
}

export async function updateAnnouncement(
  id: string,
  input: AnnouncementInput,
): Promise<ActionResult> {
  return adminAction({
    schema: z.intersection(announcementInputSchema, idSchema),
    input: { ...input, id },
    entity: "announcements",
    action: "update",
    run: async ({ id, ...data }, { tx }) => {
      const rows = await tx
        .update(announcements)
        .set(data)
        .where(eq(announcements.id, id))
        .returning({ id: announcements.id });
      if (!rows.length) return fail("Pengumuman tidak ditemukan.");
      return { result: undefined, entityId: id, tags: [tags.announcements] };
    },
  });
}

export async function deleteAnnouncement(id: string): Promise<ActionResult> {
  return adminAction({
    role: "owner",
    schema: idSchema,
    input: { id },
    entity: "announcements",
    action: "delete",
    run: async ({ id }, { tx }) => {
      const rows = await tx
        .delete(announcements)
        .where(eq(announcements.id, id))
        .returning({ id: announcements.id });
      if (!rows.length) return fail("Pengumuman tidak ditemukan.");
      return { result: undefined, entityId: id, tags: [tags.announcements] };
    },
  });
}
