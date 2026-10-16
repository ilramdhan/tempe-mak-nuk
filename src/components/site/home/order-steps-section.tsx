import Link from "next/link";

import { Reveal, SplitReveal } from "@/components/motion";
import {
  Container,
  Eyebrow,
  Lead,
  Section,
  Stack,
} from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import type { BlockDataMap } from "@/features/pages/blocks";

/**
 * "Cara pesan" (CMS `steps` block) as a horizontal numbered rail + the PO rule
 * sentence built from settings (order.leadDays / order.cutoffTime) — never hard-coded.
 */
export function OrderStepsSection({
  data,
  leadDays,
  cutoffTime,
}: {
  data: BlockDataMap["steps"];
  leadDays: number;
  /** "HH:mm" (settings) → shown as "HH.mm WIB". */
  cutoffTime: string;
}) {
  const cutoff = cutoffTime.replace(":", ".");
  return (
    <Section id={data.anchor ?? "cara-pesan"} tone={data.tone ?? "default"}>
      <Container>
        <Stack gap="xl">
          <Stack gap="sm" className="max-w-measure">
            <Eyebrow rule tone="accent">
              {data.eyebrow ?? "Cara pesan"}
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
            as="ol"
            stagger
            className="m-0 grid list-none grid-cols-1 gap-x-6 gap-y-10 p-0 sm:grid-cols-2 lg:grid-cols-4"
          >
            {data.items.map((step, i) => (
              <li
                key={i}
                className="flex flex-col gap-2 border-t-2 border-primary pt-4"
              >
                <span
                  aria-hidden
                  className="text-sm font-medium text-muted-foreground tabular-nums"
                >
                  Langkah {i + 1}
                </span>
                <h3 className="font-display text-h3 text-balance">
                  {step.title.replace(/^\d+\.\s*/, "")}
                </h3>
                {step.body ? (
                  <p className="text-pretty text-muted-foreground">
                    {step.body}
                  </p>
                ) : null}
              </li>
            ))}
          </Reveal>
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 md:flex-row md:items-center md:justify-between">
            <p className="max-w-measure text-pretty">
              <strong className="font-medium">Aturan PO:</strong> pesan paling
              lambat {leadDays} hari sebelum tanggal pakai, sebelum pukul{" "}
              {cutoff} WIB.
            </p>
            {data.cta ? (
              <Button
                asChild
                variant="secondary"
                className="self-start md:self-auto"
              >
                <Link href={data.cta.href}>{data.cta.label}</Link>
              </Button>
            ) : null}
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
