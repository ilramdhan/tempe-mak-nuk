import { describe, expect, it } from "vitest";

import { SETTING_KEY_LIST } from "@/db/schema/settings";
import {
  mergeSettings,
  orderRulesFromSettings,
  SETTINGS_DEFAULTS,
  settingSchemas,
  settingsSchema,
  settingsUpdateSchema,
} from "@/features/settings/schema";

describe("settings schema", () => {
  it("has a validator and a valid default for every key", () => {
    for (const key of SETTING_KEY_LIST) {
      expect(settingSchemas[key], key).toBeDefined();
      expect(settingSchemas[key].safeParse(SETTINGS_DEFAULTS[key]).success, key).toBe(true);
    }
    expect(settingsSchema.safeParse(SETTINGS_DEFAULTS).success).toBe(true);
  });

  it("validates kinds", () => {
    expect(settingSchemas["order.cutoffTime"].safeParse("15:00").success).toBe(true);
    expect(settingSchemas["order.cutoffTime"].safeParse("25:00").success).toBe(false);
    expect(settingSchemas["contact.whatsapp"].safeParse("+62 812").success).toBe(false);
    expect(settingSchemas["contact.whatsapp"].safeParse("6281234567890").success).toBe(true);
    expect(settingSchemas["social.instagram"].safeParse("javascript:alert(1)").success).toBe(false);
    expect(settingSchemas["social.instagram"].safeParse("").success).toBe(true);
    expect(settingSchemas["halal.issuedAt"].safeParse("2024-03-12").success).toBe(true);
    expect(settingSchemas.hours.safeParse({ summary: "x", days: [{ day: 1, open: "06:00", close: "16:00" }] }).success).toBe(true);
    expect(settingSchemas["order.closedWeekdays"].parse([6, 0, 0])).toEqual([0, 6]);
  });

  it("mergeSettings: defaults + valid rows, invalid rows fall back, unknown ignored", () => {
    const { settings, invalidKeys } = mergeSettings([
      { key: "order.leadDays", value: 3 },
      { key: "order.cutoffTime", value: "nope" },
      { key: "unknown.key", value: 1 },
    ]);
    expect(settings["order.leadDays"]).toBe(3);
    expect(settings["order.cutoffTime"]).toBe("15:00");
    expect(invalidKeys).toEqual(["order.cutoffTime"]);
    expect(orderRulesFromSettings(settings)).toEqual({
      leadDays: 3,
      cutoffTime: "15:00",
      closedWeekdays: [0],
      slotsPerDay: 8,
      nearlyFullThreshold: 2,
    });
  });

  it("update schema is partial", () => {
    expect(settingsUpdateSchema.safeParse({ "pricing.show": true }).success).toBe(true);
    expect(settingsUpdateSchema.safeParse({ "pricing.show": "yes" }).success).toBe(false);
  });
});
