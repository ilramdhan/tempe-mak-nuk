import { useId } from "react";

import { cn } from "@/lib/utils";

/**
 * Fine branching mycelium lines as a tileable background (240px tile).
 * Uses currentColor; set colour + opacity via className (e.g.
 * `text-primary opacity-10`). Decorative, aria-hidden.
 */
export function MyceliumPattern({
  className,
  tile = 240,
}: {
  className?: string;
  /** Rendered tile size in px. */
  tile?: number;
}) {
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
          width={tile}
          height={tile}
          patternUnits="userSpaceOnUse"
          viewBox="0 0 240 240"
        >
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinecap="round"
          >
            <path d="M0 40C30 44 52 62 76 58S120 30 146 44s46 40 94 30" />
            <path d="M76 58c-6 24-26 40-30 70" />
            <path d="M76 58c14 18 36 22 56 20" />
            <path d="M146 44c-4-16 6-30 18-44" />
            <path d="M146 44c12 10 30 8 42 22" />
            <path d="M0 150c24-8 40 4 62 18s52 6 70-12 44-22 62-6 34 12 46 6" />
            <path d="M62 168c-2 20-14 34-12 72" />
            <path d="M132 156c6 22 22 34 20 56" />
            <path d="M194 150c4-16 18-24 24-40" />
            <path d="M46 128c-14-6-30-4-46 4" />
            <path d="M188 66c-2 14 6 28 4 48" />
            <path d="M152 212c14 6 30 4 44 14" />
          </g>
          <g fill="currentColor">
            <circle cx="76" cy="58" r="1.4" />
            <circle cx="146" cy="44" r="1.4" />
            <circle cx="62" cy="168" r="1.4" />
            <circle cx="132" cy="156" r="1.4" />
            <circle cx="188" cy="66" r="1.2" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
