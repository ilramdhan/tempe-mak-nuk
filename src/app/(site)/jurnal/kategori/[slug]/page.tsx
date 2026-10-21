import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
import { itemListJsonLd, JsonLd, siteBaseUrl, webPageJsonLd } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";

import { CategoryNav } from "../../_components/category-nav";
import { PostGrid } from "../../_components/post-grid";

export async function generateStaticParams() {
  const cats = await getCategories("post");
  return cats.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/jurnal/kategori/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const cat = (await getCategories("post")).find((c) => c.slug === slug);
  if (!cat) return {};
  return pageMetadata({
    title: `${cat.name} Tempe: Artikel dan Panduan — Mak Nuk`,
    description: `Kumpulan artikel ${cat.name.toLowerCase()} tempe dari Tempe Mak Nuk, Klaten. Panduan praktis, bersumber, dan mudah dipraktikkan.`,
    path: `/jurnal/kategori/${cat.slug}`,
    titleAbsolute: true,
  });
}

export default async function KategoriPage({
  params,
}: PageProps<"/jurnal/kategori/[slug]">) {
  const { slug } = await params;
  const [categories, settings] = await Promise.all([
    getCategories("post"),
    getSettings(),
  ]);
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();
  const posts = await getPosts({ category: slug });
  const siteUrl = settings["site.url"];
  const base = siteBaseUrl(siteUrl);
  const jsonLd = webPageJsonLd(
    {
      type: "CollectionPage",
      name: `${cat.name} Tempe`,
      path: `/jurnal/kategori/${cat.slug}`,
    },
    base,
  );
  const itemList = itemListJsonLd(
    posts.map((p) => ({ name: p.title, path: `/jurnal/${p.slug}` })),
    base,
  );
  if (itemList) jsonLd.mainEntity = itemList;

  return (
    <>
      <Container>
        <Breadcrumb
          items={[{ label: "Jurnal", href: "/jurnal" }, { label: cat.name }]}
        />
      </Container>
      <Section spacing="tight">
        <Container>
          <Stack gap="md">
            <Eyebrow rule tone="accent">
              Kategori
            </Eyebrow>
            <Heading level={1} size="display">
              {cat.name}
            </Heading>
            {cat.description ? <Lead muted>{cat.description}</Lead> : null}
            <CategoryNav categories={categories} active={cat.slug} />
          </Stack>
        </Container>
      </Section>
      <Section spacing="tight">
        <Container>
          {posts.length ? (
            <PostGrid posts={posts} />
          ) : (
            <p className="text-muted-foreground">
              Belum ada artikel di kategori ini.
            </p>
          )}
        </Container>
      </Section>
      <JsonLd data={jsonLd} />
    </>
  );
}
