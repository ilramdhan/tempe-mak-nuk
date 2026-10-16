import Link from "next/link";

import { WaLink } from "@/components/site/layout";
import { Button } from "@/components/ui/button";
import { getSettings } from "@/features/settings/queries";
import { buildWaLink } from "@/lib/wa-link";

/** "Pesan" CTA pair: custom-order form (primary) + WhatsApp (secondary). */
export async function ProductCta({
  slug,
  productName,
  size = "md",
}: {
  slug?: string;
  productName?: string;
  size?: "md" | "lg";
}) {
  const settings = await getSettings();
  const href = buildWaLink(settings["contact.whatsapp"], {
    greeting: "Halo Mak Nuk, saya ingin tanya & pesan tempe.",
    lines: [{ label: "Produk", value: productName }],
  });
  const orderHref = slug ? `/custom-order?produk=${slug}` : "/custom-order";
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild size={size}>
        <Link href={orderHref}>Pesan custom</Link>
      </Button>
      {href ? (
        <Button asChild variant="secondary" size={size}>
          <WaLink href={href} source={`produk:${slug ?? "list"}`} kind="order">
            Tanya via WhatsApp
          </WaLink>
        </Button>
      ) : null}
    </div>
  );
}
