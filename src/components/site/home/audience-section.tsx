import Link from "next/link";

import { Reveal, SplitReveal } from "@/components/motion";
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
import { BlockIcon } from "@/features/pages/blocks/shared";
import { cn } from "@/lib/utils";

/**
 * "Cocok untuk siapa" (CMS `featureGrid` block) with a B2B nudge to /kemitraan.
 * Varied card sizes: first item spans wider on desktop for editorial rhythm.
 */
export function AudienceSection({
  data,
  b2bWaHref,
}: {
  data: BlockDataMap["featureGrid"];
  /** wa.me link for catering/resto inquiries (null when WA not configured). */
  b2bWaHref: string | null;
}) {
  return (
    <Section id={data.anchor ?? "untuk-siapa"} tone={data.tone ?? "default"}>
      <Container>
        <Stack gap="xl">
          <Stack gap="sm" className="max-w-measure">
            <Eyebrow rule tone="accent">
              {data.eyebrow ?? "Untuk siapa"}
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
          <Reveal
            as="ul"
            stagger
            className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-6"
          >
            {data.items.map((item, i) => (
              <li
                key={i}
                className={cn(
                  "flex flex-col gap-3 rounded-lg border border-border bg-card p-6",
                  i % 4 === 0 || i % 4 === 3
                    ? "lg:col-span-4"
                    : "lg:col-span-2",
                )}
              >
                <span className="inline-flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BlockIcon name={item.icon} />
                </span>
                <h3 className="font-display text-h3 text-balance">
                  {item.title}
                </h3>
                {item.body ? (
                  <p className="max-w-measure text-pretty text-muted-foreground">
                    {item.body}
                  </p>
                ) : null}
              </li>
            ))}
          </Reveal>
          <Grid
            cols={12}
            gap="md"
            className="items-center border-t border-border pt-6"
          >
            <p className="col-span-4 text-pretty md:col-span-7">
              Untuk katering, restoran, kantor, atau reseller: ukuran seragam
              dan jadwal antar rutin.
            </p>
            <div className="col-span-4 flex flex-wrap gap-3 md:col-span-5 md:justify-end">
              <Button asChild variant="secondary">
                <Link href="/kemitraan">Lihat kemitraan</Link>
              </Button>
              {b2bWaHref ? (
                <Button asChild variant="ghost">
                  <WaLink href={b2bWaHref} source="home:audience" kind="b2b">
                    Ajukan kerja sama
                  </WaLink>
                </Button>
              ) : null}
            </div>
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
