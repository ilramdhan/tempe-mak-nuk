"use server";

import { and, eq } from "drizzle-orm";

import { profiles, rolePermissions, userPermissions } from "@/db/schema";
import { fail, type ActionResult } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";

import {
  setRolePermissionSchema,
  setUserPermissionSchema,
  type SetRolePermissionInput,
  type SetUserPermissionInput,
} from "./schema";

/**
 * Owner-only: override one permission for the Editor role.
 * `allowed: null` deletes the override (back to the registry default).
 * No cache tags: permissions are read per request (never cached), so the next request sees it.
 */
export async function setRolePermission(
  input: SetRolePermissionInput,
): Promise<ActionResult> {
  return adminAction({
    role: "owner",
    schema: setRolePermissionSchema,
    input,
    entity: "role_permissions",
    action: "update",
    run: async (data, { tx, user }) => {
      if (data.allowed === null) {
        await tx
          .delete(rolePermissions)
          .where(
            and(
              eq(rolePermissions.role, data.role),
              eq(rolePermissions.permission, data.permission),
            ),
          );
      } else {
        await tx
          .insert(rolePermissions)
          .values({
            role: data.role,
            permission: data.permission,
            allowed: data.allowed,
            updatedBy: user.id,
          })
          .onConflictDoUpdate({
            target: [rolePermissions.role, rolePermissions.permission],
            set: { allowed: data.allowed, updatedBy: user.id },
          });
      }
      return {
        result: undefined,
        entityId: `${data.role}:${data.permission}`,
        tags: [],
      };
    },
  });
}

/**
 * Owner-only: per-user Allow (`true`) / Deny (`false`) / Inherit (`null`) for one permission.
 * Overrides on owners are rejected — owners always have every permission.
 */
export async function setUserPermission(
  input: SetUserPermissionInput,
): Promise<ActionResult> {
  return adminAction({
    role: "owner",
    schema: setUserPermissionSchema,
    input,
    entity: "user_permissions",
    action: "update",
    run: async (data, { tx, user }) => {
      const [target] = await tx
        .select({ role: profiles.role })
        .from(profiles)
        .where(eq(profiles.id, data.userId));
      if (!target) return fail("Pengguna tidak ditemukan.");
      if (target.role === "owner")
        return fail("Pemilik selalu memiliki semua akses.");
      if (data.allowed === null) {
        await tx
          .delete(userPermissions)
          .where(
            and(
              eq(userPermissions.userId, data.userId),
              eq(userPermissions.permission, data.permission),
            ),
          );
      } else {
        await tx
          .insert(userPermissions)
          .values({
            userId: data.userId,
            permission: data.permission,
            allowed: data.allowed,
            updatedBy: user.id,
          })
          .onConflictDoUpdate({
            target: [userPermissions.userId, userPermissions.permission],
            set: { allowed: data.allowed, updatedBy: user.id },
          });
      }
      return {
        result: undefined,
        entityId: data.userId,
        diff: { permission: data.permission, allowed: data.allowed },
        tags: [],
      };
    },
  });
}
