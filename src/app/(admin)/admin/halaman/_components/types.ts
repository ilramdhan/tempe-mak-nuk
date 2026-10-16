import type { PageStatus, SectionDraft } from "../_lib/editor-state";

export type Choice = { value: string; label: string };

/** Option lists the block forms pick from (serialisable; built server-side). */
export type BuilderOptions = {
  media: { id: string; url: string; alt: string }[];
  products: Choice[];
  recipes: Choice[];
  posts: Choice[];
  faqCategories: Choice[];
  postCategories: Choice[];
  faqs: Choice[];
  testimonials: Choice[];
  settingKeys: Choice[];
};

export type EditorPage = {
  id: string;
  slug: string;
  title: string;
  status: PageStatus;
  seo: {
    title?: string;
    description?: string;
    ogImageId?: string | null;
    noindex?: boolean;
  };
  updatedAt: string;
  sections: (SectionDraft & { issues: string[] })[];
};

export type PageListItem = {
  id: string;
  slug: string;
  title: string;
  status: PageStatus;
  updatedAt: string;
  sectionCount: number;
  hiddenCount: number;
  invalidCount: number;
};
