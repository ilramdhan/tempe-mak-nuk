"use client";

import { useState } from "react";

import type { RecipeSummary } from "@/features/recipes/queries";
import { cn } from "@/lib/utils";

import { RecipeCard, totalMinutes } from "./recipe-card";

type Cat = { slug: string; name: string };

const DIFFS = [
  { value: "all", label: "Semua tingkat" },
  { value: "easy", label: "Mudah" },
  { value: "medium", label: "Sedang" },
  { value: "hard", label: "Sulit" },
] as const;

const TIMES = [
  { value: 0, label: "Berapa pun" },
  { value: 30, label: "Maks 30 menit" },
  { value: 60, label: "Maks 1 jam" },
] as const;

function Chips<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.value)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors",
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border hover:bg-surface",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function RecipeBrowser({
  recipes,
  categories,
}: {
  recipes: RecipeSummary[];
  categories: Cat[];
}) {
  const [cat, setCat] = useState("all");
  const [diff, setDiff] = useState<string>("all");
  const [time, setTime] = useState<number>(0);

  const catOptions = [
    { value: "all", label: "Semua" },
    ...categories.map((c) => ({ value: c.slug, label: c.name })),
  ];
  const shown = recipes.filter(
    (r) =>
      (cat === "all" || r.category?.slug === cat) &&
      (diff === "all" || r.difficulty === diff) &&
      (!time || (totalMinutes(r) > 0 && totalMinutes(r) <= time)),
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        {categories.length ? (
          <Chips
            label="Kategori"
            options={catOptions}
            value={cat}
            onChange={setCat}
          />
        ) : null}
        <Chips
          label="Tingkat kesulitan"
          options={DIFFS}
          value={diff}
          onChange={setDiff}
        />
        <Chips
          label="Waktu masak"
          options={TIMES}
          value={time}
          onChange={setTime}
        />
      </div>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {shown.length} resep
      </p>
      {shown.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((r, i) => (
            <RecipeCard key={r.id} recipe={r} priority={i < 3} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">
          Tidak ada resep yang cocok. Coba ubah filter.
        </p>
      )}
    </div>
  );
}
