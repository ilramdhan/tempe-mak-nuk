"use client";

import { LoaderCircle } from "lucide-react";
import { useId, useState } from "react";

import { RichTextEditor } from "@/components/admin/editor";
import { Button } from "@/components/ui/button";
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
import { updateLegalDocument } from "@/features/legal/actions";
import { legalDocumentInputSchema } from "@/features/legal/schema";
import type { TiptapDoc } from "@/lib/rich-text/schema";

import { useUnsavedGuard } from "../../halaman/_components/use-unsaved-guard";
import { formatWib, fromWibInput } from "../../jurnal/_shared/lib/publish";
import { useAdminMutation } from "../../slot/_components/use-action";
import {
  docDraftFrom,
  docToInput,
  fromServerErrors,
  isDocDirty,
  isSampleContent,
  STATUS_LABEL,
  validateDoc,
  validateWith,
  type DocDraft,
  type FieldErrors,
  type LegalSlugKey,
  type LegalStatus,
} from "../_lib/legal-form";

type Props = {
  id: string;
  slug: LegalSlugKey;
  version: number;
  initial: {
    title: string;
    content: unknown;
    effectiveAt: string | null;
    status: LegalStatus;
  };
};

export function DocumentEditor({ id, slug, version, initial }: Props) {
  const uid = useId();
  const start = docDraftFrom(initial);
  const [draft, setDraft] = useState<DocDraft>(start);
  const [base, setBase] = useState<DocDraft>(start);
  const [errors, setErrors] = useState<FieldErrors>({});
  const { pending, run } = useAdminMutation();

  const dirty = isDocDirty(draft, base);
  useUnsavedGuard(dirty);
  const sample = isSampleContent(draft.content);
  const parsed = fromWibInput(draft.effectiveAt);
  const set = <K extends keyof DocDraft>(k: K, v: DocDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    const input = docToInput(slug, version, draft);
    const next = {
      ...validateDoc(draft),
      ...validateWith(legalDocumentInputSchema, input),
    };
    setErrors(next);
    if (Object.keys(next).length) return;
    const snapshot = draft;
    run(() => updateLegalDocument(id, input), {
      success:
        draft.status === "published"
          ? "Dokumen disimpan dan terbit."
          : "Draf disimpan.",
      onDone: (res) => {
        if (res.ok) setBase(snapshot);
        else setErrors(fromServerErrors(res.fieldErrors));
      },
    });
  }

  const tid = `${uid}-title`;
  const did = `${uid}-date`;
  const sid = `${uid}-status`;
  const cid = `${uid}-content`;

  return (
    <form
      onSubmit={save}
      noValidate
      className="flex flex-col gap-6 rounded-lg border border-border bg-card p-4 sm:p-6"
    >
      {sample ? (
        <p
          role="note"
          className="rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          Dokumen contoh — perlu ditinjau ahli hukum. Hapus penanda ini dari isi
          setelah ditinjau.
        </p>
      ) : null}
      {errors._form ? (
        <p role="alert" className="text-sm text-destructive">
          {errors._form}
        </p>
      ) : null}
      <fieldset disabled={pending} className="contents">
        <FieldGroup>
          <Field data-invalid={errors.title ? true : undefined}>
            <FieldLabel htmlFor={tid}>Judul</FieldLabel>
            <Input
              id={tid}
              value={draft.title}
              maxLength={160}
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? `${tid}-err` : undefined}
              onChange={(e) => set("title", e.target.value)}
            />
            {errors.title ? (
              <FieldError id={`${tid}-err`}>{errors.title}</FieldError>
            ) : null}
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor={`${uid}-ver`}>Versi</FieldLabel>
              <Input
                id={`${uid}-ver`}
                value={version}
                readOnly
                aria-describedby={`${uid}-ver-d`}
              />
              <FieldDescription id={`${uid}-ver-d`}>
                Untuk perubahan material, buat versi baru dari daftar.
              </FieldDescription>
            </Field>
            <Field data-invalid={errors.effectiveAt ? true : undefined}>
              <FieldLabel htmlFor={did}>Tanggal berlaku (WIB)</FieldLabel>
              <Input
                id={did}
                type="datetime-local"
                value={draft.effectiveAt}
                aria-invalid={errors.effectiveAt ? true : undefined}
                aria-describedby={`${did}-d${errors.effectiveAt ? ` ${did}-err` : ""}`}
                onChange={(e) => set("effectiveAt", e.target.value)}
              />
              <FieldDescription id={`${did}-d`}>
                {parsed
                  ? formatWib(parsed)
                  : "Kosong = berlaku segera setelah terbit."}
              </FieldDescription>
              {errors.effectiveAt ? (
                <FieldError id={`${did}-err`}>{errors.effectiveAt}</FieldError>
              ) : null}
            </Field>
            <Field data-invalid={errors.status ? true : undefined}>
              <FieldLabel htmlFor={sid}>Status</FieldLabel>
              <Select
                value={draft.status}
                onValueChange={(v) => set("status", v as LegalStatus)}
              >
                <SelectTrigger id={sid} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABEL) as LegalStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status ? <FieldError>{errors.status}</FieldError> : null}
            </Field>
          </div>
          <Field data-invalid={errors.content ? true : undefined}>
            <FieldLabel htmlFor={cid}>Isi dokumen</FieldLabel>
            <RichTextEditor
              id={cid}
              value={draft.content as TiptapDoc | null}
              onChange={(v) => set("content", v)}
              invalid={!!errors.content}
              ariaDescribedBy={errors.content ? `${cid}-err` : undefined}
              minHeightClassName="min-h-96"
            />
            {errors.content ? (
              <FieldError id={`${cid}-err`}>{errors.content}</FieldError>
            ) : null}
          </Field>
        </FieldGroup>
      </fieldset>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending || !dirty}>
          {pending ? (
            <LoaderCircle className="animate-spin" aria-hidden />
          ) : null}
          Simpan
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending || !dirty}
          onClick={() => {
            setDraft(base);
            setErrors({});
          }}
        >
          Batalkan perubahan
        </Button>
        {dirty ? (
          <span className="text-sm text-muted-foreground">
            Ada perubahan belum disimpan
          </span>
        ) : null}
      </div>
    </form>
  );
}
