"use client";

import {
  useRef,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { EASE, MEDIA } from "./tokens";
import { useMotionEffect } from "./use-motion-effect";

export type ParallaxProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  /**
   * Travel as a fraction of the element's own height, applied symmetrically
   * (-speed → +speed). 0.1–0.2 is "light". Negative reverses direction.
   */
  speed?: number;
  children?: ReactNode;
};

/**
 * Scrubbed translateY tied to the element's pass through the viewport.
 * Transform only. Disabled under reduced motion. For images, wrap in an
 * `overflow-clip` frame and make the media slightly taller (e.g. scale-110
 * or `-inset-y-[10%]`) so edges never show.
 */
export function Parallax({
  as: Tag = "div",
  speed = 0.12,
  children,
  ...rest
}: ParallaxProps) {
  const ref = useRef<HTMLElement>(null);

  useMotionEffect(
    ref,
    ({ gsap }, el) => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        gsap.fromTo(
          el,
          { yPercent: -speed * 100 },
          {
            yPercent: speed * 100,
            ease: EASE.none,
            scrollTrigger: {
              trigger: el.parentElement ?? el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          },
        );
      });
    },
    [speed],
  );

  return (
    <Tag ref={ref} {...rest} style={{ willChange: "transform", ...rest.style }}>
      {children}
    </Tag>
  );
}
