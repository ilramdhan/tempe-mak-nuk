import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/site/layout";
import {
  Container,
  Eyebrow,
  Grid,
  Heading,
  Section,
  Stack,
} from "@/components/site/primitives";
import { Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatIdr, formatPriceFrom } from "@/features/_shared/format";
import {
  getProductBySlug,
  getProductSlugs,
  getProducts,
} from "@/features/products/queries";
import { getSettings } from "@/features/settings/queries";

import { ProductCta } from "../_components/product-cta";
import {
  ProductImage,
  productVariantLabel,
} from "../_components/product-image";
import { RichText, type TiptapDoc } from "@/lib/rich-text";
import { JsonLd, productJsonLd, siteBaseUrl } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";

export async function generateStaticParams() {
  const slugs = await getProductSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/produk/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  return pageMetadata({
    title: p.name,
    description: p.short,
    path: `/produk/${p.slug}`,
    seo: p.seo,
  });
}

const fmt = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const num = (v: number | null, unit: string) =>
  v === null ? "-" : `${fmt.format(v)} ${unit}`;

export default async function ProductPage({
  params,
}: PageProps<"/produk/[slug]">) {
  const { slug } = await params;
  const [product, all, settings] = await Promise.all([
    getProductBySlug(slug),
    getProducts(),
    getSettings(),
  ]);
  if (!product) notFound();

  const showPrice = settings["pricing.show"];
  const sibling = all.find((p) => p.id !== product.id);
  const nutr = product.nutrition[0] ?? null;
  const priceLabel = formatPriceFrom(product.priceFrom, showPrice);

  const base = siteBaseUrl(settings["site.url"]);
  const jsonLd = [
    productJsonLd(
      {
        name: product.name,
        description: product.short,
        path: `/produk/${product.slug}`,
        images: product.gallery.map((g) => g.url),
        brand: settings["business.name"],
        price: showPrice ? product.priceFrom : null,
      },
      base,
    ),
  ];

  return (
    <>
      <Container>
        <Breadcrumb
          items={[
            { label: "Produk", href: "/produk" },
            { label: product.name },
          ]}
        />
      </Container>

      <Section spacing="tight">
        <Container>
          <Grid cols={2} gap="lg">
            <Stack gap="sm">
              <ProductImage
                media={product.gallery[0] ?? null}
                name={product.name}
                variant={product.variant}
                aspect="4 / 3"
                priority
              />
              {product.gallery.length > 1 ? (
                <ul className="grid grid-cols-3 gap-2" aria-label="Galeri foto">
                  {product.gallery.slice(1, 7).map((g) => (
                    <li key={g.id}>
                      <ProductImage
                        media={g}
                        name={product.name}
                        variant={product.variant}
                        aspect="1 / 1"
                        sizes="(min-width: 1024px) 16vw, 33vw"
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </Stack>

            <Stack gap="md">
              <Badge variant="secondary" className="w-fit">
                {productVariantLabel(product.variant)}
              </Badge>
              <Heading level={1} size="display">
                {product.name}
              </Heading>
              {product.short ? (
                <p className="text-lead text-pretty text-muted-foreground">
                  {product.short}
                </p>
              ) : null}
              <p className="font-display text-h3">
                {priceLabel ?? "Harga: tanya via WhatsApp"}
              </p>
              <ProductCta
                slug={product.slug}
                productName={product.name}
                size="lg"
              />
              <p className="text-sm text-muted-foreground">
                Dibuat sesuai pesanan, jadi cek slot dulu sebelum memesan.
              </p>
            </Stack>
          </Grid>
        </Container>
      </Section>

      {product.description ? (
        <Section spacing="tight">
          <Container size="prose">
            <Reveal>
              <RichText doc={product.description as TiptapDoc} />
            </Reveal>
          </Container>
        </Section>
      ) : null}

      {product.shapes.length || product.sizes.length ? (
        <Section tone="surface">
          <Container>
            <Grid cols={2} gap="lg">
              {product.shapes.length ? (
                <Stack gap="md">
                  <Heading level={2} size="h3">
                    Bentuk
                  </Heading>
                  <ul className="flex flex-col gap-3">
                    {product.shapes.map((s) => (
                      <li key={s.id}>
                        <p className="font-medium">{s.name}</p>
                        {s.description ? (
                          <p className="text-sm text-muted-foreground">
                            {s.description}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </Stack>
              ) : null}
              {product.sizes.length ? (
                <Stack gap="md">
                  <Heading level={2} size="h3">
                    Ukuran
                  </Heading>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead scope="col">Ukuran</TableHead>
                        <TableHead scope="col">Berat</TableHead>
                        <TableHead scope="col" className="text-right">
                          Harga
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.sizes.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">
                            {s.name}
                          </TableCell>
                          <TableCell>{s.dims ?? "-"}</TableCell>
                          <TableCell className="text-right">
                            {showPrice && s.price !== null
                              ? formatIdr(s.price)
                              : "Tanya WA"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Stack>
              ) : null}
            </Grid>
          </Container>
        </Section>
      ) : null}

      {nutr ? (
        <Section spacing="tight">
          <Container size="prose">
            <Stack gap="md">
              <Eyebrow>Informasi gizi</Eyebrow>
              <Heading level={2}>Gizi per {nutr.perGrams} g</Heading>
              <Table>
                <TableBody>
                  {(
                    [
                      ["Energi", num(nutr.energyKcal, "kkal")],
                      ["Protein", num(nutr.proteinG, "g")],
                      ["Lemak", num(nutr.fatG, "g")],
                      ["Karbohidrat", num(nutr.carbsG, "g")],
                      ["Serat", num(nutr.fiberG, "g")],
                      ["Kalsium", num(nutr.calciumMg, "mg")],
                      ["Zat besi", num(nutr.ironMg, "mg")],
                    ] as const
                  ).map(([label, value]) => (
                    <TableRow key={label}>
                      <TableHead scope="row" className="font-normal">
                        {label}
                      </TableHead>
                      <TableCell className="text-right">{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm text-muted-foreground">
                Sumber:{" "}
                {nutr.sourceUrl ? (
                  <a
                    href={nutr.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                  >
                    {nutr.source}
                  </a>
                ) : (
                  nutr.source
                )}
                . Angka ini nilai referensi tempe kedelai murni dan sama untuk
                kedua varian, belum hasil uji laboratorium produk kami. Perlu
                verifikasi; nilai sebenarnya bisa sedikit berbeda.
              </p>
            </Stack>
          </Container>
        </Section>
      ) : null}

      <Section tone="surface">
        <Container>
          <Stack gap="md" className="max-w-measure">
            <Heading level={2}>Pesan {product.name}</Heading>
            <p className="text-muted-foreground">
              Tanpa minimum order. Pilih bentuk dan ukuran di form pesanan, atau
              tanya langsung lewat WhatsApp.
            </p>
            <ProductCta
              slug={product.slug}
              productName={product.name}
              size="lg"
            />
            {sibling ? (
              <Button asChild variant="link">
                <Link href={`/produk/${sibling.slug}`}>
                  Bandingkan dengan {sibling.name}
                </Link>
              </Button>
            ) : null}
          </Stack>
        </Container>
      </Section>

      <JsonLd data={jsonLd} />
    </>
  );
}
