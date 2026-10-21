import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { Breadcrumb } from "@/components/site/layout";
import { Container, Section } from "@/components/site/primitives";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDER_WINDOW_DAYS } from "@/features/orders/date-rules";
import { OrderBuilder } from "@/features/orders/components/order-builder";
import { BlockRenderer } from "@/features/pages/blocks/block-renderer";
import { getPage, getPageMeta } from "@/features/pages/queries";
import { getProductOptions } from "@/features/products/queries";
import { getSettings } from "@/features/settings/queries";
import { getAvailability } from "@/features/slots/queries";
import { pageMetadata } from "@/lib/seo/server";

const SLUG = "custom-order";

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPageMeta(SLUG);
  return pageMetadata({
    title: meta?.title ?? "Custom Order",
    description: meta?.seo.description,
    path: "/custom-order",
    seo: meta?.seo,
  });
}

/** Request-time part: "now" (cutoff), live slot data and `?produk=` preset. */
async function Builder({
  searchParams,
}: {
  searchParams: PageProps<"/custom-order">["searchParams"];
}) {
  await connection();
  const now = new Date();
  // Sequential on purpose: parallel cache fills (5 + 2 + 1 queries) exceed the small DB pool
  // and can stall in dev; each read is cached, so this costs nothing after the first hit.
  const options = await getProductOptions();
  const settings = await getSettings();
  const availability = await getAvailability({ now, days: ORDER_WINDOW_DAYS });
  const params = await searchParams;
  const produk = params.produk;
  return (
    <OrderBuilder
      catalog={{
        shapes: options.shapes,
        sizes: options.sizes.map((s) => ({
          id: s.id,
          name: s.name,
          weightGrams: s.weightGrams,
          dims: s.dims,
          price: s.price,
        })),
        products: options.products.map((p) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          short: p.short,
          priceFrom: p.priceFrom,
          shapeIds: p.shapeIds,
          sizes: p.sizes,
        })),
      }}
      rules={availability.rules}
      slotData={availability.data}
      days={availability.days}
      now={now.toISOString()}
      waNumber={settings["contact.whatsapp"]}
      deliveryOptions={settings["delivery.areas"]}
      showPrice={settings["pricing.show"]}
      initialProductSlug={Array.isArray(produk) ? produk[0] : produk}
    />
  );
}

function BuilderSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-10 lg:grid-cols-12"
      aria-busy="true"
      aria-label="Memuat formulir pesanan"
    >
      <div className="flex flex-col gap-6 lg:col-span-8">
        <Skeleton className="h-8 w-2/3 rounded-full" />
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-40 rounded-lg" />
      </div>
      <Skeleton className="hidden h-72 rounded-lg lg:col-span-4 lg:block" />
    </div>
  );
}

export default async function CustomOrderPage(
  props: PageProps<"/custom-order">,
) {
  const page = await getPage(SLUG);
  const sections = page?.sections ?? [];
  // CMS hero on top; the builder replaces the static slot preview; the rest (rules, FAQ) follows.
  const heroIndex = sections[0]?.type === "hero" ? 1 : 0;
  const hero = sections.slice(0, heroIndex);
  const rest = sections
    .slice(heroIndex)
    .filter((s) => s.type !== "slotCalendarPreview");

  return (
    <div className="pb-24 md:pb-0">
      <Container>
        <Breadcrumb items={[{ label: page?.title ?? "Custom Order" }]} />
      </Container>
      {hero.length ? <BlockRenderer blocks={hero} /> : null}
      <Section spacing="tight" aria-label="Formulir pesanan">
        <Container>
          {hero.length ? null : <h1 className="sr-only">Custom Order</h1>}
          <Suspense fallback={<BuilderSkeleton />}>
            <Builder searchParams={props.searchParams} />
          </Suspense>
        </Container>
      </Section>
      {rest.length ? (
        <BlockRenderer blocks={rest} firstHeadingLevel={2} />
      ) : null}
    </div>
  );
}
