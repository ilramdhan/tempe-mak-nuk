"use client";

import { LoaderCircle, Lock, Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateSettings } from "@/features/settings/actions";
import type { ConsentConfig } from "@/features/settings/schema";

import { useUnsavedGuard } from "../../halaman/_components/use-unsaved-guard";
import { useAdminMutation } from "../../slot/_components/use-action";
import {
  buildConsentConfig,
  fromServerErrors,
  isConsentDirty,
  validateConsent,
  type FieldErrors,
} from "../_lib/legal-form";

export function ConsentEditor({ initial }: { initial: ConsentConfig }) {
  const uid = useId();
  const [base, setBase] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [reask, setReask] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const { pending, run } = useAdminMutation();

  const dirty = isConsentDirty(draft, base) || reask;
  useUnsavedGuard(dirty);

  const setCat = (
    i: number,
    patch: Partial<ConsentConfig["categories"][number]>,
  ) =>
    setDraft((d) => ({
      ...d,
      categories: d.categories.map((c, j) =>
        j === i ? { ...c, ...patch } : c,
      ),
    }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    const next = buildConsentConfig(base, draft, reask);
    const errs = validateConsent(next);
    const keys = next.categories.map((c) => c.key);
    keys.forEach((k, i) => {
      if (keys.indexOf(k) !== i)
        errs[`categories.${i}.key`] ??= "Kunci kategori harus unik";
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    run(() => updateSettings({ "consent.config": next }), {
      success: reask
        ? "Consent disimpan. Pengunjung akan diminta persetujuan ulang."
        : "Consent disimpan.",
      onDone: (res) => {
        if (res.ok) {
          setBase(next);
          setDraft(next);
          setReask(false);
        } else setErrors(fromServerErrors(res.fieldErrors));
      },
    });
  }

  return (
    <form
      onSubmit={save}
      noValidate
      className="flex flex-col gap-6 rounded-lg border border-border bg-card p-4 sm:p-6"
    >
      {errors._form || errors["consent.config"] ? (
        <p role="alert" className="text-sm text-destructive">
          {errors._form ?? errors["consent.config"]}
        </p>
      ) : null}
      <fieldset disabled={pending} className="contents">
        <FieldGroup>
          <Field data-invalid={errors.bannerText ? true : undefined}>
            <FieldLabel htmlFor={`${uid}-banner`}>Teks banner</FieldLabel>
            <Textarea
              id={`${uid}-banner`}
              rows={3}
              maxLength={1000}
              value={draft.bannerText}
              aria-invalid={errors.bannerText ? true : undefined}
              aria-describedby={
                errors.bannerText ? `${uid}-banner-err` : undefined
              }
              onChange={(e) =>
                setDraft((d) => ({ ...d, bannerText: e.target.value }))
              }
            />
            {errors.bannerText ? (
              <FieldError id={`${uid}-banner-err`}>
                {errors.bannerText}
              </FieldError>
            ) : null}
          </Field>

          <div className="flex flex-col gap-4">
            <h2 className="font-medium">Kategori cookie</h2>
            {draft.categories.map((c, i) => {
              const p = `${uid}-c${i}`;
              const locked = c.required;
              return (
                <fieldset
                  key={i}
                  className="flex flex-col gap-3 rounded-md border border-border p-3"
                >
                  <legend className="flex items-center gap-1.5 px-1 text-sm font-medium">
                    {locked ? <Lock className="size-3.5" aria-hidden /> : null}
                    {c.label || "Kategori baru"}
                    {locked ? (
                      <span className="font-normal text-muted-foreground">
                        (wajib, selalu aktif)
                      </span>
                    ) : null}
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      data-invalid={
                        errors[`categories.${i}.key`] ? true : undefined
                      }
                    >
                      <FieldLabel htmlFor={`${p}-key`}>Kunci</FieldLabel>
                      <Input
                        id={`${p}-key`}
                        value={c.key}
                        readOnly={
                          locked || base.categories.some((b) => b.key === c.key)
                        }
                        aria-invalid={
                          errors[`categories.${i}.key`] ? true : undefined
                        }
                        aria-describedby={`${p}-key-d${errors[`categories.${i}.key`] ? ` ${p}-key-err` : ""}`}
                        onChange={(e) =>
                          setCat(i, {
                            key: e.target.value.trim().toLowerCase(),
                          })
                        }
                      />
                      <FieldDescription id={`${p}-key-d`}>
                        Huruf kecil, angka, - atau _. Kunci tersimpan tidak
                        dapat diubah.
                      </FieldDescription>
                      {errors[`categories.${i}.key`] ? (
                        <FieldError id={`${p}-key-err`}>
                          {errors[`categories.${i}.key`]}
                        </FieldError>
                      ) : null}
                    </Field>
                    <Field
                      data-invalid={
                        errors[`categories.${i}.label`] ? true : undefined
                      }
                    >
                      <FieldLabel htmlFor={`${p}-label`}>Label</FieldLabel>
                      <Input
                        id={`${p}-label`}
                        value={c.label}
                        maxLength={60}
                        aria-invalid={
                          errors[`categories.${i}.label`] ? true : undefined
                        }
                        aria-describedby={
                          errors[`categories.${i}.label`]
                            ? `${p}-label-err`
                            : undefined
                        }
                        onChange={(e) => setCat(i, { label: e.target.value })}
                      />
                      {errors[`categories.${i}.label`] ? (
                        <FieldError id={`${p}-label-err`}>
                          {errors[`categories.${i}.label`]}
                        </FieldError>
                      ) : null}
                    </Field>
                  </div>
                  <Field
                    data-invalid={
                      errors[`categories.${i}.description`] ? true : undefined
                    }
                  >
                    <FieldLabel htmlFor={`${p}-desc`}>Deskripsi</FieldLabel>
                    <Textarea
                      id={`${p}-desc`}
                      rows={2}
                      maxLength={500}
                      value={c.description}
                      aria-invalid={
                        errors[`categories.${i}.description`] ? true : undefined
                      }
                      onChange={(e) =>
                        setCat(i, { description: e.target.value })
                      }
                    />
                    {errors[`categories.${i}.description`] ? (
                      <FieldError>
                        {errors[`categories.${i}.description`]}
                      </FieldError>
                    ) : null}
                  </Field>
                  {!locked ? (
                    <div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            categories: d.categories.filter((_, j) => j !== i),
                          }))
                        }
                      >
                        <Trash2 aria-hidden /> Hapus kategori
                      </Button>
                    </div>
                  ) : null}
                </fieldset>
              );
            })}
            {errors.categories ? (
              <p role="alert" className="text-sm text-destructive">
                {errors.categories}
              </p>
            ) : null}
            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={draft.categories.length >= 10}
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    categories: [
                      ...d.categories,
                      {
                        key: `kategori-${d.categories.length + 1}`,
                        label: "",
                        description: "",
                        required: false,
                      },
                    ],
                  }))
                }
              >
                <Plus aria-hidden /> Tambah kategori
              </Button>
            </div>
          </div>

          <Field orientation="horizontal">
            <Switch
              id={`${uid}-reask`}
              checked={reask}
              onCheckedChange={setReask}
              aria-describedby={`${uid}-reask-d`}
            />
            <div>
              <FieldLabel htmlFor={`${uid}-reask`}>
                Minta persetujuan ulang (naikkan versi)
              </FieldLabel>
              <FieldDescription id={`${uid}-reask-d`}>
                Versi saat ini {base.version}
                {reask ? ` → ${base.version + 1}` : ""}. Pengunjung dengan versi
                lama akan melihat banner lagi. Nyalakan bila teks atau kategori
                berubah secara material.
              </FieldDescription>
            </div>
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
            setReask(false);
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
