import "server-only";

import type { ComponentType } from "react";

import { getMediaByIds } from "@/features/media/queries";
import { getSettings } from "@/features/settings/queries";

import {
  CompareBlock,
  CtaBlock,
  FeatureGridBlock,
  GalleryBlock,
  HeroBlock,
  LogoStripBlock,
  RichTextBlock,
  StatsBlock,
  StepsBlock,
  TrustStripBlock,
} from "./renderers/static";
import {
  FaqListBlock,
  PostTeaserBlock,
  ProductTeaserBlock,
  RecipeTeaserBlock,
  SlotCalendarPreviewBlock,
  SplitBlock,
  TestimonialListBlock,
} from "./renderers/data";
import { collectMediaIds as collectRichMedia } from "@/lib/rich-text/render";
import type { Block, BlockDataMap, BlockType } from "./schema";
import { validateBlocks, type BlockLike } from "./validate";

export { validateBlocks, type BlockLike };
import type { BlockContext, BlockProps } from "./shared";

type Renderers = {
  [K in BlockType]: ComponentType<BlockProps<BlockDataMap[K]>>;
};

export const BLOCK_RENDERERS: Renderers = {
  hero: HeroBlock,
  richText: RichTextBlock,
  featureGrid: FeatureGridBlock,
  compare: CompareBlock,
  steps: StepsBlock,
  stats: StatsBlock,
  cta: CtaBlock,
  faqList: FaqListBlock,
  testimonialList: TestimonialListBlock,
  gallery: GalleryBlock,
  productTeaser: ProductTeaserBlock,
  slotCalendarPreview: SlotCalendarPreviewBlock,
  recipeTeaser: RecipeTeaserBlock,
  postTeaser: PostTeaserBlock,
  trustStrip: TrustStripBlock,
  logoStrip: LogoStripBlock,
  split: SplitBlock,
};

function mediaIdsOf(block: Block): string[] {
  switch (block.type) {
    case "hero":
    case "split":
      return [
        block.data.image?.mediaId,
        ...(block.type === "split" ? collectRichMedia(block.data.content) : []),
      ].filter((x): x is string => Boolean(x));
    case "gallery":
      return block.data.items.map((i) => i.mediaId);
    case "logoStrip":
      return block.data.items
        .map((i) => i.mediaId)
        .filter((x): x is string => Boolean(x));
    case "richText":
      return collectRichMedia(block.data.content);
    default:
      return [];
  }
}

function hostOf(url: string): string[] {
  try {
    return url ? [new URL(url).hostname] : [];
  } catch {
    return [];
  }
}

/**
 * Render an ordered list of section blocks. Validates each with `blockSchema.safeParse`,
 * skips invalid ones, never throws on bad data. Heading level 1 goes to the first block if it
 * is a hero (set `firstHeadingLevel={2}` when the page renders its own <h1>).
 */
export async function BlockRenderer({
  blocks,
  firstHeadingLevel = 1,
}: {
  blocks: readonly BlockLike[];
  firstHeadingLevel?: 1 | 2;
}) {
  const valid = validateBlocks(blocks);
  if (!valid.length) return null;
  const [media, settings] = await Promise.all([
    getMediaByIds(valid.flatMap(mediaIdsOf)),
    getSettings(),
  ]);
  const internalHosts = hostOf(settings["site.url"]);
  const h1Index = firstHeadingLevel === 1 && valid[0]?.type === "hero" ? 0 : -1;
  return (
    <>
      {valid.map((block, index) => {
        const ctx: BlockContext = {
          media,
          index,
          internalHosts,
          headingLevel: index === h1Index ? 1 : 2,
        };
        const Renderer = BLOCK_RENDERERS[block.type] as ComponentType<
          BlockProps<unknown>
        >;
        return <Renderer key={block.key} data={block.data} ctx={ctx} />;
      })}
    </>
  );
}
