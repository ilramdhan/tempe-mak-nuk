import { cn } from "@/lib/utils";

/** [cx, cy, rotation, scale] — hand-placed so the scatter feels organic. */
const BEANS: ReadonlyArray<readonly [number, number, number, number]> = [
  [18, 22, -20, 1], [52, 60, 35, 0.8], [96, 18, 70, 1.1], [140, 52, -50, 0.9],
  [182, 24, 15, 1], [30, 104, 80, 0.9], [78, 120, -30, 1.2], [122, 98, 55, 0.8],
  [166, 128, -75, 1], [200, 90, 25, 0.85], [20, 176, -45, 1.1], [64, 188, 10, 0.9],
  [110, 160, 65, 1], [150, 190, -20, 1.15], [190, 168, 40, 0.8], [96, 214, -60, 0.9],
  [44, 140, 20, 0.7], [208, 40, -35, 0.75], [136, 14, 30, 0.7], [176, 210, 75, 0.9],
];

/**
 * Scatter of soybean ovals (220x230 viewBox). Fills with currentColor;
 * control with className (`text-accent opacity-20`). Decorative.
 */
export function SoyDots({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 220 230"
      className={cn("pointer-events-none", className)}
    >
      <g fill="currentColor">
        {BEANS.map(([x, y, r, s], i) => (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx={7 * s}
            ry={5 * s}
            transform={`rotate(${r} ${x} ${y})`}
          />
        ))}
      </g>
    </svg>
  );
}
