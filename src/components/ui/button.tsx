import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * Brand button (docs/brand.md, PROMPT §6). Pill radius for every variant,
 * focus ring on --ring. Accent uses dark text (accent-foreground) on gold.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_12%)]",
        secondary:
          "border-input bg-transparent text-foreground hover:bg-surface aria-expanded:bg-surface",
        ghost: "text-foreground hover:bg-surface aria-expanded:bg-surface",
        accent:
          "bg-accent text-accent-foreground hover:bg-[color-mix(in_oklch,var(--accent),var(--foreground)_10%)]",
        link: "rounded-sm text-accent-strong underline-offset-4 hover:underline focus-visible:ring-offset-0",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-[color-mix(in_oklch,var(--destructive),var(--foreground)_12%)]",
      },
      size: {
        xs: "h-7 px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-12 px-8 text-base",
        icon: "size-11",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    compoundVariants: [
      {
        variant: "link",
        size: ["xs", "sm", "md", "lg"],
        className: "h-auto px-0",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

function Button({
  className,
  variant = "primary",
  size = "md",
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
