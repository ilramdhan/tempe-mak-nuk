"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Scroll distance (px) before the header turns to glass. */
const GLASS_AT = 8;
/** Only start hiding on scroll-down after this offset (keeps the top calm). */
const HIDE_AFTER = 480;
/** Ignore jitter smaller than this (px). */
const DELTA = 6;

/**
 * Sticky header chrome. Writes `data-scrolled` / `data-hidden` straight to the DOM
 * (no React re-renders on scroll). Never hides while focus is inside the header
 * or while the mobile menu is open (`data-menu-open` is set by MobileMenu).
 */
export function HeaderShell({
  children,
  hideOnScroll = true,
}: {
  children: ReactNode;
  hideOnScroll?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lastY = window.scrollY;
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      el.dataset.scrolled = String(y > GLASS_AT);
      if (hideOnScroll) {
        const locked =
          el.dataset.menuOpen === "true" || el.contains(document.activeElement);
        if (locked || y < HIDE_AFTER) el.dataset.hidden = "false";
        else if (y - lastY > DELTA) el.dataset.hidden = "true";
        else if (lastY - y > DELTA) el.dataset.hidden = "false";
      }
      if (Math.abs(y - lastY) > DELTA || y < HIDE_AFTER) lastY = y;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onFocusIn = () => (el.dataset.hidden = "false");

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("focusin", onFocusIn);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      el.removeEventListener("focusin", onFocusIn);
    };
  }, [hideOnScroll]);

  return (
    <header
      ref={ref}
      data-site-header
      data-scrolled="false"
      data-hidden="false"
      className={cn(
        "group/header sticky top-0 z-40 w-full border-b border-transparent",
        "transition-[background-color,border-color,transform] duration-300 ease-out motion-reduce:transition-none",
        "data-[hidden=true]:-translate-y-full",
        "data-[scrolled=true]:border-border data-[scrolled=true]:bg-background/80 data-[scrolled=true]:backdrop-blur-md data-[scrolled=true]:backdrop-saturate-150",
        "supports-[not(backdrop-filter:blur(1px))]:data-[scrolled=true]:bg-background",
      )}
    >
      {children}
    </header>
  );
}
