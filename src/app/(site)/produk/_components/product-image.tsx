import Image from "next/image";

import { ImagePlaceholder } from "@/components/brand/textures";
import type { PublicMedia } from "@/features/media/queries";
import type { ProductVariant } from "@/db/schema";

export function productVariantLabel(variant: ProductVariant) {
  return variant === "classic" ? "Dengan kulit ari" : "Tanpa kulit ari";
}

export function ProductImage({
  media,
  name,
  variant,
  aspect = "4 / 3",
  priority = false,
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: {
  media: PublicMedia | null;
  name: string;
  variant: ProductVariant;
  aspect?: string;
  priority?: boolean;
  sizes?: string;
}) {
  if (!media)
    return (
      <ImagePlaceholder
        caption={name}
        aspect={aspect}
        texture={variant === "classic" ? "mycelium" : "soy"}
      />
    );
  return (
    <div
      className="relative w-full overflow-hidden rounded-lg border border-border bg-surface"
      style={{ aspectRatio: aspect }}
    >
      <Image
        src={media.url}
        alt={media.alt ?? name}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        {...(media.blurDataUrl
          ? { placeholder: "blur" as const, blurDataURL: media.blurDataUrl }
          : {})}
      />
    </div>
  );
}
