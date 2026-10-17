import { move } from "../../produk/_lib/form-state";

export type FaqRow = {
  id: string;
  question: string;
  answer: string;
  categoryId: string | null;
  sort: number;
  visible: boolean;
  showOnHome: boolean;
};
export type CategoryRow = { id: string; name: string };
export type FaqGroup = {
  key: string;
  categoryId: string | null;
  name: string;
  items: FaqRow[];
};

/** Group FAQs by category (known categories first, then "Tanpa kategori"), keeping list order inside each group. */
export function groupFaqs(
  faqs: readonly FaqRow[],
  categories: readonly CategoryRow[],
): FaqGroup[] {
  const known = new Set(categories.map((c) => c.id));
  const groups: FaqGroup[] = categories.map((c) => ({
    key: c.id,
    categoryId: c.id,
    name: c.name,
    items: faqs.filter((f) => f.categoryId === c.id),
  }));
  const rest = faqs.filter((f) => !f.categoryId || !known.has(f.categoryId));
  if (rest.length || groups.length === 0)
    groups.push({
      key: "none",
      categoryId: null,
      name: "Tanpa kategori",
      items: rest,
    });
  return groups.filter((g) => g.items.length > 0 || g.categoryId === null);
}

/** Move one item inside its category group, preserving the slots other groups occupy in the flat list. */
export function reorderWithin(
  faqs: readonly FaqRow[],
  groupIds: readonly string[],
  from: number,
  to: number,
): FaqRow[] {
  const moved = move(groupIds, from, to);
  const byId = new Map(faqs.map((f) => [f.id, f]));
  let i = 0;
  const inGroup = new Set(groupIds);
  return faqs.map((f) =>
    inGroup.has(f.id) ? (byId.get(moved[i++]) as FaqRow) : f,
  );
}
