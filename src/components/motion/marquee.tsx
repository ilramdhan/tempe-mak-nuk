import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

import "./motion.css";

export type MarqueeProps = HTMLAttributes<HTMLDivElement> & {
  /** Seconds per full loop. Default 40 (calm). */
  duration?: number;
  /** CSS length between items and between copies. Default 3rem. */
  gap?: string;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  children: ReactNode;
};

/**
 * Infinite CSS marquee (compositor-only transform, no JS). Content is
 * rendered twice; the copy is `aria-hidden` + `inert`. Reduced motion:
 * static, wrapped, single copy. Server-component friendly.
 * Pass each item as a direct child (they become flex items).
 */
export function Marquee({
  duration = 40,
  gap = "3rem",
  direction = "left",
  pauseOnHover = true,
  className,
  style,
  children,
  ...rest
}: MarqueeProps) {
  return (
    <div
      className={cn("motion-marquee", className)}
      data-direction={direction}
      data-pause-on-hover={pauseOnHover ? "" : undefined}
      style={
        {
          "--marquee-gap": gap,
          "--marquee-duration": `${duration}s`,
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      <div className="motion-marquee__group">{children}</div>
      <div className="motion-marquee__group" aria-hidden="true" inert>
        {children}
      </div>
    </div>
  );
}
