import { SETTINGS_KEYS, type SettingKey } from "@/db/schema/settings";

/** Owner-only settings groups (business identity, ordering rules, consent, site). Editors may change the rest (e.g. `seo.*`, `cta.*`). */
export const OWNER_SETTING_GROUPS: ReadonlySet<string> = new Set([
  "business",
  "legal",
  "halal",
  "order",
  "consent",
  "private",
  "site",
]);

export function isOwnerOnlySetting(key: SettingKey): boolean {
  return OWNER_SETTING_GROUPS.has(SETTINGS_KEYS[key].group);
}

/** Role required to write this set of keys. */
export function requiredSettingsRole(
  keys: readonly SettingKey[],
): "owner" | "editor" {
  return keys.some(isOwnerOnlySetting) ? "owner" : "editor";
}
