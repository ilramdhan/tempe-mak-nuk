"use client";

import dynamic from "next/dynamic";

import { useConsent } from "./store";

// Loaded only once consent is given — keeps Vercel scripts out of the first-load bundle (P6.4).
const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((m) => m.Analytics),
  { ssr: false },
);
const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((m) => m.SpeedInsights),
  { ssr: false },
);

/** Renders Vercel Analytics + Speed Insights only after "analytics" is allowed. */
export function AnalyticsGate({ version }: { version: number }) {
  const ok = useConsent("analytics", version);
  if (!ok) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
