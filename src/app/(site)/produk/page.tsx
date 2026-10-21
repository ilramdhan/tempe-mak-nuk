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
import { getProductBySlug, getProducts } from "@/features/products/queries";
import { getSettings } from "@/features/settings/queries";
import { itemListJsonLd, JsonLd, siteBaseUrl, webPageJsonLd } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";

import { ProductCta } from "./_components/product-cta";
import { ProductImage, productVariantLabel } from "./_components/product-image";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Jenis Tempe: Klasik dan Tanpa Kulit",
    description: "Kenali dua varian Tempe Mak Nuk: Klasik dengan kulit ari dan Original Tanpa Kulit yang lebih putih dan padat. Pilih bentuk dan ukuran sesuai kebutuhan.",
    path: "/produk",
  });
}

export default async function ProdukPage() {
  const [list, settings] = await Promise.all([getProducts(), getSettings()]);
  const details = (
    await Promise.all(list.map((p) => getProductBySlug(p.slug)))
  ).filter((d) => d !== null);
  const showPrice = settings["pricing.show"];
  const siteUrl = settings["site.url"];

  const base = siteBaseUrl(siteUrl);
  const jsonLd = webPageJsonLd(
    {
      type: "CollectionPage",
      name: "Jenis Tempe Mak Nuk",
      path: "/produk",
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
            <Eyebrow rule tone="accent">Produk</Eyebrow>
            <Heading level={1} size="display">
              Dua tempe, satu cara buat: pelan dan jujur
            </Heading>
            <Lead muted>
              Bahannya sama: kedelai, air, dan ragi. Bedanya di kulit ari. Pilih
              yang sesuai selera, lalu tentukan bentuk dan ukurannya. Tanpa
              minimum order.
            </Lead>
          </Stack>
        </Container>
      </Section>

      <Section spacing="tight">
        <Container>
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
                  <Heading level={2} size="h2">
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
                    <Link href={`/produk/${p.slug}`}>Lihat detail</Link>
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
