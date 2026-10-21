"use client";

import { useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";

import { SlotBadge } from "@/components/ui/badge";
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
import {
  AVAILABILITY_LABEL,
  type AvailabilityInput,
  type DayAvailability,
  toBadgeStatus,
} from "@/features/slots/availability";
import { formatDateLong, toDateKey } from "@/lib/dates";

import { checkUseDate } from "../date-rules";
import type { OrderFormValues } from "../schema";
import { SlotCalendar } from "./slot-calendar-lazy";
import { SlotLegend } from "./slot-legend";

export function StepDate({
  days,
  availability,
  deliveryOptions,
}: {
  days: readonly DayAvailability[];
  availability: AvailabilityInput;
  deliveryOptions: readonly string[];
}) {
  const { control, trigger } = useFormContext<OrderFormValues>();
  const useDate = useWatch({ control, name: "useDate" });
  /** Last clicked unavailable day → explanation (live region). */
  const [blocked, setBlocked] = useState<string | null>(null);
  const check = useDate ? checkUseDate(useDate, availability) : null;
  const selectedDay = check?.day ?? null;

  return (
    <FieldGroup>
      <Controller
        control={control}
        name="useDate"
        render={({ field, fieldState }) => (
          <FieldSet data-invalid={fieldState.invalid || undefined}>
            <FieldLegend>Tanggal pakai</FieldLegend>
            <FieldDescription id="order-date-hint">
              Tanggal yang libur, penuh, atau lewat batas pesan tidak bisa
              dipilih. Status diperbarui manual; konfirmasi akhir via WhatsApp.
            </FieldDescription>
            <SlotCalendar
              days={days}
              today={toDateKey(availability.now)}
              selected={field.value || null}
              numberOfMonths={2}
              aria-invalid={fieldState.invalid}
              aria-describedby="order-date-hint order-date-legend order-date-status"
              onSelect={(day) => {
                if (!day.orderable) {
                  setBlocked(checkUseDate(day.date, availability).message);
                  return;
                }
                setBlocked(null);
                field.onChange(day.date);
                void trigger("useDate");
              }}
            />
            <SlotLegend id="order-date-legend" />
            <div
              id="order-date-status"
              aria-live="polite"
              className="flex flex-col gap-2"
            >
              {blocked ? (
                <p className="text-sm text-destructive">{blocked}</p>
              ) : null}
              {selectedDay && check?.ok ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">
                    {formatDateLong(selectedDay.date)}
                  </span>
                  <SlotBadge status={toBadgeStatus(selectedDay.status)}>
                    {AVAILABILITY_LABEL[selectedDay.status]}
                  </SlotBadge>
                  <span className="text-muted-foreground">{check.message}</span>
                </div>
              ) : null}
            </div>
            <FieldError id="order-useDate-error" errors={[fieldState.error]} />
          </FieldSet>
        )}
      />

      <Controller
        control={control}
        name="delivery"
        render={({ field, fieldState }) =>
          deliveryOptions.length ? (
            <FieldSet data-invalid={fieldState.invalid || undefined}>
              <FieldLegend>Ambil atau kirim</FieldLegend>
              <RadioGroup
                name={field.name}
                value={field.value}
                onValueChange={field.onChange}
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.invalid ? "order-delivery-error" : undefined
                }
              >
                {deliveryOptions.map((opt, i) => (
                  <Field key={opt} orientation="horizontal">
                    <RadioGroupItem value={opt} id={`order-delivery-${i}`} />
                    <FieldLabel
                      htmlFor={`order-delivery-${i}`}
                      className="font-normal"
                    >
                      {opt}
                    </FieldLabel>
                  </Field>
                ))}
              </RadioGroup>
              <FieldError
                id="order-delivery-error"
                errors={[fieldState.error]}
              />
            </FieldSet>
          ) : (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="order-delivery">
                Ambil atau kirim (opsional)
              </FieldLabel>
              <Input
                id="order-delivery"
                {...field}
                placeholder="Misal: ambil sendiri"
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )
        }
      />
    </FieldGroup>
  );
}
