"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

import { NOTE_MAX, ORDER_PURPOSES, type OrderFormValues } from "../schema";

type TextName = "name" | "area" | "purposeOther";

function TextField({
  name,
  label,
  placeholder,
  autoComplete,
  hint,
}: {
  name: TextName;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  hint?: string;
}) {
  const { control } = useFormContext<OrderFormValues>();
  const id = `order-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid || undefined}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <Input
            id={id}
            {...field}
            placeholder={placeholder}
            autoComplete={autoComplete}
            aria-invalid={fieldState.invalid}
            aria-describedby={
              [
                hint ? `${id}-hint` : null,
                fieldState.invalid ? `${id}-error` : null,
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
          />
          {hint ? (
            <FieldDescription id={`${id}-hint`}>{hint}</FieldDescription>
          ) : null}
          <FieldError id={`${id}-error`} errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

export function StepCustomer() {
  const { control } = useFormContext<OrderFormValues>();
  const purpose = useWatch({ control, name: "purpose" });
  const note = useWatch({ control, name: "note" });

  return (
    <FieldGroup>
      <Controller
        control={control}
        name="purpose"
        render={({ field, fieldState }) => (
          <FieldSet data-invalid={fieldState.invalid || undefined}>
            <FieldLegend>Keperluan (opsional)</FieldLegend>
            <RadioGroup
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            >
              {ORDER_PURPOSES.map((p, i) => (
                <Field key={p} orientation="horizontal">
                  <RadioGroupItem value={p} id={`order-purpose-${i}`} />
                  <FieldLabel
                    htmlFor={`order-purpose-${i}`}
                    className="font-normal"
                  >
                    {p}
                  </FieldLabel>
                </Field>
              ))}
            </RadioGroup>
          </FieldSet>
        )}
      />
      {purpose === "Lainnya" ? (
        <TextField
          name="purposeOther"
          label="Keperluan lainnya"
          placeholder="Misal: arisan kantor"
        />
      ) : null}

      <Controller
        control={control}
        name="note"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid || undefined}>
            <FieldLabel htmlFor="order-note">Catatan (opsional)</FieldLabel>
            <Textarea
              id="order-note"
              {...field}
              rows={3}
              maxLength={NOTE_MAX}
              placeholder="Bentuk khusus, kemasan daun/plastik, jam ambil, dan lainnya."
              aria-invalid={fieldState.invalid}
              aria-describedby="order-note-hint"
            />
            <FieldDescription id="order-note-hint" className="tabular-nums">
              {note.length}/{NOTE_MAX} karakter
            </FieldDescription>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          name="name"
          label="Nama"
          autoComplete="name"
          placeholder="Nama Anda"
        />
        <TextField
          name="area"
          label="Area / kota"
          autoComplete="address-level2"
          placeholder="Misal: Klaten, Solo"
          hint="Untuk perkiraan ongkir. Alamat lengkap cukup via chat."
        />
      </div>
      <FieldDescription>
        Data ini hanya masuk ke pesan WhatsApp Anda, tidak dikirim ke server
        kami. Draf tersimpan di perangkat ini saja.
      </FieldDescription>
    </FieldGroup>
  );
}
