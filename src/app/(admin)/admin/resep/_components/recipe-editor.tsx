"use client";

import { useCallback, useId } from "react";

import { RichTextEditor } from "@/components/admin/editor";
import type { RecipeDifficulty } from "@/db/schema/enums";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createRecipe,
  deleteRecipe,
  updateRecipe,
} from "@/features/recipes/actions";

import {
  ExcerptField,
  MediaSelect,
  OptionSelect,
  PublishFields,
  SeoFields,
  TitleSlugFields,
} from "../../jurnal/_shared/components/content-fields";
import {
  EditorFrame,
  Panel,
} from "../../jurnal/_shared/components/editor-frame";
import type {
  MediaOption,
  Option,
} from "../../jurnal/_shared/components/types";
import { useContentEditor } from "../../jurnal/_shared/components/use-content-editor";
import { withTitle } from "../../jurnal/_lib/post-draft";
import {
  DIFFICULTY_LABEL,
  recipeSnapshot,
  remapRowErrors,
  toRecipeInput,
  validateRecipeDraft,
  type RecipeDraft,
} from "../_lib/recipe-draft";
import { IngredientList, StepList } from "./recipe-lists";

export type RecipeEditorOptions = {
  media: MediaOption[];
  categories: Option[];
  products: Option[];
};

const DIFFICULTY_OPTIONS: Option[] = (
  Object.keys(DIFFICULTY_LABEL) as RecipeDifficulty[]
).map((k) => ({ value: k, label: DIFFICULTY_LABEL[k] }));

function NumberField({
  label,
  value,
  errorKey,
  errors,
  suffix,
  onChange,
}: {
  label: string;
  value: string;
  errorKey: string;
  errors: Record<string, string>;
  suffix?: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <Field data-invalid={errors[errorKey] ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        inputMode="numeric"
        value={value}
        aria-invalid={errors[errorKey] ? true : undefined}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
      />
      {suffix ? <FieldDescription>{suffix}</FieldDescription> : null}
      {errors[errorKey] ? <FieldError>{errors[errorKey]}</FieldError> : null}
    </Field>
  );
}

export function RecipeEditor({
  id,
  initial,
  options,
  live,
}: {
  id: string | null;
  initial: RecipeDraft;
  options: RecipeEditorOptions;
  live?: string | null;
}) {
  const validate = useCallback((d: RecipeDraft) => validateRecipeDraft(d), []);
  const { draft, update, errors, dirty, pending, submit, discard } =
    useContentEditor<RecipeDraft>({
      initial,
      id,
      basePath: "/admin/resep",
      label: "Resep",
      snapshot: recipeSnapshot,
      validate,
      mapServerErrors: remapRowErrors,
      save: (d) =>
        id
          ? updateRecipe(id, toRecipeInput(d))
          : createRecipe(toRecipeInput(d)),
    });
  const set = <K extends keyof RecipeDraft>(k: K, v: RecipeDraft[K]) =>
    update((d) => ({ ...d, [k]: v }));
  const tipsId = useId();

  return (
    <EditorFrame
      dirty={dirty}
      pending={pending}
      errors={errors}
      publicHref={live ? `/resep/${live}` : null}
      onSave={submit}
      onDiscard={discard}
      deleteConfig={
        id
          ? {
              title: initial.title,
              entityLabel: "resep",
              listHref: "/admin/resep",
              onDelete: () => deleteRecipe(id),
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
            basePath="/resep"
            titleLabel="Nama resep"
            onTitle={(v) => update((d) => withTitle(d, v))}
            onSlug={(slug, slugAuto) =>
              update((d) => ({ ...d, slug, slugAuto }))
            }
          />
          <ExcerptField
            value={draft.excerpt}
            errors={errors}
            label="Pengantar singkat"
            onChange={(v) => set("excerpt", v)}
          />
          <Panel title="Waktu & porsi">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <NumberField
                label="Persiapan"
                suffix="menit"
                value={draft.prepMinutes}
                errorKey="prepMinutes"
                errors={errors}
                onChange={(v) => set("prepMinutes", v)}
              />
              <NumberField
                label="Memasak"
                suffix="menit"
                value={draft.cookMinutes}
                errorKey="cookMinutes"
                errors={errors}
                onChange={(v) => set("cookMinutes", v)}
              />
              <NumberField
                label="Porsi"
                suffix="orang"
                value={draft.servings}
                errorKey="servings"
                errors={errors}
                onChange={(v) => set("servings", v)}
              />
              <OptionSelect
                label="Kesulitan"
                value={draft.difficulty}
                options={DIFFICULTY_OPTIONS}
                noneLabel="Tidak ditentukan"
                errorKey="difficulty"
                errors={errors}
                onChange={(v) =>
                  set("difficulty", v as RecipeDifficulty | null)
                }
              />
            </div>
          </Panel>
          <Panel title="Bahan">
            <IngredientList
              value={draft.ingredients}
              errors={errors}
              onChange={(v) => set("ingredients", v)}
            />
          </Panel>
          <Panel title="Langkah">
            <StepList
              value={draft.steps}
              errors={errors}
              media={options.media}
              onChange={(v) => set("steps", v)}
            />
          </Panel>
          <Field data-invalid={errors.content ? true : undefined}>
            <FieldLabel htmlFor={tipsId}>Tips dan catatan</FieldLabel>
            <RichTextEditor
              id={tipsId}
              value={draft.content}
              media={options.media}
              invalid={!!errors.content}
              ariaDescribedBy={`${tipsId}-desc`}
              placeholder="Tips memilih tempe, variasi, cara menyimpan…"
              onChange={(v) => set("content", v)}
            />
            <FieldDescription id={`${tipsId}-desc`}>
              Tampil di bawah langkah dengan judul “Tips dan catatan”.
            </FieldDescription>
            {errors.content ? <FieldError>{errors.content}</FieldError> : null}
          </Field>
          <Panel
            title="SEO"
            description="Cara resep tampil di Google & saat dibagikan."
          >
            <SeoFields
              seo={draft.seo}
              errors={errors}
              media={options.media}
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
              media={options.media}
              errors={errors}
              errorKey="coverMediaId"
              onChange={(v) => set("coverMediaId", v)}
            />
          </Panel>
          <Panel title="Kategori & produk">
            <OptionSelect
              label="Kategori"
              value={draft.categoryId}
              options={options.categories}
              noneLabel="Tanpa kategori"
              errorKey="categoryId"
              errors={errors}
              onChange={(v) => set("categoryId", v)}
            />
            <OptionSelect
              label="Produk terkait"
              value={draft.productId}
              options={options.products}
              noneLabel="Tidak ada"
              errorKey="productId"
              errors={errors}
              description="Ditampilkan sebagai “Tempe yang dipakai”."
              onChange={(v) => set("productId", v)}
            />
          </Panel>
        </>
      }
    />
  );
}
