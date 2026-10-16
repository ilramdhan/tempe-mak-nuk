/**
 * Simple 7-day slot teaser for the beranda.
 * TODO(P4.5): replace <SlotWeek> with the public slot calendar from
 * `src/features/slots/components/*` once P4.5 lands (orchestrator wires it up).
 */
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { SplitReveal } from "@/components/motion";
import { WaLink } from "@/components/site/layout";
import {
  Container,
  Eyebrow,
  Grid,
  Lead,
  Section,
  Stack,
} from "@/components/site/primitives";
import { SlotBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { BlockDataMap } from "@/features/pages/blocks";
import {
  AVAILABILITY_LABEL,
  toBadgeStatus,
} from "@/features/slots/availability";
import { getAvailability } from "@/features/slots/queries";
import { formatDateShort, formatWeekday } from "@/lib/dates";
import { cn } from "@/lib/utils";

const DAYS = 7;

async function SlotWeek() {
  await connection(); // request-time "now"; the rest of the page stays in the static shell
  const { days } = await getAvailability({ now: new Date(), days: DAYS });
  return (
    <ul
      className="m-0 grid list-none grid-cols-2 gap-2 p-0 sm:grid-cols-4 lg:grid-cols-7"
      aria-label="Status slot 7 hari ke depan"
    >
      {days.map((d) => (
        <li
          key={d.date}
          className={cn(
            "flex flex-col gap-2 rounded-lg border border-border bg-card p-3",
            !d.orderable && "text-muted-foreground",
          )}
        >
          <span className="text-xs">{formatWeekday(d.date)}</span>
          <span className="font-display text-h4 leading-none text-foreground">
            {formatDateShort(d.date)}
          </span>
          <SlotBadge status={toBadgeStatus(d.status)}>
            {AVAILABILITY_LABEL[d.status]}
          </SlotBadge>
          <span className="sr-only">{d.reason}</span>
        </li>
      ))}
    </ul>
  );
}

function SlotWeekSkeleton() {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
      aria-hidden
    >
      {Array.from({ length: DAYS }, (_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}

export function SlotTeaser({
  data,
  waHref,
  slotsPerDay,
}: {
  data: BlockDataMap["slotCalendarPreview"];
  waHref: string | null;
  slotsPerDay: number;
}) {
  return (
    <Section id={data.anchor ?? "slot"} tone={data.tone ?? "surface"} grain>
      <Container>
        <Stack gap="lg">
          <Grid cols={12} gap="lg" rowGap="md" className="items-end">
            <Stack gap="sm" className="col-span-4 md:col-span-7">
              <Eyebrow rule tone="accent">
                {data.eyebrow ?? `${slotsPerDay} slot per hari`}
              </Eyebrow>
              {data.heading ? (
                <SplitReveal
                  as="h2"
                  className="font-display text-h1 text-balance"
                >
                  {data.heading}
                </SplitReveal>
              ) : null}
              {data.intro ? <Lead muted>{data.intro}</Lead> : null}
            </Stack>
            <div className="col-span-4 flex flex-wrap gap-3 md:col-span-5 md:justify-end">
              {waHref ? (
                <Button asChild>
                  <WaLink href={waHref} source="home:slot" kind="order">
                    {data.cta?.label ?? "Cek slot via WhatsApp"}
                  </WaLink>
                </Button>
              ) : null}
              <Button asChild variant="ghost">
                <Link href="/cara-pesan">Kalender lengkap</Link>
              </Button>
            </div>
          </Grid>
          <Suspense fallback={<SlotWeekSkeleton />}>
            <SlotWeek />
          </Suspense>
          <p className="text-sm text-muted-foreground">
            Status diperbarui manual; konfirmasi akhir via WhatsApp.
          </p>
        </Stack>
      </Container>
    </Section>
  );
}
