/**
 * Page builder editor state (pure, client-safe): reducer, validation and dirty check.
 * The editor keeps a local draft of page meta + ordered sections and saves it all at once
 * through `savePageContent`.
 */
import { pageInputSchema } from "@/features/pages/schema";
import {
  blockSchema,
  getBlockDefaults,
  type BlockInput,
  type BlockType,
} from "@/features/pages/blocks";

import { insertAt, moveItem, removeAt, setAt, type Path } from "./path";
import { idErrorMap } from "./zod-id";

export type PageStatus = "draft" | "published";

export type PageMetaDraft = {
  slug: string;
  title: string;
  status: PageStatus;
  seo: {
    title: string;
    description: string;
    ogImageId: string | null;
    noindex: boolean;
  };
};

export type SectionDraft = {
  /** Stable client key (dnd id / React key). Equals `id` for saved sections. */
  key: string;
  /** DB id, null until saved. */
  id: string | null;
  type: BlockType;
  data: Record<string, unknown>;
  visible: boolean;
};

export type EditorState = { page: PageMetaDraft; sections: SectionDraft[] };

export type EditorAction =
  | { type: "page"; path: Path; value: unknown }
  | { type: "add"; blockType: BlockType; index: number; key: string }
  | { type: "duplicate"; key: string; newKey: string }
  | { type: "remove"; key: string }
  | { type: "move"; from: number; to: number }
  | { type: "toggle"; key: string }
  | { type: "field"; key: string; path: Path; value: unknown }
  | { type: "reset"; state: EditorState }
  /** After save: attach DB ids to new sections by client key (keeps edits made meanwhile). */
  | { type: "assignIds"; ids: Record<string, string> };

export function editorReducer(
  state: EditorState,
  action: EditorAction,
): EditorState {
  switch (action.type) {
    case "page":
      return { ...state, page: setAt(state.page, action.path, action.value) };
    case "add": {
      const section: SectionDraft = {
        key: action.key,
        id: null,
        type: action.blockType,
        data: getBlockDefaults(action.blockType) as Record<string, unknown>,
        visible: true,
      };
      return {
        ...state,
        sections: insertAt(state.sections, action.index, section),
      };
    }
    case "duplicate": {
      const index = state.sections.findIndex((s) => s.key === action.key);
      if (index < 0) return state;
      const src = state.sections[index]!;
      const copy: SectionDraft = {
        ...src,
        key: action.newKey,
        id: null,
        data: structuredClone(src.data),
      };
      return { ...state, sections: insertAt(state.sections, index + 1, copy) };
    }
    case "remove":
      return {
        ...state,
        sections: removeAt(
          state.sections,
          state.sections.findIndex((s) => s.key === action.key),
        ),
      };
    case "move":
      return {
        ...state,
        sections: moveItem(state.sections, action.from, action.to),
      };
    case "toggle":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.key === action.key ? { ...s, visible: !s.visible } : s,
        ),
      };
    case "field":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.key === action.key
            ? { ...s, data: setAt(s.data, action.path, action.value) }
            : s,
        ),
      };
    case "reset":
      return action.state;
    case "assignIds":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === null && action.ids[s.key]
            ? { ...s, id: action.ids[s.key]! }
            : s,
        ),
      };
  }
}

/** Errors keyed by dotted path ("items.0.title", "_form" for the block root). */
export type FieldErrors = Record<string, string>;

export type Validation = {
  page: FieldErrors;
  sections: Record<string, FieldErrors>;
  /** Total number of problems. */
  count: number;
};

function collect(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
  drop = 0,
): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of issues) {
    const key = issue.path.slice(drop).map(String).join(".") || "_form";
    out[key] ??= issue.message;
  }
  return out;
}

export function validateSection(
  section: Pick<SectionDraft, "type" | "data">,
): FieldErrors {
  const res = blockSchema.safeParse(
    { type: section.type, data: section.data },
    { error: idErrorMap },
  );
  return res.success ? {} : collect(res.error.issues, 1); // drop the leading "data"
}

export function validatePage(page: PageMetaDraft): FieldErrors {
  const res = pageInputSchema.safeParse(toPageInput(page), {
    error: idErrorMap,
  });
  return res.success ? {} : collect(res.error.issues);
}

export function validateEditor(state: EditorState): Validation {
  const page = validatePage(state.page);
  const sections: Record<string, FieldErrors> = {};
  let count = Object.keys(page).length;
  for (const s of state.sections) {
    const errors = validateSection(s);
    const n = Object.keys(errors).length;
    if (n) {
      sections[s.key] = errors;
      count += n;
    }
  }
  return { page, sections, count };
}

/** Map server `fieldErrors` ("page.slug", "sections.2.data.items.0.title") back onto the draft. */
export function mapServerErrors(
  state: EditorState,
  fieldErrors: Record<string, string[]> | undefined,
): Validation {
  const out: Validation = { page: {}, sections: {}, count: 0 };
  for (const [path, messages] of Object.entries(fieldErrors ?? {})) {
    const msg = messages[0] ?? "Tidak valid";
    const parts = path.split(".");
    if (parts[0] === "page")
      out.page[parts.slice(1).join(".") || "_form"] ??= msg;
    else if (parts[0] === "sections" && /^\d+$/.test(parts[1] ?? "")) {
      const section = state.sections[Number(parts[1])];
      if (!section) continue;
      const rest = parts[2] === "data" ? parts.slice(3) : parts.slice(2);
      (out.sections[section.key] ??= {})[rest.join(".") || "_form"] ??= msg;
    } else out.page._form ??= msg;
    out.count++;
  }
  return out;
}

const emptyToUndefined = (v: string) => (v.trim() === "" ? undefined : v);

export function toPageInput(page: PageMetaDraft) {
  return {
    slug: page.slug,
    title: page.title,
    status: page.status,
    seo: {
      title: emptyToUndefined(page.seo.title),
      description: emptyToUndefined(page.seo.description),
      ogImageId: page.seo.ogImageId || null,
      noindex: page.seo.noindex || undefined,
    },
  };
}

/** Draft data is loosely typed client-side; the action re-validates with `blockSchema`. */
export function toSaveSections(sections: readonly SectionDraft[]) {
  return sections.map((s) => ({
    id: s.id,
    visible: s.visible,
    ...({ type: s.type, data: s.data } as BlockInput),
  }));
}

/** Stable JSON for dirty checks (object key order independent). */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) =>
            a.localeCompare(b),
          ),
        )
      : v,
  );
}

export function snapshot(state: EditorState): string {
  return stableStringify({
    page: state.page,
    sections: state.sections.map((s) => ({
      id: s.id,
      type: s.type,
      data: s.data,
      visible: s.visible,
    })),
  });
}

export function isDirty(state: EditorState, savedSnapshot: string): boolean {
  return snapshot(state) !== savedSnapshot;
}

/** After a successful save: attach the new DB ids (same order as sent). */
export function applySavedIds(
  state: EditorState,
  ids: readonly string[],
): EditorState {
  return {
    ...state,
    sections: state.sections.map((s, i) => ({ ...s, id: ids[i] ?? s.id })),
  };
}
