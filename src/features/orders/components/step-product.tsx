"use client";

import { Controller, useFormContext, useWatch } from "react-hook-form";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatIdr, formatPriceFrom } from "@/features/_shared/format";

import {
  shapesForProduct,
  sizeLabel,
  sizesForProduct,
  type OrderCatalog,
} from "../catalog";
import { QUANTITY_MAX, QUANTITY_MIN, type OrderFormValues } from "../schema";

const errId = (name: string) => `order-${name}-error`;

/**
 * Selectable card option (label wraps the radio → whole card is the hit area).
 * The radio is a <button role="radio">, so its name comes from aria-labelledby
 * (axe `button-name` does not count <label for>); description/meta → aria-describedby.
 */
function OptionCard({
  id,
  value,
  title,
  description,
  meta,
}: {
  id: string;
  value: string;
  title: string;
  description?: string | null;
  meta?: string | null;
}) {
  return (
    <FieldLabel htmlFor={id}>
      <Field orientation="horizontal">
        <RadioGroupItem
          value={value}
          id={id}
          aria-labelledby={`${id}-title`}
          aria-describedby={
            [description ? `${id}-desc` : null, meta ? `${id}-meta` : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />
        <FieldContent>
          <FieldTitle id={`${id}-title`}>{title}</FieldTitle>
          {description ? (
            <FieldDescription id={`${id}-desc`}>{description}</FieldDescription>
          ) : null}
          {meta ? (
            <FieldDescription id={`${id}-meta`} className="tabular-nums">
              {meta}
            </FieldDescription>
          ) : null}
        </FieldContent>
      </Field>
    </FieldLabel>
  );
}

export function StepProduct({
  catalog,
  showPrice,
}: {
  catalog: OrderCatalog;
  showPrice: boolean;
}) {
  const { control, setValue, getValues } = useFormContext<OrderFormValues>();
  const productId = useWatch({ control, name: "productId" });
  const shapes = shapesForProduct(catalog, productId);
  const sizes = sizesForProduct(catalog, productId);

  return (
    <FieldGroup>
      <Controller
        control={control}
        name="productId"
        render={({ field, fieldState }) => (
          <FieldSet data-invalid={fieldState.invalid || undefined}>
            <FieldLegend>Varian</FieldLegend>
            <RadioGroup
              name={field.name}
              value={field.value}
              onValueChange={(v) => {
                field.onChange(v);
                // Drop shape/size choices the new variant does not offer.
                const { shapeId, sizeId } = getValues();
                if (
                  shapeId &&
                  !shapesForProduct(catalog, v).some((s) => s.id === shapeId)
                )
                  setValue("shapeId", "");
                if (
                  sizeId &&
                  !sizesForProduct(catalog, v).some((s) => s.id === sizeId)
                )
                  setValue("sizeId", "");
              }}
              aria-invalid={fieldState.invalid}
              aria-describedby={
                fieldState.invalid ? errId(field.name) : undefined
              }
              className="grid-cols-1 sm:grid-cols-2"
            >
              {catalog.products.map((p) => (
                <OptionCard
                  key={p.id}
                  id={`order-product-${p.slug}`}
                  value={p.id}
                  title={p.name}
                  description={p.short}
                  meta={formatPriceFrom(p.priceFrom, showPrice)}
                />
              ))}
            </RadioGroup>
            <FieldError id={errId(field.name)} errors={[fieldState.error]} />
          </FieldSet>
        )}
      />

      <Controller
        control={control}
        name="shapeId"
        render={({ field, fieldState }) => (
          <FieldSet
            data-invalid={fieldState.invalid || undefined}
            disabled={!productId}
          >
            <FieldLegend>Bentuk</FieldLegend>
            {!productId ? (
              <FieldDescription>
                Pilih varian dulu untuk melihat bentuknya.
              </FieldDescription>
            ) : null}
            <RadioGroup
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              aria-invalid={fieldState.invalid}
              aria-describedby={
                fieldState.invalid ? errId(field.name) : undefined
              }
              className="grid-cols-1 sm:grid-cols-2"
            >
              {shapes.map((s) => (
                <OptionCard
                  key={s.id}
                  id={`order-shape-${s.slug}`}
                  value={s.id}
                  title={s.name}
                  description={s.description}
                />
              ))}
            </RadioGroup>
            <FieldError id={errId(field.name)} errors={[fieldState.error]} />
          </FieldSet>
        )}
      />

      <Controller
        control={control}
        name="sizeId"
        render={({ field, fieldState }) => (
          <FieldSet
            data-invalid={fieldState.invalid || undefined}
            disabled={!productId}
          >
            <FieldLegend>Ukuran</FieldLegend>
            <RadioGroup
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              aria-invalid={fieldState.invalid}
              aria-describedby={
                fieldState.invalid ? errId(field.name) : undefined
              }
              className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            >
              {sizes.map((s) => (
                <OptionCard
                  key={s.id}
                  id={`order-size-${s.id}`}
                  value={s.id}
                  title={sizeLabel(s)}
                  meta={
                    showPrice && s.price !== null
                      ? `${formatIdr(s.price)} / pcs`
                      : null
                  }
                />
              ))}
            </RadioGroup>
            <FieldError id={errId(field.name)} errors={[fieldState.error]} />
          </FieldSet>
        )}
      />

      <Controller
        control={control}
        name="quantity"
        render={({ field, fieldState }) => (
          <Field
            data-invalid={fieldState.invalid || undefined}
            className="max-w-xs"
          >
            <FieldLabel htmlFor="order-quantity">Jumlah (pcs)</FieldLabel>
            <Input
              id="order-quantity"
              name={field.name}
              ref={field.ref}
              type="number"
              inputMode="numeric"
              min={QUANTITY_MIN}
              max={QUANTITY_MAX}
              step={1}
              value={Number.isFinite(field.value) ? field.value : ""}
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? Number.NaN : e.target.valueAsNumber,
                )
              }
              onBlur={field.onBlur}
              aria-invalid={fieldState.invalid}
              aria-describedby={`order-quantity-hint${fieldState.invalid ? ` ${errId(field.name)}` : ""}`}
              className="tabular-nums"
            />
            <FieldDescription id="order-quantity-hint">
              Tanpa minimum order. Satu pun boleh.
            </FieldDescription>
            <FieldError id={errId(field.name)} errors={[fieldState.error]} />
          </Field>
        )}
      />
    </FieldGroup>
  );
}
