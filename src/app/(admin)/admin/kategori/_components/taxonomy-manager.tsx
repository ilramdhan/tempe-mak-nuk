"use client";

import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { RoleGate } from "@/components/admin/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/features/_shared/action";
import {
  createCategory,
  createTag,
  deleteCategory,
  deleteTag,
  reorderCategories,
  updateCategory,
  updateTag,
} from "@/features/taxonomy/actions";

import { cleanSlugInput, slugify } from "../../jurnal/_shared/lib/slug";
import { SortableList } from "../../produk/_components/sortable-list";
import { mapServerErrors } from "../../produk/_lib/form-state";
import { useAdminMutation } from "../../slot/_components/use-action";

type Kind = "faq" | "post" | "recipe";

export type CategoryItem = {
  id: string;
  kind: Kind;
  slug: string;
  name: string;
  description: string | null;
  sort: number;
  count: number;
};
export type TagItem = {
  id: string;
  slug: string;
  name: string;
  count: number;
};

const KINDS: { kind: Kind; label: string; unit: string }[] = [
  { kind: "faq", label: "FAQ", unit: "FAQ" },
  { kind: "post", label: "Jurnal", unit: "artikel" },
  { kind: "recipe", label: "Resep", unit: "resep" },
];

type Editing =
  | { type: "category"; kind: Kind; item: CategoryItem | null }
  | { type: "tag"; item: TagItem | null }
  | null;

export function TaxonomyManager({
  categories,
  tags,
}: {
  categories: CategoryItem[];
  tags: TagItem[];
}) {
  const [editing, setEditing] = useState<Editing>(null);
  return (
    <>
      <Tabs defaultValue="faq">
        <TabsList>
          {KINDS.map((k) => (
            <TabsTrigger key={k.kind} value={k.kind}>
              {k.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="tag">Tag</TabsTrigger>
        </TabsList>
        {KINDS.map((k) => (
          <TabsContent key={k.kind} value={k.kind} className="mt-4">
            <CategoryList
              kind={k.kind}
              unit={k.unit}
              items={categories.filter((c) => c.kind === k.kind)}
              onEdit={(item) =>
                setEditing({ type: "category", kind: k.kind, item })
              }
            />
          </TabsContent>
        ))}
        <TabsContent value="tag" className="mt-4">
          <TagList
            items={tags}
            onEdit={(item) => setEditing({ type: "tag", item })}
          />
        </TabsContent>
      </Tabs>
      {editing?.type === "category" ? (
        <CategoryDialog
          key={editing.item?.id ?? "new"}
          kind={editing.kind}
          item={editing.item}
          siblings={categories.filter((c) => c.kind === editing.kind)}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {editing?.type === "tag" ? (
        <TagDialog
          key={editing.item?.id ?? "new"}
          item={editing.item}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}

function CategoryList({
  kind,
  unit,
  items,
  onEdit,
}: {
  kind: Kind;
  unit: string;
  items: CategoryItem[];
  onEdit: (item: CategoryItem | null) => void;
}) {
  const { pending, run } = useAdminMutation();
  const [list, setList] = useState(items);
  const [prev, setPrev] = useState(items);
  if (prev !== items) {
    setPrev(items);
    setList(items);
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    setList(next);
    run(
      () =>
        reorderCategories(
          kind,
          next.map((c) => c.id),
        ),
      {
        success: "Urutan kategori disimpan.",
        onDone: (r) => {
          if (!r.ok) setList(items);
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => onEdit(null)}>
          <Plus /> Kategori baru
        </Button>
      </div>
      <SortableList
        items={list}
        label="Urutan kategori"
        nameOf={(c) => c.name}
        onMove={move}
        empty="Belum ada kategori."
        renderItem={(c) => (
          <div className="text-sm">
            <div className="font-medium">{c.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <span>/{c.slug}</span>
              <Badge variant={c.count ? "secondary" : "outline"}>
                {c.count} {unit}
              </Badge>
            </div>
          </div>
        )}
        actions={(c) => (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Edit kategori ${c.name}`}
              disabled={pending}
              onClick={() => onEdit(c)}
            >
              <Pencil />
            </Button>
            <RoleGate permission="categories.delete">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Hapus kategori ${c.name}`}
                disabled={pending}
                onClick={() => {
                  if (c.count > 0) {
                    window.alert(
                      `Kategori "${c.name}" masih dipakai ${c.count} ${unit}. Pindahkan item tersebut ke kategori lain dulu.`,
                    );
                    return;
                  }
                  if (window.confirm(`Hapus kategori "${c.name}"?`))
                    run(() => deleteCategory(c.id), {
                      success: "Kategori dihapus.",
                    });
                }}
              >
                <Trash2 />
              </Button>
            </RoleGate>
          </>
        )}
      />
    </div>
  );
}

function TagList({
  items,
  onEdit,
}: {
  items: TagItem[];
  onEdit: (item: TagItem | null) => void;
}) {
  const { pending, run } = useAdminMutation();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => onEdit(null)}>
          <Plus /> Tag baru
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada tag.</p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {items.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1 text-sm">
                <div className="font-medium">{t.name}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>/{t.slug}</span>
                  <Badge variant={t.count ? "secondary" : "outline"}>
                    {t.count} artikel
                  </Badge>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Edit tag ${t.name}`}
                disabled={pending}
                onClick={() => onEdit(t)}
              >
                <Pencil />
              </Button>
              <RoleGate permission="tags.delete">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Hapus tag ${t.name}`}
                  disabled={pending}
                  onClick={() => {
                    const msg =
                      t.count > 0
                        ? `Tag "${t.name}" dipakai ${t.count} artikel dan akan dilepas dari artikel tersebut. Hapus?`
                        : `Hapus tag "${t.name}"?`;
                    if (window.confirm(msg))
                      run(() => deleteTag(t.id), { success: "Tag dihapus." });
                  }}
                >
                  <Trash2 />
                </Button>
              </RoleGate>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function useSlugFields(initialName: string, initialSlug: string) {
  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [touched, setTouched] = useState(initialSlug !== "");
  return {
    name,
    slug,
    onName(v: string) {
      setName(v);
      if (!touched) setSlug(slugify(v, 120));
    },
    onSlug(v: string) {
      setTouched(true);
      setSlug(cleanSlugInput(v));
    },
  };
}

function CategoryDialog({
  kind,
  item,
  siblings,
  onClose,
}: {
  kind: Kind;
  item: CategoryItem | null;
  siblings: CategoryItem[];
  onClose: () => void;
}) {
  const { pending, run } = useAdminMutation();
  const f = useSlugFields(item?.name ?? "", item?.slug ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (siblings.some((s) => s.slug === f.slug && s.id !== item?.id)) {
      setErrors({ slug: "Slug sudah dipakai kategori lain." });
      return;
    }
    const input = {
      kind,
      slug: f.slug,
      name: f.name,
      description,
      sort: item?.sort ?? 9999,
    };
    run(
      async () =>
        (item
          ? await updateCategory(item.id, input)
          : await createCategory(input)) as ActionResult,
      {
        success: "Kategori disimpan.",
        onDone: (r) => {
          if (r.ok) onClose();
          else setErrors(mapServerErrors(r.fieldErrors));
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>
              {item ? "Edit kategori" : "Kategori baru"}
            </DialogTitle>
            <DialogDescription>
              Mengubah slug akan mengubah alamat halaman kategori di situs.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-5">
            <Field data-invalid={errors.name ? true : undefined}>
              <FieldLabel htmlFor="cat-name">Nama *</FieldLabel>
              <Input
                id="cat-name"
                value={f.name}
                maxLength={80}
                aria-invalid={errors.name ? true : undefined}
                onChange={(e) => f.onName(e.target.value)}
              />
              {errors.name ? <FieldError>{errors.name}</FieldError> : null}
            </Field>
            <Field data-invalid={errors.slug ? true : undefined}>
              <FieldLabel htmlFor="cat-slug">Slug *</FieldLabel>
              <Input
                id="cat-slug"
                value={f.slug}
                aria-invalid={errors.slug ? true : undefined}
                onChange={(e) => f.onSlug(e.target.value)}
              />
              <FieldDescription>
                Otomatis dari nama, bisa diubah. Unik per jenis.
              </FieldDescription>
              {errors.slug ? <FieldError>{errors.slug}</FieldError> : null}
            </Field>
            <Field data-invalid={errors.description ? true : undefined}>
              <FieldLabel htmlFor="cat-desc">Deskripsi</FieldLabel>
              <Textarea
                id="cat-desc"
                rows={3}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {errors.description ? (
                <FieldError>{errors.description}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : null}{" "}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TagDialog({
  item,
  onClose,
}: {
  item: TagItem | null;
  onClose: () => void;
}) {
  const { pending, run } = useAdminMutation();
  const f = useSlugFields(item?.name ?? "", item?.slug ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = { slug: f.slug, name: f.name };
    run(
      async () =>
        (item
          ? await updateTag(item.id, input)
          : await createTag(input)) as ActionResult,
      {
        success: "Tag disimpan.",
        onDone: (r) => {
          if (r.ok) onClose();
          else setErrors(mapServerErrors(r.fieldErrors));
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>{item ? "Edit tag" : "Tag baru"}</DialogTitle>
            <DialogDescription>
              Tag dipakai untuk mengelompokkan artikel jurnal.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-5">
            <Field data-invalid={errors.name ? true : undefined}>
              <FieldLabel htmlFor="tag-name">Nama *</FieldLabel>
              <Input
                id="tag-name"
                value={f.name}
                maxLength={60}
                aria-invalid={errors.name ? true : undefined}
                onChange={(e) => f.onName(e.target.value)}
              />
              {errors.name ? <FieldError>{errors.name}</FieldError> : null}
            </Field>
            <Field data-invalid={errors.slug ? true : undefined}>
              <FieldLabel htmlFor="tag-slug">Slug *</FieldLabel>
              <Input
                id="tag-slug"
                value={f.slug}
                aria-invalid={errors.slug ? true : undefined}
                onChange={(e) => f.onSlug(e.target.value)}
              />
              {errors.slug ? <FieldError>{errors.slug}</FieldError> : null}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <LoaderCircle className="animate-spin" /> : null}{" "}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
