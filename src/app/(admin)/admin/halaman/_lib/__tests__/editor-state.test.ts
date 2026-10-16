import { describe, expect, it } from "vitest";

import { BLOCK_TYPES } from "@/features/pages/blocks";

import {
  applySavedIds,
  editorReducer,
  isDirty,
  mapServerErrors,
  snapshot,
  toPageInput,
  validateEditor,
  validateSection,
  type EditorState,
} from "../editor-state";

const ID_A = "00000000-0000-4000-8000-00000000000a";
const ID_B = "00000000-0000-4000-8000-00000000000b";

function initial(): EditorState {
  return {
    page: {
      slug: "tentang",
      title: "Tentang",
      status: "published",
      seo: { title: "", description: "", ogImageId: null, noindex: false },
    },
    sections: [
      {
        key: ID_A,
        id: ID_A,
        type: "cta",
        data: { headline: "Halo" },
        visible: true,
      },
      {
        key: ID_B,
        id: ID_B,
        type: "trustStrip",
        data: { items: [{ label: "Halal" }] },
        visible: true,
      },
    ],
  };
}

describe("editorReducer", () => {
  it("adds a block with valid defaults at an index", () => {
    const next = editorReducer(initial(), {
      type: "add",
      blockType: "hero",
      index: 0,
      key: "new1",
    });
    expect(next.sections.map((s) => s.key)).toEqual(["new1", ID_A, ID_B]);
    expect(next.sections[0]!.id).toBeNull();
    expect(validateSection(next.sections[0]!)).toEqual({});
  });

  it("every block type's defaults validate", () => {
    let state: EditorState = { ...initial(), sections: [] };
    BLOCK_TYPES.forEach((t, i) => {
      state = editorReducer(state, {
        type: "add",
        blockType: t,
        index: i,
        key: `k${i}`,
      });
    });
    expect(validateEditor(state).count).toBe(0);
  });

  it("moves, toggles, duplicates and removes", () => {
    let s = editorReducer(initial(), { type: "move", from: 0, to: 1 });
    expect(s.sections.map((x) => x.key)).toEqual([ID_B, ID_A]);
    s = editorReducer(s, { type: "toggle", key: ID_A });
    expect(s.sections[1]!.visible).toBe(false);
    s = editorReducer(s, { type: "duplicate", key: ID_B, newKey: "dup" });
    expect(s.sections.map((x) => x.key)).toEqual([ID_B, "dup", ID_A]);
    expect(s.sections[1]!.id).toBeNull();
    expect(s.sections[1]!.data).not.toBe(s.sections[0]!.data);
    s = editorReducer(s, { type: "remove", key: ID_B });
    expect(s.sections.map((x) => x.key)).toEqual(["dup", ID_A]);
  });

  it("edits nested fields immutably", () => {
    const start = initial();
    const s = editorReducer(start, {
      type: "field",
      key: ID_B,
      path: ["items", 0, "label"],
      value: "Sejak 2001",
    });
    expect(s.sections[1]!.data).toEqual({ items: [{ label: "Sejak 2001" }] });
    expect(start.sections[1]!.data).toEqual({ items: [{ label: "Halal" }] });
  });

  it("edits page meta", () => {
    const s = editorReducer(initial(), {
      type: "page",
      path: ["seo", "title"],
      value: "SEO",
    });
    expect(s.page.seo.title).toBe("SEO");
  });
});

describe("validation", () => {
  it("reports per-field errors with data-relative paths", () => {
    const s = editorReducer(initial(), {
      type: "field",
      key: ID_B,
      path: ["items", 0, "label"],
      value: "",
    });
    const v = validateEditor(s);
    expect(Object.keys(v.sections[ID_B] ?? {})).toEqual(["items.0.label"]);
    expect(v.count).toBe(1);
  });

  it("validates page slug and SEO length", () => {
    let s = editorReducer(initial(), {
      type: "page",
      path: ["slug"],
      value: "Bukan Slug",
    });
    s = editorReducer(s, {
      type: "page",
      path: ["seo", "title"],
      value: "x".repeat(80),
    });
    expect(Object.keys(validateEditor(s).page).sort()).toEqual([
      "seo.title",
      "slug",
    ]);
  });

  it("maps server fieldErrors back to sections by index", () => {
    const v = mapServerErrors(initial(), {
      "page.title": ["Judul wajib diisi"],
      "sections.1.data.items.0.label": ["Too small"],
      _form: ["x"],
    });
    expect(v.page).toEqual({ title: "Judul wajib diisi", _form: "x" });
    expect(v.sections[ID_B]).toEqual({ "items.0.label": "Too small" });
    expect(v.count).toBe(3);
  });

  it("drops empty SEO strings so defaults apply", () => {
    expect(toPageInput(initial().page).seo).toEqual({
      title: undefined,
      description: undefined,
      ogImageId: null,
      noindex: undefined,
    });
  });
});

describe("dirty state", () => {
  it("detects changes and ignores client keys / key order", () => {
    const base = initial();
    const snap = snapshot(base);
    expect(isDirty(base, snap)).toBe(false);
    const reordered: EditorState = {
      ...base,
      page: {
        status: "published",
        title: "Tentang",
        slug: "tentang",
        seo: base.page.seo,
      },
    };
    expect(isDirty(reordered, snap)).toBe(false);
    expect(
      isDirty(editorReducer(base, { type: "toggle", key: ID_A }), snap),
    ).toBe(true);
  });

  it("applies saved ids so a re-snapshot is clean", () => {
    const added = editorReducer(initial(), {
      type: "add",
      blockType: "cta",
      index: 2,
      key: "tmp",
    });
    const saved = applySavedIds(added, [
      ID_A,
      ID_B,
      "00000000-0000-4000-8000-00000000000c",
    ]);
    expect(saved.sections[2]!.id).toBe("00000000-0000-4000-8000-00000000000c");
    expect(saved.sections[2]!.key).toBe("tmp");
  });
});

describe("assignIds", () => {
  it("attaches ids to new sections by key without touching other edits", () => {
    let s = editorReducer(initial(), {
      type: "add",
      blockType: "cta",
      index: 2,
      key: "tmp",
    });
    s = editorReducer(s, {
      type: "field",
      key: ID_A,
      path: ["headline"],
      value: "Diedit saat menyimpan",
    });
    s = editorReducer(s, {
      type: "assignIds",
      ids: { tmp: "00000000-0000-4000-8000-00000000000c", [ID_A]: "ignored" },
    });
    expect(s.sections[2]!.id).toBe("00000000-0000-4000-8000-00000000000c");
    expect(s.sections[0]!.id).toBe(ID_A);
    expect(s.sections[0]!.data.headline).toBe("Diedit saat menyimpan");
  });
});

describe("Indonesian messages", () => {
  it("uses friendly messages for empty and too-long fields", () => {
    expect(validateSection({ type: "cta", data: { headline: "" } })).toEqual({
      headline: "Wajib diisi",
    });
    expect(
      validateSection({ type: "cta", data: { headline: "x".repeat(161) } }),
    ).toEqual({
      headline: "Maksimal 160 karakter",
    });
    expect(
      validateSection({ type: "trustStrip", data: { items: [] } }),
    ).toEqual({ items: "Minimal 1 item" });
  });

  it("keeps explicit schema messages", () => {
    const errs = validateSection({
      type: "cta",
      data: { headline: "x", primary: { label: "a", href: "javascript:x" } },
    });
    expect(errs["primary.href"]).toMatch(/Tautan harus diawali/);
  });
});
