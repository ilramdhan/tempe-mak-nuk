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
import { getRecipes } from "@/features/recipes/queries";
import { getSettings } from "@/features/settings/queries";
import { getCategories } from "@/features/taxonomy/queries";
import { itemListJsonLd, JsonLd, siteBaseUrl, webPageJsonLd } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";

import { RecipeBrowser } from "./_components/recipe-browser";

const DESCRIPTION =
  "Kumpulan resep tempe rumahan: mendoan, bacem, orek, sambal goreng, penyet, sampai tim untuk MPASI. Langkah jelas, bahan mudah dicari.";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Resep Tempe Rumahan Mudah dan Enak — Tempe Mak Nuk",
    description: DESCRIPTION,
    path: "/resep",
    titleAbsolute: true,
  });
}

export default async function ResepPage() {
  const [recipes, categories, settings] = await Promise.all([
    getRecipes(),
    getCategories("recipe"),
    getSettings(),
  ]);
  const siteUrl = settings["site.url"];
  const base = siteBaseUrl(siteUrl);
  const jsonLd = webPageJsonLd(
    {
      type: "CollectionPage",
      name: "Resep Tempe Mak Nuk",
      path: "/resep",
      description: DESCRIPTION,
    },
    base,
  );
  const list = itemListJsonLd(
    recipes.map((r) => ({ name: r.title, path: `/resep/${r.slug}` })),
    base,
  );
  if (list) jsonLd.mainEntity = list;

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: "Resep" }]} />
      </Container>
      <Section spacing="tight">
        <Container>
          <Stack gap="md">
            <Eyebrow rule tone="accent">Resep</Eyebrow>
            <Heading level={1} size="display">
              Resep Tempe Rumahan
            </Heading>
            <Lead muted>{DESCRIPTION}</Lead>
          </Stack>
        </Container>
      </Section>
      <Section spacing="tight">
        <Container>
          {recipes.length ? (
            <RecipeBrowser
              recipes={recipes}
              categories={categories.map((c) => ({
                slug: c.slug,
                name: c.name,
              }))}
            />
          ) : (
            <p className="text-muted-foreground">
              Belum ada resep. Silakan cek lagi nanti.
            </p>
          )}
        </Container>
      </Section>
      <JsonLd data={jsonLd} />
    </>
  );
}
