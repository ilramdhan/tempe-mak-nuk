"use client";

import { useState } from "react";

import { MediaPicker, type MediaLibraryItem } from "@/components/admin/media-picker";
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

import { normalizeImageSrc } from "./doc-utils";

export type ImageInsert = {
  src: string;
  alt: string;
  title?: string;
  mediaId?: string | null;
};

export function ImageDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (image: ImageInsert) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? (
          <ImageForm
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ImageForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (image: ImageInsert) => void;
  onCancel: () => void;
}) {
  const [picked, setPicked] = useState<Pick<MediaLibraryItem, "id" | "url" | "alt"> | null>(null);
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [errors, setErrors] = useState<{ url?: string; alt?: string }>({});

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
          <MediaPicker
            id="rte-img-source"
            value={picked?.id ?? null}
            initialItem={picked}
            noneLabel="Belum dipilih — atau isi alamat gambar di bawah"
            onChange={(id, item) => {
              setPicked(item);
              if (item && !alt.trim()) setAlt(item.alt);
            }}
          />
        </Field>
        {picked ? null : (
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
