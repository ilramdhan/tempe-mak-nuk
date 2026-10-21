import { Fraunces, Geist } from "next/font/google";

/**
 * Display serif — Fraunces variable (wght + opsz + SOFT axes).
 * Exposed as `--font-fraunces`, mapped to `--font-display` in globals.css.
 */
export const fontDisplay = Fraunces({
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT"],
  variable: "--font-fraunces",
  // P6.4: ~120 kB (opsz+SOFT axes) — not preloaded so CSS + Geist (body/UI, ~30 kB) win the
  // first-load bandwidth. Headings paint in the metric-adjusted fallback, then swap (no CLS).
  preload: false,
});

/**
 * UI / body sans — Geist variable (wght axis).
 * Exposed as `--font-geist`, mapped to `--font-sans` in globals.css.
 */
export const fontSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
});

/** Class string to put on <html> so both CSS variables are defined. */
export const fontVariables = `${fontDisplay.variable} ${fontSans.variable}`;
