import "server-only";

import { getDb } from "@/db/client";
import { settings as settingsTable } from "@/db/schema";
import type { SettingKey } from "@/db/schema/settings";

import { mergeSettings, type Settings } from "./schema";

/** Admin: every row (incl. private) + metadata + list of invalid keys. Uncached. */
export async function getSettingsForAdmin(): Promise<{
  settings: Settings;
  invalidKeys: SettingKey[];
  rows: { key: string; group: string; updatedAt: Date; updatedBy: string | null }[];
}> {
  const rows = await getDb().select().from(settingsTable);
  const { settings, invalidKeys } = mergeSettings(rows);
  return {
    settings,
    invalidKeys,
    rows: rows.map(({ key, group, updatedAt, updatedBy }) => ({ key, group, updatedAt, updatedBy })),
  };
}
