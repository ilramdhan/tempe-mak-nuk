import Link from "next/link";

import { ImagePlaceholder } from "@/components/brand/textures";
import {
  Counter,
  Magnetic,
  Parallax,
  Reveal,
  SplitReveal,
} from "@/components/motion";
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
import type { PublicMedia } from "@/features/media/queries";
import type { BlockDataMap } from "@/features/pages/blocks";
import { BlockMedia } from "@/features/pages/blocks/shared";

export type HomeHeroProps = {
  data: BlockDataMap["hero"];
  media: Record<string, PublicMedia>;
  /** Prebuilt wa.me link (null when the WhatsApp number is not configured). */
  waHref: string | null;
  foundedYear: number;
};

/**
 * Beranda hero: split-text headline (LCP-safe `trigger="load"`), two CTAs,
 * and an editorial visual with the "sejak {year}" counter. Copy from the CMS hero block.
 */
export function HomeHero({ data, media, waHref, foundedYear }: HomeHeroProps) {
  const primary = data.primaryCta;
  const secondary = data.secondaryCta;
  return (
    <Section tone="default" spacing="tight" grain className="overflow-clip">
      <Container>
        <Grid cols={12} gap="lg" rowGap="xl" className="items-center">
          <Stack gap="md" className="col-span-4 md:col-span-7">
            {data.eyebrow ? (
              <Eyebrow rule tone="accent">
                {data.eyebrow}
              </Eyebrow>
            ) : null}
            <SplitReveal
              as="h1"
              trigger="load"
              className="font-display text-display text-balance [&_.motion-line]:-mb-[0.12em] [&_.motion-line]:pb-[0.12em]"
            >
              {data.headline}
            </SplitReveal>
            {data.subheadline ? <Lead muted>{data.subheadline}</Lead> : null}
            {primary || secondary ? (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {primary ? (
                  <Magnetic>
                    <Button asChild size="lg">
                      {waHref ? (
                        <WaLink href={waHref} source="home:hero" kind="order">
                          {primary.label}
                        </WaLink>
                      ) : (
                        <Link href={primary.href}>{primary.label}</Link>
                      )}
                    </Button>
                  </Magnetic>
                ) : null}
                {secondary ? (
                  <Button asChild size="lg" variant="secondary">
                    <Link href={secondary.href}>{secondary.label}</Link>
                  </Button>
                ) : null}
              </div>
            ) : null}
          </Stack>

          <div className="col-span-4 md:col-span-5">
            <Stack gap="sm">
              <div className="overflow-clip rounded-lg">
                <Parallax speed={0.06}>
                  {data.image ? (
                    <BlockMedia
                      image={data.image}
                      media={media}
                      caption={data.image.alt ?? "tempe dalam daun pisang"}
                      aspect="5 / 4"
                      priority
                      sizes="(min-width: 768px) 40vw, 100vw"
                    />
                  ) : (
                    <ImagePlaceholder
                      caption="tempe setengah terbuka dari daun pisang"
                      aspect="5 / 4"
                      texture="leaf"
                    />
                  )}
                </Parallax>
              </div>
              <Reveal className="flex items-baseline justify-between gap-4 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Sabarnya sama sejak
                </p>
                <p className="font-display text-h2 leading-none text-accent-strong">
                  <Counter
                    value={foundedYear}
                    from={1980}
                    format={{ useGrouping: false }}
                  />
                </p>
              </Reveal>
            </Stack>
          </div>
        </Grid>
      </Container>
    </Section>
  );
}
