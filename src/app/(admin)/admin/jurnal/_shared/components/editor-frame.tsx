"use client";

import {
  ExternalLink,
  LoaderCircle,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
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
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";

import type { PermissionKey } from "@/features/permissions/registry";

import type { FieldErrors } from "../lib/form";

/** Sticky action bar + two-column layout (main / aside) shared by both editors. */
export function EditorFrame({
  dirty,
  pending,
  errors,
  publicHref,
  onSave,
  onDiscard,
  deleteConfig,
  main,
  aside,
}: {
  dirty: boolean;
  pending: boolean;
  errors: FieldErrors;
  /** Shown when the item is live. */
  publicHref?: string | null;
  onSave: () => void;
  onDiscard: () => void;
  deleteConfig?: {
    title: string;
    entityLabel: string;
    listHref: string;
    onDelete: () => Promise<{ ok: boolean; error?: string }>;
    /** Delete button hidden without this permission (server re-checks). */
    permission: PermissionKey;
  };
  main: ReactNode;
  aside: ReactNode;
}) {
  const count = Object.keys(errors).length;
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className="flex flex-col gap-6"
    >
      <div className="sticky top-0 z-20 -mx-2 flex flex-wrap items-center gap-2 rounded-b-lg border-b border-input bg-background/95 px-2 py-3 backdrop-blur">
        <p className="mr-auto text-sm text-muted-foreground" aria-live="polite">
          {pending
            ? "Menyimpan…"
            : count
              ? `${count} isian perlu diperbaiki`
              : dirty
                ? "Ada perubahan yang belum disimpan"
                : "Semua perubahan tersimpan"}
        </p>
        {publicHref ? (
          <Button asChild variant="ghost" size="sm">
            <a
              href={publicHref}
              target="_blank"
              rel="noopener noreferrer"
              data-skip-unsaved-guard
            >
              <ExternalLink /> Lihat di situs
            </a>
          </Button>
        ) : null}
        {deleteConfig ? <DeleteButton {...deleteConfig} /> : null}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!dirty || pending}
          onClick={onDiscard}
        >
          <RotateCcw /> Buang perubahan
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          aria-keyshortcuts="Control+S Meta+S"
        >
          {pending ? <LoaderCircle className="animate-spin" /> : <Save />}{" "}
          Simpan
        </Button>
      </div>
      {errors._form ? <FieldError>{errors._form}</FieldError> : null}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">{main}</div>
        <aside className="flex flex-col gap-6" aria-label="Pengaturan terbit">
          {aside}
        </aside>
      </div>
    </form>
  );
}

function DeleteButton({
  permission,
  ...props
}: {
  title: string;
  entityLabel: string;
  listHref: string;
  onDelete: () => Promise<{ ok: boolean; error?: string }>;
  permission: PermissionKey;
}) {
  return useCan(permission) ? <DeleteButtonInner {...props} /> : null;
}

function DeleteButtonInner({
  title,
  entityLabel,
  listHref,
  onDelete,
}: {
  title: string;
  entityLabel: string;
  listHref: string;
  onDelete: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Trash2 /> Hapus
      </Button>
      <AlertDialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus {entityLabel} “{title}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Dihapus permanen dan alamat publiknya menjadi 404. Tindakan ini
              tidak bisa dibatalkan — pertimbangkan mengubah status ke Draf
              saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  try {
                    const res = await onDelete();
                    if (!res.ok) {
                      toast.error(res.error ?? "Gagal menghapus.");
                      return;
                    }
                    toast.success(`“${title}” dihapus.`);
                    setOpen(false);
                    router.replace(listHref);
                  } catch {
                    toast.error("Gagal terhubung ke server. Coba lagi.");
                  }
                });
              }}
            >
              {pending ? <LoaderCircle className="animate-spin" /> : null} Hapus
              permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Titled card section used inside the editor columns. */
export function Panel({
  title,
  children,
  description,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-input p-4 sm:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-h4 font-semibold">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
