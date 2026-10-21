"use client";

import { useMemo, useRef, type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

import { DURATION, EASE, ENTER_START, MEDIA } from "./tokens";
import { useMotionEffect } from "./use-motion-effect";

export type CounterProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  /** Final value — rendered as-is in SSR markup (SEO / no-JS / reduced motion). */
  value: number;
  /** Start value for the count. Default 0 (use e.g. 1990 for "sejak 2001"). */
  from?: number;
  duration?: number;
  /** BCP-47 locale for formatting. Default "id-ID". */
  locale?: string;
  /** Intl.NumberFormat options (serialisable, so usable from Server Components). */
  format?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
  start?: string;
};

/**
 * Counts up once when scrolled into view. The final number is in the HTML;
 * an invisible sizer reserves its width so counting never shifts layout.
 */
export function Counter({
  value,
  from = 0,
  duration = DURATION.counter,
  locale = "id-ID",
  format,
  prefix = "",
  suffix = "",
  start = ENTER_START,
  className,
  ...rest
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const formatKey = JSON.stringify(format ?? {});
  const fmt = useMemo(
    () =>
      new Intl.NumberFormat(
        locale,
        JSON.parse(formatKey) as Intl.NumberFormatOptions,
      ),
    [locale, formatKey],
  );
  const finalText = `${prefix}${fmt.format(value)}${suffix}`;

  useMotionEffect(
    ref,
    ({ gsap }, el) => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motion, () => {
        // Intermediate values use the precision of the final value (or the
        // explicit format), so integer counts never flash fractions.
        const opts = fmt.resolvedOptions();
        const decimals = Math.min(
          opts.maximumFractionDigits ?? 0,
          Math.max(
            opts.minimumFractionDigits ?? 0,
            (String(value).split(".")[1] ?? "").length,
          ),
        );
        const factor = 10 ** decimals;
        const state = { n: from };
        const render = () => {
          const n = Math.round(state.n * factor) / factor;
          el.textContent = `${prefix}${fmt.format(n)}${suffix}`;
        };
        gsap.to(state, {
          n: value,
          duration,
          ease: EASE.soft,
          onUpdate: render,
          onComplete: () => {
            el.textContent = finalText;
          },
          scrollTrigger: {
            trigger: el,
            start,
            once: true,
            // Show the start value only once we're about to animate.
            onEnter: render,
          },
        });
        return () => {
          el.textContent = finalText;
        };
      });
    },
    [value, from, duration, fmt, prefix, suffix, start],
  );

  return (
    <span className={cn("inline-grid tabular-nums", className)} {...rest}>
      <span
        aria-hidden="true"
        className="invisible col-start-1 row-start-1 select-none"
      >
        {finalText}
      </span>
      <span ref={ref} className="col-start-1 row-start-1">
        {finalText}
      </span>
    </span>
  );
}
