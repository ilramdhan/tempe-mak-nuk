import type { Metadata } from "next";

import { Breadcrumb } from "@/components/site/layout";
import {
  Container,
  Eyebrow,
  Heading,
  Lead,
  Section,
  Stack,
} from "@/components/site/primitives";
import { getPosts } from "@/features/posts/queries";
import { getSettings } from "@/features/settings/queries";
import { getCategories } from "@/features/taxonomy/queries";
import { absoluteUrl, JsonLd, siteBaseUrl } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";

import { CategoryNav } from "./_components/category-nav";
import { PostGrid } from "./_components/post-grid";

const DESCRIPTION =
  "Panduan menyimpan, memilih, dan mengolah tempe, ditambah gizi, sejarah, dan cerita dari dapur Tempe Mak Nuk di Klaten.";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Jurnal Tempe: Panduan, Gizi, dan Cerita — Mak Nuk",
    description: DESCRIPTION,
    path: "/jurnal",
    titleAbsolute: true,
  });
}

export default async function JurnalPage() {
  const [posts, categories, settings] = await Promise.all([
    getPosts(),
    getCategories("post"),
    getSettings(),
  ]);
  const siteUrl = settings["site.url"];
  const base = siteBaseUrl(siteUrl);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Jurnal Tempe Mak Nuk",
    description: DESCRIPTION,
    url: absoluteUrl("/jurnal", base),
    inLanguage: "id-ID",
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: absoluteUrl(`/jurnal/${p.slug}`, base),
      datePublished: p.publishedAt?.toISOString(),
    })),
  };

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: "Jurnal" }]} />
      </Container>
      <Section spacing="tight">
        <Container>
          <Stack gap="md">
            <Eyebrow rule tone="accent">Jurnal</Eyebrow>
            <Heading level={1} size="display">
              Jurnal Tempe
            </Heading>
            <Lead muted>{DESCRIPTION}</Lead>
            <CategoryNav categories={categories} />
          </Stack>
        </Container>
      </Section>
      <Section spacing="tight">
        <Container>
          {posts.length ? (
            <PostGrid posts={posts} />
          ) : (
            <p className="text-muted-foreground">
              Belum ada artikel. Silakan cek lagi nanti.
            </p>
          )}
        </Container>
      </Section>
      <JsonLd data={jsonLd} />
    </>
  );
}
