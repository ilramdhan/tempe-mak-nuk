import { blockSchema, type Block } from "./schema";

/** Raw input: page_sections rows (or anything shaped { type, data, id? }). */
export type BlockLike = { id?: string; type: string; data: unknown };
export type ValidBlock = Block & { key: string };

/** Validate blocks, dropping invalid/unknown ones (logged outside production). Never throws. */
export function validateBlocks(
  blocks: readonly BlockLike[] | null | undefined,
): ValidBlock[] {
  const out: ValidBlock[] = [];
  (blocks ?? []).forEach((b, i) => {
    const res = blockSchema.safeParse({ type: b?.type, data: b?.data });
    if (res.success) out.push({ ...res.data, key: b.id ?? `${b.type}-${i}` });
    else if (process.env.NODE_ENV !== "production")
      console.warn(
        `[blocks] skipped invalid block #${i} (${String(b?.type)}${b?.id ? ` ${b.id}` : ""}):`,
        res.error.issues
          .map((x) => `${x.path.join(".")}: ${x.message}`)
          .join("; "),
      );
  });
  return out;
}
