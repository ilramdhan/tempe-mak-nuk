/** Blocks that render from their own data only (no DB reads besides pre-resolved media). */
import {
  Container,
  Divider,
  Eyebrow,
  Grid,
  Heading,
  Lead,
  Section,
  Stack,
} from "@/components/site/primitives";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RichText } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

import type { BlockDataMap } from "../schema";
import {
  BlockHeader,
  BlockIcon,
  BlockMedia,
  CtaButton,
  CtaRow,
  SmartLink,
  type BlockProps,
} from "../shared";

export function HeroBlock({ data, ctx }: BlockProps<BlockDataMap["hero"]>) {
  const centered = data.layout === "center";
  const text = (
    <Stack
      gap="md"
      className={cn(centered && "mx-auto items-center text-center")}
    >
      {data.eyebrow ? (
        <Eyebrow rule={!centered} tone="accent">
          {data.eyebrow}
        </Eyebrow>
      ) : null}
      <Heading
        level={ctx.headingLevel}
        size={ctx.index === 0 ? "display" : "h1"}
      >
        {data.headline}
      </Heading>
      {data.subheadline ? <Lead muted>{data.subheadline}</Lead> : null}
      {data.primaryCta || data.secondaryCta ? (
        <CtaRow className={cn("pt-2", centered && "justify-center")}>
          <CtaButton cta={data.primaryCta} />
          <CtaButton cta={data.secondaryCta} variant="secondary" />
        </CtaRow>
      ) : null}
    </Stack>
  );
  return (
    <Section id={data.anchor ?? undefined} tone={data.tone ?? "default"} grain>
      <Container>
        {centered ? (
          text
        ) : (
          <Grid cols={12} gap="lg" rowGap="xl" className="items-center">
            <div className="col-span-4 md:col-span-7">{text}</div>
            <div className="col-span-4 md:col-span-5">
              <BlockMedia
                image={data.image}
                media={ctx.media}
                caption={data.image?.alt ?? "tempe Mak Nuk"}
                priority={ctx.index === 0}
                sizes="(min-width: 768px) 40vw, 100vw"
              />
            </div>
          </Grid>
        )}
      </Container>
    </Section>
  );
}

export function RichTextBlock({
  data,
  ctx,
}: BlockProps<BlockDataMap["richText"]>) {
  return (
    <Section
      id={data.anchor ?? undefined}
      tone={data.tone ?? "default"}
      spacing="tight"
    >
      <Container size={data.width === "prose" ? "prose" : "default"}>
        <Stack gap="lg">
          <BlockHeader
            eyebrow={data.eyebrow}
            heading={data.heading}
            intro={data.intro}
            level={ctx.headingLevel}
          />
          <RichText doc={data.content} internalHosts={ctx.internalHosts} />
        </Stack>
      </Container>
    </Section>
  );
}

export function FeatureGridBlock({
  data,
  ctx,
}: BlockProps<BlockDataMap["featureGrid"]>) {
  const cols =
    data.columns ??
    (data.items.length % 3 === 0 ? 3 : data.items.length >= 4 ? 4 : 2);
  return (
    <Section id={data.anchor ?? undefined} tone={data.tone ?? "default"}>
      <Container>
        <Stack gap="xl">
          <BlockHeader
            eyebrow={data.eyebrow}
            heading={data.heading}
            intro={data.intro}
            level={ctx.headingLevel}
          />
          <Grid as="ul" cols={cols} gap="lg">
            {data.items.map((item, i) => (
              <li key={i}>
                <Stack gap="xs" className="border-t border-border pt-5">
                  {item.icon ? (
                    <span className="mb-2 inline-flex size-10 items-center justify-center rounded-full bg-surface text-primary">
                      <BlockIcon name={item.icon} />
                    </span>
                  ) : null}
                  <Heading level={ctx.headingLevel === 1 ? 2 : 3} size="h4">
                    {item.title}
                  </Heading>
                  {item.body ? (
                    <p className="text-pretty text-muted-foreground">
                      {item.body}
                    </p>
                  ) : null}
                </Stack>
              </li>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}

export function CompareBlock({
  data,
  ctx,
}: BlockProps<BlockDataMap["compare"]>) {
  return (
    <Section id={data.anchor ?? undefined} tone={data.tone ?? "surface"}>
      <Container>
        <Stack gap="lg">
          <BlockHeader
            eyebrow={data.eyebrow}
            heading={data.heading}
            intro={data.intro}
            level={ctx.headingLevel}
          />
          <div className="rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="w-1/4 px-4 py-3">
                    <span className="sr-only">Aspek</span>
                  </TableHead>
                  {data.columns.map((c, i) => (
                    <TableHead
                      key={i}
                      scope="col"
                      className="px-4 py-3 font-display text-base text-foreground"
                    >
                      {c}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row, r) => (
                  <TableRow key={r}>
                    <TableHead
                      scope="row"
                      className="px-4 py-3 align-top font-medium text-muted-foreground"
                    >
                      {row.label}
                    </TableHead>
                    {row.values.map((v, c) => (
                      <TableCell
                        key={c}
                        className="px-4 py-3 align-top whitespace-normal"
                      >
                        {v}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {data.note ? (
            <p className="text-sm text-muted-foreground">{data.note}</p>
          ) : null}
        </Stack>
      </Container>
    </Section>
  );
}

export function StepsBlock({ data, ctx }: BlockProps<BlockDataMap["steps"]>) {
  return (
    <Section id={data.anchor ?? undefined} tone={data.tone ?? "default"}>
      <Container>
        <Stack gap="xl">
          <BlockHeader
            eyebrow={data.eyebrow}
            heading={data.heading}
            intro={data.intro}
            level={ctx.headingLevel}
          />
          <Grid as="ol" cols={data.items.length <= 3 ? 3 : 4} gap="lg">
            {data.items.map((step, i) => (
              <li key={i}>
                <Stack gap="xs">
                  <span
                    aria-hidden
                    className="font-display text-h2 leading-none text-accent-strong"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Divider className="my-2" />
                  <Heading level={ctx.headingLevel === 1 ? 2 : 3} size="h4">
                    {/* Seeds may number titles ("1. Sortir"); the visual numeral already does. */}
                    {step.title.replace(/^\d+\.\s*/, "")}
                  </Heading>
                  {step.body ? (
                    <p className="text-pretty text-muted-foreground">
                      {step.body}
                    </p>
                  ) : null}
                </Stack>
              </li>
            ))}
          </Grid>
          {data.cta ? (
            <CtaRow>
              <CtaButton cta={data.cta} variant="secondary" size="md" />
            </CtaRow>
          ) : null}
        </Stack>
      </Container>
    </Section>
  );
}

export function StatsBlock({ data, ctx }: BlockProps<BlockDataMap["stats"]>) {
  return (
    <Section id={data.anchor ?? undefined} tone={data.tone ?? "surface"}>
      <Container>
        <Stack gap="xl">
          <BlockHeader
            eyebrow={data.eyebrow}
            heading={data.heading}
            intro={data.intro}
            level={ctx.headingLevel}
          />
          <Grid as="dl" cols={data.items.length <= 3 ? 3 : 4} gap="lg">
            {data.items.map((s, i) => (
              <div
                key={i}
                className="flex flex-col-reverse gap-1 border-l-2 border-accent pl-4"
              >
                <dt className="text-sm text-muted-foreground">{s.label}</dt>
                <dd className="font-display text-h2 leading-none">
                  {s.value}
                  {s.unit ? (
                    <span className="ml-1 font-sans text-base text-muted-foreground">
                      {s.unit}
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </Grid>
          {data.source ? (
            <p className="max-w-measure text-sm text-muted-foreground">
              Sumber: {data.source}
            </p>
          ) : null}
        </Stack>
      </Container>
    </Section>
  );
}

export function CtaBlock({ data, ctx }: BlockProps<BlockDataMap["cta"]>) {
  return (
    <Section id={data.anchor ?? undefined} tone={data.tone ?? "primary"} grain>
      <Container size="prose">
        <Stack gap="md" align="center" className="text-center">
          {data.eyebrow ? (
            <Eyebrow tone="inherit">{data.eyebrow}</Eyebrow>
          ) : null}
          <Heading level={ctx.headingLevel} size="h1">
            {data.headline}
          </Heading>
          {data.body ? <Lead className="opacity-90">{data.body}</Lead> : null}
          {data.primary || data.secondary ? (
            <CtaRow className="justify-center pt-2">
              <CtaButton cta={data.primary} variant="accent" />
              <CtaButton cta={data.secondary} variant="ghost" />
            </CtaRow>
          ) : null}
        </Stack>
      </Container>
    </Section>
  );
}

export function GalleryBlock({
  data,
  ctx,
}: BlockProps<BlockDataMap["gallery"]>) {
  const items = data.items.filter((i) => ctx.media[i.mediaId]);
  const cols = data.columns;
  return (
    <Section id={data.anchor ?? undefined} tone={data.tone ?? "default"}>
      <Container>
        <Stack gap="lg">
          <BlockHeader
            eyebrow={data.eyebrow}
            heading={data.heading}
            intro={data.intro}
            level={ctx.headingLevel}
          />
          {items.length ? (
            <Grid as="ul" cols={cols} gap="sm">
              {items.map((item) => (
                <li key={item.mediaId}>
                  <figure className="m-0">
                    <BlockMedia
                      image={item}
                      media={ctx.media}
                      caption={item.caption ?? ""}
                      aspect="4 / 3"
                      sizes="(min-width: 1024px) 33vw, 50vw"
                    />
                    {item.caption ? (
                      <figcaption className="mt-2 text-sm text-muted-foreground">
                        {item.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                </li>
              ))}
            </Grid>
          ) : (
            <Grid cols={3} gap="sm">
              {(["mycelium", "leaf", "soy"] as const).map((t, i) => (
                <BlockMedia
                  key={t}
                  image={null}
                  media={ctx.media}
                  caption={i === 0 ? "proses di dapur (menyusul)" : "menyusul"}
                  aspect="4 / 3"
                  texture={t}
                />
              ))}
            </Grid>
          )}
          {!items.length && data.note ? (
            <p className="text-sm text-muted-foreground">{data.note}</p>
          ) : null}
        </Stack>
      </Container>
    </Section>
  );
}

export function TrustStripBlock({
  data,
}: BlockProps<BlockDataMap["trustStrip"]>) {
  return (
    <Section
      id={data.anchor ?? undefined}
      tone={data.tone ?? "surface"}
      spacing="none"
      className="border-y border-border py-6"
    >
      <Container>
        <ul
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-medium"
          aria-label="Keunggulan"
        >
          {data.items.map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <BlockIcon
                name={item.icon ?? "check"}
                className="size-4 text-primary"
              />
              {item.label}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}

export function LogoStripBlock({
  data,
  ctx,
}: BlockProps<BlockDataMap["logoStrip"]>) {
  return (
    <Section
      id={data.anchor ?? undefined}
      tone={data.tone ?? "default"}
      spacing="tight"
    >
      <Container>
        <Stack gap="md" align="center">
          <BlockHeader
            eyebrow={data.eyebrow}
            heading={data.heading}
            intro={data.intro}
            level={ctx.headingLevel}
            align="center"
          />
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {data.items.map((item, i) => {
              const m = item.mediaId ? ctx.media[item.mediaId] : undefined;
              const content = m ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.url}
                  alt={item.label}
                  className="h-8 w-auto opacity-80 grayscale"
                  loading="lazy"
                />
              ) : (
                <span className="font-display text-h4 text-muted-foreground">
                  {item.label}
                </span>
              );
              return (
                <li key={i}>
                  {item.href ? (
                    <SmartLink href={item.href} className="hover:opacity-100">
                      {content}
                    </SmartLink>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        </Stack>
      </Container>
    </Section>
  );
}
