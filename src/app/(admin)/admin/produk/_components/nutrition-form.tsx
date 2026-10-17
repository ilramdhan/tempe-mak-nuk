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
import { deleteNutrition, upsertNutrition } from "@/features/products/actions";

import { parseNutrient } from "../_lib/form-state";
import type { NutritionRow } from "../_lib/load";
import { useAdminMutation } from "../../slot/_components/use-action";

const FIELDS = [
  ["energyKcal", "Energi (kkal)"],
  ["proteinG", "Protein (g)"],
  ["fatG", "Lemak (g)"],
  ["carbsG", "Karbohidrat (g)"],
  ["fiberG", "Serat (g)"],
  ["calciumMg", "Kalsium (mg)"],
  ["ironMg", "Zat besi (mg)"],
] as const;

type Key = (typeof FIELDS)[number][0];

const str = (n: number | null | undefined) =>
  n === null || n === undefined ? "" : String(n);

/** Nilai gizi per 100 g + sumber (disimpan terpisah dari form produk). */
export function NutritionForm({
  productId,
  initial,
}: {
  productId: string;
  initial: NutritionRow | null;
}) {
  const { pending, run } = useAdminMutation();
  const [vals, setVals] = useState<Record<Key, string>>(() => ({
    energyKcal: str(initial?.energyKcal),
    proteinG: str(initial?.proteinG),
    fatG: str(initial?.fatG),
    carbsG: str(initial?.carbsG),
    fiberG: str(initial?.fiberG),
    calciumMg: str(initial?.calciumMg),
    ironMg: str(initial?.ironMg),
  }));
  const [source, setSource] = useState(initial?.source ?? "");
  const [sourceUrl, setSourceUrl] = useState(initial?.sourceUrl ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function save(e: React.FormEvent) {
    e.preventDefault();
    const local: Record<string, string> = {};
    const nums = {} as Record<Key, number | null>;
    for (const [k, label] of FIELDS) {
      const n = parseNutrient(vals[k]);
      if (n !== null && (Number.isNaN(n) || n < 0))
        local[k] = `${label} harus angka ≥ 0`;
      nums[k] = n;
    }
    if (!source.trim()) local.source = "Sumber data gizi wajib diisi";
    setErrors(local);
    if (Object.keys(local).length) return;
    run(
      () =>
        upsertNutrition({
          productId,
          perGrams: 100,
          ...nums,
          source,
          sourceUrl: sourceUrl.trim() || null,
        }),
      {
        success: "Nilai gizi disimpan.",
        onDone: (res) => {
          if (!res.ok && res.fieldErrors)
            setErrors(
              Object.fromEntries(
                Object.entries(res.fieldErrors).map(([k, v]) => [
                  k,
                  v[0] ?? "",
                ]),
              ),
            );
        },
      },
    );
  }

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-5">
      <FieldGroup>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FIELDS.map(([k, label]) => (
            <Field key={k} data-invalid={errors[k] ? true : undefined}>
              <FieldLabel htmlFor={`n-${k}`}>{label}</FieldLabel>
              <Input
                id={`n-${k}`}
                inputMode="decimal"
                value={vals[k]}
                aria-invalid={errors[k] ? true : undefined}
                onChange={(e) =>
                  setVals((v) => ({ ...v, [k]: e.target.value }))
                }
              />
              {errors[k] ? <FieldError>{errors[k]}</FieldError> : null}
            </Field>
          ))}
        </div>
        <Field data-invalid={errors.source ? true : undefined}>
          <FieldLabel htmlFor="n-source">Sumber data *</FieldLabel>
          <Input
            id="n-source"
            value={source}
            maxLength={300}
            aria-invalid={errors.source ? true : undefined}
            onChange={(e) => setSource(e.target.value)}
          />
          <FieldDescription>
            Mis. Tabel Komposisi Pangan Indonesia (TKPI) atau hasil uji lab.
            Nilai per 100 g.
          </FieldDescription>
          {errors.source ? <FieldError>{errors.source}</FieldError> : null}
        </Field>
        <Field data-invalid={errors.sourceUrl ? true : undefined}>
          <FieldLabel htmlFor="n-url">Tautan sumber (opsional)</FieldLabel>
          <Input
            id="n-url"
            type="url"
            value={sourceUrl}
            aria-invalid={errors.sourceUrl ? true : undefined}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
          {errors.sourceUrl ? (
            <FieldError>{errors.sourceUrl}</FieldError>
          ) : null}
        </Field>
      </FieldGroup>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? <LoaderCircle className="animate-spin" /> : null} Simpan
          nilai gizi
        </Button>
        {initial ? (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              if (window.confirm("Hapus data gizi produk ini?"))
                run(() => deleteNutrition(initial.id), {
                  success: "Data gizi dihapus.",
                });
            }}
          >
            Hapus data gizi
          </Button>
        ) : null}
      </div>
    </form>
  );
}
