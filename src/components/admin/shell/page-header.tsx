import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  /** Page title (rendered as the page's single <h1>). */
  title: ReactNode;
  /** One-line explanation under the title. */
  description?: ReactNode;
  /** Right-aligned actions (buttons, links). Wraps below the title on mobile. */
  actions?: ReactNode;
  /** Small line above the title (e.g. breadcrumb or "Konten"). */
  eyebrow?: ReactNode;
  className?: string;
};

/** Standard header for every admin page (P5.2–P5.10). Server-safe. */
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between lg:mb-8",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-1 text-sm text-muted-foreground">{eyebrow}</div>
        ) : null}
        <h1 className="font-display text-2xl leading-tight font-medium tracking-tight text-balance">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-pretty text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
