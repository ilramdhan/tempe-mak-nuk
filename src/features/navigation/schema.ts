import { z } from "zod";

import { navLocation } from "@/db/schema/enums";
import {
  dateTimeSchema,
  hrefSchema,
  requiredText,
  sortSchema,
  uuidSchema,
} from "@/features/_shared/schema";

export const navLocationSchema = z.enum(navLocation.enumValues);

export const navItemInputSchema = z.object({
  location: navLocationSchema,
  label: requiredText(60, "Label"),
  href: hrefSchema,
  parentId: uuidSchema.nullish().transform((v) => v ?? null),
  sort: sortSchema,
  visible: z.boolean().default(true),
});
export type NavItemInput = z.input<typeof navItemInputSchema>;
export type NavItemData = z.output<typeof navItemInputSchema>;

export const announcementInputSchema = z
  .object({
    text: requiredText(200, "Teks pengumuman"),
    href: hrefSchema.nullish().transform((v) => v ?? null),
    startsAt: dateTimeSchema,
    endsAt: dateTimeSchema,
    active: z.boolean().default(true),
  })
  .refine((v) => !v.startsAt || !v.endsAt || v.endsAt > v.startsAt, {
    path: ["endsAt"],
    message: "Waktu selesai harus setelah waktu mulai",
  });
export type AnnouncementInput = z.input<typeof announcementInputSchema>;

export const navReorderSchema = z.object({
  location: navLocationSchema,
  ids: z.array(uuidSchema).min(1).max(200),
});
