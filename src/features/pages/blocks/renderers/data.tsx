/** Blocks that read domain data (all via cached queries → static under cacheComponents). */
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";

import {
  Container,
  Grid,
  Heading,
  Section,
  Stack,
} from "@/components/site/primitives";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge, SlotBadge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMinutes, formatPriceFrom } from "@/features/_shared/format";
import { groupFaqs, queryFaqs } from "@/features/faqs/queries";
import {
  getPosts,
  getPostsBySlugs,
  type PostSummary,
} from "@/features/posts/queries";
import { getProducts, getProductsBySlugs } from "@/features/products/queries";
import { getRecipes, getRecipesBySlugs } from "@/features/recipes/queries";
import { formatSettingValue, getSettings } from "@/features/settings/queries";
import {
  AVAILABILITY_LABEL,
  toBadgeStatus,
} from "@/features/slots/availability";
import { getAvailability } from "@/features/slots/queries";
import { queryTestimonials } from "@/features/testimonials/queries";
import { formatDate, formatDateShort, formatWeekday } from "@/lib/dates";
import { renderLightMarkdown } from "@/lib/rich-text/inline";
import { RichText } from "@/lib/rich-text";
import { cn } from "@/lib/utils";

import type { BlockDataMap } from "../schema";
import {
  BlockHeader,
  BlockMedia,
  CtaButton,
  CtaRow,
  type BlockProps,
} from "../shared";

const sub = (level: 1 | 2 | 3 | 4) => (level === 1 ? 2 : 3) as 2 | 3;

function Footer({ cta }: { cta: { label: string; href: string } | null }) {
  if (!cta) return null;
  return (
    <CtaRow>
      <CtaButton cta={cta} variant="secondary" size="md" />
    </CtaRow>
  );
}

// ── FAQ ──────────────────────────────────────────────────────────────────
export async function FaqListBlock({
  data,
  ctx,
}: BlockProps<BlockDataMap["faqList"]>) {
  const list = await queryFaqs(data);
  if (!list.length) return null;
  // Group only for "all" without an explicit category/ids.
  const groups =
    data.source === "all" && !data.category && !data.ids?.length
      ? groupFaqs(list)
      : [{ slug: null, name: "", items: list }];
  return (
    <Section id={data.anchor ?? "faq"} tone={data.tone ?? "default"}>
      <Container size="prose">
        <Stack gap="lg">
          <BlockHeader
            eyebrow={data.eyebrow}
            heading={data.heading}
            intro={data.intro}
            level={ctx.headingLevel}
          />
          {groups.map((g) => (
            <Stack key={g.slug ?? "_"} gap="xs">
              {g.name ? (
                <Heading
                  level={sub(ctx.headingLevel)}
                  size="h4"
                  id={g.slug ? `faq-${g.slug}` : undefined}
                >
                  {g.name}
                </Heading>
              ) : null}
              <Accordion type="multiple" className="border-t border-border">
                {g.items.map((f) => (
                  <AccordionItem
                    key={f.id}
                    value={f.id}
                    className="border-border"
                  >
                    <AccordionTrigger className="py-4 text-base">
                      {f.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground">
                      {renderLightMarkdown(f.answer, {
                        internalHosts: ctx.internalHosts,
                      })}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Stack>
          ))}
          <Footer cta={data.cta} />
        </Stack>
      </Container>
    </Section>
  );
}

// ── Testimonials ─────────────────────────────────────────────────────────
export async function TestimonialListBlock({
  data,
  ctx,
}: BlockProps<BlockDataMap["testimonialList"]>) {
  const list = await queryTestimonials(data);
  if (!list.length) return null;
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
          <Grid as="ul" cols={list.length >= 3 ? 3 : 2} gap="md">
            {list.map((t) => (
              <li key={t.id}>
                <figure className="m-0 flex h-full flex-col gap-4 rounded-lg border border-border bg-card p-6">
                  <blockquote className="font-display text-h4 text-pretty">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-auto flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {t.name}
                    </span>
                    {[t.role, t.city].filter(Boolean).join(" · ")}
                    {t.verified ? (
                      <Badge variant="outline">Terverifikasi</Badge>
                    ) : null}
                    {t.isPlaceholder ? (
                      <Badge
                        variant="secondary"
                        className="dark:bg-foreground/10"
                      >
                        Contoh testimoni
                      </Badge>
                    ) : null}
                  </figcaption>
                </figure>
              </li>
            ))}
          </Grid>
          <Footer cta={data.cta} />
        </Stack>
      </Container>
    </Section>
  );
}

// ── Products ─────────────────────────────────────────────────────────────
export async function ProductTeaserBlock({
  data,
  ctx,
}: BlockProps<BlockDataMap["productTeaser"]>) {
  const [list, settings] = await Promise.all([
    data.productSlugs?.length
      ? getProductsBySlugs(data.productSlugs)
      : getProducts(),
    getSettings(),
  ]);
  if (!list.length) return null;
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
          <Grid
            as="ul"
            cols={list.length === 1 ? 1 : list.length === 2 ? 2 : 3}
            gap="lg"
          >
            {list.map((p) => {
              const price = formatPriceFrom(
                p.priceFrom,
                settings["pricing.show"],
              );
              return (
                <li key={p.id}>
                  <Card className="h-full gap-0 py-0">
                    <BlockMedia
                      image={p.cover ? { mediaId: p.cover.id } : null}
                      media={p.cover ? { [p.cover.id]: p.cover } : {}}
                      caption={`tekstur ${p.name}`}
                      aspect="4 / 3"
                      texture={p.variant === "skinless" ? "soy" : "mycelium"}
                      className="rounded-none border-0 border-b"
                    />
                    <CardHeader className="pt-6">
                      <Heading level={sub(ctx.headingLevel)} size="h3">
                        {p.name}
                      </Heading>
                      {p.short ? (
                        <CardDescription className="text-base">
                          {p.short}
                        </CardDescription>
                      ) : null}
                    </CardHeader>
                    <CardContent className="pt-3 pb-6">
                      {price ? (
                        <p className="text-sm font-medium">{price}</p>
                      ) : null}
                    </CardContent>
                    <CardFooter className="mt-auto gap-3 bg-transparent">
                      <CtaButton
                        cta={{
                          label: data.ctaLabel ?? "Lihat detail",
                          href: `/produk/${p.slug}`,
                        }}
                        variant="primary"
                        size="md"
                      />
                    </CardFooter>
                  </Card>
                </li>
              );
            })}
          </Grid>
          <Footer cta={data.cta} />
        </Stack>
      </Container>
    </Section>
  );
}

// ── Posts / recipes ──────────────────────────────────────────────────────
function TeaserCard({
  href,
  title,
  excerpt,
  meta,
  cover,
  level,
}: {
  href: string;
  title: string;
  excerpt: string | null;
  meta: string[];
  cover: PostSummary["cover"];
  level: 2 | 3;
}) {
  return (
    <article className="group relative flex h-full flex-col gap-3">
      <BlockMedia
        image={cover ? { mediaId: cover.id } : null}
        media={cover ? { [cover.id]: cover } : {}}
        caption={title}
        aspect="3 / 2"
        texture="leaf"
        sizes="(min-width: 1024px) 33vw, 100vw"
      />
      {meta.length ? (
        <p className="text-xs text-muted-foreground">{meta.join(" · ")}</p>
      ) : null}
      <Heading level={level} size="h4">
        <Link
          href={href}
          className="group-hover:underline group-hover:underline-offset-4 after:absolute after:inset-0"
        >
          {title}
        </Link>
      </Heading>
      {excerpt ? (
        <p className="line-clamp-3 text-pretty text-muted-foreground">
          {excerpt}
        </p>
      ) : null}
    </article>
  );
}

export async function PostTeaserBlock({
  data,
  ctx,
}: BlockProps<BlockDataMap["postTeaser"]>) {
  const list = data.slugs?.length
    ? (await getPostsBySlugs(data.slugs)).slice(0, data.limit)
    : await getPosts({ category: data.category, limit: data.limit });
  if (!list.length) return null;
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
          <Grid as="ul" cols={list.length === 1 ? 2 : 3} gap="lg">
            {list.map((p) => (
              <li key={p.id}>
                <TeaserCard
                  href={`/jurnal/${p.slug}`}
                  title={p.title}
                  excerpt={p.excerpt}
                  cover={p.cover}
                  level={sub(ctx.headingLevel)}
                  meta={[
                    p.category?.name,
                    p.publishedAt ? formatDate(p.publishedAt) : null,
                    p.readingMinutes ? `${p.readingMinutes} menit baca` : null,
                  ].filter((x): x is string => Boolean(x))}
                />
              </li>
            ))}
          </Grid>
          <Footer cta={data.cta} />
        </Stack>
      </Container>
    </Section>
  );
}

export async function RecipeTeaserBlock({
  data,
  ctx,
}: BlockProps<BlockDataMap["recipeTeaser"]>) {
  const list = data.slugs?.length
    ? (await getRecipesBySlugs(data.slugs)).slice(0, data.limit)
    : await getRecipes({ limit: data.limit });
  if (!list.length) return null;
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
          <Grid as="ul" cols={list.length === 1 ? 2 : 3} gap="lg">
            {list.map((r) => {
              const total = (r.prepMinutes ?? 0) + (r.cookMinutes ?? 0);
              return (
                <li key={r.id}>
                  <TeaserCard
                    href={`/resep/${r.slug}`}
                    title={r.title}
                    excerpt={r.excerpt}
                    cover={r.cover}
                    level={sub(ctx.headingLevel)}
                    meta={[
                      r.category?.name,
                      formatMinutes(total),
                      r.servings ? `${r.servings} porsi` : null,
                    ].filter((x): x is string => Boolean(x))}
                  />
                </li>
              );
            })}
          </Grid>
          <Footer cta={data.cta} />
        </Stack>
      </Container>
    </Section>
  );
}

// ── Slot calendar preview ───────────────────────────────────────────────
async function SlotDays({ days }: { days: number }) {
  await connection(); // request-time "now"; everything above stays in the static shell
  const { days: list } = await getAvailability({ now: new Date(), days });
  return (
    <ul
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
      aria-label="Status slot per tanggal"
    >
      {list.map((d) => {
        const badge = toBadgeStatus(d.status);
        return (
          <li
            key={d.date}
            className={cn(
              "flex flex-col gap-2 rounded-lg border border-border bg-card p-3",
              !d.orderable && "opacity-70",
            )}
            title={d.reason}
          >
            <span className="text-xs text-muted-foreground">
              {formatWeekday(d.date)}
            </span>
            <span className="font-display text-h4 leading-none">
              {formatDateShort(d.date)}
            </span>
            <SlotBadge status={badge}>{AVAILABILITY_LABEL[d.status]}</SlotBadge>
            <span className="sr-only">{d.reason}</span>
          </li>
        );
      })}
    </ul>
  );
}

function SlotDaysSkeleton({ days }: { days: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"
      aria-hidden
    >
      {Array.from({ length: Math.min(days, 14) }, (_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}

export function SlotCalendarPreviewBlock({
  data,
  ctx,
}: BlockProps<BlockDataMap["slotCalendarPreview"]>) {
  return (
    <Section id={data.anchor ?? "slot"} tone={data.tone ?? "surface"}>
      <Container>
        <Stack gap="lg">
          <BlockHeader
            eyebrow={data.eyebrow}
            heading={data.heading}
            intro={data.intro}
            level={ctx.headingLevel}
          />
          <Suspense fallback={<SlotDaysSkeleton days={data.days} />}>
            <SlotDays days={data.days} />
          </Suspense>
          <p className="text-sm text-muted-foreground">
            Status diperbarui manual; konfirmasi akhir via WhatsApp.
          </p>
          <Footer cta={data.cta} />
        </Stack>
      </Container>
    </Section>
  );
}

// ── Split (image/map + text + live setting facts) ───────────────────────
export async function SplitBlock({
  data,
  ctx,
}: BlockProps<BlockDataMap["split"]>) {
  const settings = await getSettings();
  const facts = data.facts
    .map((f) => ({
      label: f.label,
      value: formatSettingValue(
        settings[f.settingKey as keyof typeof settings],
      ),
    }))
    .filter((f) => f.value);
  const embedUrl = settings["maps.embedUrl"];
  const visual =
    data.map && embedUrl ? (
      <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-surface">
        <iframe
          src={embedUrl}
          title={`Peta lokasi ${settings["business.name"]}`}
          className="size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    ) : (
      <BlockMedia
        image={data.image}
        media={ctx.media}
        caption={data.image?.alt ?? data.heading ?? "dapur Mak Nuk"}
        aspect="4 / 3"
        texture="leaf"
      />
    );
  return (
    <Section id={data.anchor ?? undefined} tone={data.tone ?? "default"}>
      <Container>
        <Grid cols={12} gap="lg" rowGap="xl" className="items-center">
          <div
            className={cn(
              "col-span-4 md:col-span-6",
              data.imagePosition === "left" && "md:order-2",
            )}
          >
            <Stack gap="md">
              <BlockHeader
                eyebrow={data.eyebrow}
                heading={data.heading}
                level={ctx.headingLevel}
              />
              {data.content ? (
                <RichText
                  doc={data.content}
                  internalHosts={ctx.internalHosts}
                />
              ) : data.body ? (
                <p className="max-w-measure text-pretty text-muted-foreground">
                  {data.body}
                </p>
              ) : null}
              {facts.length ? (
                <dl className="grid gap-x-6 gap-y-3 border-t border-border pt-4 sm:grid-cols-[auto_1fr]">
                  {facts.map((f) => (
                    <div key={f.label} className="contents">
                      <dt className="text-sm text-muted-foreground">
                        {f.label}
                      </dt>
                      <dd className="font-medium break-words">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              <Footer cta={data.cta} />
            </Stack>
          </div>
          <div className="col-span-4 md:col-span-6">{visual}</div>
        </Grid>
      </Container>
    </Section>
  );
}
