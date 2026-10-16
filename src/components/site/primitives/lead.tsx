import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type LeadProps = HTMLAttributes<HTMLParagraphElement> & {
  /** Muted colour for secondary intros. */
  muted?: boolean;
};

/** Large intro paragraph, capped at prose measure. */
export function Lead({ muted = false, className, ...props }: LeadProps) {
  return (
    <p
      className={cn(
        "max-w-measure text-lead text-pretty",
        muted && "text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
