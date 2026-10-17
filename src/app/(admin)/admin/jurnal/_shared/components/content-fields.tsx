"use client";

/**
 * Shared fields for the Jurnal & Resep editors: title+slug, publish (status/date WIB),
 * cover/media select, SEO. Pure controlled components: value in, onChange out.
 */
import { useId } from "react";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import type { FieldErrors, SeoDraft } from "../lib/form";
import {
  checkPublish,
  fromWibInput,
  formatWib,
  type ContentStatus,
} from "../lib/publish";
import { cleanSlugInput, slugify } from "../lib/slug";
import type { MediaOption, Option } from "./types";

const NONE = "__none__";

export function Counter({
  value,
  max,
  ideal,
}: {
  value: string;
  max: number;
  ideal?: [number, number];
}) {
  const n = value.length;
  const over = n > max;
  const good = ideal && n >= ideal[0] && n <= ideal[1];
  return (
    <span
      className={over ? "text-destructive" : good ? "text-halal" : undefined}
      aria-live="polite"
    >
      {n}/{max}
    </span>
  );
}

const errProps = (errors: FieldErrors, key: string, id: string) => ({
  "aria-invalid": errors[key] ? (true as const) : undefined,
  "aria-describedby": [`${id}-desc`, errors[key] ? `${id}-err` : null]
    .filter(Boolean)
    .join(" "),
});

function Err({
  errors,
  k,
  id,
}: {
  errors: FieldErrors;
  k: string;
  id: string;
}) {
  return errors[k] ? (
    <FieldError id={`${id}-err`}>{errors[k]}</FieldError>
  ) : null;
}

export function TitleSlugFields({
  title,
  slug,
  slugAuto,
  errors,
  basePath,
  titleLabel = "Judul",
  onTitle,
  onSlug,
}: {
  title: string;
  slug: string;
  slugAuto: boolean;
  errors: FieldErrors;
  /** Public route prefix, e.g. "/jurnal". */
  basePath: string;
  titleLabel?: string;
  onTitle: (v: string) => void;
  onSlug: (v: string, auto: boolean) => void;
}) {
  const tid = useId();
  const sid = useId();
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field data-invalid={errors.title ? true : undefined}>
        <FieldLabel htmlFor={tid}>{titleLabel} *</FieldLabel>
        <Input
          id={tid}
          value={title}
          maxLength={160}
          {...errProps(errors, "title", tid)}
          onChange={(e) => onTitle(e.target.value)}
        />
        <FieldDescription id={`${tid}-desc`}>
          <Counter value={title} max={160} />
        </FieldDescription>
        <Err errors={errors} k="title" id={tid} />
      </Field>
      <Field data-invalid={errors.slug ? true : undefined}>
        <FieldLabel htmlFor={sid}>Slug (alamat) *</FieldLabel>
        <Input
          id={sid}
          value={slug}
          maxLength={120}
          {...errProps(errors, "slug", sid)}
          onChange={(e) => onSlug(cleanSlugInput(e.target.value), false)}
          onBlur={() => onSlug(slugify(slug), slugAuto)}
        />
        <FieldDescription id={`${sid}-desc`}>
          {basePath}/{slug || "…"} ·{" "}
          {slugAuto ? (
            "mengikuti judul"
          ) : (
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => onSlug(slugify(title), true)}
            >
              buat ulang dari judul
            </button>
          )}
          . Mengubah slug konten yang sudah terbit memutus tautan lama.
        </FieldDescription>
        <Err errors={errors} k="slug" id={sid} />
      </Field>
    </div>
  );
}

export function ExcerptField({
  value,
  errors,
  onChange,
  label = "Ringkasan",
  description = "Tampil di kartu daftar & dipakai sebagai deskripsi bila deskripsi SEO kosong.",
}: {
  value: string;
  errors: FieldErrors;
  onChange: (v: string) => void;
  label?: string;
  description?: string;
}) {
  const id = useId();
  return (
    <Field data-invalid={errors.excerpt ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Textarea
        id={id}
        rows={3}
        value={value}
        {...errProps(errors, "excerpt", id)}
        onChange={(e) => onChange(e.target.value)}
      />
      <FieldDescription id={`${id}-desc`}>
        {description} <Counter value={value} max={400} ideal={[80, 200]} />
      </FieldDescription>
      <Err errors={errors} k="excerpt" id={id} />
    </Field>
  );
}

export const STATUS_LABEL: Record<ContentStatus, string> = {
  draft: "Draf (tidak tampil)",
  published: "Terbit",
  scheduled: "Terjadwal",
};

export function PublishFields({
  status,
  publishedAt,
  errors,
  onStatus,
  onPublishedAt,
}: {
  status: ContentStatus;
  publishedAt: string;
  errors: FieldErrors;
  onStatus: (v: ContentStatus) => void;
  onPublishedAt: (v: string) => void;
}) {
  const sid = useId();
  const did = useId();
  const { warning } = checkPublish(status, publishedAt);
  const parsed = fromWibInput(publishedAt);
  return (
    <FieldGroup>
      <Field data-invalid={errors.status ? true : undefined}>
        <FieldLabel htmlFor={sid}>Status</FieldLabel>
        <Select
          value={status}
          onValueChange={(v) => onStatus(v as ContentStatus)}
        >
          <SelectTrigger id={sid} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_LABEL) as ContentStatus[]).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Err errors={errors} k="status" id={sid} />
      </Field>
      <Field data-invalid={errors.publishedAt ? true : undefined}>
        <FieldLabel htmlFor={did}>
          Tanggal terbit (WIB){status === "scheduled" ? " *" : ""}
        </FieldLabel>
        <Input
          id={did}
          type="datetime-local"
          value={publishedAt}
          {...errProps(errors, "publishedAt", did)}
          onChange={(e) => onPublishedAt(e.target.value)}
        />
        <FieldDescription id={`${did}-desc`}>
          {status === "scheduled"
            ? "Konten tampil otomatis pada waktu ini (Asia/Jakarta)."
            : status === "published"
              ? "Kosong = sekarang saat disimpan."
              : "Opsional; dipakai saat nanti diterbitkan."}
          {parsed ? <> · {formatWib(parsed)}</> : null}
          {warning ? (
            <span className="mt-1 block text-accent-strong">{warning}</span>
          ) : null}
        </FieldDescription>
        <Err errors={errors} k="publishedAt" id={did} />
      </Field>
    </FieldGroup>
  );
}

/** Simple select over existing options with a "none" choice and a missing-id fallback. */
export function OptionSelect({
  label,
  value,
  options,
  noneLabel,
  errorKey,
  errors,
  description,
  onChange,
}: {
  label: string;
  value: string | null;
  options: readonly Option[];
  noneLabel: string;
  errorKey: string;
  errors: FieldErrors;
  description?: React.ReactNode;
  onChange: (v: string | null) => void;
}) {
  const id = useId();
  const missing = value && !options.some((o) => o.value === value);
  return (
    <Field data-invalid={errors[errorKey] ? true : undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={value ?? NONE}
        onValueChange={(v) => onChange(v === NONE ? null : v)}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={errors[errorKey] ? true : undefined}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{noneLabel}</SelectItem>
          {missing ? (
            <SelectItem value={value}>
              ID {value.slice(0, 8)}… (tidak ditemukan)
            </SelectItem>
          ) : null}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <Err errors={errors} k={errorKey} id={id} />
    </Field>
  );
}

export const mediaOptions = (media: readonly MediaOption[]): Option[] =>
  media.map((m) => ({ value: m.id, label: m.alt || m.id.slice(0, 8) }));

/** Cover image picker (existing media by id) with preview. */
export function MediaSelect({
  label,
  value,
  media,
  errors,
  errorKey,
  noneLabel = "Tanpa gambar",
  description,
  onChange,
}: {
  label: string;
  value: string | null;
  media: readonly MediaOption[];
  errors: FieldErrors;
  errorKey: string;
  noneLabel?: string;
  description?: React.ReactNode;
  onChange: (v: string | null) => void;
}) {
  const picked = media.find((m) => m.id === value);
  return (
    <div className="flex flex-col gap-3">
      <OptionSelect
        label={label}
        value={value}
        options={mediaOptions(media)}
        noneLabel={noneLabel}
        errorKey={errorKey}
        errors={errors}
        description={
          description ??
          (media.length ? undefined : "Belum ada media — unggah di menu Media.")
        }
        onChange={onChange}
      />
      {picked ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={picked.url}
          alt={`Pratinjau: ${picked.alt}`}
          className="aspect-video w-full max-w-sm rounded-md border border-input object-cover"
        />
      ) : null}
    </div>
  );
}

export function SeoFields({
  seo,
  errors,
  media,
  fallbackTitle,
  onChange,
}: {
  seo: SeoDraft;
  errors: FieldErrors;
  media: readonly MediaOption[];
  fallbackTitle: string;
  onChange: (next: SeoDraft) => void;
}) {
  const tid = useId();
  const did = useId();
  const nid = useId();
  const set = <K extends keyof SeoDraft>(k: K, v: SeoDraft[K]) =>
    onChange({ ...seo, [k]: v });
  return (
    <FieldGroup>
      <Field data-invalid={errors["seo.title"] ? true : undefined}>
        <FieldLabel htmlFor={tid}>Judul SEO</FieldLabel>
        <Input
          id={tid}
          value={seo.title}
          placeholder={fallbackTitle}
          {...errProps(errors, "seo.title", tid)}
          onChange={(e) => set("title", e.target.value)}
        />
        <FieldDescription id={`${tid}-desc`}>
          Judul di hasil Google (ideal 50–60 karakter). Kosong = judul konten.{" "}
          <Counter value={seo.title} max={70} ideal={[50, 60]} />
        </FieldDescription>
        <Err errors={errors} k="seo.title" id={tid} />
      </Field>
      <Field data-invalid={errors["seo.description"] ? true : undefined}>
        <FieldLabel htmlFor={did}>Deskripsi SEO</FieldLabel>
        <Textarea
          id={did}
          rows={3}
          value={seo.description}
          {...errProps(errors, "seo.description", did)}
          onChange={(e) => set("description", e.target.value)}
        />
        <FieldDescription id={`${did}-desc`}>
          1–2 kalimat (ideal 120–160 karakter). Kosong = ringkasan.{" "}
          <Counter value={seo.description} max={170} ideal={[120, 160]} />
        </FieldDescription>
        <Err errors={errors} k="seo.description" id={did} />
      </Field>
      <MediaSelect
        label="Gambar berbagi (OG)"
        value={seo.ogImageId}
        media={media}
        errors={errors}
        errorKey="seo.ogImageId"
        noneLabel="Pakai gambar sampul / default situs"
        onChange={(v) => set("ogImageId", v)}
      />
      <Field orientation="horizontal">
        <Switch
          id={nid}
          checked={seo.noindex}
          onCheckedChange={(v) => set("noindex", v)}
        />
        <div className="flex flex-col gap-0.5">
          <FieldLabel htmlFor={nid}>
            Sembunyikan dari mesin pencari (noindex)
          </FieldLabel>
          <FieldDescription>
            Tetap bisa dibuka lewat tautan, tapi tidak diindeks Google.
          </FieldDescription>
        </div>
      </Field>
    </FieldGroup>
  );
}
