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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  createProductShape,
  createProductSize,
  deleteProductShape,
  deleteProductSize,
  reorderProductShapes,
  reorderProductSizes,
  updateProductShape,
  updateProductSize,
} from "@/features/products/actions";

import type { ActionResult } from "@/features/_shared/action";
import { autoSlug, mapServerErrors, move } from "../_lib/form-state";
import type { ShapeRow, SizeRow } from "../_lib/load";
import { useAdminMutation } from "../../slot/_components/use-action";
import { SortableList } from "./sortable-list";

export function OptionsManager({
  shapes,
  sizes,
}: {
  shapes: ShapeRow[];
  sizes: SizeRow[];
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <ShapesPanel shapes={shapes} />
      <SizesPanel sizes={sizes} />
    </div>
  );
}

function ShapesPanel({ shapes }: { shapes: ShapeRow[] }) {
  const { pending, run } = useAdminMutation();
  const [list, setList] = useState(shapes);
  const [prev, setPrev] = useState(shapes);
  if (prev !== shapes) {
    setPrev(shapes);
    setList(shapes);
  }
  const [editing, setEditing] = useState<ShapeRow | "new" | null>(null);

  function reorder(from: number, to: number) {
    const next = move(list, from, to);
    setList(next);
    run(() => reorderProductShapes(next.map((s) => s.id)), {
      success: "Urutan bentuk disimpan.",
      onDone: (r) => {
        if (!r.ok) setList(shapes);
      },
    });
  }

  return (
    <section aria-labelledby="h-shape" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="h-shape" className="text-lg font-medium">
          Bentuk
        </h2>
        <Button type="button" size="sm" onClick={() => setEditing("new")}>
          <Plus /> Bentuk baru
        </Button>
      </div>
      <SortableList
        items={list}
        label="Urutan bentuk"
        nameOf={(s) => s.name}
        onMove={reorder}
        empty="Belum ada bentuk."
        renderItem={(s) => (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{s.name}</span>
            <span className="text-xs text-muted-foreground">{s.slug}</span>
            {!s.active ? <Badge variant="outline">Nonaktif</Badge> : null}
          </div>
        )}
        actions={(s) => (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Edit bentuk ${s.name}`}
              disabled={pending}
              onClick={() => setEditing(s)}
            >
              <Pencil />
            </Button>
            <RoleGate permission="product_shapes.delete">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Hapus bentuk ${s.name}`}
                disabled={pending}
                onClick={() => {
                  if (
                    window.confirm(
                      `Hapus bentuk "${s.name}"? Tautan ke produk ikut terhapus.`,
                    )
                  )
                    run(() => deleteProductShape(s.id), {
                      success: "Bentuk dihapus.",
                    });
                }}
              >
                <Trash2 />
              </Button>
            </RoleGate>
          </>
        )}
      />
      {editing ? (
        <ShapeDialog
          key={editing === "new" ? "new" : editing.id}
          shape={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  );
}

function ShapeDialog({
  shape,
  onClose,
}: {
  shape: ShapeRow | null;
  onClose: () => void;
}) {
  const { pending, run } = useAdminMutation();
  const [name, setName] = useState(shape?.name ?? "");
  const [slug, setSlug] = useState(shape?.slug ?? "");
  const [touched, setTouched] = useState(shape !== null);
  const [description, setDescription] = useState(shape?.description ?? "");
  const [active, setActive] = useState(shape?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      name,
      slug,
      description,
      sort: shape?.sort ?? 9999,
      active,
    };
    run(
      async () =>
        (shape
          ? await updateProductShape(shape.id, input)
          : await createProductShape(input)) as ActionResult,
      {
        success: "Bentuk disimpan.",
        onDone: (r) => {
          if (r.ok) onClose();
          else
            setErrors(
              mapServerErrors(
                (r as { fieldErrors?: Record<string, string[]> }).fieldErrors,
              ),
            );
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>{shape ? "Edit bentuk" : "Bentuk baru"}</DialogTitle>
            <DialogDescription>Mis. Daun, Plastik, Slice.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-5">
            <Field data-invalid={errors.name ? true : undefined}>
              <FieldLabel htmlFor="sh-name">Nama *</FieldLabel>
              <Input
                id="sh-name"
                value={name}
                maxLength={80}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!touched) setSlug(autoSlug(e.target.value));
                }}
              />
              {errors.name ? <FieldError>{errors.name}</FieldError> : null}
            </Field>
            <Field data-invalid={errors.slug ? true : undefined}>
              <FieldLabel htmlFor="sh-slug">Slug *</FieldLabel>
              <Input
                id="sh-slug"
                value={slug}
                onChange={(e) => {
                  setTouched(true);
                  setSlug(e.target.value.toLowerCase());
                }}
              />
              {errors.slug ? <FieldError>{errors.slug}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="sh-desc">Deskripsi</FieldLabel>
              <Textarea
                id="sh-desc"
                rows={2}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <Field orientation="horizontal">
              <Switch
                id="sh-active"
                checked={active}
                onCheckedChange={setActive}
              />
              <FieldLabel htmlFor="sh-active">Aktif</FieldLabel>
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

function SizesPanel({ sizes }: { sizes: SizeRow[] }) {
  const { pending, run } = useAdminMutation();
  const [list, setList] = useState(sizes);
  const [prev, setPrev] = useState(sizes);
  if (prev !== sizes) {
    setPrev(sizes);
    setList(sizes);
  }
  const [editing, setEditing] = useState<SizeRow | "new" | null>(null);

  function reorder(from: number, to: number) {
    const next = move(list, from, to);
    setList(next);
    run(() => reorderProductSizes(next.map((s) => s.id)), {
      success: "Urutan ukuran disimpan.",
      onDone: (r) => {
        if (!r.ok) setList(sizes);
      },
    });
  }

  return (
    <section aria-labelledby="h-size" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="h-size" className="text-lg font-medium">
          Ukuran
        </h2>
        <Button type="button" size="sm" onClick={() => setEditing("new")}>
          <Plus /> Ukuran baru
        </Button>
      </div>
      <SortableList
        items={list}
        label="Urutan ukuran"
        nameOf={(s) => s.name}
        onMove={reorder}
        empty="Belum ada ukuran."
        renderItem={(s) => (
          <div className="text-sm">
            <span className="font-medium">{s.name}</span>{" "}
            {!s.active ? <Badge variant="outline">Nonaktif</Badge> : null}
            <div className="text-xs text-muted-foreground">
              {[
                s.weightGrams ? `${s.weightGrams} g` : null,
                s.dims,
                s.price != null
                  ? `Rp ${s.price.toLocaleString("id-ID")}`
                  : "Harga: tanya",
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
        )}
        actions={(s) => (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Edit ukuran ${s.name}`}
              disabled={pending}
              onClick={() => setEditing(s)}
            >
              <Pencil />
            </Button>
            <RoleGate permission="product_sizes.delete">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Hapus ukuran ${s.name}`}
                disabled={pending}
                onClick={() => {
                  if (
                    window.confirm(
                      `Hapus ukuran "${s.name}"? Tautan ke produk ikut terhapus.`,
                    )
                  )
                    run(() => deleteProductSize(s.id), {
                      success: "Ukuran dihapus.",
                    });
                }}
              >
                <Trash2 />
              </Button>
            </RoleGate>
          </>
        )}
      />
      {editing ? (
        <SizeDialog
          key={editing === "new" ? "new" : editing.id}
          size={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  );
}

function SizeDialog({
  size,
  onClose,
}: {
  size: SizeRow | null;
  onClose: () => void;
}) {
  const { pending, run } = useAdminMutation();
  const [name, setName] = useState(size?.name ?? "");
  const [weight, setWeight] = useState(size?.weightGrams?.toString() ?? "");
  const [dims, setDims] = useState(size?.dims ?? "");
  const [price, setPrice] = useState(size?.price?.toString() ?? "");
  const [active, setActive] = useState(size?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const num = (s: string) =>
    s.trim() === "" ? null : Number(s.replace(/[.\s]/g, ""));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      name,
      weightGrams: num(weight),
      dims,
      price: num(price),
      sort: size?.sort ?? 9999,
      active,
    };
    run(
      async () =>
        (size
          ? await updateProductSize(size.id, input)
          : await createProductSize(input)) as ActionResult,
      {
        success: "Ukuran disimpan.",
        onDone: (r) => {
          if (r.ok) onClose();
          else
            setErrors(
              mapServerErrors(
                (r as { fieldErrors?: Record<string, string[]> }).fieldErrors,
              ),
            );
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>{size ? "Edit ukuran" : "Ukuran baru"}</DialogTitle>
            <DialogDescription>
              Harga di sini jadi default; tiap produk bisa menimpanya.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-5">
            <Field data-invalid={errors.name ? true : undefined}>
              <FieldLabel htmlFor="sz-name">Nama *</FieldLabel>
              <Input
                id="sz-name"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name ? <FieldError>{errors.name}</FieldError> : null}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field data-invalid={errors.weightGrams ? true : undefined}>
                <FieldLabel htmlFor="sz-weight">Berat (g)</FieldLabel>
                <Input
                  id="sz-weight"
                  inputMode="numeric"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                {errors.weightGrams ? (
                  <FieldError>{errors.weightGrams}</FieldError>
                ) : null}
              </Field>
              <Field data-invalid={errors.price ? true : undefined}>
                <FieldLabel htmlFor="sz-price">Harga (Rp)</FieldLabel>
                <Input
                  id="sz-price"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                {errors.price ? <FieldError>{errors.price}</FieldError> : null}
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="sz-dims">Dimensi</FieldLabel>
              <Input
                id="sz-dims"
                value={dims}
                maxLength={80}
                onChange={(e) => setDims(e.target.value)}
              />
              <FieldDescription>
                Mis. 20 x 8 x 3 cm. Kosongkan harga bila ditanyakan via
                WhatsApp.
              </FieldDescription>
            </Field>
            <Field orientation="horizontal">
              <Switch
                id="sz-active"
                checked={active}
                onCheckedChange={setActive}
              />
              <FieldLabel htmlFor="sz-active">Aktif</FieldLabel>
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
