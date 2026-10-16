"use client";

import { useRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { MEDIA, gsap, useGSAP } from "./gsap";

export type MagneticProps = HTMLAttributes<HTMLSpanElement> & {
  /** Fraction of pointer offset followed. Default 0.25 (subtle). */
  strength?: number;
  /** Max travel in px. Default 10. */
  max?: number;
  children: ReactNode;
};

/**
 * Subtle magnetic hover for CTAs. Active only for fine pointers with motion
 * allowed; on touch / reduced motion it is an inert inline-block wrapper.
 */
export function Magnetic({
  strength = 0.25,
  max = 10,
  className,
  children,
  ...rest
}: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const mm = gsap.matchMedia();
      mm.add(`${MEDIA.motion} and ${MEDIA.finePointer}`, () => {
        const xTo = gsap.quickTo(el, "x", {
          duration: 0.6,
          ease: "power3.out",
        });
        const yTo = gsap.quickTo(el, "y", {
          duration: 0.6,
          ease: "power3.out",
        });
        const clamp = gsap.utils.clamp(-max, max);

        const onMove = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          xTo(clamp((e.clientX - (r.left + r.width / 2)) * strength));
          yTo(clamp((e.clientY - (r.top + r.height / 2)) * strength));
        };
        const onLeave = () => {
          xTo(0);
          yTo(0);
        };
        el.addEventListener("pointermove", onMove);
        el.addEventListener("pointerleave", onLeave);
        return () => {
          el.removeEventListener("pointermove", onMove);
          el.removeEventListener("pointerleave", onLeave);
        };
      });
    },
    { scope: ref, dependencies: [strength, max] },
  );

  return (
    <span ref={ref} className={cn("inline-block", className)} {...rest}>
      {children}
    </span>
  );
}
