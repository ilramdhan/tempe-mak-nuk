import { Reveal, SplitReveal } from "@/components/motion";
import {
  Container,
  Eyebrow,
  Grid,
  Lead,
  Section,
  Stack,
} from "@/components/site/primitives";
import type { BlockDataMap } from "@/features/pages/blocks";
import { BlockIcon } from "@/features/pages/blocks/shared";

/**
 * "Kenapa Mak Nuk" — asymmetric editorial layout: sticky heading on the left,
 * numbered pillars on the right (CMS `featureGrid` block).
 */
export function PillarsSection({
  data,
}: {
  data: BlockDataMap["featureGrid"];
}) {
  return (
    <Section id={data.anchor ?? undefined} tone={data.tone ?? "surface"} grain>
      <Container>
        <Grid cols={12} gap="lg" rowGap="xl">
          <div className="col-span-4 md:col-span-5">
            <Stack gap="sm" className="md:sticky md:top-28">
              <Eyebrow rule tone="accent">
                {data.eyebrow ?? "Empat pegangan"}
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
          </div>
          <Reveal
            as="ol"
            stagger
            className="col-span-4 m-0 flex list-none flex-col p-0 md:col-span-6 md:col-start-7"
          >
            {data.items.map((item, i) => (
              <li
                key={i}
                className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-border py-6 last:border-b"
              >
                <span
                  aria-hidden
                  className="row-span-2 font-display text-h3 leading-none text-accent-strong tabular-nums"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-h3 text-balance">
                  {item.title}
                  <BlockIcon
                    name={item.icon}
                    className="ml-2 inline size-5 align-[-0.1em] text-primary"
                  />
                </h3>
                {item.body ? (
                  <p className="text-pretty text-muted-foreground">
                    {item.body}
                  </p>
                ) : null}
              </li>
            ))}
          </Reveal>
        </Grid>
      </Container>
    </Section>
  );
}
