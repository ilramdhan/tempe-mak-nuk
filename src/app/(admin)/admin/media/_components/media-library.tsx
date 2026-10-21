"use client";

import { Copy, Loader2, Pencil, Search, Trash2, Upload } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { MediaUploader } from "@/components/admin/media-picker";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMediaAlt } from "@/features/media/actions";
import {
  deleteMediaAndFile,
  getMediaUsageAction,
  searchMediaLibrary,
  type MediaLibraryItem,
} from "@/features/media/library-actions";
import { formatBytes } from "@/features/media/upload-rules";
import type { MediaUsage } from "@/features/media/usage";

import { useAdminMutation } from "../../slot/_components/use-action";

export const PAGE_SIZE = 48;

export function MediaLibrary({
  initialItems,
  initialHasMore,
  loadError,
}: {
  initialItems: MediaLibraryItem[];
  initialHasMore: boolean;
  loadError: boolean;
}) {
  const searchId = useId();
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [q, setQ] = useState("");
  const [loading, startLoading] = useTransition();
  const [error, setError] = useState<string | null>(
    loadError ? "Gagal memuat media. Muat ulang halaman." : null,
  );
  const [showUpload, setShowUpload] = useState(false);
  const [editing, setEditing] = useState<MediaLibraryItem | null>(null);
  const [deleting, setDeleting] = useState<MediaLibraryItem | null>(null);
  const reqRef = useRef(0);
  const firstRun = useRef(true);

  function load(query: string, offset: number) {
    const req = ++reqRef.current;
    startLoading(async () => {
      try {
        const res = await searchMediaLibrary({
          q: query || undefined,
          limit: PAGE_SIZE,
          offset,
        });
        if (req !== reqRef.current) return;
        if (res.ok) {
          setItems((prev) =>
            offset ? [...prev, ...res.data.items] : res.data.items,
          );
          setHasMore(res.data.hasMore);
          setError(null);
        } else setError(res.error);
      } catch {
        if (req === reqRef.current)
          setError("Gagal terhubung ke server. Coba lagi.");
      }
    });
  }

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => load(q.trim(), 0), 250);
    return () => clearTimeout(t);
  }, [q]);

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL disalin.");
    } catch {
      toast.error("Tidak bisa menyalin. Salin manual dari kolom URL.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <label htmlFor={searchId} className="sr-only">
            Cari media
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id={searchId}
            type="search"
            value={q}
            placeholder="Cari teks alt atau nama berkas…"
            className="pl-9"
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button
          type="button"
          onClick={() => setShowUpload((v) => !v)}
          aria-expanded={showUpload}
        >
          <Upload aria-hidden />{" "}
          {showUpload ? "Tutup unggahan" : "Unggah gambar"}
        </Button>
      </div>

      {showUpload ? (
        <section
          aria-label="Unggah gambar"
          className="rounded-lg border border-border p-4"
        >
          <MediaUploader
            onUploaded={(item) => {
              setItems((prev) => [
                item,
                ...prev.filter((p) => p.id !== item.id),
              ]);
              toast.success(`Terunggah: ${item.alt}`);
            }}
          />
        </section>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {items.length === 0 && !loading ? (
        <p className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          {q
            ? "Tidak ada media yang cocok."
            : "Belum ada media. Klik “Unggah gambar” untuk mulai."}
        </p>
      ) : (
        <ul
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
          aria-label="Daftar media"
        >
          {items.map((m) => (
            <li
              key={m.id}
              className="flex flex-col overflow-hidden rounded-lg border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt={m.alt}
                loading="lazy"
                width={m.width ?? undefined}
                height={m.height ?? undefined}
                className="aspect-square w-full bg-surface object-cover"
                style={
                  m.blurDataUrl
                    ? {
                        backgroundImage: `url(${m.blurDataUrl})`,
                        backgroundSize: "cover",
                      }
                    : undefined
                }
              />
              <div className="flex flex-1 flex-col gap-1 p-2">
                <p className="line-clamp-2 text-sm" title={m.alt}>
                  {m.alt}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.width && m.height ? `${m.width}×${m.height}` : "—"}
                  {m.sizeBytes ? ` · ${formatBytes(m.sizeBytes)}` : ""}
                </p>
                <div className="mt-auto flex gap-1 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Salin URL ${m.alt}`}
                    title="Salin URL"
                    onClick={() => copyUrl(m.url)}
                  >
                    <Copy />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Ubah teks alt ${m.alt}`}
                    title="Ubah teks alt"
                    onClick={() => setEditing(m)}
                  >
                    <Pencil />
                  </Button>
                  <RoleGate permission="media.delete">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Hapus ${m.alt}`}
                      title="Hapus"
                      onClick={() => setDeleting(m)}
                    >
                      <Trash2 />
                    </Button>
                  </RoleGate>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {loading ? (
        <p
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          aria-live="polite"
        >
          <Loader2 className="size-4 animate-spin" aria-hidden /> Memuat…
        </p>
      ) : hasMore ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            onClick={() => load(q.trim(), items.length)}
          >
            Muat lebih banyak
          </Button>
        </div>
      ) : null}

      {editing ? (
        <EditAltDialog
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(alt) => {
            setItems((prev) =>
              prev.map((p) => (p.id === editing.id ? { ...p, alt } : p)),
            );
            setEditing(null);
          }}
        />
      ) : null}
      {deleting ? (
        <DeleteDialog
          item={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setItems((prev) => prev.filter((p) => p.id !== deleting.id));
            setDeleting(null);
          }}
        />
      ) : null}
    </div>
  );
}

function EditAltDialog({
  item,
  onClose,
  onSaved,
}: {
  item: MediaLibraryItem;
  onClose: () => void;
  onSaved: (alt: string) => void;
}) {
  const id = useId();
  const [alt, setAlt] = useState(item.alt);
  const [err, setErr] = useState<string | null>(null);
  const { pending, run } = useAdminMutation();

  function save(e: React.FormEvent) {
    e.preventDefault();
    const v = alt.trim();
    if (!v) {
      setErr("Teks alt wajib diisi");
      return;
    }
    run(() => updateMediaAlt(item.id, { alt: v }), {
      success: "Teks alt disimpan.",
      onDone: (res) => {
        if (res.ok) onSaved(v);
        else setErr(res.fieldErrors?.alt?.[0] ?? res.error ?? null);
      },
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form onSubmit={save} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Ubah teks alt</DialogTitle>
            <DialogDescription>
              Jelaskan isi gambar untuk pembaca layar & mesin pencari.
            </DialogDescription>
          </DialogHeader>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.url}
            alt=""
            className="max-h-48 w-full rounded-md object-contain"
          />
          <div className="flex flex-col gap-1">
            <Label htmlFor={id}>Teks alt *</Label>
            <Input
              id={id}
              value={alt}
              maxLength={300}
              aria-invalid={err ? true : undefined}
              aria-describedby={err ? `${id}-err` : undefined}
              onChange={(e) => {
                setAlt(e.target.value);
                setErr(null);
              }}
            />
            {err ? (
              <p id={`${id}-err`} className="text-sm text-destructive">
                {err}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  item,
  onClose,
  onDeleted,
}: {
  item: MediaLibraryItem;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [usage, setUsage] = useState<MediaUsage[] | null>(null);
  const [usageError, setUsageError] = useState(false);
  const { pending, run } = useAdminMutation();

  useEffect(() => {
    let alive = true;
    getMediaUsageAction(item.id)
      .then((res) => {
        if (!alive) return;
        if (res.ok) setUsage(res.data);
        else setUsageError(true);
      })
      .catch(() => alive && setUsageError(true));
    return () => {
      alive = false;
    };
  }, [item.id]);

  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus media?</AlertDialogTitle>
          <AlertDialogDescription>
            “{item.alt}” akan dihapus permanen beserta berkasnya di penyimpanan.
            Tindakan ini tidak bisa dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="text-sm" aria-live="polite">
          {usage === null && !usageError ? (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden /> Memeriksa
              pemakaian…
            </p>
          ) : usageError ? (
            <p className="text-muted-foreground">
              Pemakaian tidak dapat diperiksa.
            </p>
          ) : usage && usage.length ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <p className="font-medium text-destructive">
                Media ini masih dipakai di {usage.length} tempat:
              </p>
              <ul className="mt-1 list-disc pl-5">
                {usage.slice(0, 10).map((u) => (
                  <li key={`${u.kind}:${u.label}`}>
                    {u.kind}: {u.label}
                  </li>
                ))}
              </ul>
              {usage.length > 10 ? (
                <p className="mt-1">…dan {usage.length - 10} lainnya.</p>
              ) : null}
              <p className="mt-2">
                Gambar di tempat tersebut akan hilang / kembali ke placeholder.
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Tidak ditemukan pemakaian media ini.
            </p>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              run(() => deleteMediaAndFile(item.id), {
                success: "Media dihapus.",
                onDone: (res) => {
                  if (!res.ok) return;
                  if (res.data && !res.data.storageRemoved) {
                    toast.warning(
                      "Data terhapus, tetapi berkas di penyimpanan gagal dihapus.",
                    );
                  }
                  onDeleted();
                },
              });
            }}
          >
            {pending ? "Menghapus…" : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
