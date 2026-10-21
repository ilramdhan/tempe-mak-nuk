import { describe, expect, it } from "vitest";

import { SETTING_KEY_LIST } from "@/db/schema/settings";

import { isOwnerOnlySetting, requiredSettingsRole } from "../roles";

describe("settings roles", () => {
  it("lets editors write seo.* and cta.* only", () => {
    expect(requiredSettingsRole(["seo.defaultTitle", "cta.primaryLabel"])).toBe(
      "editor",
    );
  });
  it("requires owner for site.* and any mixed set", () => {
    expect(requiredSettingsRole(["site.url"])).toBe("owner");
    expect(requiredSettingsRole(["seo.defaultTitle", "site.locale"])).toBe(
      "owner",
    );
  });
  it("requires owner for order/business keys", () => {
    for (const k of SETTING_KEY_LIST) {
      if (/^(order|business|legal|halal|consent|site)\./.test(k))
        expect(isOwnerOnlySetting(k)).toBe(true);
    }
  });
});
