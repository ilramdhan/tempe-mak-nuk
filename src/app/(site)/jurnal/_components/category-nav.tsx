import Link from "next/link";

import { cn } from "@/lib/utils";

type Cat = { slug: string; name: string };

export function CategoryNav({
  categories,
  active,
}: {
  categories: Cat[];
  active?: string;
}) {
  if (!categories.length) return null;
  const base =
    "inline-flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors";
  const on = "border-primary bg-primary text-primary-foreground";
  const off = "border-border hover:bg-surface";
  return (
    <nav aria-label="Kategori jurnal">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href="/jurnal"
            aria-current={active ? undefined : "page"}
            className={cn(base, active ? off : on)}
          >
            Semua
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/jurnal/kategori/${c.slug}`}
              aria-current={active === c.slug ? "page" : undefined}
              className={cn(base, active === c.slug ? on : off)}
            >
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
