"use client";

import {
  useRef,
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

export type SplitRevealProps = HTMLAttributes<HTMLElement> & {
  /** Tag to render. Default `h2` (`h1` is typical with `trigger="load"`). */
  as?: ElementType;
  /**
   * `load`  — animate on mount (hero/LCP). Text is painted immediately at a
   *           faint state, never fully hidden, so it still counts for LCP.
   * `scroll` — animate once when scrolled into view (fully masked start).
   */
  trigger?: "load" | "scroll";
  delay?: number;
  duration?: number;
  stagger?: number;
  start?: string;
  children?: ReactNode;
};

/**
 * Line-by-line masked reveal using SplitText (`autoSplit` re-splits on
 * resize / font load and keeps animation progress). Reverted on unmount.
 * Without JS or with reduced motion the plain text renders untouched.
 * Keep children plain text / inline elements (em, strong, br).
 */
export function SplitReveal({
  as: Tag = "h2",
  trigger = "scroll",
  delay = 0,
  duration = DURATION.slow,
  stagger = STAGGER.line,
  start = ENTER_START,
  children,
  ...rest
}: SplitRevealProps) {
  const ref = useRef<HTMLElement>(null);

  // SplitText (font metrics + DOM split) runs only near viewport + idle (P8.11), not
  // during hydration. `load` (hero) uses a short idle timeout so it still plays at once.
  useMotionEffect(
    ref,
    ({ gsap, SplitText }, el) => {
      const mm = gsap.matchMedia();

      mm.add(MEDIA.motion, () => {
        const isLoad = trigger === "load";
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "motion-line",
          autoSplit: true,
          aria: "auto",
          onSplit(self) {
            // Container takes over from CSS pre-state (lines now hold the motion).
            gsap.set(el, { opacity: 1, clearProps: "transform" });
            el.setAttribute(READY_ATTR, "");
            return gsap.from(self.lines, {
              yPercent: isLoad ? 60 : 105,
              opacity: isLoad ? 0.2 : 1,
              duration,
              delay,
              stagger,
              ease: EASE.line,
              ...(isLoad
                ? {}
                : { scrollTrigger: { trigger: el, start, once: true } }),
            });
          },
        });
      });

      mm.add(MEDIA.reduce, () => {
        el.setAttribute(READY_ATTR, "");
      });
    },
    [trigger, delay, duration, stagger, start],
    { idleTimeout: trigger === "load" ? 150 : undefined },
  );

  return (
    <Tag
      ref={ref}
      data-split={trigger === "load" ? "hero" : "scroll"}
      {...rest}
    >
      {children}
    </Tag>
  );
}
