"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { WaLink } from "@/components/site/layout/wa-link";
import { buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildWaLink } from "@/lib/wa-link";
import { cn } from "@/lib/utils";

export const BUSINESS_TYPES = [
  "Warung",
  "Katering",
  "Restoran / kafe",
  "Reseller",
  "Lainnya",
] as const;
/** Extra choices appended after the catalogue products (names come from the DB). */
const EXTRA_PRODUCT_CHOICES = ["Semua varian", "Custom"] as const;

const schema = z.object({
  businessName: z
    .string()
    .trim()
    .min(2, "Isi nama usaha (min. 2 karakter).")
    .max(100, "Maksimal 100 karakter."),
  businessType: z.enum(BUSINESS_TYPES, { error: "Pilih jenis usaha." }),
  city: z.string().trim().min(2, "Isi kota.").max(60, "Maksimal 60 karakter."),
  weeklyNeed: z
    .string()
    .trim()
    .min(1, "Isi perkiraan kebutuhan per minggu.")
    .max(60, "Maksimal 60 karakter."),
  product: z.string().min(1, "Pilih produk."),
  contactName: z
    .string()
    .trim()
    .min(2, "Isi nama kontak.")
    .max(80, "Maksimal 80 karakter."),
  contactPhone: z
    .string()
    .trim()
    .regex(
      /^\+?[\d\s-]{8,18}$/,
      "Isi nomor WhatsApp yang valid, mis. 0812-3456-7890.",
    ),
  notes: z.string().trim().max(500, "Maksimal 500 karakter.").optional(),
});
type Values = z.input<typeof schema>;

const selectClass =
  "h-11 w-full rounded-md border border-input bg-card px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive md:text-sm";

export function InquiryForm({
  whatsapp,
  productNames,
}: {
  whatsapp: string;
  productNames: readonly string[];
}) {
  const productChoices = [...productNames, ...EXTRA_PRODUCT_CHOICES];
  const {
    register,
    control,
    formState: { errors, isValid },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      businessName: "",
      city: "",
      weeklyNeed: "",
      contactName: "",
      contactPhone: "",
      notes: "",
    },
  });
  const values = useWatch({ control });

  const href = useMemo(() => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) return null;
    const v = parsed.data;
    return buildWaLink(whatsapp, {
      greeting: "Halo Mak Nuk, saya ingin menanyakan kerja sama (kemitraan):",
      lines: [
        { label: "Nama usaha", value: v.businessName },
        { label: "Jenis usaha", value: v.businessType },
        { label: "Kota", value: v.city },
        { label: "Kebutuhan per minggu", value: v.weeklyNeed },
        { label: "Produk", value: v.product },
        { label: "Nama kontak", value: v.contactName },
        { label: "No. WhatsApp", value: v.contactPhone },
        { label: "Catatan", value: v.notes },
      ],
      footer: "Terima kasih.",
    });
  }, [values, whatsapp]);

  const err = (k: keyof Values) => errors[k]?.message;
  const props = (k: keyof Values) => ({
    id: k,
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `${k}-error` : undefined,
  });

  return (
    <form
      noValidate
      onSubmit={(e) => e.preventDefault()}
      aria-label="Form pengajuan kerja sama"
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="businessName">Nama usaha</FieldLabel>
          <Input
            {...props("businessName")}
            autoComplete="organization"
            {...register("businessName")}
          />
          <FieldError id="businessName-error">{err("businessName")}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="businessType">Jenis usaha</FieldLabel>
          <select
            {...props("businessType")}
            className={selectClass}
            defaultValue=""
            {...register("businessType")}
          >
            <option value="" disabled>
              Pilih jenis usaha
            </option>
            {BUSINESS_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <FieldError id="businessType-error">{err("businessType")}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="city">Kota</FieldLabel>
          <Input
            {...props("city")}
            autoComplete="address-level2"
            {...register("city")}
          />
          <FieldError id="city-error">{err("city")}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="weeklyNeed">Kebutuhan per minggu</FieldLabel>
          <Input
            {...props("weeklyNeed")}
            placeholder="mis. 20 kg"
            {...register("weeklyNeed")}
          />
          <FieldDescription>
            Perkiraan saja, bisa disesuaikan nanti.
          </FieldDescription>
          <FieldError id="weeklyNeed-error">{err("weeklyNeed")}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="product">Produk</FieldLabel>
          <select
            {...props("product")}
            className={selectClass}
            defaultValue=""
            {...register("product")}
          >
            <option value="" disabled>
              Pilih produk
            </option>
            {productChoices.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <FieldError id="product-error">{err("product")}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="contactName">Nama kontak</FieldLabel>
          <Input
            {...props("contactName")}
            autoComplete="name"
            {...register("contactName")}
          />
          <FieldError id="contactName-error">{err("contactName")}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="contactPhone">Nomor WhatsApp</FieldLabel>
          <Input
            {...props("contactPhone")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            {...register("contactPhone")}
          />
          <FieldError id="contactPhone-error">{err("contactPhone")}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="notes">Catatan (opsional)</FieldLabel>
          <Textarea {...props("notes")} rows={3} {...register("notes")} />
          <FieldError id="notes-error">{err("notes")}</FieldError>
        </Field>
        {isValid && href ? (
          <WaLink
            href={href}
            source="kemitraan:form"
            kind="b2b"
            className={cn(buttonVariants({ size: "lg" }))}
          >
            Kirim lewat WhatsApp
          </WaLink>
        ) : (
          <button
            type="button"
            disabled
            className={cn(buttonVariants({ size: "lg" }))}
          >
            Kirim lewat WhatsApp
          </button>
        )}
        <FieldDescription>
          Data tidak disimpan di situs ini. Pesan tersusun lalu terbuka di
          WhatsApp.
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}
