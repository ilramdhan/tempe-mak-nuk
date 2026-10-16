import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * Parallel banana-leaf veins: a midrib with evenly angled side veins,
 * tiled horizontally. Stroke = currentColor. Decorative, aria-hidden.
 */
export function BananaLeafLines({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg
      aria-hidden
      focusable="false"
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    >
      <defs>
        <pattern
          id={id}
          width="120"
          height="120"
          patternUnits="userSpaceOnUse"
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="0.9"
            strokeLinecap="round"
          >
            <path d="M60 0V120" strokeWidth="1.4" />
            <path d="M60 6C80 12 100 24 120 40M60 6C40 12 20 24 0 40" />
            <path d="M60 26C80 32 100 44 120 60M60 26C40 32 20 44 0 60" />
            <path d="M60 46C80 52 100 64 120 80M60 46C40 52 20 64 0 80" />
            <path d="M60 66C80 72 100 84 120 100M60 66C40 72 20 84 0 100" />
            <path d="M60 86C80 92 100 104 120 120M60 86C40 92 20 104 0 120" />
            <path d="M60 106C72 110 84 116 96 124M60 106C48 110 36 116 24 124" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
