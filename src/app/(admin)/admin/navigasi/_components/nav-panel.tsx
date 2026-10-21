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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ActionResult } from "@/features/_shared/action";
import { hrefSchema } from "@/features/_shared/schema";
import {
  createNavItem,
  deleteNavItem,
  reorderNavItems,
  updateNavItem,
} from "@/features/navigation/actions";

import { SortableList } from "../../produk/_components/sortable-list";
import { mapServerErrors, move } from "../../produk/_lib/form-state";
import { useAdminMutation } from "../../slot/_components/use-action";

export const LOCATIONS = [
  ["header", "Header"],
  ["footer_col1", "Footer kolom 1"],
  ["footer_col2", "Footer kolom 2"],
  ["footer_col3", "Footer kolom 3"],
  ["footer_col4", "Footer kolom 4"],
  ["legal", "Legal (bawah footer)"],
  ["social", "Sosial media"],
] as const;
type Location = (typeof LOCATIONS)[number][0];

export type NavRow = {
  id: string;
  location: Location;
  label: string;
  href: string;
  parentId: string | null;
  sort: number;
  visible: boolean;
};

export function NavPanel({ items }: { items: NavRow[] }) {
  const [location, setLocation] = useState<Location>("header");
  return (
    <section aria-labelledby="h-nav" className="flex flex-col gap-4">
      <h2 id="h-nav" className="sr-only">
        Menu navigasi
      </h2>
      <Field className="max-w-xs">
        <FieldLabel htmlFor="nav-loc">Lokasi menu</FieldLabel>
        <Select
          value={location}
          onValueChange={(v) => setLocation(v as Location)}
        >
          <SelectTrigger id="nav-loc" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCATIONS.map(([k, label]) => (
              <SelectItem key={k} value={k}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <LocationList
        key={location}
        location={location}
        items={items.filter((n) => n.location === location)}
      />
    </section>
  );
}

function LocationList({
  location,
  items,
}: {
  location: Location;
  items: NavRow[];
}) {
  const { pending, run } = useAdminMutation();
  const [list, setList] = useState(items);
  const [prev, setPrev] = useState(items);
  if (prev !== items) {
    setPrev(items);
    setList(items);
  }
  const [editing, setEditing] = useState<NavRow | "new" | null>(null);
  const labelOf = (id: string | null) => list.find((n) => n.id === id)?.label;

  function reorder(from: number, to: number) {
    const next = move(list, from, to);
    setList(next);
    run(
      () =>
        reorderNavItems(
          location,
          next.map((n) => n.id),
        ),
      {
        success: "Urutan menu disimpan.",
        onDone: (r) => {
          if (!r.ok) setList(items);
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setEditing("new")}>
          <Plus /> Item menu
        </Button>
      </div>
      <SortableList
        items={list}
        label="Urutan menu"
        nameOf={(n) => n.label}
        onMove={reorder}
        empty="Belum ada item di lokasi ini."
        renderItem={(n) => (
          <div className="text-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-medium">{n.label}</span>
              {n.parentId ? (
                <Badge variant="outline">
                  Sub-menu dari {labelOf(n.parentId) ?? "?"}
                </Badge>
              ) : null}
              {!n.visible ? (
                <Badge variant="outline">Disembunyikan</Badge>
              ) : null}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {n.href}
            </div>
          </div>
        )}
        actions={(n) => (
          <>
            <Switch
              aria-label={`Tampilkan menu ${n.label}`}
              checked={n.visible}
              disabled={pending}
              onCheckedChange={(v) =>
                run(
                  () =>
                    updateNavItem(n.id, {
                      location: n.location,
                      label: n.label,
                      href: n.href,
                      parentId: n.parentId,
                      sort: n.sort,
                      visible: v,
                    }) as Promise<ActionResult>,
                  { success: v ? "Menu ditampilkan." : "Menu disembunyikan." },
                )
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Edit menu ${n.label}`}
              disabled={pending}
              onClick={() => setEditing(n)}
            >
              <Pencil />
            </Button>
            <RoleGate permission="nav_items.delete">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Hapus menu ${n.label}`}
                disabled={pending}
                onClick={() => {
                  if (
                    window.confirm(
                      `Hapus menu "${n.label}"? Sub-menunya ikut terhapus.`,
                    )
                  )
                    run(() => deleteNavItem(n.id), {
                      success: "Menu dihapus.",
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
        <NavDialog
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? null : editing}
          location={location}
          parents={list.filter(
            (n) => !n.parentId && (editing === "new" || n.id !== editing.id),
          )}
          nextSort={list.length}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

const NO_PARENT = "__none";

function NavDialog({
  item,
  location,
  parents,
  nextSort,
  onClose,
}: {
  item: NavRow | null;
  location: Location;
  parents: NavRow[];
  nextSort: number;
  onClose: () => void;
}) {
  const { pending, run } = useAdminMutation();
  const [label, setLabel] = useState(item?.label ?? "");
  const [href, setHref] = useState(item?.href ?? "");
  const [parentId, setParentId] = useState(item?.parentId ?? NO_PARENT);
  const [visible, setVisible] = useState(item?.visible ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const link = hrefSchema.safeParse(href);
    if (!link.success) {
      setErrors({
        href: link.error.issues[0]?.message ?? "Tautan tidak valid",
      });
      return;
    }
    const input = {
      location,
      label,
      href,
      parentId: parentId === NO_PARENT ? null : parentId,
      sort: item?.sort ?? nextSort,
      visible,
    };
    run(
      async () =>
        (item
          ? await updateNavItem(item.id, input)
          : await createNavItem(input)) as ActionResult,
      {
        success: "Menu disimpan.",
        onDone: (r) => {
          if (r.ok) onClose();
          else setErrors(mapServerErrors(r.fieldErrors));
        },
      },
    );
  }

  const bad = (k: string) => (errors[k] ? true : undefined);

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>
              {item ? "Edit item menu" : "Item menu baru"}
            </DialogTitle>
            <DialogDescription>
              Lokasi: {LOCATIONS.find(([k]) => k === location)?.[1]}.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-5">
            <Field data-invalid={bad("label")}>
              <FieldLabel htmlFor="nv-label">Label *</FieldLabel>
              <Input
                id="nv-label"
                value={label}
                maxLength={60}
                aria-invalid={bad("label")}
                onChange={(e) => setLabel(e.target.value)}
              />
              {errors.label ? <FieldError>{errors.label}</FieldError> : null}
            </Field>
            <Field data-invalid={bad("href")}>
              <FieldLabel htmlFor="nv-href">Tautan *</FieldLabel>
              <Input
                id="nv-href"
                value={href}
                aria-invalid={bad("href")}
                onChange={(e) => setHref(e.target.value)}
              />
              <FieldDescription>
                Diawali /, #, https://, mailto: atau tel:
              </FieldDescription>
              {errors.href ? <FieldError>{errors.href}</FieldError> : null}
            </Field>
            {location === "header" ? (
              <Field data-invalid={bad("parentId")}>
                <FieldLabel htmlFor="nv-parent">Induk (sub-menu)</FieldLabel>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger id="nv-parent" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PARENT}>
                      Tidak ada (menu utama)
                    </SelectItem>
                    {parents.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.parentId ? (
                  <FieldError>{errors.parentId}</FieldError>
                ) : null}
              </Field>
            ) : null}
            <Field orientation="horizontal">
              <Switch
                id="nv-visible"
                checked={visible}
                onCheckedChange={setVisible}
              />
              <FieldLabel htmlFor="nv-visible">Tampilkan</FieldLabel>
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
