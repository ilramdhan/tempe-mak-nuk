import { cn } from "@/lib/utils";

import { BananaLeafLines } from "./banana-leaf-lines";
import { MyceliumPattern } from "./mycelium-pattern";
import { SoyDots } from "./soy-dots";

export type PlaceholderTexture = "mycelium" | "soy" | "leaf";

/**
 * Art-directed stand-in for product photos until real ones arrive.
 * Surface background + theme-aware texture + small caption
 * ("Foto: tekstur Tempe Klasik"). Swap for next/image later.
 */
export function ImagePlaceholder({
  caption,
  aspect = "4 / 5",
  texture = "mycelium",
  className,
}: {
  /** Caption without the "Foto:" prefix, e.g. "tekstur Tempe Klasik". */
  caption: string;
  /** CSS aspect-ratio, e.g. "4 / 5" or "16 / 9". */
  aspect?: string;
  texture?: PlaceholderTexture;
  className?: string;
}) {
  return (
    <figure
      role="img"
      aria-label={`Foto: ${caption} (menyusul)`}
      className={cn(
        "relative isolate m-0 w-full overflow-hidden rounded-lg border border-border bg-surface text-primary",
        className,
      )}
      style={{ aspectRatio: aspect }}
    >
      {texture === "mycelium" && <MyceliumPattern className="opacity-[0.14]" />}
      {texture === "leaf" && <BananaLeafLines className="opacity-[0.12]" />}
      {texture === "soy" && (
        <SoyDots className="absolute inset-0 size-full text-accent opacity-25" />
      )}
      <figcaption className="absolute bottom-3 left-3 rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground">
        Foto: {caption}
      </figcaption>
    </figure>
  );
}
