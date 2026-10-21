"use server";

import { sql } from "drizzle-orm";

import { settings as settingsTable } from "@/db/schema";
import { SETTINGS_KEYS, type SettingKey } from "@/db/schema/settings";
import type { ActionResult } from "@/features/_shared/action";
import { fail } from "@/features/_shared/action";
import { adminAction } from "@/features/_shared/admin-action";
import { tags } from "@/lib/cache-tags";

import { requiredSettingsRole } from "./roles";
import { settingsUpdateSchema, type SettingsUpdate } from "./schema";

/** Upsert any subset of settings keys. */
export async function updateSettings(
  input: SettingsUpdate,
): Promise<ActionResult<{ keys: SettingKey[] }>> {
  const keys = Object.keys(input ?? {}).filter(
    (k): k is SettingKey => k in SETTINGS_KEYS,
  );
  if (keys.length === 0) return fail("Tidak ada pengaturan yang diubah.");
  return adminAction({
    role: requiredSettingsRole(keys),
    schema: settingsUpdateSchema,
    input,
    entity: "settings",
    action: "update",
    run: async (data, { tx, user }) => {
      const entries = (Object.entries(data) as [SettingKey, unknown][]).filter(
        ([, v]) => v !== undefined,
      );
      if (entries.length === 0)
        return fail("Tidak ada pengaturan yang diubah.");
      await tx
        .insert(settingsTable)
        .values(
          entries.map(([key, value]) => ({
            key,
            value,
            group: SETTINGS_KEYS[key].group,
            updatedBy: user.id,
          })),
        )
        .onConflictDoUpdate({
          target: settingsTable.key,
          set: {
            value: sql`excluded.value`,
            group: sql`excluded."group"`,
            updatedBy: user.id,
            updatedAt: sql`now()`,
          },
        });
      return {
        result: { keys: entries.map(([k]) => k) },
        entityId: entries.length === 1 ? entries[0][0] : null,
        diff: Object.fromEntries(entries),
        // Settings feed every page (header/footer/SEO/slots) — settings tag covers them.
        tags: [
          tags.settings,
          entries.some(([k]) => k.startsWith("order.")) && tags.slots,
        ],
      };
    },
  });
}
