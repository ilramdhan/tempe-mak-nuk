import Link from "next/link";

import { SplitReveal } from "@/components/motion";
import {
  Container,
  Eyebrow,
  Lead,
  Section,
  Stack,
} from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import type { BlockDataMap } from "@/features/pages/blocks";

import { ProcessStory } from "./process-story";

/** Process steps block rendered as a pinned scroll story (CMS `steps` block). */
export function ProcessSection({ data }: { data: BlockDataMap["steps"] }) {
  return (
    <Section id={data.anchor ?? "proses"} tone={data.tone ?? "default"}>
      <Container>
        <Stack gap="xl">
          <Stack gap="sm" className="max-w-measure">
            <Eyebrow rule tone="accent">
              {data.eyebrow ?? "Proses"}
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
          <ProcessStory
            steps={data.items.map((s) => ({ title: s.title, body: s.body }))}
          />
          {data.cta ? (
            <div>
              <Button asChild variant="secondary">
                <Link href={data.cta.href}>{data.cta.label}</Link>
              </Button>
            </div>
          ) : null}
        </Stack>
      </Container>
    </Section>
  );
}
