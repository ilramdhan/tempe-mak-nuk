"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  OptionSelect,
  mediaOptions,
} from "../../jurnal/_shared/components/content-fields";
import type { MediaOption } from "../../jurnal/_shared/components/types";
import { errorsUnder, type FieldErrors } from "../../jurnal/_shared/lib/form";
import {
  emptyIngredient,
  emptyStep,
  type IngredientDraft,
  type StepDraft,
} from "../_lib/recipe-draft";

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

function RowActions({
  index,
  count,
  label,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  label: string;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Naikkan ${label}`}
        disabled={index === 0}
        onClick={() => onMove(index - 1)}
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Turunkan ${label}`}
        disabled={index === count - 1}
        onClick={() => onMove(index + 1)}
      >
        <ArrowDown />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Hapus ${label}`}
        onClick={onRemove}
      >
        <Trash2 />
      </Button>
    </div>
  );
}

export function IngredientList({
  value,
  errors,
  onChange,
}: {
  value: IngredientDraft[];
  errors: FieldErrors;
  onChange: (v: IngredientDraft[]) => void;
}) {
  const patch = (i: number, p: Partial<IngredientDraft>) =>
    onChange(value.map((row, n) => (n === i ? { ...row, ...p } : row)));
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Baris kosong diabaikan. Isi “Kelompok” (mis. Bumbu halus) untuk memisah
        daftar.
      </p>
      <ol className="flex flex-col gap-3">
        {value.map((row, i) => {
          const rowErr = errorsUnder(errors, `ingredients.${i}`);
          const p = `ing-${row.key}`;
          return (
            <li key={row.key} className="rounded-md border border-input p-3">
              <div className="flex items-start gap-2">
                <div className="grid flex-1 gap-2 sm:grid-cols-[6rem_minmax(0,1fr)]">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`${p}-qty`} className="text-xs">
                      Takaran
                    </Label>
                    <Input
                      id={`${p}-qty`}
                      value={row.qty}
                      maxLength={60}
                      placeholder="2 sdm"
                      onChange={(e) => patch(i, { qty: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`${p}-item`} className="text-xs">
                      Bahan *
                    </Label>
                    <Input
                      id={`${p}-item`}
                      value={row.item}
                      maxLength={160}
                      aria-invalid={
                        errors[`ingredients.${i}.item`] ? true : undefined
                      }
                      onChange={(e) => patch(i, { item: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`${p}-group`} className="text-xs">
                      Kelompok
                    </Label>
                    <Input
                      id={`${p}-group`}
                      value={row.group}
                      maxLength={80}
                      onChange={(e) => patch(i, { group: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`${p}-note`} className="text-xs">
                      Catatan
                    </Label>
                    <Input
                      id={`${p}-note`}
                      value={row.note}
                      maxLength={200}
                      placeholder="iris tipis"
                      onChange={(e) => patch(i, { note: e.target.value })}
                    />
                  </div>
                </div>
                <RowActions
                  index={i}
                  count={value.length}
                  label={`bahan ${i + 1}`}
                  onMove={(to) => onChange(move(value, i, to))}
                  onRemove={() => onChange(value.filter((_, n) => n !== i))}
                />
              </div>
              {rowErr.length ? (
                <FieldError className="mt-2">{rowErr[0]}</FieldError>
              ) : null}
            </li>
          );
        })}
      </ol>
      {errors.ingredients ? (
        <FieldError>{errors.ingredients}</FieldError>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        disabled={value.length >= 100}
        onClick={() =>
          onChange([...value, emptyIngredient(value.at(-1)?.group ?? "")])
        }
      >
        <Plus /> Tambah bahan
      </Button>
    </div>
  );
}

export function StepList({
  value,
  errors,
  media,
  onChange,
}: {
  value: StepDraft[];
  errors: FieldErrors;
  media: readonly MediaOption[];
  onChange: (v: StepDraft[]) => void;
}) {
  const patch = (i: number, p: Partial<StepDraft>) =>
    onChange(value.map((row, n) => (n === i ? { ...row, ...p } : row)));
  const opts = mediaOptions(media);
  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-col gap-3">
        {value.map((row, i) => {
          const id = `step-${row.key}`;
          const textErr = errors[`steps.${i}.text`];
          return (
            <li key={row.key} className="rounded-md border border-input p-3">
              <div className="flex items-start gap-2">
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor={id}>Langkah {i + 1} *</Label>
                  <Textarea
                    id={id}
                    rows={3}
                    value={row.text}
                    maxLength={2000}
                    aria-invalid={textErr ? true : undefined}
                    onChange={(e) => patch(i, { text: e.target.value })}
                  />
                  {textErr ? <FieldError>{textErr}</FieldError> : null}
                  {opts.length ? (
                    <OptionSelect
                      label="Foto langkah (opsional)"
                      value={row.mediaId}
                      options={opts}
                      noneLabel="Tanpa foto"
                      errorKey={`steps.${i}.mediaId`}
                      errors={errors}
                      onChange={(v) => patch(i, { mediaId: v })}
                    />
                  ) : null}
                </div>
                <RowActions
                  index={i}
                  count={value.length}
                  label={`langkah ${i + 1}`}
                  onMove={(to) => onChange(move(value, i, to))}
                  onRemove={() => onChange(value.filter((_, n) => n !== i))}
                />
              </div>
            </li>
          );
        })}
      </ol>
      {errors.steps ? <FieldError>{errors.steps}</FieldError> : null}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        disabled={value.length >= 100}
        onClick={() => onChange([...value, emptyStep()])}
      >
        <Plus /> Tambah langkah
      </Button>
    </div>
  );
}
