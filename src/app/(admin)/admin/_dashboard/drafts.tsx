import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listPagesForAdmin } from "@/features/pages/queries.admin";
import { listPostsForAdmin } from "@/features/posts/queries.admin";
import { listRecipesForAdmin } from "@/features/recipes/queries.admin";
import { formatDateShort } from "@/lib/dates";

type Item = {
  id: string;
  title: string;
  kind: string;
  href: string;
  status: string;
  date: Date | null;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  scheduled: "Terjadwal",
};

export async function DraftsCard() {
  const [posts, recipes, pages] = await Promise.all([
    listPostsForAdmin(),
    listRecipesForAdmin(),
    listPagesForAdmin(),
  ]);
  const items: Item[] = [
    ...posts.map((p) => ({
      id: p.id,
      title: p.title,
      kind: "Artikel",
      href: `/admin/jurnal/${p.id}`,
      status: p.status,
      date: p.publishedAt ?? p.updatedAt,
    })),
    ...recipes.map((r) => ({
      id: r.id,
      title: r.title,
      kind: "Resep",
      href: `/admin/resep/${r.id}`,
      status: r.status,
      date: r.publishedAt ?? r.updatedAt,
    })),
    ...pages.map((p) => ({
      id: p.id,
      title: p.title,
      kind: "Halaman",
      href: `/admin/halaman/${p.id}`,
      status: p.status,
      date: p.updatedAt,
    })),
  ]
    .filter((i) => i.status === "draft" || i.status === "scheduled")
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Draft & terjadwal</CardTitle>
        <CardDescription>
          {items.length === 0
            ? "Semua konten sudah terbit."
            : `${items.length} konten belum terbit.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? null : (
          <ul className="divide-y">
            {items.slice(0, 10).map((i) => (
              <li key={`${i.kind}-${i.id}`}>
                <Link
                  href={i.href}
                  className="flex items-center gap-3 py-2.5 hover:bg-surface"
                >
                  <Badge variant="secondary">{i.kind}</Badge>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {i.title}
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {i.date ? formatDateShort(i.date) : ""}
                  </span>
                  <Badge variant="outline">
                    {STATUS_LABEL[i.status] ?? i.status}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {items.length > 10 ? (
          <p className="pt-2 text-xs text-muted-foreground">
            +{items.length - 10} lainnya di modul masing-masing.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
