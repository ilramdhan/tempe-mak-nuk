// GSAP itself is NOT re-exported here (P8.11): the barrel is imported by server-rendered
// sections, and a static GSAP import would put it back into the critical JS. Import
// `gsap`/`ScrollTrigger`/`SplitText`/`useGSAP` from "@/components/motion/gsap" (client
// only), or prefer `useMotionEffect` / `loadGsap` which load it lazily.
export {
  DURATION,
  EASE,
  ENTER_START,
  MEDIA,
  READY_ATTR,
  STAGGER,
} from "./tokens";
export {
  loadGsap,
  useMotionEffect,
  type MotionEffectOptions,
  type MotionKit,
} from "./use-motion-effect";
export type { InitWhen } from "./schedule";
export { LenisProvider, scrollToTarget, useLenis } from "./lenis-provider";
export type { LenisProviderProps } from "./lenis-provider";
export { useReducedMotion } from "./use-reduced-motion";
export { Reveal, type RevealProps } from "./reveal";
export { SplitReveal, type SplitRevealProps } from "./split-reveal";
export { Parallax, type ParallaxProps } from "./parallax";
export { Marquee, type MarqueeProps } from "./marquee";
export { PinnedStory, type PinnedStoryProps } from "./pinned-story";
export { Counter, type CounterProps } from "./counter";
export { Magnetic, type MagneticProps } from "./magnetic";
