"use client";

import {
  AlertTriangle,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createPage, deletePage } from "@/features/pages/actions";
import { formatDate } from "@/lib/dates";

import type { PageListItem } from "./types";

const publicPath = (slug: string) => (slug === "home" ? "/" : `/${slug}`);

export function PageList({ pages }: { pages: PageListItem[] }) {
  const [deleting, setDeleting] = useState<PageListItem | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    startTransition(async () => {
      try {
        const res = await deletePage(target.id);
        if (res.ok) {
          toast.success(`Halaman "${target.title}" dihapus.`);
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
      <div className="flex justify-end">
        <CreatePageDialog />
      </div>
      {pages.length === 0 ? (
        <p className="rounded-lg border border-dashed border-input p-8 text-center text-sm text-muted-foreground">
          Belum ada halaman.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-input">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Halaman</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Section</TableHead>
                <TableHead className="hidden md:table-cell">Diubah</TableHead>
                <TableHead className="text-right">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link
                      href={`/admin/halaman/${p.id}`}
                      className="font-medium hover:underline"
                    >
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {publicPath(p.slug)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {p.status === "published" ? (
                      <Badge>Terbit</Badge>
                    ) : (
                      <Badge variant="outline">Draf</Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="tabular-nums">{p.sectionCount}</span>
                    {p.hiddenCount ? (
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        · {p.hiddenCount} disembunyikan
                      </span>
                    ) : null}
                    {p.invalidCount ? (
                      <span className="ml-1 inline-flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="size-3.5" aria-hidden />
                        {p.invalidCount} tidak valid
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                    {formatDate(new Date(p.updatedAt))}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/halaman/${p.id}`}>
                          <Pencil /> Edit
                        </Link>
                      </Button>
                      <RoleGate role="owner">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Hapus halaman ${p.title}`}
                          disabled={p.slug === "home"}
                          onClick={() => setDeleting(p)}
                        >
                          <Trash2 />
                        </Button>
                      </RoleGate>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
              Hapus halaman “{deleting?.title}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Halaman dan seluruh {deleting?.sectionCount ?? 0} section-nya
              dihapus permanen. Rute {deleting ? publicPath(deleting.slug) : ""}{" "}
              akan kosong/404 — pertimbangkan membuat redirect. Tindakan ini
              tidak bisa dibatalkan.
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

function CreatePageDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const autoSlug = (t: string) =>
    t
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await createPage({ title, slug, status: "draft", seo: {} });
        if (!res.ok) {
          const fe = Object.fromEntries(
            Object.entries(res.fieldErrors ?? {}).map(([k, v]) => [
              k,
              v[0] ?? "",
            ]),
          );
          setErrors(fe);
          toast.error(res.error);
          return;
        }
        toast.success("Halaman dibuat sebagai draf.");
        setOpen(false);
        router.push(`/admin/halaman/${res.data.id}`);
      } catch {
        toast.error("Gagal terhubung ke server. Coba lagi.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setTitle("");
          setSlug("");
          setSlugTouched(false);
          setErrors({});
        }
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Plus /> Halaman baru
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Halaman baru</DialogTitle>
            <DialogDescription>
              Dibuat sebagai draf. Halaman baru hanya tampil di situs bila
              rutenya sudah tersedia di kode (mis. halaman CMS umum) — tanyakan
              ke developer bila ragu.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-5">
            <Field data-invalid={errors.title ? true : undefined}>
              <FieldLabel htmlFor="new-title">Judul *</FieldLabel>
              <Input
                id="new-title"
                value={title}
                maxLength={160}
                aria-invalid={errors.title ? true : undefined}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slugTouched) setSlug(autoSlug(e.target.value));
                }}
              />
              {errors.title ? <FieldError>{errors.title}</FieldError> : null}
            </Field>
            <Field data-invalid={errors.slug ? true : undefined}>
              <FieldLabel htmlFor="new-slug">Slug *</FieldLabel>
              <Input
                id="new-slug"
                value={slug}
                aria-invalid={errors.slug ? true : undefined}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase());
                }}
              />
              <FieldDescription>
                Huruf kecil, angka, tanda hubung; boleh bertingkat dengan “/”.
              </FieldDescription>
              {errors.slug ? <FieldError>{errors.slug}</FieldError> : null}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : null} Buat
              & edit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
