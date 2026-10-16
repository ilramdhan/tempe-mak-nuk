import type { Metadata } from "next";
import Link from "next/link";

import { WaLink } from "@/components/site/layout";
import {
  Container,
  Heading,
  Lead,
  Section,
  Stack,
} from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/features/settings/queries";
import { buildWaLink } from "@/lib/wa-link";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false, follow: false },
};

export default async function SiteNotFound() {
  const settings = await getSettings();
  const waHref = buildWaLink(
    settings["contact.whatsapp"],
    "Halo Mak Nuk, saya tidak menemukan halaman yang saya cari.",
  );
  return (
    <Section>
      <Container size="prose">
        <Stack gap="md" className="items-start">
          <p className="font-display text-sm font-semibold tracking-widest text-muted-foreground">
            404
          </p>
          <Heading level={1} size="display">
            Halaman ini sudah tidak ada.
          </Heading>
          <Lead muted>
            Mungkin sudah dipindah, seperti tempe yang sudah diambil.
          </Lead>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="primary" size="lg">
              <Link href="/">Kembali ke beranda</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/produk">Lihat produk</Link>
            </Button>
            {waHref ? (
              <Button asChild variant="ghost" size="lg">
                <WaLink href={waHref} source="404:cta" kind="general">
                  Tanya via WhatsApp
                </WaLink>
              </Button>
            ) : null}
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
