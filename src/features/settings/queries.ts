import "server-only";

import { ne } from "drizzle-orm";
import { cacheTag } from "next/cache";

import { settings as settingsTable } from "@/db/schema";
import type { SettingKey } from "@/db/schema/settings";
import { cachedRead } from "@/features/_shared/db";
import { tags } from "@/lib/cache-tags";

import {
  mergeSettings,
  orderRulesFromSettings,
  SETTINGS_DEFAULTS,
  type Settings,
} from "./schema";

/**
 * All public settings (group ≠ private), validated per key and merged over defaults.
 * Never throws; invalid rows fall back to defaults (logged in dev).
 */
export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheTag(tags.settings);
  return cachedRead("settings", "days", SETTINGS_DEFAULTS, async (db) => {
    const rows = await db
      .select({ key: settingsTable.key, value: settingsTable.value })
      .from(settingsTable)
      .where(ne(settingsTable.group, "private"));
    const { settings, invalidKeys } = mergeSettings(rows);
    if (invalidKeys.length && process.env.NODE_ENV !== "production")
      console.warn(
        `[settings] invalid values replaced by defaults: ${invalidKeys.join(", ")}`,
      );
    return settings;
  });
}

export async function getSetting<K extends SettingKey>(
  key: K,
): Promise<Settings[K]> {
  return (await getSettings())[key];
}

/** Order rules for features/slots/availability. */
export async function getOrderRules() {
  return orderRulesFromSettings(await getSettings());
}

/** Format a settings value for display in fact lists (split block, footer). */
export function formatSettingValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value))
    return value.map(formatSettingValue).filter(Boolean).join(" · ");
  if (
    typeof value === "object" &&
    "summary" in value &&
    typeof value.summary === "string"
  )
    return value.summary;
  return "";
}
