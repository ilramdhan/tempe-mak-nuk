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
import { Button } from "@/components/ui/button";
import { getMediaByIds } from "@/features/media/queries";
import {
  getPostBySlug,
  getPostSlugs,
  getRelatedPosts,
} from "@/features/posts/queries";
import { getSettings } from "@/features/settings/queries";
import { formatDate } from "@/lib/dates";
import {
  extractHeadings,
  richTextToPlainText,
  RichText,
  type TiptapDoc,
  type TiptapNode,
} from "@/lib/rich-text";
import { articleJsonLd, JsonLd, siteBaseUrl } from "@/lib/seo";
import { pageMetadata } from "@/lib/seo/server";
import { buildWaLink } from "@/lib/wa-link";

import { PostCard, PostMeta } from "../_components/post-card";

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/jurnal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPostBySlug(slug);
  if (!p) return {};
  return pageMetadata({
    title: p.title,
    description: p.excerpt,
    path: `/jurnal/${p.slug}`,
    seo: p.seo,
    type: "article",
    publishedTime: p.publishedAt,
    modifiedTime: p.updatedAt,
  });
}

function collectMediaIds(
  node: TiptapNode | TiptapDoc | undefined,
  out: string[] = [],
  depth = 0,
): string[] {
  if (!node || depth > 30) return out;
  const id = (node as TiptapNode).attrs?.mediaId;
  if (typeof id === "string") out.push(id);
  for (const c of node.content ?? []) collectMediaIds(c, out, depth + 1);
  return out;
}

export default async function PostPage({
  params,
}: PageProps<"/jurnal/[slug]">) {
  const { slug } = await params;
  const [post, related, settings] = await Promise.all([
    getPostBySlug(slug),
    getRelatedPosts(slug, 3),
    getSettings(),
  ]);
  if (!post) notFound();

  const doc = (post.content ?? null) as TiptapDoc | null;
  const headings = extractHeadings(doc).filter((h) => h.level <= 3);
  const media = await getMediaByIds(collectMediaIds(doc ?? undefined));
  const waHref = buildWaLink(settings["contact.whatsapp"], {
    greeting:
      "Halo Mak Nuk, saya baca artikel di jurnal dan ingin tanya tempe.",
    lines: [{ label: "Artikel", value: post.title }],
  });

  const jsonLd = articleJsonLd(
    {
      type: "BlogPosting",
      headline: post.title,
      path: `/jurnal/${post.slug}`,
      description: post.seo.description ?? post.excerpt,
      images: post.cover ? [post.cover.url] : [],
      publishedAt: post.publishedAt,
      modifiedAt: post.updatedAt,
      authorName: post.author?.name,
      publisherName: settings["business.name"],
      wordCount: richTextToPlainText(doc).split(/\s+/).filter(Boolean).length,
      section: post.category?.name,
      keywords: post.tags.map((t) => t.name),
    },
    siteBaseUrl(settings["site.url"]),
  );

  return (
    <>
      <Container>
        <Breadcrumb
          items={[
            { label: "Jurnal", href: "/jurnal" },
            ...(post.category
              ? [
                  {
                    label: post.category.name,
                    href: `/jurnal/kategori/${post.category.slug}`,
                  },
                ]
              : []),
            { label: post.title },
          ]}
        />
      </Container>

      <Section spacing="tight">
        <Container size="prose">
          <Stack gap="md">
            {post.category ? (
              <Eyebrow>
                <Link href={`/jurnal/kategori/${post.category.slug}`}>
                  {post.category.name}
                </Link>
              </Eyebrow>
            ) : null}
            <Heading level={1} size="display">
              {post.title}
            </Heading>
            {post.excerpt ? (
              <p className="text-lead text-pretty text-muted-foreground">
                {post.excerpt}
              </p>
            ) : null}
            <div className="flex flex-col gap-1">
              {post.author?.name ? (
                <p className="text-sm">Ditulis oleh {post.author.name}</p>
              ) : null}
              <PostMeta post={post} />
              {post.updatedAt &&
              post.publishedAt &&
              formatDate(post.updatedAt) !== formatDate(post.publishedAt) ? (
                <p className="text-sm text-muted-foreground">
                  Diperbarui{" "}
                  <time dateTime={post.updatedAt.toISOString()}>
                    {formatDate(post.updatedAt)}
                  </time>
                </p>
              ) : null}
            </div>
          </Stack>
        </Container>
      </Section>

      {post.cover ? (
        <Section spacing="none">
          <Container size="wide">
            <div
              className="relative w-full overflow-hidden rounded-lg border border-border bg-surface"
              style={{ aspectRatio: "16 / 9" }}
            >
              <Image
                src={post.cover.url}
                alt={post.cover.alt ?? post.title}
                fill
                priority
                sizes="(min-width: 1024px) 960px, 100vw"
                className="object-cover"
                {...(post.cover.blurDataUrl
                  ? {
                      placeholder: "blur" as const,
                      blurDataURL: post.cover.blurDataUrl,
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
            {headings.length >= 3 ? (
              <nav
                aria-labelledby="toc-title"
                className="rounded-lg border border-border bg-surface p-4"
              >
                <p id="toc-title" className="mb-2 font-medium">
                  Daftar isi
                </p>
                <ol className="flex flex-col gap-1 text-sm">
                  {headings.map((h) => (
                    <li
                      key={h.id}
                      className={h.level === 3 ? "ps-4" : undefined}
                    >
                      <a
                        href={`#${h.id}`}
                        className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}
            <RichText doc={doc} media={media} />
            {post.tags.length ? (
              <ul
                className="flex flex-wrap gap-2 text-sm text-muted-foreground"
                aria-label="Tag"
              >
                {post.tags.map((t) => (
                  <li key={t.slug}>#{t.name}</li>
                ))}
              </ul>
            ) : null}
          </Stack>
        </Container>
      </Section>

      <Section tone="surface">
        <Container size="prose">
          <Stack gap="md">
            <Heading level={2} size="h3">
              Ingin mencoba tempe Mak Nuk?
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
                    source={`jurnal:${post.slug}`}
                    kind="order"
                  >
                    Tanya via WhatsApp
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
              <Heading level={2}>Artikel terkait</Heading>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <PostCard key={p.id} post={p} />
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
