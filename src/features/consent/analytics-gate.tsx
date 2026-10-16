"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { useConsent } from "./store";

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
