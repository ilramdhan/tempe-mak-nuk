/**
 * Layout helpers for code routes that mix CMS sections with code-owned dynamic content (P8.1:
 * /produk, /faq, /kontak). Pure + client-safe.
 *
 * Page shape: [hero?] [...before] [marker?] [...after]
 * - The first section, when it is a valid `hero`, becomes the page intro (rendered by the route
 *   in its own markup, so the visual design stays the same).
 * - The first section of `markerType` marks where the route renders its dynamic core (product
 *   grid, FAQ browser, contact details); its data (heading/intro/body) is handed to the route.
 *   Without a marker the dynamic core follows the intro and every other section comes after it.
 */
import {
  BLOCK_SCHEMAS,
  type BlockDataMap,
  type BlockType,
} from "./blocks/schema";

type SectionLike = { id?: string; type: string; data: unknown };

export type HeroIntro = Pick<
  BlockDataMap["hero"],
  "eyebrow" | "headline" | "subheadline" | "primaryCta" | "secondaryCta"
>;

export type PageLayout<S extends SectionLike, M extends BlockType> = {
  intro: HeroIntro | null;
  before: S[];
  marker: BlockDataMap[M] | null;
  after: S[];
};

export function splitPageSections<S extends SectionLike, M extends BlockType>(
  sections: readonly S[] | null | undefined,
  markerType: M,
): PageLayout<S, M> {
  const list = [...(sections ?? [])];
  let intro: HeroIntro | null = null;
  if (list[0]?.type === "hero") {
    const res = BLOCK_SCHEMAS.hero.safeParse(list[0].data);
    if (res.success) {
      const { eyebrow, headline, subheadline, primaryCta, secondaryCta } =
        res.data;
      intro = { eyebrow, headline, subheadline, primaryCta, secondaryCta };
      list.shift();
    }
  }
  const at = list.findIndex((s) => s.type === markerType);
  if (at < 0) return { intro, before: [], marker: null, after: list };
  const parsed = BLOCK_SCHEMAS[markerType].safeParse(list[at].data);
  return {
    intro,
    before: list.slice(0, at),
    marker: parsed.success ? (parsed.data as BlockDataMap[M]) : null,
    after: list.slice(at + 1),
  };
}
