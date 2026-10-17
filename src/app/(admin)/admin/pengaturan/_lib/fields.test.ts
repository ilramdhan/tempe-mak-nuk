import { describe, expect, it } from "vitest";

import { SETTING_KEY_LIST } from "@/db/schema/settings";
import { SETTINGS_DEFAULTS } from "@/features/settings/schema";

import { ALL_FIELD_KEYS, parseDraft, TABS, normalizePhone } from "./fields";

const defs = TABS.flatMap((t) => t.sections.flatMap((s) => s.fields));

describe("settings admin fields", () => {
  it("covers every settings key exactly once", () => {
    expect([...ALL_FIELD_KEYS].sort()).toEqual([...SETTING_KEY_LIST].sort());
  });
  it("normalizes WA numbers", () => {
    expect(normalizePhone("0812-3456-7890")).toBe("6281234567890");
    expect(normalizePhone("+62 812 3456 7890")).toBe("6281234567890");
  });
  it("validates WA and URL with Indonesian messages", () => {
    const wa = defs.find((d) => d.key === "contact.whatsapp")!;
    expect(parseDraft(wa, "123", SETTINGS_DEFAULTS)).toMatchObject({ ok: false });
    expect(parseDraft(wa, "08123456789", SETTINGS_DEFAULTS)).toEqual({ ok: true, value: "628123456789" });
    const ig = defs.find((d) => d.key === "social.instagram")!;
    const bad = parseDraft(ig, "instagram", SETTINGS_DEFAULTS);
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.message).toMatch(/URL/);
    expect(parseDraft(ig, "", SETTINGS_DEFAULTS)).toEqual({ ok: true, value: "" });
  });
});
