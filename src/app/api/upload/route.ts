import { AuthError, requireRole } from "@/lib/auth/require-role";
import { ImageProcessingError } from "@/features/media/process-image";
import { storeUpload } from "@/features/media/upload.server";
import {
  UPLOAD_MAX_BYTES,
  formatBytes,
  uploadAltSchema,
  validateUploadFile,
} from "@/features/media/upload-rules";

/**
 * POST /api/upload — multipart `file` (one image) + `alt` (required). Editor+ (role checked
 * against the DB). Validates MIME/size, then content via sharp (magic bytes, dimensions),
 * re-encodes to WebP ≤2400 px without metadata, stores in Supabase Storage (service role) and
 * inserts the `media` row. Responses: `{ ok:true, media }` or `{ ok:false, error }` (Indonesian).
 *
 * Body size: route handlers are not bound by `serverActions.bodySizeLimit`; the proxy buffers
 * up to `proxyClientMaxBodySize` (default 10 MB) which is above our 5 MB file cap.
 */
const MAX_BODY = UPLOAD_MAX_BYTES + 64 * 1024;

function json(status: number, body: Record<string, unknown>) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
const err = (
  status: number,
  error: string,
  fieldErrors?: Record<string, string[]>,
) =>
  json(status, { ok: false, error, ...(fieldErrors ? { fieldErrors } : {}) });

export async function POST(request: Request) {
  // CSRF: same-origin only (cookies authenticate this route).
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return err(403, "Permintaan ditolak.");

  let user;
  try {
    user = await requireRole("editor");
  } catch (e) {
    if (e instanceof AuthError)
      return err(e.reason === "unauthenticated" ? 401 : 403, e.message);
    console.error("[upload] auth failed:", e);
    return err(500, "Terjadi kesalahan. Coba lagi.");
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY)
    return err(
      413,
      `Ukuran berkas melebihi batas ${formatBytes(UPLOAD_MAX_BYTES)}.`,
    );
  if (
    !(request.headers.get("content-type") ?? "").startsWith(
      "multipart/form-data",
    )
  ) {
    return err(415, "Format permintaan tidak valid.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return err(400, "Data unggahan tidak terbaca.");
  }

  const file = form.get("file");
  if (!(file instanceof File))
    return err(400, "Pilih berkas gambar.", { file: ["Pilih berkas gambar."] });
  if (form.getAll("file").length > 1)
    return err(400, "Unggah satu berkas per permintaan.");

  const alt = uploadAltSchema.safeParse({ alt: form.get("alt") ?? "" });
  if (!alt.success) {
    const msg = alt.error.issues[0]?.message ?? "Teks alt wajib diisi";
    return err(422, msg, { alt: [msg] });
  }

  const fileError = validateUploadFile(file);
  if (fileError)
    return err(file.size > UPLOAD_MAX_BYTES ? 413 : 415, fileError, {
      file: [fileError],
    });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const created = await storeUpload(buffer, alt.data.alt, user);
    return json(201, { ok: true, media: created });
  } catch (e) {
    if (e instanceof ImageProcessingError)
      return err(422, e.message, { file: [e.message] });
    console.error("[upload] failed:", e);
    return err(500, "Gagal mengunggah. Coba lagi.");
  }
}
