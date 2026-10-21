/** Zod schemas for permission management (client-safe). */
import { z } from "zod";

import { uuidSchema } from "@/features/_shared/schema";

import { PERMISSION_KEYS, PERMISSIONS } from "./registry";

export const permissionKeySchema = z
  .enum(PERMISSION_KEYS, { error: "Izin tidak dikenal" })
  .refine((key) => PERMISSIONS[key].grantable, {
    error: "Izin ini khusus pemilik dan tidak dapat diberikan.",
  });

/** `allowed: null` = hapus override (kembali ke bawaan / ikut peran). */
const allowedSchema = z.boolean().nullable();

export const setRolePermissionSchema = z.object({
  role: z.literal("editor", { error: "Hanya peran Editor yang dapat diatur." }),
  permission: permissionKeySchema,
  allowed: allowedSchema,
});

export const setUserPermissionSchema = z.object({
  userId: uuidSchema,
  permission: permissionKeySchema,
  allowed: allowedSchema,
});

export type SetRolePermissionInput = z.input<typeof setRolePermissionSchema>;
export type SetUserPermissionInput = z.input<typeof setUserPermissionSchema>;
