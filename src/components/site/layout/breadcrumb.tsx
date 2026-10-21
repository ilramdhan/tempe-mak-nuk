import Link from "next/link";
import { Fragment } from "react";

import {
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getSetting } from "@/features/settings/queries";
import { serializeJsonLd } from "@/lib/seo/serialize";
import { siteBaseUrl } from "@/lib/seo/url";
import { cn } from "@/lib/utils";

export type BreadcrumbCrumb = {
  label: string;
  /** Omit for the current page (last item). Root-relative ("/produk") or absolute. */
  href?: string;
};

export type BreadcrumbProps = {
  /** Trail AFTER "Beranda" (added automatically unless `includeHome={false}`). */
  items: BreadcrumbCrumb[];
  includeHome?: boolean;
  /** Emit schema.org BreadcrumbList JSON-LD (needs settings `site.url`). Default true. */
  jsonLd?: boolean;
  className?: string;
};

const HOME: BreadcrumbCrumb = { label: "Beranda", href: "/" };

function absoluteUrl(href: string, siteUrl: string): string | null {
  try {
    return new URL(href, siteUrl).toString();
  } catch {
    return null;
  }
}

/**
 * schema.org BreadcrumbList. Items without `href` (the current page) are emitted without
 * `item`, which Google accepts for the last crumb. Returns null if `siteUrl` is unusable.
 */
export function breadcrumbJsonLd(
  crumbs: BreadcrumbCrumb[],
  siteUrl: string,
): Record<string, unknown> | null {
  if (!siteUrl || !absoluteUrl("/", siteUrl)) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => {
      const item = c.href ? absoluteUrl(c.href, siteUrl) : null;
      return {
        "@type": "ListItem",
        position: i + 1,
        name: c.label,
        ...(item ? { item } : {}),
      };
    }),
  };
}

export { serializeJsonLd };

/**
 * Page breadcrumb (server component). Visual trail + optional BreadcrumbList JSON-LD.
 *
 *   <Breadcrumb items={[{ label: "Produk", href: "/produk" }, { label: product.name }]} />
 */
export async function Breadcrumb({
  items,
  includeHome = true,
  jsonLd = true,
  className,
}: BreadcrumbProps) {
  const crumbs = includeHome ? [HOME, ...items] : items;
  if (crumbs.length === 0) return null;
  const structured = jsonLd
    ? breadcrumbJsonLd(crumbs, siteBaseUrl(await getSetting("site.url")))
    : null;

  return (
    <>
      <BreadcrumbRoot aria-label="Breadcrumb" className={cn(className)}>
        <BreadcrumbList className="gap-x-1 gap-y-0">
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1;
            return (
              <Fragment key={`${i}-${crumb.label}`}>
                <BreadcrumbItem className="min-w-0">
                  {last || !crumb.href ? (
                    <BreadcrumbPage className="line-clamp-1 py-3">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      asChild
                      className="inline-flex min-h-11 items-center rounded-sm underline-offset-4 hover:underline"
                    >
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {last ? null : <BreadcrumbSeparator />}
              </Fragment>
            );
          })}
        </BreadcrumbList>
      </BreadcrumbRoot>
      {structured ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(structured) }}
        />
      ) : null}
    </>
  );
}
