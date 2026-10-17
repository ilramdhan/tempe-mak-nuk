/** Post editor state ↔ `PostInput` (pure; unit-tested). */
import { toStoredDoc } from "@/components/admin/editor/doc-utils";
import { postInputSchema, type PostInput } from "@/features/posts/schema";
import type { TiptapDoc } from "@/lib/rich-text/schema";

import {
  numberOrNull,
  numberToInput,
  seoFromDb,
  seoToInput,
  stableStringify,
  validateWith,
  type FieldErrors,
  type SeoDraft,
} from "../_shared/lib/form";
import {
  checkPublish,
  publishedAtForSave,
  toWibInput,
  type ContentStatus,
} from "../_shared/lib/publish";
import { slugify } from "../_shared/lib/slug";

export type PostDraft = {
  title: string;
  slug: string;
  /** Slug follows the title until edited by hand (new posts only). */
  slugAuto: boolean;
  excerpt: string;
  content: TiptapDoc | null;
  coverMediaId: string | null;
  categoryId: string | null;
  status: ContentStatus;
  /** "YYYY-MM-DDTHH:mm" in WIB, or "". */
  publishedAt: string;
  readingMinutes: string;
  seo: SeoDraft;
  tagIds: string[];
};

export type PostRecord = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: TiptapDoc | null;
  coverMediaId: string | null;
  categoryId: string | null;
  status: ContentStatus;
  publishedAt: Date | string | null;
  readingMinutes: number | null;
  seo: Parameters<typeof seoFromDb>[0];
  tagIds: string[];
};

export function emptyPostDraft(): PostDraft {
  return {
    title: "",
    slug: "",
    slugAuto: true,
    excerpt: "",
    content: null,
    coverMediaId: null,
    categoryId: null,
    status: "draft",
    publishedAt: "",
    readingMinutes: "",
    seo: seoFromDb(null),
    tagIds: [],
  };
}

export function postDraftFromRecord(r: PostRecord): PostDraft {
  return {
    title: r.title,
    slug: r.slug,
    slugAuto: false,
    excerpt: r.excerpt ?? "",
    content: r.content,
    coverMediaId: r.coverMediaId,
    categoryId: r.categoryId,
    status: r.status,
    publishedAt: toWibInput(r.publishedAt),
    readingMinutes: numberToInput(r.readingMinutes),
    seo: seoFromDb(r.seo),
    tagIds: [...r.tagIds].sort(),
  };
}

/** Title edit that keeps an auto slug in sync. */
export function withTitle<
  T extends { title: string; slug: string; slugAuto: boolean },
>(draft: T, title: string): T {
  return {
    ...draft,
    title,
    slug: draft.slugAuto ? slugify(title) : draft.slug,
  };
}

export function toPostInput(d: PostDraft): PostInput {
  return {
    slug: d.slug.trim(),
    title: d.title,
    excerpt: d.excerpt,
    content: d.content,
    coverMediaId: d.coverMediaId,
    categoryId: d.categoryId,
    status: d.status,
    publishedAt: publishedAtForSave(d.publishedAt),
    readingMinutes: numberOrNull(
      d.readingMinutes,
    ) as PostInput["readingMinutes"],
    seo: seoToInput(d.seo),
    tagIds: d.tagIds,
  };
}

export function validatePostDraft(d: PostDraft, now = new Date()): FieldErrors {
  const errors = validateWith(postInputSchema, toPostInput(d));
  const pub = checkPublish(d.status, d.publishedAt, now);
  if (pub.error) errors.publishedAt ??= pub.error;
  return errors;
}

export function postSnapshot(d: PostDraft): string {
  const { slugAuto: _ignored, ...rest } = d;
  void _ignored;
  return stableStringify({
    ...rest,
    content: toStoredDoc(rest.content),
    tagIds: [...rest.tagIds].sort(),
  });
}
