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
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { normalizeLinkHref } from "./doc-utils";

/** Add / edit / remove a link. `onSubmit(null)` removes it. */
export function LinkDialog({
  open,
  initialHref,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  initialHref: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (href: string | null) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? (
          <LinkForm
            initialHref={initialHref}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function LinkForm({
  initialHref,
  onSubmit,
  onCancel,
}: {
  initialHref: string;
  onSubmit: (href: string | null) => void;
  onCancel: () => void;
}) {
  const [href, setHref] = useState(initialHref);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const v = normalizeLinkHref(href);
        if (!v) {
          setError(
            "Tautan harus diawali https://, http://, / (halaman situs) atau #.",
          );
          return;
        }
        onSubmit(v);
      }}
    >
      <DialogHeader>
        <DialogTitle>
          {initialHref ? "Ubah tautan" : "Sisipkan tautan"}
        </DialogTitle>
        <DialogDescription>
          Pilih teks dulu, lalu isi alamatnya. Tautan ke situs lain otomatis
          dibuka di tab baru.
        </DialogDescription>
      </DialogHeader>
      <Field data-invalid={error ? true : undefined} className="my-5">
        <FieldLabel htmlFor="rte-link-href">Alamat tautan</FieldLabel>
        <Input
          id="rte-link-href"
          value={href}
          autoFocus
          placeholder="https://… atau /produk"
          aria-invalid={error ? true : undefined}
          aria-describedby="rte-link-help"
          onChange={(e) => {
            setHref(e.target.value);
            setError(null);
          }}
        />
        <FieldDescription id="rte-link-help">
          Contoh: <code>/resep/tempe-mendoan</code>,{" "}
          <code>https://wa.me/62…</code>
        </FieldDescription>
        {error ? <FieldError>{error}</FieldError> : null}
      </Field>
      <DialogFooter className="gap-2">
        {initialHref ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onSubmit(null)}
            className="sm:mr-auto"
          >
            Hapus tautan
          </Button>
        ) : null}
        <Button type="button" variant="secondary" onClick={onCancel}>
          Batal
        </Button>
        <Button type="submit">Simpan</Button>
      </DialogFooter>
    </form>
  );
}
