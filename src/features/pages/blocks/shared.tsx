import {
  AlertTriangle,
  Award,
  Baby,
  BadgeCheck,
  Calendar,
  Check,
  ChefHat,
  Clock,
  Droplets,
  Dumbbell,
  Eye,
  Hand,
  HeartHandshake,
  Home,
  Leaf,
  MapPin,
  MessageCircle,
  Package,
  Ruler,
  Shapes,
  ShieldCheck,
  Sparkles,
  Sprout,
  Square,
  Star,
  Truck,
  Utensils,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ImagePlaceholder, type PlaceholderTexture } from "@/components/brand/textures";
import { Eyebrow, Heading, Lead, Stack, type HeadingLevel } from "@/components/site/primitives";
import { Button } from "@/components/ui/button";
import type { PublicMedia } from "@/features/media/queries";
import { cn } from "@/lib/utils";

import type { BlockImage, CtaLink, IconName } from "./schema";

export const ICONS: Record<IconName, LucideIcon> = {
  "alert-triangle": AlertTriangle,
  award: Award,
  baby: Baby,
  "badge-check": BadgeCheck,
  calendar: Calendar,
  "chef-hat": ChefHat,
  check: Check,
  clock: Clock,
  droplets: Droplets,
  dumbbell: Dumbbell,
  eye: Eye,
  hand: Hand,
  "heart-handshake": HeartHandshake,
  home: Home,
  leaf: Leaf,
  "map-pin": MapPin,
  "message-circle": MessageCircle,
  package: Package,
  ruler: Ruler,
  shapes: Shapes,
  "shield-check": ShieldCheck,
  sparkles: Sparkles,
  sprout: Sprout,
  square: Square,
  star: Star,
  truck: Truck,
  utensils: Utensils,
  wheat: Wheat,
};

export function BlockIcon({ name, className }: { name: IconName | null | undefined; className?: string }) {
  if (!name) return null;
  const Icon = ICONS[name];
  return <Icon aria-hidden className={cn("size-5", className)} strokeWidth={1.75} />;
}

/** Shared context passed from <BlockRenderer> to every block. */
export type BlockContext = {
  /** Media resolved for all blocks on the page (id → media). */
  media: Record<string, PublicMedia>;
  /** Position on the page (0-based). */
  index: number;
  /** Heading level for the block's main heading: 1 for the first hero, else 2. */
  headingLevel: HeadingLevel;
  /** Hostnames treated as internal for links (from settings site.url). */
  internalHosts: readonly string[];
};

export type BlockProps<D> = { data: D; ctx: BlockContext };

const isInternal = (href: string) => href.startsWith("/") || href.startsWith("#");

/** Link that uses next/link internally and adds rel/target for external URLs. */
export function SmartLink({
  href,
  className,
  children,
  ...rest
}: { href: string; className?: string; children: ReactNode } & Omit<React.ComponentProps<"a">, "href">) {
  if (isInternal(href))
    return (
      <Link href={href} className={className} {...rest}>
        {children}
      </Link>
    );
  const external = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}

export function CtaButton({
  cta,
  variant = "primary",
  size = "lg",
  className,
}: {
  cta: CtaLink | null | undefined;
  variant?: "primary" | "secondary" | "accent" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!cta) return null;
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <SmartLink href={cta.href}>{cta.label}</SmartLink>
    </Button>
  );
}

export function CtaRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-3", className)}>{children}</div>;
}

/** Eyebrow + heading + intro used at the top of most blocks. */
export function BlockHeader({
  eyebrow,
  heading,
  intro,
  level = 2,
  align = "start",
  className,
}: {
  eyebrow?: string | null;
  heading?: string | null;
  intro?: string | null;
  level?: HeadingLevel;
  align?: "start" | "center";
  className?: string;
}) {
  if (!eyebrow && !heading && !intro) return null;
  return (
    <Stack gap="sm" className={cn("max-w-measure", align === "center" && "mx-auto items-center text-center", className)}>
      {eyebrow ? <Eyebrow rule={align === "start"} tone="accent">{eyebrow}</Eyebrow> : null}
      {heading ? <Heading level={level}>{heading}</Heading> : null}
      {intro ? <Lead muted>{intro}</Lead> : null}
    </Stack>
  );
}

/** Next/Image for resolved media, art-directed placeholder otherwise. */
export function BlockMedia({
  image,
  media,
  caption,
  aspect = "4 / 5",
  texture = "mycelium",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  className,
}: {
  image: BlockImage | { mediaId: string; alt?: string | null } | null | undefined;
  media: Record<string, PublicMedia>;
  /** Placeholder caption when no image (without "Foto:" prefix). */
  caption: string;
  aspect?: string;
  texture?: PlaceholderTexture;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const m = image ? media[image.mediaId] : undefined;
  if (!m) return <ImagePlaceholder caption={caption} aspect={aspect} texture={texture} className={className} />;
  const alt = image?.alt || m.alt;
  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-lg border border-border bg-surface", className)}
      style={{ aspectRatio: aspect }}
    >
      <Image
        src={m.url}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        {...(m.blurDataUrl ? { placeholder: "blur" as const, blurDataURL: m.blurDataUrl } : {})}
      />
    </div>
  );
}
