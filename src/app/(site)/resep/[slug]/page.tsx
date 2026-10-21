import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { WaLink, Breadcrumb } from "@/components/site/layout";
import {
  Container,
  Eyebrow,
  Heading,
  Section,
  Stack,
} from "@/components/site/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMinutes } from "@/features/_shared/format";
import { getMediaByIds } from "@/features/media/queries";
import {
  getRecipeBySlug,
  getRecipeSlugs,
  getRelatedRecipes,
} from "@/features/recipes/queries";
import { getSettings } from "@/features/settings/queries";
import { RichText, type TiptapDoc } from "@/lib/rich-text";
import { JsonLd, recipeJsonLd, siteBaseUrl } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";
import { buildWaLink } from "@/lib/wa-link";

import {
  DIFFICULTY_LABEL,
  RecipeCard,
  totalMinutes,
} from "../_components/recipe-card";

/**
 * Unlisted slugs must wait for the full render (no App Shell flush) so
 * `notFound()` yields a real HTTP 404 on the first request. Everything here is
 * `"use cache"`, so known and newly visited slugs stay fully static.
 */
export const ensureStatic = "navigation";

export async function generateStaticParams() {
  const slugs = await getRecipeSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/resep/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRecipeBySlug(slug);
  if (!r) return {};
  return pageMetadata({
    ogImageFile: true,
    title: r.seo.title ?? `Resep ${r.title}, Mudah`,
    description: `Cara membuat ${r.title}: bahan, langkah, waktu masak, dan tips memilih tempe segar. Ditulis keluarga pembuat tempe Mak Nuk, Klaten.`,
    path: `/resep/${r.slug}`,
    seo: r.seo,
    type: "article",
    publishedTime: r.publishedAt,
    modifiedTime: r.updatedAt,
  });
}

export default async function RecipePage({
  params,
}: PageProps<"/resep/[slug]">) {
  const { slug } = await params;
  const [recipe, related, settings] = await Promise.all([
    getRecipeBySlug(slug),
    getRelatedRecipes(slug, 3),
    getSettings(),
  ]);
  if (!recipe) notFound();

  const doc = (recipe.content ?? null) as TiptapDoc | null;
  const media = await getMediaByIds(recipe.steps.map((s) => s.mediaId));
  const waHref = buildWaLink(settings["contact.whatsapp"], {
    greeting: "Halo Mak Nuk, saya mau pesan tempe untuk dimasak.",
    lines: [{ label: "Resep", value: recipe.title }],
  });

  const total = totalMinutes(recipe);
  const groups: { name: string | null; items: typeof recipe.ingredients }[] =
    [];
  for (const ing of recipe.ingredients) {
    const name = ing.group ?? null;
    const last = groups[groups.length - 1];
    if (last && last.name === name) last.items.push(ing);
    else groups.push({ name, items: [ing] });
  }

  const jsonLd = recipeJsonLd(
    {
      name: recipe.title,
      path: `/resep/${recipe.slug}`,
      description: recipe.seo.description ?? recipe.excerpt,
      image: recipe.cover?.url ?? "/og-default.png",
      publishedAt: recipe.publishedAt,
      modifiedAt: recipe.updatedAt,
      authorName: settings["business.name"],
      prepMinutes: recipe.prepMinutes,
      cookMinutes: recipe.cookMinutes,
      totalMinutes: total || null,
      servings: recipe.servings,
      category: recipe.category?.name,
      keywords: ["resep tempe", recipe.title],
      ingredients: recipe.ingredients.map((i) =>
        [i.qty, i.item, i.note ? `(${i.note})` : ""].filter(Boolean).join(" "),
      ),
      steps: recipe.steps.map((s) => ({
        text: s.text,
        image: s.mediaId ? media[s.mediaId]?.url : null,
      })),
    },
    siteBaseUrl(settings["site.url"]),
  );

  const facts = [
    { label: "Persiapan", value: formatMinutes(recipe.prepMinutes) },
    { label: "Memasak", value: formatMinutes(recipe.cookMinutes) },
    { label: "Total", value: formatMinutes(total) },
    {
      label: "Porsi",
      value: recipe.servings ? `${recipe.servings} porsi` : null,
    },
    {
      label: "Tingkat",
      value: recipe.difficulty ? DIFFICULTY_LABEL[recipe.difficulty] : null,
    },
  ].filter((f) => f.value);

  return (
    <>
      <Container>
        <Breadcrumb
          items={[{ label: "Resep", href: "/resep" }, { label: recipe.title }]}
        />
      </Container>

      <Section spacing="tight">
        <Container size="prose">
          <Stack gap="md">
            {recipe.category ? <Eyebrow>{recipe.category.name}</Eyebrow> : null}
            <Heading level={1} size="display">
              {recipe.title}
            </Heading>
            {recipe.excerpt ? (
              <p className="text-lead text-pretty text-muted-foreground">
                {recipe.excerpt}
              </p>
            ) : null}
            {facts.length ? (
              <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface p-4 sm:grid-cols-3">
                {facts.map((f) => (
                  <div key={f.label}>
                    <dt className="text-sm text-muted-foreground">{f.label}</dt>
                    <dd className="font-medium">{f.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </Stack>
        </Container>
      </Section>

      {recipe.cover ? (
        <Section spacing="none">
          <Container size="wide">
            <div
              className="relative w-full overflow-hidden rounded-lg border border-border bg-surface"
              style={{ aspectRatio: "16 / 9" }}
            >
              <Image
                src={recipe.cover.url}
                alt={recipe.cover.alt ?? recipe.title}
                fill
                preload
                sizes="(min-width: 1024px) 960px, 100vw"
                className="object-cover"
                {...(recipe.cover.blurDataUrl
                  ? {
                      placeholder: "blur" as const,
                      blurDataURL: recipe.cover.blurDataUrl,
                    }
                  : {})}
              />
            </div>
          </Container>
        </Section>
      ) : null}

      <Section spacing="tight">
        <Container size="prose">
          <Stack gap="lg">
            {groups.length ? (
              <section aria-labelledby="bahan" className="flex flex-col gap-3">
                <Heading level={2} size="h3" id="bahan">
                  Bahan
                </Heading>
                {groups.map((g, gi) => (
                  <div key={gi} className="flex flex-col gap-2">
                    {g.name ? <p className="font-medium">{g.name}</p> : null}
                    <ul className="flex flex-col gap-2">
                      {g.items.map((i, ii) => (
                        <li
                          key={ii}
                          className="flex gap-2 border-b border-border pb-2"
                        >
                          {i.qty ? (
                            <span className="min-w-24 font-medium">
                              {i.qty}
                            </span>
                          ) : null}
                          <span>
                            {i.item}
                            {i.note ? (
                              <span className="text-muted-foreground">
                                {" "}
                                ({i.note})
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            ) : null}

            {recipe.steps.length ? (
              <section
                aria-labelledby="langkah"
                className="flex flex-col gap-3"
              >
                <Heading level={2} size="h3" id="langkah">
                  Langkah
                </Heading>
                <ol className="flex flex-col gap-4">
                  {recipe.steps.map((s, i) => {
                    const m = s.mediaId ? media[s.mediaId] : undefined;
                    return (
                      <li key={i} className="flex gap-3">
                        <span
                          aria-hidden
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
                        >
                          {i + 1}
                        </span>
                        <div className="flex flex-col gap-2">
                          <p>{s.text}</p>
                          {m ? (
                            <Image
                              src={m.url}
                              alt={m.alt ?? ""}
                              width={m.width ?? 800}
                              height={m.height ?? 600}
                              sizes="(min-width: 768px) 640px, 100vw"
                              className="h-auto w-full rounded-lg border border-border"
                            />
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ) : null}

            {doc ? (
              <section aria-labelledby="tips" className="flex flex-col gap-3">
                <Heading level={2} size="h3" id="tips">
                  Tips dan catatan
                </Heading>
                <RichText doc={doc} media={media} />
              </section>
            ) : null}

            {recipe.product ? (
              <aside className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
                <p className="font-medium">Tempe yang dipakai</p>
                <p className="text-muted-foreground">
                  Resep ini enak dengan{" "}
                  <Badge variant="secondary">{recipe.product.name}</Badge>. Mau
                  ukuran atau kemasan khusus? Bisa lewat custom order.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="secondary">
                    <Link href={`/produk/${recipe.product.slug}`}>
                      Lihat {recipe.product.name}
                    </Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href="/custom-order">Custom order</Link>
                  </Button>
                </div>
              </aside>
            ) : null}
          </Stack>
        </Container>
      </Section>

      <Section tone="surface">
        <Container size="prose">
          <Stack gap="md">
            <Heading level={2} size="h3">
              Siap masak? Pesan tempenya dulu.
            </Heading>
            <p className="text-muted-foreground">
              Tempe dibuat sesuai pesanan, tanpa minimum order. Lihat jenisnya
              atau tanya langsung lewat WhatsApp.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/produk">Lihat produk</Link>
              </Button>
              {waHref ? (
                <Button asChild size="lg" variant="secondary">
                  <WaLink
                    href={waHref}
                    source={`resep:${recipe.slug}`}
                    kind="order"
                  >
                    Pesan via WhatsApp
                  </WaLink>
                </Button>
              ) : null}
            </div>
          </Stack>
        </Container>
      </Section>

      {related.length ? (
        <Section>
          <Container>
            <Stack gap="lg">
              <Heading level={2}>Resep terkait</Heading>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((r) => (
                  <RecipeCard key={r.id} recipe={r} />
                ))}
              </div>
            </Stack>
          </Container>
        </Section>
      ) : null}

      <JsonLd data={jsonLd} />
    </>
  );
}
