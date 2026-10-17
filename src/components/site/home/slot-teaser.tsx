/** 7-day slot teaser for the beranda (shared `SlotWeekStrip`, also used by P4.5). */
import Link from "next/link";

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
import { Button } from "@/components/ui/button";
import type { BlockDataMap } from "@/features/pages/blocks";
import { SlotWeekStrip } from "@/features/slots/components/slot-week-strip";

const DAYS = 7;

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
          <SlotWeekStrip days={DAYS} />
          <p className="text-sm text-muted-foreground">
            Status diperbarui manual; konfirmasi akhir via WhatsApp.
          </p>
        </Stack>
      </Container>
    </Section>
  );
}
