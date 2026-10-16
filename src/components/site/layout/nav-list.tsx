"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import type { NavLink } from "@/features/navigation/queries";
import { cn } from "@/lib/utils";

import { isExternalHref, matchPath } from "./nav-utils";

export type NavListVariant = "desktop" | "mobile";

type NavListProps = {
  links: NavLink[];
  variant: NavListVariant;
  /** Called after a link is activated (mobile menu closes itself). */
  onNavigate?: () => void;
  className?: string;
};

function NavAnchor({
  link,
  pathname,
  variant,
  onNavigate,
  sub = false,
}: {
  link: NavLink;
  pathname: string | null;
  variant: NavListVariant;
  onNavigate?: () => void;
  sub?: boolean;
}) {
  const match = matchPath(pathname, link.href);
  const external = isExternalHref(link.href);
  const className =
    variant === "desktop"
      ? cn(
          "relative inline-flex h-11 items-center rounded-full px-3 text-sm font-medium transition-colors",
          "text-muted-foreground hover:text-foreground",
          "after:absolute after:inset-x-3 after:bottom-2 after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform motion-reduce:after:transition-none",
          "hover:after:scale-x-100 aria-[current]:text-foreground aria-[current]:after:scale-x-100",
        )
      : sub
        ? cn(
            "inline-flex min-h-11 items-center text-lg text-muted-foreground transition-colors hover:text-foreground",
            "aria-[current]:text-foreground",
          )
        : cn(
            "group inline-flex min-h-12 items-baseline gap-3 font-display-soft text-h3 transition-colors",
            "text-foreground/85 hover:text-foreground aria-[current]:text-primary",
          );

  const content =
    variant === "mobile" && !sub ? (
      <>
        <span>{link.label}</span>
        <span
          aria-hidden="true"
          className="size-1.5 translate-y-[-0.35em] rounded-full bg-accent opacity-0 transition-opacity group-aria-[current]:opacity-100"
        />
      </>
    ) : (
      link.label
    );

  if (external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onNavigate}
      >
        {content}
      </a>
    );
  }
  return (
    <Link
      href={link.href}
      className={className}
      aria-current={
        match === "page" ? "page" : match === "section" ? "true" : undefined
      }
      onClick={onNavigate}
    >
      {content}
    </Link>
  );
}

/** Pure view (no router hooks) — also the Suspense fallback with no active state. */
export function NavListView({
  links,
  variant,
  onNavigate,
  className,
  pathname,
}: NavListProps & { pathname: string | null }) {
  if (variant === "desktop") {
    return (
      <ul className={cn("flex items-center gap-1", className)}>
        {links.map((link) => (
          <li key={link.id}>
            <NavAnchor link={link} pathname={pathname} variant={variant} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {links.map((link, i) => (
        <li
          key={link.id}
          className="motion-safe:animate-in motion-safe:duration-500 motion-safe:fade-in-0 motion-safe:fill-mode-both motion-safe:slide-in-from-bottom-3"
          style={{ animationDelay: `${60 + i * 40}ms` }}
        >
          <NavAnchor
            link={link}
            pathname={pathname}
            variant={variant}
            onNavigate={onNavigate}
          />
          {link.children.length > 0 ? (
            <ul className="mt-1 mb-2 flex flex-col border-l border-border pl-4">
              {link.children.map((child) => (
                <li key={child.id}>
                  <NavAnchor
                    link={child}
                    pathname={pathname}
                    variant={variant}
                    onNavigate={onNavigate}
                    sub
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function NavListWithPath(props: NavListProps) {
  const pathname = usePathname();
  return <NavListView {...props} pathname={pathname} />;
}

/**
 * Nav links with active state from usePathname. Wrapped in Suspense because, under
 * cacheComponents, usePathname suspends on routes with unknown dynamic params.
 */
export function NavList(props: NavListProps) {
  return (
    <Suspense fallback={<NavListView {...props} pathname={null} />}>
      <NavListWithPath {...props} />
    </Suspense>
  );
}
