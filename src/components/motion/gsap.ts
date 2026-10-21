"use client";

/**
 * Single GSAP entry point for the app. Import gsap / plugins from HERE
 * (never from "gsap" directly) so plugins are registered exactly once.
 * Kit components load this lazily (`loadGsap()` in ./use-motion-effect);
 * a static import puts GSAP (~46 kB gz) into the importing route's critical JS.
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

import "./motion.css";
import { DURATION, EASE } from "./tokens";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

gsap.defaults({ ease: EASE.out, duration: DURATION.base });

export {
  DURATION,
  EASE,
  ENTER_START,
  MEDIA,
  READY_ATTR,
  STAGGER,
} from "./tokens";
export { gsap, ScrollTrigger, SplitText, useGSAP };
