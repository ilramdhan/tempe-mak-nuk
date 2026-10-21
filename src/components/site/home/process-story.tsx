"use client";

import {
  ImagePlaceholder,
  type PlaceholderTexture,
} from "@/components/brand/textures";
import { PinnedStory } from "@/components/motion";
import { cn } from "@/lib/utils";

export type ProcessStep = { title: string; body: string | null };

/** Art direction per step (docs/photo-brief.md §C, S10–S15) until real photos exist. */
const VISUALS: { caption: string; texture: PlaceholderTexture }[] = [
  { caption: "memilah kedelai di tampah bambu", texture: "soy" },
  { caption: "kedelai direbus, uap naik", texture: "soy" },
  { caption: "ragi ditabur, lalu dibungkus daun", texture: "leaf" },
  { caption: "miselium putih menyatukan kedelai", texture: "mycelium" },
];

const visualFor = (i: number) => VISUALS[i % VISUALS.length]!;

/**
 * "Dari kedelai ke tempe" pinned scroll story (md+ with motion) — stacked list otherwise.
 * Step copy is rendered once (SEO-safe); media is decorative placeholder art.
 */
export function ProcessStory({
  steps,
  headingLevel = 3,
}: {
  steps: ProcessStep[];
  headingLevel?: 3 | 4;
}) {
  const H = `h${headingLevel}` as const;
  return (
    <PinnedStory
      aria-label="Tahapan membuat tempe"
      // Inactive steps dim via colour (muted-foreground passes AA), not opacity.
      stepClassName="group/step md:motion-reduce:grid-cols-2 md:motion-reduce:items-center"
      steps={steps.map((step, i) => (
        <div key={i} className="flex max-w-measure flex-col gap-4">
          <span
            aria-hidden
            className="font-display text-display leading-none text-accent-strong transition-colors duration-500 md:motion-safe:group-data-[active=false]/step:text-muted-foreground"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <H className="font-display text-h2 text-balance transition-colors duration-500 md:motion-safe:group-data-[active=false]/step:text-muted-foreground">
            {step.title.replace(/^\d+\.\s*/, "")}
          </H>
          {step.body ? (
            <p className="text-lead text-pretty text-muted-foreground">
              {step.body}
            </p>
          ) : null}
        </div>
      ))}
      renderMedia={(active, { stacked }) => {
        if (stacked) {
          const v = visualFor(active);
          return (
            <ImagePlaceholder
              caption={v.caption}
              texture={v.texture}
              aspect="4 / 3"
            />
          );
        }
        return (
          <div className="relative">
            {steps.map((_, i) => {
              const v = visualFor(i);
              return (
                <div
                  key={i}
                  className={cn(
                    "transition-opacity duration-700",
                    i === 0 ? "relative" : "absolute inset-0",
                    i === active ? "opacity-100" : "opacity-0",
                  )}
                >
                  <ImagePlaceholder
                    caption={v.caption}
                    texture={v.texture}
                    aspect="4 / 5"
                  />
                </div>
              );
            })}
            <p className="mt-4 text-sm text-muted-foreground tabular-nums">
              Langkah {active + 1} dari {steps.length}
            </p>
          </div>
        );
      }}
    />
  );
}
