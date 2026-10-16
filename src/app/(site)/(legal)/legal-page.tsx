import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumb } from "@/components/site/layout";
import { Container, Heading } from "@/components/site/primitives";
import type { LegalSlug } from "@/db/schema";
import { getLegalDocument } from "@/features/legal/queries";
import { LEGAL_ROUTES } from "@/features/legal/schema";
import { formatDateLong } from "@/lib/dates";
import { RichText, type TiptapDoc } from "@/lib/rich-text";

const TITLES: Record<LegalSlug, string> = {
  privacy: "Kebijakan Privasi",
  terms: "Syarat & Ketentuan",
  cookies: "Kebijakan Cookie",
  ordering: "Kebijakan Pemesanan",
};

export async function legalMetadata(slug: LegalSlug): Promise<Metadata> {
  const doc = await getLegalDocument(slug);
  return {
    title: doc?.title ?? TITLES[slug],
    alternates: { canonical: LEGAL_ROUTES[slug] },
    robots: { index: true, follow: true },
  };
}

export async function LegalPage({ slug }: { slug: LegalSlug }) {
  const doc = await getLegalDocument(slug);
  if (!doc) notFound();
  const effective = doc.effectiveAt ?? doc.updatedAt;
  return (
    <>
      <Container size="prose">
        <Breadcrumb items={[{ label: doc.title }]} />
      </Container>
      <Container size="prose" className="pt-6 pb-16">
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
      </Container>
    </>
  );
}
