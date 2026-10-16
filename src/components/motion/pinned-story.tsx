"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

import { MEDIA, ScrollTrigger, gsap, useGSAP } from "./gsap";

export type PinnedStoryProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  /** One node per step (copy). Order = story order. */
  steps: ReactNode[];
  /**
   * Visual for a given step. Desktop: called with the active index inside a
   * pinned (sticky) column — crossfade yourself with opacity. Stacked
   * fallback: called once per step with `stacked: true`.
   */
  renderMedia: (active: number, ctx: { stacked: boolean }) => ReactNode;
  /** Which column holds the pinned media on desktop. Default "left". */
  mediaSide?: "left" | "right";
  onStepChange?: (index: number) => void;
  stepClassName?: string;
};

/**
 * Pinned scroll story. md+ with motion allowed: media column is pinned
 * (CSS sticky — no pin-spacer, no layout shift, plays well with Lenis)
 * while each step's copy scrolls past (min-h-svh); active step drives
 * `renderMedia`. Below md or with reduced motion: stacked steps, each with
 * its own media. Step copy is rendered once (SEO-safe).
 * Each desktop step gets `data-active="true|false"` for styling, e.g.
 * `data-[active=false]:opacity-40 transition-opacity`.
 */
export function PinnedStory({
  steps,
  renderMedia,
  mediaSide = "left",
  onStepChange,
  className,
  stepClassName,
  ...rest
}: PinnedStoryProps) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const onChangeRef = useRef(onStepChange);
  useLayoutEffect(() => {
    onChangeRef.current = onStepChange;
  });

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MEDIA.motion} and ${MEDIA.desktop}`, () => {
        const items = gsap.utils.toArray<HTMLElement>("[data-story-step]");
        items.forEach((item, i) => {
          ScrollTrigger.create({
            trigger: item,
            start: "top center",
            end: "bottom center",
            onToggle: (self) => {
              if (!self.isActive) return;
              setActive(i);
              onChangeRef.current?.(i);
            },
          });
        });
      });
    },
    { scope: ref, dependencies: [steps.length] },
  );

  return (
    <section
      ref={ref}
      className={cn(
        "relative grid gap-16 md:motion-safe:grid-cols-2 md:motion-safe:gap-12",
        className,
      )}
      {...rest}
    >
      {/* Pinned media column (md+, motion allowed) — decorative duplicate of per-step media. */}
      <div
        aria-hidden="true"
        className={cn(
          "sticky top-0 hidden h-svh items-center md:motion-safe:flex",
          mediaSide === "right" && "md:order-2",
        )}
      >
        <div className="w-full">{renderMedia(active, { stacked: false })}</div>
      </div>
      <ol className="m-0 grid list-none gap-16 p-0 md:motion-safe:block">
        {steps.map((step, i) => (
          <li
            key={i}
            data-story-step=""
            data-active={i === active}
            className={cn(
              "grid gap-6 md:motion-safe:flex md:motion-safe:min-h-svh md:motion-safe:items-center",
              stepClassName,
            )}
          >
            {/* Per-step media: stacked fallback only */}
            <div className="md:motion-safe:hidden">
              {renderMedia(i, { stacked: true })}
            </div>
            <div>{step}</div>
          </li>
        ))}
      </ol>
    </section>
  );
}
