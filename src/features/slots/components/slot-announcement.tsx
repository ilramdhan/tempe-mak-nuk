import { connection } from "next/server";
import { Suspense } from "react";

import { AnnouncementBar } from "@/components/site/layout";
import { getAvailability } from "@/features/slots/queries";

import { weekSlotMessage } from "../week-message";

async function SlotAnnouncementData() {
  await connection();
  const { days } = await getAvailability({ now: new Date(), days: 7 });
  const msg = weekSlotMessage(days);
  return (
    <AnnouncementBar
      id={`${msg.id}:${days[0]?.date.slice(0, 7) ?? ""}`}
      text={msg.text}
      href="/custom-order"
    />
  );
}

/**
 * Fallback announcement driven by this week's slot status (used when no CMS announcement
 * is active). Streams inside Suspense so the static shell stays cacheable; the fallback
 * reserves the bar's height (no CLS).
 */
export function SlotAnnouncement() {
  return (
    <Suspense fallback={<div className="min-h-11 bg-primary" aria-hidden />}>
      <SlotAnnouncementData />
    </Suspense>
  );
}
