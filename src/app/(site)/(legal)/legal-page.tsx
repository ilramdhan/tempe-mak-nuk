import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/site/layout";
import { Container, Heading } from "@/components/site/primitives";
import type { LegalSlug } from "@/db/schema";
import { getLegalDocument } from "@/features/legal/queries";
import { LEGAL_ROUTES } from "@/features/legal/schema";
import { formatDateLong } from "@/lib/dates";
import { extractHeadings, RichText, type TiptapDoc } from "@/lib/rich-text";
import { pageMetadata } from "@/lib/seo/server";

const TITLES: Record<LegalSlug, string> = {
  privacy: "Kebijakan Privasi",
  terms: "Syarat & Ketentuan",
  cookies: "Kebijakan Cookie",
  ordering: "Kebijakan Pemesanan",
};

const DESCRIPTIONS: Record<LegalSlug, string> = {
  privacy:
    "Bagaimana Tempe Mak Nuk mengumpulkan, menggunakan, dan melindungi data pribadi Anda saat memesan dan menghubungi kami.",
  terms:
    "Syarat dan ketentuan penggunaan situs serta pemesanan produk Tempe Mak Nuk, termasuk hak dan kewajiban kedua pihak.",
  cookies:
    "Penjelasan jenis cookie yang digunakan situs Tempe Mak Nuk, tujuannya, dan cara Anda mengatur preferensi cookie.",
  ordering:
    "Ketentuan pemesanan Tempe Mak Nuk: cara pesan, pembayaran, pengiriman, perubahan, dan pembatalan pesanan.",
};

export async function legalMetadata(slug: LegalSlug): Promise<Metadata> {
  const doc = await getLegalDocument(slug);
  return pageMetadata({
    title: doc?.title ?? TITLES[slug],
    description: DESCRIPTIONS[slug],
    path: LEGAL_ROUTES[slug],
  });
}

export async function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = await getLegalDocument(slug);
  if (!doc) notFound();
  const headings = extractHeadings(doc.content as TiptapDoc | null).filter(
    (h) => h.level <= 3,
  );
  const effective = doc.effectiveAt ?? doc.updatedAt;
  return (
    <>
      <Container size="prose">
        <Breadcrumb items={[{ label: doc.title }]} />
      </Container>
      <Container className="pt-6 pb-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
          {headings.length ? (
            <aside className="lg:order-first">
              <details className="rounded-lg border border-border bg-surface px-4 py-3 lg:hidden">
                <summary className="cursor-pointer text-sm font-medium">
                  Daftar isi
                </summary>
                <LegalToc headings={headings} label="Daftar isi (ringkas)" />
              </details>
              <div className="sticky top-24 hidden max-h-[calc(100vh-8rem)] overflow-y-auto lg:block">
                <p className="mb-2 text-sm font-medium">Daftar isi</p>
                <LegalToc headings={headings} label="Daftar isi" />
              </div>
            </aside>
          ) : null}
          <div className="max-w-prose min-w-0">
            <Heading level={1} size="h1">
              {doc.title}
            </Heading>
            <p className="mt-3 text-sm text-muted-foreground">
              Versi {doc.version} · berlaku sejak {formatDateLong(effective)}
            </p>
            <p
              role="note"
              className="mt-4 rounded-lg border border-border bg-surface px-4 py-3 text-sm"
            >
              Dokumen contoh — perlu ditinjau ahli hukum.
            </p>
            <div className="mt-8">
              <RichText doc={doc.content as TiptapDoc | null} />
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}

function LegalToc({
  headings,
  label,
}: {
  headings: ReturnType<typeof extractHeadings>;
  label: string;
}) {
  return (
    <nav aria-label={label} className="mt-3 lg:mt-0">
      <ol className="flex flex-col gap-1.5 text-sm">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? "ps-4" : undefined}>
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
  );
}
