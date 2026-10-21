"use client";

import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  LoaderCircle,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { RoleGate } from "@/components/admin/shell";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteProduct } from "@/features/products/actions";

import type { ProductListItem } from "../_lib/load";

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
});
const helper = createColumnHelper<typeof features, ProductListItem>();

const idr = new Intl.NumberFormat("id-ID");
const VARIANT = { classic: "Klasik", skinless: "Tanpa kulit ari" } as const;

export function ProductTable({ products }: { products: ProductListItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<ProductListItem | null>(null);
  const [pending, startTransition] = useTransition();

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? products.filter((p) => `${p.name} ${p.slug}`.toLowerCase().includes(q))
      : products;
  }, [products, query]);

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor("name", { header: "Produk" }),
        helper.accessor("variant", { header: "Varian" }),
        helper.accessor("priceFrom", { header: "Mulai dari" }),
        helper.accessor("isActive", { header: "Status" }),
        helper.accessor("sort", { header: "Urutan" }),
      ]),
    [],
  );

  const table = useTable({
    features,
    columns,
    data,
  });

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      try {
        const res = await deleteProduct(target.id);
        if (res.ok) {
          toast.success(`Produk "${target.name}" dihapus.`);
          setDeleting(null);
          router.refresh();
        } else toast.error(res.error);
      } catch {
        toast.error("Gagal terhubung ke server. Coba lagi.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-sm">
        <Input
          type="search"
          aria-label="Cari produk"
          placeholder="Cari nama atau slug…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {products.length === 0 ? (
        <p className="rounded-lg border border-dashed border-input p-8 text-center text-sm text-muted-foreground">
          Belum ada produk.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-input">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => {
                    const sorted = h.column.getIsSorted();
                    return (
                      <TableHead
                        key={h.id}
                        aria-sort={
                          sorted === "asc"
                            ? "ascending"
                            : sorted === "desc"
                              ? "descending"
                              : undefined
                        }
                      >
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-sm font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          onClick={() => h.column.toggleSorting()}
                        >
                          <table.FlexRender header={h} />
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3.5" aria-hidden />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3.5" aria-hidden />
                          ) : (
                            <ArrowUpDown
                              className="size-3.5 opacity-50"
                              aria-hidden
                            />
                          )}
                        </button>
                      </TableHead>
                    );
                  })}
                  <TableHead className="text-right">
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    Tidak ada produk yang cocok.
                  </TableCell>
                </TableRow>
              ) : null}
              {table.getRowModel().rows.map((row) => {
                const p = row.original;
                return (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/admin/produk/${p.id}`}
                        className="font-medium hover:underline"
                      >
                        {p.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        /produk/{p.slug}
                      </div>
                    </TableCell>
                    <TableCell>{VARIANT[p.variant]}</TableCell>
                    <TableCell className="tabular-nums">
                      {p.priceFrom === null
                        ? "—"
                        : `Rp ${idr.format(p.priceFrom)}`}
                    </TableCell>
                    <TableCell>
                      {p.isActive ? (
                        <Badge>Aktif</Badge>
                      ) : (
                        <Badge variant="outline">Nonaktif</Badge>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">{p.sort}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/produk/${p.id}`}>
                            <Pencil /> Edit
                          </Link>
                        </Button>
                        <RoleGate permission="products.delete">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Hapus produk ${p.name}`}
                            onClick={() => setDeleting(p)}
                          >
                            <Trash2 />
                          </Button>
                        </RoleGate>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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
              Hapus produk “{deleting?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Produk beserta tautan bentuk, ukuran, galeri, dan data gizinya
              dihapus permanen. Resep yang menautkan produk ini akan kehilangan
              tautannya. Untuk sekadar menyembunyikan, nonaktifkan produk.
              Tindakan ini tidak bisa dibatalkan.
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
