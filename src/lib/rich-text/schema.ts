import { z } from "zod";

/** Tiptap / ProseMirror JSON (subset we render; unknown node types are tolerated and skipped). */
export type TiptapMark = { type: string; attrs?: Record<string, unknown> };
export type TiptapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
};
export type TiptapDoc = { type: "doc"; content?: TiptapNode[] };

export const tiptapMarkSchema = z.object({
  type: z.string().min(1).max(40),
  attrs: z.record(z.string(), z.unknown()).optional(),
});

export const tiptapNodeSchema: z.ZodType<TiptapNode> = z.object({
  type: z.string().min(1).max(40),
  attrs: z.record(z.string(), z.unknown()).optional(),
  text: z.string().max(20_000).optional(),
  marks: z.array(tiptapMarkSchema).max(10).optional(),
  get content() {
    return z.array(tiptapNodeSchema).max(2_000).optional();
  },
});

/** Validates the document envelope + node shapes (structure only; rendering sanitizes values). */
export const richTextDocSchema = z.object({
  type: z.literal("doc"),
  content: z.array(tiptapNodeSchema).max(2_000).optional(),
});

export const emptyDoc = (): TiptapDoc => ({ type: "doc", content: [] });
