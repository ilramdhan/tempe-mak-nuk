import Link from "next/link";

import { MyceliumPattern } from "@/components/brand/textures";
import { Magnetic, SplitReveal } from "@/components/motion";
import { WaLink } from "@/components/site/layout";
import {
  Container,
  Eyebrow,
  Lead,
  Section,
  Stack,
} from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import type { BlockDataMap } from "@/features/pages/blocks";

/** Closing CTA band (CMS `cta` block) on brand green; primary goes to WhatsApp. */
export function ClosingCta({
  data,
  waHref,
  hours,
}: {
  data: BlockDataMap["cta"];
  waHref: string | null;
  /** settings.hours.summary */
  hours: string;
}) {
  return (
    <Section tone={data.tone ?? "primary"} grain className="overflow-clip">
      <MyceliumPattern className="opacity-[0.08]" />
      <Container size="prose" className="relative">
        <Stack gap="md" align="center" className="text-center">
          <Eyebrow tone="inherit">
            {data.eyebrow ?? "Tempe yang layak ditunggu"}
          </Eyebrow>
          <SplitReveal
            as="h2"
            className="font-display text-display text-balance"
          >
            {data.headline}
          </SplitReveal>
          {data.body ? <Lead className="opacity-90">{data.body}</Lead> : null}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {waHref && data.primary ? (
              <Magnetic>
                <Button asChild variant="accent" size="lg">
                  <WaLink href={waHref} source="home:closing" kind="order">
                    {data.primary.label}
                  </WaLink>
                </Button>
              </Magnetic>
            ) : data.primary ? (
              <Button asChild variant="accent" size="lg">
                <Link href={data.primary.href}>{data.primary.label}</Link>
              </Button>
            ) : null}
            {data.secondary ? (
              <Button
                asChild
                variant="ghost"
                size="lg"
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href={data.secondary.href}>{data.secondary.label}</Link>
              </Button>
            ) : null}
          </div>
          {hours && !data.body ? (
            <p className="text-sm text-muted-foreground">{hours}</p>
          ) : null}
        </Stack>
      </Container>
    </Section>
  );
}
