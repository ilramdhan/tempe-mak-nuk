/**
 * Pure helpers for the page builder (no React): immutable path get/set on plain JSON
 * values and list reordering. Unit-tested in `__tests__/path.test.ts`.
 */

export type PathKey = string | number;
export type Path = readonly PathKey[];

/** Parse "items.0.title" → ["items", 0, "title"]. */
export function parsePath(path: string): PathKey[] {
  if (!path) return [];
  return path.split(".").map((k) => (/^\d+$/.test(k) ? Number(k) : k));
}

export function joinPath(path: Path): string {
  return path.join(".");
}

export function getAt(obj: unknown, path: Path): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<PathKey, unknown>)[key];
  }
  return cur;
}

/**
 * Immutable set. Missing containers are created (array when the next key is a number).
 * `value === undefined` deletes the key from objects (so Zod defaults apply).
 */
export function setAt<T>(obj: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [key, ...rest] = path;
  const base: unknown =
    obj != null && typeof obj === "object"
      ? obj
      : typeof key === "number"
        ? []
        : {};
  const child = (base as Record<PathKey, unknown>)[key];
  const next = rest.length === 0 ? value : setAt(child, rest, value);
  if (Array.isArray(base)) {
    const copy = base.slice();
    copy[key as number] = next;
    return copy as T;
  }
  const copy = { ...(base as Record<string, unknown>) };
  if (next === undefined) delete copy[key as string];
  else copy[key as string] = next;
  return copy as T;
}

/** Move one item (returns the same array when indexes are invalid or equal). */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= list.length ||
    to >= list.length
  )
    return list as T[];
  const copy = list.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item as T);
  return copy;
}

export function removeAt<T>(list: readonly T[], index: number): T[] {
  if (index < 0 || index >= list.length) return list as T[];
  return [...list.slice(0, index), ...list.slice(index + 1)];
}

export function insertAt<T>(list: readonly T[], index: number, item: T): T[] {
  const i = Math.max(0, Math.min(index, list.length));
  return [...list.slice(0, i), item, ...list.slice(i)];
}

/** Compare table: keep every row's `values` aligned with the column count. */
export type CompareRow = { label: string; values: string[] };

export function addCompareColumn(
  columns: readonly string[],
  rows: readonly CompareRow[],
  name = "",
) {
  return {
    columns: [...columns, name],
    rows: rows.map((r) => ({
      ...r,
      values: [...padValues(r.values, columns.length), ""],
    })),
  };
}

export function removeCompareColumn(
  columns: readonly string[],
  rows: readonly CompareRow[],
  index: number,
) {
  return {
    columns: removeAt(columns, index),
    rows: rows.map((r) => ({
      ...r,
      values: removeAt(padValues(r.values, columns.length), index),
    })),
  };
}

export function moveCompareColumn(
  columns: readonly string[],
  rows: readonly CompareRow[],
  from: number,
  to: number,
) {
  return {
    columns: moveItem(columns, from, to),
    rows: rows.map((r) => ({
      ...r,
      values: moveItem(padValues(r.values, columns.length), from, to),
    })),
  };
}

export function padValues(
  values: readonly string[] | null | undefined,
  length: number,
): string[] {
  const v = (values ?? []).slice(0, length);
  while (v.length < length) v.push("");
  return v;
}
