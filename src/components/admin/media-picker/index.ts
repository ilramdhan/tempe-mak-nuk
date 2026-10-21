/**
 * Media picker public API (P5.8). Import from "@/components/admin/media-picker".
 * - MediaPicker        — form field: value = media id | null, dialog to pick/upload.
 * - MediaPickerDialog  — the dialog alone (e.g. gallery "add photo").
 * - MediaUploader      — drag & drop multi-upload with required alt per file.
 */
export { MediaPicker, MediaPickerDialog, type MediaPickerProps } from "./media-picker";
export { MediaUploader } from "./media-uploader";
export { uploadMediaFile, type UploadResult } from "./upload-client";
export type { MediaLibraryItem } from "@/features/media/library-actions";
