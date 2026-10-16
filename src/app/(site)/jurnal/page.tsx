import type { Metadata } from "next";

import { Breadcrumb, serializeJsonLd } from "@/components/site/layout";
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

import { CategoryNav } from "./_components/category-nav";
import { PostGrid } from "./_components/post-grid";

const DESCRIPTION =
  "Panduan menyimpan, memilih, dan mengolah tempe, ditambah gizi, sejarah, dan cerita dari dapur Tempe Mak Nuk di Klaten.";

export const metadata: Metadata = {
  title: { absolute: "Jurnal Tempe: Panduan, Gizi, dan Cerita — Mak Nuk" },
  description: DESCRIPTION,
  alternates: { canonical: "/jurnal" },
};

export default async function JurnalPage() {
  const [posts, categories, settings] = await Promise.all([
    getPosts(),
    getCategories("post"),
    getSettings(),
  ]);
  const siteUrl = settings["site.url"];
  const jsonLd = siteUrl
    ? {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "Jurnal Tempe Mak Nuk",
        description: DESCRIPTION,
        url: new URL("/jurnal", siteUrl).toString(),
        inLanguage: "id-ID",
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          headline: p.title,
          url: new URL(`/jurnal/${p.slug}`, siteUrl).toString(),
          datePublished: p.publishedAt?.toISOString(),
        })),
      }
    : null;

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: "Jurnal" }]} />
      </Container>
      <Section spacing="tight">
        <Container>
          <Stack gap="md">
            <Eyebrow>Jurnal</Eyebrow>
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
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      ) : null}
    </>
  );
}
