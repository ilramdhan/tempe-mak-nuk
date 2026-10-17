"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";

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

import { useUnsavedGuard } from "../../halaman/_components/use-unsaved-guard";
import { mapServerErrors } from "../../produk/_lib/form-state";
import { useAdminMutation } from "../../slot/_components/use-action";

export type CtaValues = {
  primaryLabel: string;
  primaryHref: string;
  waFloatEnabled: boolean;
  waFloatMessage: string;
};

export function CtaPanel({ values }: { values: CtaValues }) {
  const { pending, run } = useAdminMutation();
  const [v, setV] = useState(values);
  const [saved, setSaved] = useState(values);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(v) !== JSON.stringify(saved);
  useUnsavedGuard(dirty);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    run(
      () =>
        updateSettings({
          "cta.primaryLabel": v.primaryLabel,
          "cta.primaryHref": v.primaryHref,
          "cta.waFloatEnabled": v.waFloatEnabled,
          "cta.waFloatMessage": v.waFloatMessage,
        }),
      {
        success: "CTA disimpan.",
        onDone: (r) => {
          if (r.ok) {
            setSaved(v);
            setErrors({});
          } else {
            const raw = mapServerErrors(r.fieldErrors);
            setErrors({
              primaryLabel: raw["cta.primaryLabel"] ?? "",
              primaryHref: raw["cta.primaryHref"] ?? "",
              waFloatMessage: raw["cta.waFloatMessage"] ?? "",
            });
          }
        },
      },
    );
  }

  return (
    <form onSubmit={submit} noValidate className="max-w-xl">
      <FieldGroup>
        <Field data-invalid={errors.primaryLabel ? true : undefined}>
          <FieldLabel htmlFor="cta-label">Teks tombol utama</FieldLabel>
          <Input
            id="cta-label"
            value={v.primaryLabel}
            maxLength={80}
            aria-invalid={errors.primaryLabel ? true : undefined}
            onChange={(e) => setV({ ...v, primaryLabel: e.target.value })}
          />
          {errors.primaryLabel ? (
            <FieldError>{errors.primaryLabel}</FieldError>
          ) : null}
        </Field>
        <Field data-invalid={errors.primaryHref ? true : undefined}>
          <FieldLabel htmlFor="cta-href">Tautan tombol utama</FieldLabel>
          <Input
            id="cta-href"
            value={v.primaryHref}
            aria-invalid={errors.primaryHref ? true : undefined}
            onChange={(e) => setV({ ...v, primaryHref: e.target.value })}
          />
          <FieldDescription>
            Contoh: /custom-order atau https://wa.me/...
          </FieldDescription>
          {errors.primaryHref ? (
            <FieldError>{errors.primaryHref}</FieldError>
          ) : null}
        </Field>
        <Field orientation="horizontal">
          <Switch
            id="cta-wa"
            checked={v.waFloatEnabled}
            onCheckedChange={(c) => setV({ ...v, waFloatEnabled: c })}
          />
          <FieldLabel htmlFor="cta-wa">Tombol WhatsApp mengambang</FieldLabel>
        </Field>
        <Field data-invalid={errors.waFloatMessage ? true : undefined}>
          <FieldLabel htmlFor="cta-msg">Pesan awal WhatsApp</FieldLabel>
          <Textarea
            id="cta-msg"
            rows={3}
            value={v.waFloatMessage}
            aria-invalid={errors.waFloatMessage ? true : undefined}
            onChange={(e) => setV({ ...v, waFloatMessage: e.target.value })}
          />
          {errors.waFloatMessage ? (
            <FieldError>{errors.waFloatMessage}</FieldError>
          ) : null}
        </Field>
        <div>
          <Button type="submit" disabled={pending || !dirty}>
            {pending ? <LoaderCircle className="animate-spin" /> : null} Simpan
            CTA
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
