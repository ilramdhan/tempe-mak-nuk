"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import { normalizeImageSrc } from "./doc-utils";

export type EditorMediaOption = { id: string; url: string; alt: string };

export type ImageInsert = {
  src: string;
  alt: string;
  title?: string;
  mediaId?: string | null;
};

const URL_MODE = "__url__";

export function ImageDialog({
  open,
  media,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  media: readonly EditorMediaOption[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (image: ImageInsert) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? (
          <ImageForm
            media={media}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ImageForm({
  media,
  onSubmit,
  onCancel,
}: {
  media: readonly EditorMediaOption[];
  onSubmit: (image: ImageInsert) => void;
  onCancel: () => void;
}) {
  const [source, setSource] = useState<string>(media[0]?.id ?? URL_MODE);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState(media[0]?.alt ?? "");
  const [caption, setCaption] = useState("");
  const [errors, setErrors] = useState<{ url?: string; alt?: string }>({});
  const picked = media.find((m) => m.id === source);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    const next: typeof errors = {};
    const src = picked ? picked.url : normalizeImageSrc(url);
    if (!src)
      next.url = "Alamat gambar harus diawali https:// atau / (berkas situs).";
    if (!alt.trim())
      next.alt = "Teks alternatif wajib diisi (aksesibilitas & SEO).";
    setErrors(next);
    if (next.url || next.alt || !src) return;
    onSubmit({
      src,
      alt: alt.trim(),
      title: caption.trim() || undefined,
      mediaId: picked?.id ?? null,
    });
  }

  return (
    <form noValidate onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>Sisipkan gambar</DialogTitle>
        <DialogDescription>
          Pilih dari media yang sudah diunggah, atau tempel alamat gambar.
        </DialogDescription>
      </DialogHeader>
      <FieldGroup className="my-5">
        <Field>
          <FieldLabel htmlFor="rte-img-source">Sumber</FieldLabel>
          <Select
            value={source}
            onValueChange={(v) => {
              setSource(v);
              const m = media.find((x) => x.id === v);
              if (m && !alt.trim()) setAlt(m.alt);
            }}
          >
            <SelectTrigger id="rte-img-source" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {media.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.alt || m.id.slice(0, 8)}
                </SelectItem>
              ))}
              <SelectItem value={URL_MODE}>Alamat (URL) lain…</SelectItem>
            </SelectContent>
          </Select>
          {media.length === 0 ? (
            <FieldDescription>
              Belum ada media. Unggah di menu Media, atau pakai URL.
            </FieldDescription>
          ) : null}
        </Field>
        {picked ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={picked.url}
            alt=""
            className="max-h-40 w-auto rounded-md border border-input object-contain"
          />
        ) : (
          <Field data-invalid={errors.url ? true : undefined}>
            <FieldLabel htmlFor="rte-img-url">Alamat gambar *</FieldLabel>
            <Input
              id="rte-img-url"
              value={url}
              placeholder="https://…"
              aria-invalid={errors.url ? true : undefined}
              onChange={(e) => setUrl(e.target.value)}
            />
            {errors.url ? <FieldError>{errors.url}</FieldError> : null}
          </Field>
        )}
        <Field data-invalid={errors.alt ? true : undefined}>
          <FieldLabel htmlFor="rte-img-alt">Teks alternatif (alt) *</FieldLabel>
          <Input
            id="rte-img-alt"
            value={alt}
            maxLength={200}
            aria-invalid={errors.alt ? true : undefined}
            onChange={(e) => setAlt(e.target.value)}
          />
          <FieldDescription>
            Jelaskan isi gambar, mis. “Tempe mendoan digoreng di wajan”.
          </FieldDescription>
          {errors.alt ? <FieldError>{errors.alt}</FieldError> : null}
        </Field>
        <Field>
          <FieldLabel htmlFor="rte-img-caption">
            Keterangan (opsional)
          </FieldLabel>
          <Input
            id="rte-img-caption"
            value={caption}
            maxLength={200}
            onChange={(e) => setCaption(e.target.value)}
          />
        </Field>
      </FieldGroup>
      <DialogFooter className="gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">Sisipkan</Button>
      </DialogFooter>
    </form>
  );
}
