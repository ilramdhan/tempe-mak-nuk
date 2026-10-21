"use client";

import {
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_equalsString,
  filterFn_includesString,
  globalFilteringFeature,
  rowSortingFeature,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCan } from "@/components/admin/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatWib, VISIBILITY_LABEL, type Visibility } from "../lib/publish";
import type { Option } from "./types";
import type { PermissionKey } from "@/features/permissions/registry";

export type ContentRow = {
  id: string;
  title: string;
  slug: string;
  visibility: Visibility;
  /** ISO */
  publishedAt: string | null;
  categoryId: string | null;
  categoryName: string;
  /** ISO */
  updatedAt: string;
  /** Optional extra column value (e.g. related product). */
  extra?: string;
};

type ActionResult = { ok: boolean; error?: string };

const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: {
    includesString: filterFn_includesString,
    equalsString: filterFn_equalsString,
  },
  sortFns: { text: sortFn_text, basic: sortFn_basic },
});
const helper = createColumnHelper<typeof features, ContentRow>();
const ALL = "__all__";
const NO_CATEGORY = "__none__";

const VIS_BADGE: Record<Visibility, "default" | "secondary" | "outline"> = {
  live: "default",
  scheduled: "secondary",
  draft: "outline",
};

export function ContentTable({
  rows,
  entityLabel,
  basePath,
  publicBasePath,
  categories,
  extraLabel,
  onDelete,
  deletePermission,
}: {
  rows: ContentRow[];
  /** "artikel" / "resep" */
  entityLabel: string;
  /** "/admin/jurnal" */
  basePath: string;
  /** "/jurnal" */
  publicBasePath: string;
  categories: readonly Option[];
  extraLabel?: string;
  onDelete: (id: string) => Promise<ActionResult>;
  /** Permission key for the delete action (button hidden without it; server re-checks). */
  deletePermission: PermissionKey;
}) {
  const canDelete = useCan(deletePermission);
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleting, setDeleting] = useState<ContentRow | null>(null);
  const [pending, startTransition] = useTransition();

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor("title", {
          header: "Judul",
          sortFn: "text",
          enableGlobalFilter: true,
        }),
        helper.accessor("slug", {
          header: "Slug",
          enableGlobalFilter: true,
          enableSorting: false,
        }),
        helper.accessor((r) => r.categoryId ?? NO_CATEGORY, {
          id: "category",
          header: "Kategori",
          filterFn: "equalsString",
          enableGlobalFilter: false,
          sortFn: (a, b) =>
            a.original.categoryName.localeCompare(
              b.original.categoryName,
              "id",
            ),
        }),
        helper.accessor("visibility", {
          header: "Status",
          filterFn: "equalsString",
          enableGlobalFilter: false,
          sortFn: "text",
        }),
        helper.accessor(
          (r) => (r.publishedAt ? Date.parse(r.publishedAt) : undefined),
          {
            id: "publishedAt",
            header: "Terbit",
            sortFn: "basic",
            sortUndefined: "last",
            enableGlobalFilter: false,
          },
        ),
        helper.accessor((r) => Date.parse(r.updatedAt), {
          id: "updatedAt",
          header: "Diubah",
          sortFn: "basic",
          enableGlobalFilter: false,
        }),
      ]),
    [],
  );

  const table = useTable({
    features,
    columns,
    data: rows,
    getRowId: (r) => r.id,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    enableSortingRemoval: false,
  });

  const filterValue = (id: string) =>
    (columnFilters.find((f) => f.id === id)?.value as string | undefined) ??
    ALL;
  const setFilter = (id: string, v: string) =>
    setColumnFilters((prev) => [
      ...prev.filter((f) => f.id !== id),
      ...(v === ALL ? [] : [{ id, value: v }]),
    ]);

  const visible = table.getRowModel().rows.map((r) => r.original);
  const sortHeader = (id: string, label: string, className?: string) => {
    const col = table.getColumn(id);
    const dir = col?.getIsSorted();
    const Icon =
      dir === "asc" ? ArrowUp : dir === "desc" ? ArrowDown : ArrowUpDown;
    return (
      <TableHead
        className={className}
        aria-sort={
          dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none"
        }
      >
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          onClick={col?.getToggleSortingHandler()}
        >
          {label}
          <Icon className="size-3.5" aria-hidden />
        </button>
      </TableHead>
    );
  };

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      try {
        const res = await onDelete(target.id);
        if (res.ok) {
          toast.success(`“${target.title}” dihapus.`);
          setDeleting(null);
          router.refresh();
        } else toast.error(res.error ?? "Gagal menghapus.");
      } catch {
        toast.error("Gagal terhubung ke server. Coba lagi.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5 sm:min-w-56">
          <Label htmlFor="content-search">Cari</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="content-search"
              type="search"
              value={globalFilter}
              placeholder="Judul atau slug…"
              className="pl-9"
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 sm:w-44">
          <Label htmlFor="content-status">Status</Label>
          <Select
            value={filterValue("visibility")}
            onValueChange={(v) => setFilter("visibility", v)}
          >
            <SelectTrigger id="content-status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Semua status</SelectItem>
              {(Object.keys(VISIBILITY_LABEL) as Visibility[]).map((v) => (
                <SelectItem key={v} value={v}>
                  {VISIBILITY_LABEL[v]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5 sm:w-52">
          <Label htmlFor="content-category">Kategori</Label>
          <Select
            value={filterValue("category")}
            onValueChange={(v) => setFilter("category", v)}
          >
            <SelectTrigger id="content-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Semua kategori</SelectItem>
              <SelectItem value={NO_CATEGORY}>Tanpa kategori</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button asChild size="sm" className="sm:ml-auto">
          <Link href={`${basePath}/baru`}>
            <Plus /> Tambah {entityLabel}
          </Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {visible.length} dari {rows.length} {entityLabel}
      </p>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-input p-8 text-center text-sm text-muted-foreground">
          Belum ada {entityLabel}.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-input">
          <Table>
            <TableHeader>
              <TableRow>
                {sortHeader("title", "Judul")}
                {sortHeader("category", "Kategori", "hidden md:table-cell")}
                {sortHeader("visibility", "Status")}
                {sortHeader("publishedAt", "Terbit", "hidden lg:table-cell")}
                {sortHeader("updatedAt", "Diubah", "hidden sm:table-cell")}
                <TableHead className="text-right">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Tidak ada {entityLabel} yang cocok dengan filter.
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="max-w-80">
                      <Link
                        href={`${basePath}/${r.id}`}
                        className="font-medium hover:underline"
                      >
                        {r.title}
                      </Link>
                      <div className="truncate text-xs text-muted-foreground">
                        {publicBasePath}/{r.slug}
                        {extraLabel && r.extra
                          ? ` · ${extraLabel}: ${r.extra}`
                          : ""}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm md:table-cell">
                      {r.categoryName || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={VIS_BADGE[r.visibility]}>
                        {VISIBILITY_LABEL[r.visibility]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                      {r.publishedAt ? formatWib(r.publishedAt) : "—"}
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {formatWib(r.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`${basePath}/${r.id}`}>
                            <Pencil /> Edit
                          </Link>
                        </Button>
                        {r.visibility === "live" ? (
                          <Button asChild variant="ghost" size="icon-sm">
                            <a
                              href={`${publicBasePath}/${r.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Lihat “${r.title}” di situs (tab baru)`}
                            >
                              <ExternalLink />
                            </a>
                          </Button>
                        ) : null}
                        {canDelete ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Hapus ${entityLabel} ${r.title}`}
                            onClick={() => setDeleting(r)}
                          >
                            <Trash2 />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && !pending && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus {entityLabel} “{deleting?.title}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {entityLabel[0]?.toUpperCase()}
              {entityLabel.slice(1)} dihapus permanen dan alamat{" "}
              {publicBasePath}/{deleting?.slug} menjadi 404. Tindakan ini tidak
              bisa dibatalkan — pertimbangkan mengubah status ke Draf saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              {pending ? <LoaderCircle className="animate-spin" /> : null} Hapus
              permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
