"use client";

import type { MediaLibraryItem } from "@/features/media/library-actions";

export type UploadResult = { ok: true; media: MediaLibraryItem } | { ok: false; error: string };

/**
 * POST one file to /api/upload with progress (XHR — fetch has no upload progress).
 * Never throws; network errors resolve to `{ ok:false }` with an Indonesian message.
 */
export function uploadMediaFile(
  file: File,
  alt: string,
  opts: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
): Promise<UploadResult> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      const body = xhr.response as { ok?: boolean; media?: MediaLibraryItem; error?: string } | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.ok && body.media) {
        opts.onProgress?.(1);
        resolve({ ok: true, media: body.media });
      } else {
        resolve({ ok: false, error: body?.error ?? `Gagal mengunggah (HTTP ${xhr.status}).` });
      }
    };
    xhr.onerror = () => resolve({ ok: false, error: "Gagal terhubung ke server. Coba lagi." });
    xhr.onabort = () => resolve({ ok: false, error: "Unggahan dibatalkan." });
    opts.signal?.addEventListener("abort", () => xhr.abort(), { once: true });

    const form = new FormData();
    form.append("file", file);
    form.append("alt", alt);
    xhr.send(form);
  });
}
