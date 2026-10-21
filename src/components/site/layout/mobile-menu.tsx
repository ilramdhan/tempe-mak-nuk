"use client";

import { MenuIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { Dialog } from "radix-ui";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { Logo } from "@/components/brand/logo";
import { useLenis } from "@/components/motion/lenis-provider";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import type { NavLink } from "@/features/navigation/queries";

import { NavList } from "./nav-list";

export type MobileMenuProps = {
  links: NavLink[];
  cta: { label: string; href: string };
  /** Extra content under the links (e.g. WA link + hours), rendered by the server. */
  footer?: ReactNode;
};

/**
 * Full-screen mobile menu on Radix Dialog: focus trap, Esc, aria-expanded/controls,
 * focus return and body scroll lock come from Radix; Lenis is stopped while open.
 */
export function MobileMenu({ links, cta, footer }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const lenis = useLenis();
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-site-header]");
    if (header) header.dataset.menuOpen = String(open);
    if (open) lenis?.stop();
    else lenis?.start();
    return () => {
      lenis?.start();
    };
  }, [open, lenis]);

  // Close if the viewport grows past the mobile breakpoint.
  useEffect(() => {
    if (!open) return;
    const mql = window.matchMedia("(min-width: 64rem)");
    const onChange = () => mql.matches && setOpen(false);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Buka menu"
        >
          <MenuIcon className="size-5" aria-hidden="true" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        {/* Radix applies body scroll lock (react-remove-scroll) via the Overlay. */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-background lg:hidden" />
        <Dialog.Content
          data-lenis-prevent
          aria-describedby={undefined}
          className="grain fixed inset-0 z-50 flex flex-col overflow-y-auto overscroll-contain bg-background text-foreground motion-reduce:animate-none lg:hidden data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0"
        >
          <Dialog.Title className="sr-only">Menu navigasi</Dialog.Title>
          <div className="flex h-16 shrink-0 items-center justify-between gap-4 px-gutter pt-[env(safe-area-inset-top)] sm:h-20">
            <Link
              href="/"
              onClick={close}
              className="inline-flex min-h-11 items-center rounded-sm text-primary dark:text-foreground"
            >
              <Logo
                variant="horizontal"
                className="h-10 w-auto"
                aria-label="Tempe Mak Nuk, ke beranda"
              />
            </Link>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Tutup menu">
                <XIcon className="size-5" aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>

          <nav
            aria-label="Menu utama"
            className="flex flex-1 flex-col px-gutter pt-6 pb-10"
          >
            <NavList links={links} variant="mobile" onNavigate={close} />
          </nav>

          <div className="flex flex-col gap-6 border-t border-border px-gutter pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-4">
              <Button asChild size="lg" className="flex-1">
                <Link href={cta.href} onClick={close}>
                  {cta.label}
                </Link>
              </Button>
              <ThemeToggle className="size-12" />
            </div>
            {footer}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
