"use client";

import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MediaLibraryItem } from "@/features/media/library-actions";
import {
  UPLOAD_ACCEPT,
  UPLOAD_MAX_BYTES,
  altFromFilename,
  formatBytes,
  validateUploadFile,
} from "@/features/media/upload-rules";
import { cn } from "@/lib/utils";

import { uploadMediaFile } from "./upload-client";

type QueueItem = {
  key: string;
  file: File;
  preview: string;
  alt: string;
  status: "idle" | "uploading" | "done" | "error";
  progress: number;
  error: string | null;
};

const MAX_QUEUE = 20;

/**
 * Drag & drop / file-input uploader with per-file alt text (required), progress and multi-file
 * queue. Uploads sequentially via POST /api/upload. Used by /admin/media and the MediaPicker.
 */
export function MediaUploader({
  onUploaded,
  onFinished,
  multiple = true,
  className,
}: {
  onUploaded: (item: MediaLibraryItem) => void;
  /** After a batch: number of successful uploads (only called when none failed). */
  onFinished?: (uploaded: number) => void;
  multiple?: boolean;
  className?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Revoke object URLs on unmount.
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const set = previews.current;
    return () => set.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const patch = (key: string, p: Partial<QueueItem>) =>
    setQueue((q) => q.map((it) => (it.key === key ? { ...it, ...p } : it)));

  function addFiles(list: FileList | File[]) {
    const files = Array.from(list).slice(0, multiple ? MAX_QUEUE : 1);
    const rejected: string[] = [];
    const next: QueueItem[] = [];
    for (const file of files) {
      const error = validateUploadFile(file);
      if (error) {
        rejected.push(`${file.name}: ${error}`);
        continue;
      }
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      next.push({
        key: crypto.randomUUID(),
        file,
        preview,
        alt: altFromFilename(file.name),
        status: "idle",
        progress: 0,
        error: null,
      });
    }
    setNotice(rejected.length ? rejected.join(" · ") : null);
    setQueue((q) => (multiple ? [...q.filter((i) => i.status !== "done"), ...next].slice(0, MAX_QUEUE) : next));
  }

  function remove(key: string) {
    setQueue((q) => {
      const it = q.find((i) => i.key === key);
      if (it) {
        URL.revokeObjectURL(it.preview);
        previews.current.delete(it.preview);
      }
      return q.filter((i) => i.key !== key);
    });
  }

  async function uploadAll() {
    const pending = queue.filter((i) => i.status === "idle" || i.status === "error");
    const missingAlt = pending.filter((i) => !i.alt.trim());
    if (missingAlt.length) {
      for (const it of missingAlt) patch(it.key, { status: "error", error: "Teks alt wajib diisi" });
      setNotice("Isi teks alt untuk setiap gambar sebelum mengunggah.");
      document.getElementById(`${inputId}-alt-${missingAlt[0].key}`)?.focus();
      return;
    }
    setBusy(true);
    setNotice(null);
    let okCount = 0;
    let failed = 0;
    for (const it of pending) {
      patch(it.key, { status: "uploading", progress: 0, error: null });
      const res = await uploadMediaFile(it.file, it.alt.trim(), {
        onProgress: (p) => patch(it.key, { progress: p }),
      });
      if (res.ok) {
        okCount++;
        patch(it.key, { status: "done", progress: 1 });
        onUploaded(res.media);
      } else {
        failed++;
        patch(it.key, { status: "error", error: res.error });
      }
    }
    setBusy(false);
    if (!failed) onFinished?.(okCount);
  }

  const pendingCount = queue.filter((i) => i.status === "idle" || i.status === "error").length;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input p-6 text-center transition-colors",
          dragging && "border-primary bg-surface",
        )}
      >
        <ImagePlus className="size-8 text-muted-foreground" aria-hidden />
        <p className="text-sm">
          Seret & lepas gambar ke sini, atau{" "}
          <Button type="button" variant="link" size="sm" onClick={() => inputRef.current?.click()}>
            pilih berkas
          </Button>
        </p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG, WebP, atau AVIF · maks. {formatBytes(UPLOAD_MAX_BYTES)} per berkas. Otomatis diubah ke WebP
          (maks. 2400 px) dan metadata (EXIF/lokasi) dihapus.
        </p>
        <label htmlFor={inputId} className="sr-only">
          Pilih berkas gambar
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={UPLOAD_ACCEPT}
          multiple={multiple}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {notice ? (
        <p role="alert" className="text-sm text-destructive">
          {notice}
        </p>
      ) : null}

      {queue.length ? (
        <ul className="flex flex-col gap-3" aria-label="Antrean unggahan">
          {queue.map((it) => {
            const altId = `${inputId}-alt-${it.key}`;
            const errId = `${altId}-err`;
            const locked = it.status === "uploading" || it.status === "done";
            return (
              <li key={it.key} className="flex gap-3 rounded-md border border-input p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.preview} alt="" className="size-20 shrink-0 rounded-md object-cover" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium" title={it.file.name}>
                      {it.file.name}{" "}
                      <span className="font-normal text-muted-foreground">({formatBytes(it.file.size)})</span>
                    </span>
                    {it.status !== "uploading" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Hapus ${it.file.name} dari antrean`}
                        onClick={() => remove(it.key)}
                      >
                        <X />
                      </Button>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={altId}>Teks alt *</Label>
                    <Input
                      id={altId}
                      value={it.alt}
                      maxLength={300}
                      disabled={locked}
                      placeholder="Jelaskan isi gambar, mis. “Tempe mentah dibungkus daun pisang”"
                      aria-invalid={it.status === "error" && !it.alt.trim() ? true : undefined}
                      aria-describedby={it.error ? errId : undefined}
                      onChange={(e) => patch(it.key, { alt: e.target.value, ...(it.status === "error" ? { error: null } : {}) })}
                    />
                  </div>
                  {it.status === "uploading" || it.status === "done" ? (
                    <div className="flex items-center gap-2">
                      <progress
                        className="h-2 flex-1 accent-primary"
                        max={1}
                        value={it.progress}
                        aria-label={`Progres unggah ${it.file.name}`}
                      />
                      <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
                        {it.status === "done" ? "Selesai" : `${Math.round(it.progress * 100)}%`}
                      </span>
                    </div>
                  ) : null}
                  {it.error ? (
                    <p id={errId} className="text-sm text-destructive">
                      {it.error}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {pendingCount ? (
        <div className="flex justify-end">
          <Button type="button" onClick={uploadAll} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" aria-hidden /> : <Upload aria-hidden />}
            {busy ? "Mengunggah…" : `Unggah ${pendingCount} gambar`}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
