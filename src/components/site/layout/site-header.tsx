import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import type { NavLink } from "@/features/navigation/queries";

import { HeaderShell } from "./header-shell";
import { MobileMenu } from "./mobile-menu";
import { NavList } from "./nav-list";

export type SiteHeaderProps = {
  links: NavLink[];
  /** Short header CTA (docs/brand.md §5: "Pesan" → /custom-order). */
  cta: { label: string; href: string };
  /** Server-rendered extras for the bottom of the mobile menu. */
  mobileFooter?: React.ReactNode;
};

/** Sticky site header. Server component; only HeaderShell/NavList/MobileMenu hydrate. */
export function SiteHeader({ links, cta, mobileFooter }: SiteHeaderProps) {
  return (
    <HeaderShell>
      <div className="mx-auto flex h-16 w-full max-w-wide items-center justify-between gap-6 px-gutter sm:h-20">
        <Link
          href="/"
          className="inline-flex min-h-11 shrink-0 items-center rounded-sm text-primary dark:text-foreground"
        >
          <Logo
            variant="horizontal"
            className="h-10 w-auto"
            aria-label="Tempe Mak Nuk, ke beranda"
          />
        </Link>

        <nav aria-label="Menu utama" className="hidden lg:block">
          <NavList links={links} variant="desktop" />
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden size-11 sm:inline-flex" />
          <Button asChild size="sm" className="hidden h-11 px-6 sm:inline-flex">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
          <MobileMenu links={links} cta={cta} footer={mobileFooter} />
        </div>
      </div>
    </HeaderShell>
  );
}
