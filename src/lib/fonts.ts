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
