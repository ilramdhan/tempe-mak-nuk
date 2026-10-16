import { Marquee } from "@/components/motion";
import { Section } from "@/components/site/primitives";
import type { BlockDataMap } from "@/features/pages/blocks";
import { BlockIcon } from "@/features/pages/blocks/shared";

/**
 * Trust strip as a calm CSS marquee (static + wrapped under reduced motion).
 * Items come from the CMS `trustStrip` block. The duplicate copy is aria-hidden by Marquee.
 */
export function TrustMarquee({ data }: { data: BlockDataMap["trustStrip"] }) {
  return (
    <Section
      tone="surface"
      spacing="none"
      className="border-y border-border py-5"
      aria-label="Keunggulan Tempe Mak Nuk"
    >
      <Marquee duration={45} gap="3.5rem">
        {data.items.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-3 font-display text-h4 whitespace-nowrap"
          >
            <BlockIcon
              name={item.icon ?? "check"}
              className="size-5 text-primary"
            />
            {item.label}
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          </span>
        ))}
      </Marquee>
    </Section>
  );
}
