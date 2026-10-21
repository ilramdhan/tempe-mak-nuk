import { describe, expect, it } from "vitest";

import {
  buildConsentConfig,
  docToInput,
  groupBySlug,
  isDocDirty,
  isSampleContent,
  nextVersion,
  validateConsent,
  validateDoc,
  type DocDraft,
  type LegalRow,
} from "../legal-form";

const cfg = {
  version: 2,
  bannerText: "Halo",
  categories: [
    { key: "necessary", label: "Wajib", description: "x", required: true },
    { key: "analytics", label: "Analitik", description: "y", required: false },
  ],
};

describe("legal-form", () => {
  it("nextVersion", () => {
    expect(nextVersion([])).toBe(1);
    expect(nextVersion([1, 3, 2])).toBe(4);
  });
  it("isSampleContent", () => {
    expect(
      isSampleContent({
        type: "doc",
        content: [{ text: "**Dokumen contoh — perlu**" }],
      }),
    ).toBe(true);
    expect(isSampleContent({ type: "doc", content: [] })).toBe(false);
    expect(isSampleContent(null)).toBe(false);
  });
  it("groupBySlug sorts versions desc in fixed slug order", () => {
    const r = (slug: LegalRow["slug"], version: number) =>
      ({ id: `${slug}${version}`, slug, version }) as LegalRow;
    const g = groupBySlug([r("terms", 1), r("privacy", 1), r("privacy", 2)]);
    expect(g.map((x) => x.slug)).toEqual(["privacy", "terms"]);
    expect(g[0].rows.map((x) => x.version)).toEqual([2, 1]);
  });
  it("docToInput converts WIB wall-clock to UTC instant", () => {
    const d: DocDraft = {
      title: "T",
      content: null,
      effectiveAt: "2026-01-01T07:00",
      status: "draft",
    };
    expect(docToInput("privacy", 1, d).effectiveAt?.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z",
    );
    expect(
      docToInput("privacy", 1, { ...d, effectiveAt: "" }).effectiveAt,
    ).toBeNull();
  });
  it("validateDoc and dirty", () => {
    const d: DocDraft = {
      title: " ",
      content: null,
      effectiveAt: "bad",
      status: "draft",
    };
    expect(Object.keys(validateDoc(d))).toEqual(["title", "effectiveAt"]);
    expect(isDocDirty(d, { ...d })).toBe(false);
    expect(isDocDirty(d, { ...d, status: "published" })).toBe(true);
  });
  it("consent version bump and validation", () => {
    expect(buildConsentConfig(cfg, cfg, true).version).toBe(3);
    expect(buildConsentConfig(cfg, cfg, false).version).toBe(2);
    expect(validateConsent(cfg)).toEqual({});
    const bad = { ...cfg, categories: [{ ...cfg.categories[0], label: "" }] };
    expect(validateConsent(bad)["categories.0.label"]).toBeTruthy();
  });
});
