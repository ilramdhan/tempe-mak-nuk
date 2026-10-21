/**
 * Motion tokens (GSAP-free, so components can read them at render time
 * without pulling GSAP into the critical bundle — P8.11).
 */

/** Calm, editorial easing — decelerating curves only, no back/elastic/bounce. */
export const EASE = {
  /** Default entrance. */
  out: "power3.out",
  /** Long, soft landing for headline lines. */
  line: "expo.out",
  /** Very gentle (counters, opacity-only fades). */
  soft: "sine.out",
  /** Symmetric moves (crossfades, scrubbed tweens that are not linear). */
  inOut: "power2.inOut",
  /** Scrubbed / parallax — follow scroll 1:1. */
  none: "none",
} as const;

/** Durations in seconds. */
export const DURATION = {
  fast: 0.45,
  base: 0.9,
  slow: 1.3,
  counter: 1.8,
} as const;

export const STAGGER = {
  line: 0.09,
  item: 0.08,
} as const;

/** Default ScrollTrigger start for one-shot entrances. */
export const ENTER_START = "top 88%";

/** gsap.matchMedia() condition sets shared by the kit. */
export const MEDIA = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  /** Tailwind `md` breakpoint (48rem). */
  desktop: "(min-width: 48rem)",
  finePointer: "(pointer: fine)",
} as const;

/** Attribute set once JS has taken over an element's initial (pre-hidden) state. */
export const READY_ATTR = "data-motion-ready";
