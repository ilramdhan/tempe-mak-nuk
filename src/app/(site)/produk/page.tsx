import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumb } from "@/components/site/layout";
import {
  Container,
  Eyebrow,
  Grid,
  Heading,
  Lead,
  Section,
  Stack,
} from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPriceFrom } from "@/features/_shared/format";
import { BlockRenderer } from "@/features/pages/blocks/block-renderer";
import { CtaButton, CtaRow } from "@/features/pages/blocks/shared";
import { splitPageSections } from "@/features/pages/layout";
import { getPage, getPageMeta } from "@/features/pages/queries";
import { getProductBySlug, getProducts } from "@/features/products/queries";
import { getSettings } from "@/features/settings/queries";
import { itemListJsonLd, JsonLd, siteBaseUrl, webPageJsonLd } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";

import { ProductCta } from "./_components/product-cta";
import { ProductImage, productVariantLabel } from "./_components/product-image";

const SLUG = "produk";

/** Fallback copy when the `pages` row "produk" is missing/unpublished (admin: Halaman → Produk). */
const FALLBACK = {
  title: "Jenis Tempe: Klasik dan Tanpa Kulit",
  description:
    "Kenali dua varian Tempe Mak Nuk: Klasik dengan kulit ari dan Original Tanpa Kulit yang lebih putih dan padat. Pilih bentuk dan ukuran sesuai kebutuhan.",
  intro: {
    eyebrow: "Produk",
    headline: "Dua tempe, satu cara buat: pelan dan jujur",
    subheadline:
      "Bahannya sama: kedelai, air, dan ragi. Bedanya di kulit ari. Pilih yang sesuai selera, lalu tentukan bentuk dan ukurannya. Tanpa minimum order.",
    primaryCta: null,
    secondaryCta: null,
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const meta = await getPageMeta(SLUG);
  return pageMetadata({
    title: meta ? meta.title : FALLBACK.title,
    description: meta?.seo.description || FALLBACK.description,
    path: "/produk",
    seo: meta?.seo ?? { title: FALLBACK.title },
  });
}

export default async function ProdukPage() {
  const [page, all, settings] = await Promise.all([
    getPage(SLUG),
    getProducts(),
    getSettings(),
  ]);
  // CMS sections: hero → intro; `productTeaser` marks where the product grid goes.
  const layout = splitPageSections(page?.sections, "productTeaser");
  const intro = layout.intro ?? FALLBACK.intro;
  const grid = layout.marker;
  const nameLevel = grid?.heading ? 3 : 2;
  // Optional product selection/order from the CMS block (empty = all active products).
  const list = grid?.productSlugs?.length
    ? grid.productSlugs
        .map((slug) => all.find((p) => p.slug === slug))
        .filter((p): p is (typeof all)[number] => Boolean(p))
    : all;
  const details = (
    await Promise.all(list.map((p) => getProductBySlug(p.slug)))
  ).filter((d) => d !== null);
  const showPrice = settings["pricing.show"];
  const siteUrl = settings["site.url"];

  const base = siteBaseUrl(siteUrl);
  const jsonLd = webPageJsonLd(
    {
      type: "CollectionPage",
      name: page?.seo.title || "Jenis Tempe Mak Nuk",
      path: "/produk",
      description: page?.seo.description || FALLBACK.description,
    },
    base,
  );
  const itemList = itemListJsonLd(
    list.map((p) => ({ name: p.name, path: `/produk/${p.slug}` })),
    base,
  );
  if (itemList) jsonLd.mainEntity = itemList;

  return (
    <>
      <Container>
        <Breadcrumb items={[{ label: "Produk" }]} />
      </Container>

      <Section spacing="tight">
        <Container>
          <Stack gap="md" className="max-w-measure">
            {intro.eyebrow ? (
              <Eyebrow rule tone="accent">
                {intro.eyebrow}
              </Eyebrow>
            ) : null}
            <Heading level={1} size="display">
              {intro.headline}
            </Heading>
            {intro.subheadline ? <Lead muted>{intro.subheadline}</Lead> : null}
            {intro.primaryCta || intro.secondaryCta ? (
              <CtaRow className="pt-2">
                <CtaButton cta={intro.primaryCta} />
                <CtaButton cta={intro.secondaryCta} variant="secondary" />
              </CtaRow>
            ) : null}
          </Stack>
        </Container>
      </Section>

      {layout.before.length ? (
        <BlockRenderer blocks={layout.before} firstHeadingLevel={2} />
      ) : null}

      <Section spacing="tight" id={grid?.anchor ?? undefined}>
        <Container>
          {grid?.eyebrow || grid?.heading || grid?.intro ? (
            <Stack gap="sm" className="mb-8 max-w-measure">
              {grid.eyebrow ? <Eyebrow>{grid.eyebrow}</Eyebrow> : null}
              {grid.heading ? (
                <Heading level={2}>{grid.heading}</Heading>
              ) : null}
              {grid.intro ? <Lead muted>{grid.intro}</Lead> : null}
            </Stack>
          ) : null}
          <Grid cols={2} gap="lg">
            {list.map((p, i) => (
              <article key={p.id} className="flex flex-col gap-4">
                <Link
                  href={`/produk/${p.slug}`}
                  tabIndex={-1}
                  aria-hidden
                  className="block rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <ProductImage
                    media={p.cover}
                    name={p.name}
                    variant={p.variant}
                    priority={i === 0}
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                </Link>
                <Stack gap="xs">
                  <Eyebrow>{productVariantLabel(p.variant)}</Eyebrow>
                  <Heading level={nameLevel} size="h2">
                    <Link
                      href={`/produk/${p.slug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {p.name}
                    </Link>
                  </Heading>
                  {p.short ? (
                    <p className="text-muted-foreground">{p.short}</p>
                  ) : null}
                  <p className="font-medium">
                    {formatPriceFrom(p.priceFrom, showPrice) ??
                      "Harga: tanya via WhatsApp"}
                  </p>
                </Stack>
                <div>
                  <Button asChild variant="secondary">
                    <Link href={`/produk/${p.slug}`}>
                      {grid?.ctaLabel || "Lihat detail"}
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </Grid>
        </Container>
      </Section>

      {details.length > 1 ? (
        <Section tone="surface">
          <Container>
            <Stack gap="lg">
              <Heading level={2}>Perbandingan varian</Heading>
              <Table className="min-w-[36rem]">
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col" className="w-40">
                      <span className="sr-only">Aspek</span>
                    </TableHead>
                    {details.map((d) => (
                      <TableHead
                        key={d.id}
                        scope="col"
                        className="text-foreground"
                      >
                        {d.name}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <CompareRow label="Kulit ari">
                    {details.map((d) => (
                      <TableCell key={d.id} className="whitespace-normal">
                        {d.variant === "classic"
                          ? "Tetap menempel"
                          : "Dikupas bersih"}
                      </TableCell>
                    ))}
                  </CompareRow>
                  <CompareRow label="Bentuk">
                    {details.map((d) => (
                      <TableCell key={d.id} className="whitespace-normal">
                        {d.shapes.map((s) => s.name).join(", ") || "-"}
                      </TableCell>
                    ))}
                  </CompareRow>
                  <CompareRow label="Ukuran">
                    {details.map((d) => (
                      <TableCell key={d.id} className="whitespace-normal">
                        {d.sizes.map((s) => s.name).join(", ") || "-"}
                      </TableCell>
                    ))}
                  </CompareRow>
                  <CompareRow label="Harga">
                    {details.map((d) => (
                      <TableCell key={d.id} className="whitespace-normal">
                        {formatPriceFrom(d.priceFrom, showPrice) ??
                          "Tanya via WhatsApp"}
                      </TableCell>
                    ))}
                  </CompareRow>
                </TableBody>
              </Table>
              <p className="text-sm text-muted-foreground">
                Informasi gizi tiap varian ada di halaman detail produk.
              </p>
            </Stack>
          </Container>
        </Section>
      ) : null}

      {layout.after.length ? (
        <BlockRenderer blocks={layout.after} firstHeadingLevel={2} />
      ) : null}

      <Section>
        <Container>
          <Stack gap="md" className="max-w-measure">
            <Heading level={2}>Siap memesan?</Heading>
            <p className="text-muted-foreground">
              Atur bentuk, ukuran, dan tanggal ambil lewat form pesanan, atau
              tanya dulu lewat WhatsApp.
            </p>
            <ProductCta size="lg" />
          </Stack>
        </Container>
      </Section>

      <JsonLd data={jsonLd} />
    </>
  );
}

function CompareRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <TableRow>
      <TableHead scope="row" className="font-medium text-foreground">
        {label}
      </TableHead>
      {children}
    </TableRow>
  );
}
