"use client";

import { useEffect, useRef, type DependencyList, type RefObject } from "react";

import { scheduleInit, type ScheduleOptions } from "./schedule";

/** The lazily loaded GSAP kit (`./gsap`). Type-only: no runtime import. */
export type MotionKit = typeof import("./gsap");

let kitPromise: Promise<MotionKit> | null = null;

/**
 * Load GSAP + plugins once (shared with LenisProvider's lazy import).
 * Use this instead of a static `import` from `./gsap` so GSAP stays out of
 * the critical (hydration) JS.
 */
export function loadGsap(): Promise<MotionKit> {
  kitPromise ??= import("./gsap");
  return kitPromise;
}

const READY_ATTR = "data-motion-ready";
/** JS is live but init is deferred: keeps the CSS pre-state, cancels the CSS failsafe. */
const PENDING_ATTR = "data-motion-pending";
const REDUCE = "(prefers-reduced-motion: reduce)";
/** Earliest CSS failsafe delay in motion.css is 2.5 s (hero); stay safely below it. */
const PENDING_BEFORE_MS = 2400;

export type MotionEffectOptions = Partial<ScheduleOptions>;

/**
 * Deferred replacement for `useGSAP` inside the motion kit (P8.11).
 *
 * `setup` runs inside a `gsap.context` scoped to the element, but only after
 * the element is near the viewport / the main thread is idle (see
 * `schedule.ts`), with GSAP loaded via dynamic import. Everything created in
 * `setup` (tweens, ScrollTriggers, SplitText, matchMedia) is reverted on
 * unmount or when `deps` change.
 *
 * Reduced motion at mount: GSAP is never loaded; the element only gets
 * `data-motion-ready` (CSS pre-states don't apply under reduced motion anyway).
 * Until hydration the CSS pre-states from motion.css (incl. the failsafe) are in charge;
 * after hydration the element is marked `data-motion-pending` (pre-state kept, failsafe off)
 * until `setup` sets `data-motion-ready`.
 */
export function useMotionEffect<T extends HTMLElement>(
  ref: RefObject<T | null>,
  setup: (kit: MotionKit, el: T) => void | (() => void),
  deps: DependencyList,
  { when = "visible", rootMargin, idleTimeout }: MotionEffectOptions = {},
) {
  const setupRef = useRef(setup);
  useEffect(() => {
    setupRef.current = setup;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia(REDUCE).matches) {
      el.setAttribute(READY_ATTR, "");
      return;
    }

    // Hydrated early: the CSS failsafe (2.5 s hero / 4 s others) must not reveal — and GSAP
    // later re-hide — content still waiting below the fold. If hydration was slower than
    // the earliest failsafe, leave it alone so already-revealed content never re-hides.
    if (performance.now() < PENDING_BEFORE_MS)
      el.setAttribute(PENDING_ATTR, "");
    let alive = true;
    let revert: (() => void) | undefined;
    const cancel = scheduleInit(el, { when, rootMargin, idleTimeout }, () => {
      loadGsap().then(
        (kit) => {
          if (!alive) return;
          const ctx = kit.gsap.context(() => setupRef.current(kit, el), el);
          revert = () => ctx.revert();
        },
        // Chunk failed to load: never leave content hidden.
        () => el.setAttribute(READY_ATTR, ""),
      );
    });

    return () => {
      alive = false;
      cancel();
      revert?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller-provided deps
  }, [ref, when, rootMargin, idleTimeout, ...deps]);
}
