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
import { getRecipes } from "@/features/recipes/queries";
import { getSettings } from "@/features/settings/queries";
import { getCategories } from "@/features/taxonomy/queries";

import { RecipeBrowser } from "./_components/recipe-browser";

const DESCRIPTION =
  "Kumpulan resep tempe rumahan: mendoan, bacem, orek, sambal goreng, penyet, sampai tim untuk MPASI. Langkah jelas, bahan mudah dicari.";

export const metadata: Metadata = {
  title: { absolute: "Resep Tempe Rumahan Mudah dan Enak — Tempe Mak Nuk" },
  description: DESCRIPTION,
  alternates: { canonical: "/resep" },
};

export default async function ResepPage() {
  const [recipes, categories, settings] = await Promise.all([
    getRecipes(),
    getCategories("recipe"),
    getSettings(),
  ]);
  const siteUrl = settings["site.url"];
  const jsonLd = siteUrl
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Resep Tempe Mak Nuk",
        description: DESCRIPTION,
        url: new URL("/resep", siteUrl).toString(),
        inLanguage: "id-ID",
        mainEntity: {
          "@type": "ItemList",
          itemListElement: recipes.map((r, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: r.title,
            url: new URL(`/resep/${r.slug}`, siteUrl).toString(),
          })),
        },
      }
    : null;

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: "Resep" }]} />
      </Container>
      <Section spacing="tight">
        <Container>
          <Stack gap="md">
            <Eyebrow>Resep</Eyebrow>
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
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      ) : null}
    </>
  );
}
