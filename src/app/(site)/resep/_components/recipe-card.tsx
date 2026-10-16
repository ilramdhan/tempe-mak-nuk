import Image from "next/image";
import Link from "next/link";

import { ImagePlaceholder } from "@/components/brand/textures";
import { Badge } from "@/components/ui/badge";
import { formatMinutes } from "@/features/_shared/format";
import type { RecipeSummary } from "@/features/recipes/queries";

export const DIFFICULTY_LABEL = {
  easy: "Mudah",
  medium: "Sedang",
  hard: "Sulit",
} as const;

export function totalMinutes(
  r: Pick<RecipeSummary, "prepMinutes" | "cookMinutes">,
) {
  return (r.prepMinutes ?? 0) + (r.cookMinutes ?? 0);
}

export function RecipeCard({
  recipe,
  priority = false,
}: {
  recipe: RecipeSummary;
  priority?: boolean;
}) {
  const cover = recipe.cover;
  const total = formatMinutes(totalMinutes(recipe));
  return (
    <article className="group relative flex flex-col gap-3">
      {cover ? (
        <div
          className="relative w-full overflow-hidden rounded-lg border border-border bg-surface"
          style={{ aspectRatio: "4 / 3" }}
        >
          <Image
            src={cover.url}
            alt={cover.alt ?? recipe.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            {...(cover.blurDataUrl
              ? { placeholder: "blur" as const, blurDataURL: cover.blurDataUrl }
              : {})}
          />
        </div>
      ) : (
        <ImagePlaceholder caption={recipe.title} aspect="4 / 3" texture="soy" />
      )}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          {recipe.category ? (
            <Badge variant="secondary">{recipe.category.name}</Badge>
          ) : null}
          {recipe.difficulty ? (
            <Badge variant="outline">
              {DIFFICULTY_LABEL[recipe.difficulty]}
            </Badge>
          ) : null}
        </div>
        <h2 className="font-display text-h4 text-balance">
          <Link
            href={`/resep/${recipe.slug}`}
            className="underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            {recipe.title}
          </Link>
        </h2>
        {recipe.excerpt ? (
          <p className="line-clamp-3 text-muted-foreground">{recipe.excerpt}</p>
        ) : null}
        <p className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
          {total ? <span>{total}</span> : null}
          {recipe.servings ? <span>{recipe.servings} porsi</span> : null}
        </p>
      </div>
    </article>
  );
}
