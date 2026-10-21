"use client";

import type Lenis from "lenis";
import type { LenisOptions } from "lenis";
import "lenis/dist/lenis.css";
// Kit pre-state CSS stays global (was pulled in via ./gsap before GSAP became lazy here).
import "./motion.css";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { loadGsap } from "./use-motion-effect";
import { useReducedMotion } from "./use-reduced-motion";

const LenisContext = createContext<Lenis | null>(null);

export type LenisProviderProps = {
  children: ReactNode;
  /** Extra Lenis options (merged over the calm defaults). */
  options?: Omit<LenisOptions, "autoRaf" | "wrapper" | "content">;
};

/**
 * Window-level Lenis smooth scroll, driven by the GSAP ticker so Lenis and
 * ScrollTrigger share one rAF loop. Not created at all when the user prefers
 * reduced motion (native scroll + CSS anchors take over).
 */
export function LenisProvider({ children, options }: LenisProviderProps) {
  const reduced = useReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const optionsKey = JSON.stringify(options ?? {});

  useEffect(() => {
    if (reduced) return;

    // Lenis + GSAP are loaded lazily after hydration so routes without scroll motion don't
    // ship them in their critical JS (P6.4). Same instance wiring as before once loaded.
    let alive = true;
    let cleanup: (() => void) | undefined;

    void Promise.all([import("lenis"), loadGsap()]).then(
      ([{ default: LenisCtor }, { gsap, ScrollTrigger }]) => {
        if (!alive) return;
        const instance = new LenisCtor({
          lerp: 0.1,
          smoothWheel: true,
          // Same-page `#hash` links scroll smoothly; respects CSS scroll-padding-top.
          anchors: true,
          stopInertiaOnNavigate: true,
          ...(JSON.parse(optionsKey) as LenisOptions),
          autoRaf: false,
        });

        const onTick = (time: number) => instance.raf(time * 1000);
        const offScroll = instance.on("scroll", ScrollTrigger.update);
        gsap.ticker.add(onTick);
        gsap.ticker.lagSmoothing(0);

        // If the page was opened on a #hash, settle there via Lenis.
        if (window.location.hash) {
          const target = document.getElementById(
            decodeURIComponent(window.location.hash.slice(1)),
          );
          if (target) instance.scrollTo(target, { immediate: true });
        }

        // Font swaps change layout → recompute trigger positions once.
        void document.fonts?.ready.then(() => alive && ScrollTrigger.refresh());

        setLenis(instance);

        cleanup = () => {
          offScroll();
          gsap.ticker.remove(onTick);
          gsap.ticker.lagSmoothing(500, 33);
          instance.destroy();
          setLenis(null);
        };
      },
    );

    return () => {
      alive = false;
      cleanup?.();
    };
  }, [reduced, optionsKey]);

  return (
    <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
  );
}

/**
 * Access the Lenis instance (null when reduced motion / not mounted / SSR).
 * Optional `onScroll` subscribes to Lenis scroll events.
 *
 *   const lenis = useLenis();
 *   lenis?.scrollTo("#pesan", { offset: -80 });
 */
export function useLenis(onScroll?: (lenis: Lenis) => void): Lenis | null {
  const lenis = useContext(LenisContext);

  useEffect(() => {
    if (!lenis || !onScroll) return;
    return lenis.on("scroll", onScroll);
  }, [lenis, onScroll]);

  return lenis;
}

/** Scroll helper that falls back to native scrolling without Lenis. */
export function scrollToTarget(
  lenis: Lenis | null,
  target: string | HTMLElement | number,
  opts?: { offset?: number; immediate?: boolean },
) {
  if (lenis) {
    lenis.scrollTo(target, opts);
    return;
  }
  if (typeof target === "number") {
    window.scrollTo({ top: target + (opts?.offset ?? 0) });
    return;
  }
  const el =
    typeof target === "string" ? document.querySelector(target) : target;
  el?.scrollIntoView({ block: "start" });
}
