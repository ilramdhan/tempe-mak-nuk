"use client";

import { useCallback, useId } from "react";

import { RichTextEditor } from "@/components/admin/editor";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createPost, deletePost, updatePost } from "@/features/posts/actions";

import {
  ExcerptField,
  MediaSelect,
  OptionSelect,
  PublishFields,
  SeoFields,
  TitleSlugFields,
} from "../_shared/components/content-fields";
import { EditorFrame, Panel } from "../_shared/components/editor-frame";
import type { Option } from "../_shared/components/types";
import { useContentEditor } from "../_shared/components/use-content-editor";
import {
  postSnapshot,
  toPostInput,
  validatePostDraft,
  withTitle,
  type PostDraft,
} from "../_lib/post-draft";

export type PostEditorOptions = {
  categories: Option[];
  tags: Option[];
};

export function PostEditor({
  id,
  initial,
  options,
  live,
}: {
  id: string | null;
  initial: PostDraft;
  options: PostEditorOptions;
  /** Saved slug when currently visible on the site. */
  live?: string | null;
}) {
  const validate = useCallback((d: PostDraft) => validatePostDraft(d), []);
  const { draft, update, errors, dirty, pending, submit, discard } =
    useContentEditor<PostDraft>({
      initial,
      id,
      basePath: "/admin/jurnal",
      label: "Artikel",
      snapshot: postSnapshot,
      validate,
      save: (d) =>
        id ? updatePost(id, toPostInput(d)) : createPost(toPostInput(d)),
    });
  const set = <K extends keyof PostDraft>(k: K, v: PostDraft[K]) =>
    update((d) => ({ ...d, [k]: v }));
  const contentId = useId();
  const rmId = useId();

  return (
    <EditorFrame
      dirty={dirty}
      pending={pending}
      errors={errors}
      publicHref={live ? `/jurnal/${live}` : null}
      onSave={submit}
      onDiscard={discard}
      deleteConfig={
        id
          ? {
              title: initial.title,
              entityLabel: "artikel",
              listHref: "/admin/jurnal",
              onDelete: () => deletePost(id),
            }
          : undefined
      }
      main={
        <>
          <TitleSlugFields
            title={draft.title}
            slug={draft.slug}
            slugAuto={draft.slugAuto}
            errors={errors}
            basePath="/jurnal"
            onTitle={(v) => update((d) => withTitle(d, v))}
            onSlug={(slug, slugAuto) =>
              update((d) => ({ ...d, slug, slugAuto }))
            }
          />
          <ExcerptField
            value={draft.excerpt}
            errors={errors}
            onChange={(v) => set("excerpt", v)}
          />
          <Field data-invalid={errors.content ? true : undefined}>
            <FieldLabel htmlFor={contentId}>Isi artikel</FieldLabel>
            <RichTextEditor
              id={contentId}
              value={draft.content}
              invalid={!!errors.content}
              ariaDescribedBy={`${contentId}-desc`}
              placeholder="Mulai menulis… gunakan Subjudul (H2) untuk membagi bagian."
              minHeightClassName="min-h-96"
              onChange={(v) => set("content", v)}
            />
            <FieldDescription id={`${contentId}-desc`}>
              Judul artikel sudah jadi H1; mulai bagian dengan H2. Subjudul
              membentuk daftar isi.
            </FieldDescription>
            {errors.content ? <FieldError>{errors.content}</FieldError> : null}
          </Field>
          <Panel
            title="SEO"
            description="Cara artikel tampil di Google & saat dibagikan."
          >
            <SeoFields
              seo={draft.seo}
              errors={errors}
              fallbackTitle={draft.title}
              onChange={(v) => set("seo", v)}
            />
          </Panel>
        </>
      }
      aside={
        <>
          <Panel title="Terbit">
            <PublishFields
              status={draft.status}
              publishedAt={draft.publishedAt}
              errors={errors}
              onStatus={(v) => set("status", v)}
              onPublishedAt={(v) => set("publishedAt", v)}
            />
          </Panel>
          <Panel title="Sampul">
            <MediaSelect
              label="Gambar sampul"
              value={draft.coverMediaId}
              errors={errors}
              errorKey="coverMediaId"
              onChange={(v) => set("coverMediaId", v)}
            />
          </Panel>
          <Panel title="Kategori & tag">
            <OptionSelect
              label="Kategori"
              value={draft.categoryId}
              options={options.categories}
              noneLabel="Tanpa kategori"
              errorKey="categoryId"
              errors={errors}
              onChange={(v) => set("categoryId", v)}
            />
            <TagPicker
              value={draft.tagIds}
              options={options.tags}
              error={errors.tagIds}
              onChange={(v) => set("tagIds", v)}
            />
            <Field data-invalid={errors.readingMinutes ? true : undefined}>
              <FieldLabel htmlFor={rmId}>Waktu baca (menit)</FieldLabel>
              <Input
                id={rmId}
                inputMode="numeric"
                value={draft.readingMinutes}
                placeholder="otomatis"
                aria-invalid={errors.readingMinutes ? true : undefined}
                onChange={(e) =>
                  set("readingMinutes", e.target.value.replace(/[^\d]/g, ""))
                }
              />
              <FieldDescription>
                Kosong = dihitung dari isi (±200 kata/menit).
              </FieldDescription>
              {errors.readingMinutes ? (
                <FieldError>{errors.readingMinutes}</FieldError>
              ) : null}
            </Field>
          </Panel>
        </>
      }
    />
  );
}

function TagPicker({
  value,
  options,
  error,
  onChange,
}: {
  value: string[];
  options: Option[];
  error?: string;
  onChange: (v: string[]) => void;
}) {
  const base = useId();
  const selected = new Set(value);
  return (
    <FieldSet data-invalid={error ? true : undefined}>
      <FieldLegend variant="label">Tag</FieldLegend>
      {options.length === 0 ? (
        <FieldDescription>Belum ada tag.</FieldDescription>
      ) : (
        <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
          {options.map((t, i) => (
            <Field key={t.value} orientation="horizontal">
              <Checkbox
                id={`${base}-${i}`}
                checked={selected.has(t.value)}
                onCheckedChange={(c) =>
                  onChange(
                    c
                      ? [...value, t.value].sort()
                      : value.filter((v) => v !== t.value),
                  )
                }
              />
              <FieldLabel htmlFor={`${base}-${i}`} className="font-normal">
                {t.label}
              </FieldLabel>
            </Field>
          ))}
        </div>
      )}
      {error ? <FieldError>{error}</FieldError> : null}
    </FieldSet>
  );
}
