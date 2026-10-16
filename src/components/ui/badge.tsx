import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * Badge. Slot-status variants (available/nearly/full/closed) use the
 * --slot-* tokens; pair them with a text label + SlotDot so status is never
 * colour-only (docs/brand.md §5).
 */
const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-surface text-foreground",
        outline: "border-input text-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        halal: "bg-halal text-halal-foreground",
        available: "border-slot-available text-slot-available",
        nearly: "border-slot-nearly text-slot-nearly",
        full: "border-slot-full text-slot-full",
        closed: "border-slot-closed text-slot-closed",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

type SlotStatus = "available" | "nearly" | "full" | "closed";

const SLOT_LABEL: Record<SlotStatus, string> = {
  available: "Tersedia",
  nearly: "Hampir penuh",
  full: "Penuh",
  closed: "Libur",
};

/** Shape marker per status: full dot / half / empty ring / dash. */
function SlotDot({ status }: { status: SlotStatus }) {
  const common = "inline-block size-2.5 shrink-0 rounded-full";
  if (status === "available")
    return <span aria-hidden className={cn(common, "bg-current")} />;
  if (status === "nearly")
    return (
      <span
        aria-hidden
        className={cn(common, "border border-current")}
        style={{
          background:
            "linear-gradient(90deg, currentColor 50%, transparent 50%)",
        }}
      />
    );
  if (status === "full")
    return (
      <span aria-hidden className={cn(common, "border-2 border-current")} />
    );
  return <span aria-hidden className="inline-block h-0.5 w-2.5 bg-current" />;
}

/** Slot status badge with label + shape marker. */
function SlotBadge({
  status,
  className,
  children,
}: {
  status: SlotStatus;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Badge variant={status} className={className}>
      <SlotDot status={status} />
      {children ?? SLOT_LABEL[status]}
    </Badge>
  );
}

export { Badge, badgeVariants, SlotBadge, SlotDot, SLOT_LABEL };
export type { SlotStatus };
