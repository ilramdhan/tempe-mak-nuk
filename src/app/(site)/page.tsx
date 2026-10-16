import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AudienceSection } from "@/components/site/home/audience-section";
import { ClosingCta } from "@/components/site/home/closing-cta";
import { HomeHero } from "@/components/site/home/home-hero";
import { HomeJsonLd } from "@/components/site/home/home-json-ld";
import { OrderStepsSection } from "@/components/site/home/order-steps-section";
import { PillarsSection } from "@/components/site/home/pillars-section";
import { ProcessSection } from "@/components/site/home/process-section";
import { SlotTeaser } from "@/components/site/home/slot-teaser";
import { TrustMarquee } from "@/components/site/home/trust-marquee";
import { getMediaByIds } from "@/features/media/queries";
import { validateBlocks, type ValidBlock } from "@/features/pages/blocks";
import { BlockRenderer } from "@/features/pages/blocks/block-renderer";
import { getPage, getPageMeta } from "@/features/pages/queries";
import { getSettings } from "@/features/settings/queries";
import { buildWaLink } from "@/lib/wa-link";

const SLUG = "home";

/** Used only if the `home` page row is missing/unpublished (docs/brand.md §1 hero lockup). */
const FALLBACK_HERO: ValidBlock = {
  key: "fallback-hero",
  type: "hero",
  data: {
    anchor: null,
    tone: null,
    eyebrow: null,
    headline: "Tiga bahan, tanpa jalan pintas.",
    subheadline: "Kedelai, air, dan ragi. Tanpa pengawet, tanpa bahan kimia.",
    primaryCta: { label: "Cek slot via WhatsApp", href: "/custom-order" },
    secondaryCta: { label: "Lihat dua varian", href: "/produk" },
    image: null,
    layout: "split",
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    getPageMeta(SLUG),
    getSettings(),
  ]);
  const title =
    page?.seo.title ||
    settings["seo.defaultTitle"] ||
    settings["business.name"];
  const description =
    page?.seo.description || settings["seo.defaultDescription"];
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: { title, description, url: "/", type: "website" },
    robots: page?.seo.noindex ? { index: false, follow: false } : undefined,
  };
}

/**
 * Beranda. Sections come from the CMS `home` page (admin can edit copy, order, show/hide).
 * Signature blocks get beranda-specific motion components; everything else falls through to
 * <BlockRenderer> (product/recipe/post/testimonial/FAQ teasers).
 * Mapping by type + occurrence: 1st `steps` = proses (pinned story), 2nd = cara pesan;
 * 1st `featureGrid` = kenapa Mak Nuk, 2nd = untuk siapa.
 */
export default async function HomePage() {
  const [page, settings] = await Promise.all([getPage(SLUG), getSettings()]);
  const blocks = validateBlocks(page?.sections ?? []);
  if (!blocks.some((b) => b.type === "hero")) blocks.unshift(FALLBACK_HERO);

  const wa = settings["contact.whatsapp"];
  const orderWaHref = buildWaLink(wa, settings["cta.waFloatMessage"]);
  const b2bWaHref = buildWaLink(wa, {
    greeting: `Halo ${settings["business.name"]}, saya ingin menanyakan kerja sama pasokan tempe.`,
    lines: [
      { label: "Usaha", value: "…" },
      { label: "Kebutuhan per minggu", value: "…" },
    ],
  });
  const heroImageIds = blocks.flatMap((b) =>
    b.type === "hero" && b.data.image ? [b.data.image.mediaId] : [],
  );
  const media = await getMediaByIds(heroImageIds);

  // 1-based occurrence of each block's type (pure, no mutation during render).
  const occurrence = blocks.map(
    (b, i) => blocks.slice(0, i + 1).filter((x) => x.type === b.type).length,
  );

  const rendered: ReactNode[] = blocks.map((block, i) => {
    const n = occurrence[i]!;
    switch (block.type) {
      case "hero":
        // Only the first hero is the h1 hero; later ones render as generic blocks.
        if (n > 1) break;
        return (
          <HomeHero
            key={block.key}
            data={block.data}
            media={media}
            waHref={orderWaHref}
            foundedYear={settings["business.foundedYear"]}
          />
        );
      case "trustStrip":
        return <TrustMarquee key={block.key} data={block.data} />;
      case "steps":
        if (n === 1)
          return <ProcessSection key={block.key} data={block.data} />;
        if (n === 2)
          return (
            <OrderStepsSection
              key={block.key}
              data={block.data}
              leadDays={settings["order.leadDays"]}
              cutoffTime={settings["order.cutoffTime"]}
            />
          );
        break;
      case "featureGrid":
        if (n === 1)
          return <PillarsSection key={block.key} data={block.data} />;
        if (n === 2)
          return (
            <AudienceSection
              key={block.key}
              data={block.data}
              b2bWaHref={b2bWaHref}
            />
          );
        break;
      case "slotCalendarPreview":
        return (
          <SlotTeaser
            key={block.key}
            data={block.data}
            waHref={orderWaHref}
            slotsPerDay={settings["order.slotsPerDay"]}
          />
        );
      case "cta":
        return (
          <ClosingCta
            key={block.key}
            data={block.data}
            waHref={orderWaHref}
            hours={settings.hours.summary}
          />
        );
    }
    // Generic CMS blocks (teasers, testimonials with placeholder label, FAQ, …). The page owns its h1.
    return (
      <BlockRenderer
        key={block.key}
        blocks={[{ id: block.key, type: block.type, data: block.data }]}
        firstHeadingLevel={2}
      />
    );
  });

  return (
    <>
      {rendered}
      <HomeJsonLd settings={settings} />
    </>
  );
}
