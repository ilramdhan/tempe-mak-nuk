"use client";

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

import type { FieldErrors, PageMetaDraft } from "../_lib/editor-state";
import type { Path } from "../_lib/path";
import type { BuilderOptions } from "./types";

const NONE = "__none__";

function Counter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <span className={over ? "text-destructive" : undefined}>
      {value.length}/{max}
    </span>
  );
}

/** Page title / slug / status + SEO meta. */
export function PageMetaForm({
  page,
  errors,
  media,
  isHome,
  onChange,
}: {
  page: PageMetaDraft;
  errors: FieldErrors;
  media: BuilderOptions["media"];
  isHome: boolean;
  onChange: (path: Path, value: unknown) => void;
}) {
  const err = (k: string) => errors[k];
  const inv = (k: string) => (errors[k] ? true : undefined);
  return (
    <FieldGroup>
      {errors._form ? <FieldError>{errors._form}</FieldError> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={inv("title")}>
          <FieldLabel htmlFor="page-title">Judul halaman *</FieldLabel>
          <Input
            id="page-title"
            value={page.title}
            maxLength={160}
            aria-invalid={inv("title")}
            onChange={(e) => onChange(["title"], e.target.value)}
          />
          <FieldDescription>
            Dipakai di admin, breadcrumb, dan judul tab bila judul SEO kosong.
          </FieldDescription>
          {err("title") ? <FieldError>{err("title")}</FieldError> : null}
        </Field>
        <Field data-invalid={inv("slug")}>
          <FieldLabel htmlFor="page-slug">Slug *</FieldLabel>
          <Input
            id="page-slug"
            value={page.slug}
            readOnly={isHome}
            aria-invalid={inv("slug")}
            onChange={(e) => onChange(["slug"], e.target.value.toLowerCase())}
          />
          <FieldDescription>
            {isHome
              ? "Slug beranda tidak bisa diubah."
              : "Harus sama dengan rute situs (mis. tentang). Mengubah slug tanpa redirect akan memutus tautan lama."}
          </FieldDescription>
          {err("slug") ? <FieldError>{err("slug")}</FieldError> : null}
        </Field>
        <Field data-invalid={inv("status")}>
          <FieldLabel htmlFor="page-status">Status</FieldLabel>
          <Select
            value={page.status}
            onValueChange={(v) => onChange(["status"], v)}
          >
            <SelectTrigger id="page-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="published">Terbit</SelectItem>
              <SelectItem value="draft">
                Draf (tidak tampil di situs)
              </SelectItem>
            </SelectContent>
          </Select>
          {err("status") ? <FieldError>{err("status")}</FieldError> : null}
        </Field>
      </div>

      <Field data-invalid={inv("seo.title")}>
        <FieldLabel htmlFor="seo-title">Judul SEO</FieldLabel>
        <Input
          id="seo-title"
          value={page.seo.title}
          aria-invalid={inv("seo.title")}
          onChange={(e) => onChange(["seo", "title"], e.target.value)}
        />
        <FieldDescription>
          Judul di hasil Google (ideal 50–60 karakter). Kosong = judul halaman.{" "}
          <Counter value={page.seo.title} max={70} />
        </FieldDescription>
        {err("seo.title") ? <FieldError>{err("seo.title")}</FieldError> : null}
      </Field>
      <Field data-invalid={inv("seo.description")}>
        <FieldLabel htmlFor="seo-desc">Deskripsi SEO</FieldLabel>
        <Textarea
          id="seo-desc"
          rows={3}
          value={page.seo.description}
          aria-invalid={inv("seo.description")}
          onChange={(e) => onChange(["seo", "description"], e.target.value)}
        />
        <FieldDescription>
          Ringkasan 1–2 kalimat (ideal 120–160 karakter). Kosong = deskripsi
          default situs. <Counter value={page.seo.description} max={170} />
        </FieldDescription>
        {err("seo.description") ? (
          <FieldError>{err("seo.description")}</FieldError>
        ) : null}
      </Field>
      <Field data-invalid={inv("seo.ogImageId")}>
        <FieldLabel htmlFor="seo-og">Gambar berbagi (OG)</FieldLabel>
        <Select
          value={page.seo.ogImageId ?? NONE}
          onValueChange={(v) =>
            onChange(["seo", "ogImageId"], v === NONE ? null : v)
          }
        >
          <SelectTrigger id="seo-og" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Default situs</SelectItem>
            {page.seo.ogImageId &&
            !media.some((m) => m.id === page.seo.ogImageId) ? (
              <SelectItem value={page.seo.ogImageId}>
                ID {page.seo.ogImageId.slice(0, 8)}… (tidak ditemukan)
              </SelectItem>
            ) : null}
            {media.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.alt || m.id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {err("seo.ogImageId") ? (
          <FieldError>{err("seo.ogImageId")}</FieldError>
        ) : null}
      </Field>
      <Field orientation="horizontal">
        <Switch
          id="seo-noindex"
          checked={page.seo.noindex}
          onCheckedChange={(v) => onChange(["seo", "noindex"], v)}
        />
        <div className="flex flex-col gap-0.5">
          <FieldLabel htmlFor="seo-noindex">
            Sembunyikan dari mesin pencari (noindex)
          </FieldLabel>
          <FieldDescription>
            Halaman tetap bisa dibuka, tapi tidak diindeks Google.
          </FieldDescription>
        </div>
      </Field>
    </FieldGroup>
  );
}
