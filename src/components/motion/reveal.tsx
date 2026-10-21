"use client";

import {
  useRef,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import {
  DURATION,
  EASE,
  ENTER_START,
  MEDIA,
  READY_ATTR,
  STAGGER,
} from "./tokens";
import { useMotionEffect } from "./use-motion-effect";

export type RevealProps = HTMLAttributes<HTMLElement> & {
  /** Element/tag to render. Default `div`. */
  as?: ElementType;
  /** Delay in seconds. */
  delay?: number;
  /** Start offset in px (translateY). Default 24. */
  y?: number;
  duration?: number;
  /**
   * When set, the direct children are revealed in sequence (stagger in
   * seconds) instead of the element as a whole. Good for card lists.
   */
  stagger?: number | boolean;
  /** ScrollTrigger start. Default "top 88%". */
  start?: string;
  children?: ReactNode;
};

/**
 * Fade + rise once when scrolled into view. Pre-hidden only by CSS when JS
 * runs and motion is allowed (see motion.css); reduced motion = no animation.
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  y = 24,
  duration = DURATION.base,
  stagger,
  start = ENTER_START,
  style,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const group = stagger !== undefined && stagger !== false;
  const each = typeof stagger === "number" ? stagger : STAGGER.item;

  // Deferred until near viewport + idle (P8.11); CSS pre-state holds until then.
  useMotionEffect(
    ref,
    ({ gsap }, el) => {
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        const targets = group ? Array.from(el.children) : el;
        gsap.fromTo(
          targets,
          { opacity: 0, y },
          {
            opacity: 1,
            y: 0,
            duration,
            delay,
            ease: EASE.out,
            stagger: group ? each : 0,
            clearProps: "transform",
            scrollTrigger: { trigger: el, start, once: true },
          },
        );
        el.setAttribute(READY_ATTR, "");
      });

      mm.add(MEDIA.reduce, () => {
        el.setAttribute(READY_ATTR, "");
      });
    },
    [delay, y, duration, group, each, start],
  );

  return (
    <Tag
      ref={ref}
      data-reveal={group ? "group" : ""}
      style={{ "--reveal-y": `${y}px`, ...style } as CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  );
}
