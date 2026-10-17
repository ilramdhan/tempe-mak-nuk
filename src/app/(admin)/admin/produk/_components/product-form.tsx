"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { RichTextEditor } from "@/components/admin/editor";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, updateProduct } from "@/features/products/actions";

import { useUnsavedGuard } from "../../halaman/_components/use-unsaved-guard";
import {
  autoSlug,
  isDirty,
  mapServerErrors,
  move,
  toProductInput,
  validateDraft,
  type FieldErrors,
  type ProductDraft,
} from "../_lib/form-state";
import type { MediaOption, ShapeRow, SizeRow } from "../_lib/load";
import { SortableList } from "./sortable-list";

const NONE = "__none__";

export function ProductForm({
  productId,
  initial,
  shapes,
  sizes,
  media,
}: {
  productId: string | null;
  initial: ProductDraft;
  shapes: ShapeRow[];
  sizes: SizeRow[];
  media: MediaOption[];
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [slugTouched, setSlugTouched] = useState(productId !== null);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, startSaving] = useTransition();

  const dirty = isDirty(draft, saved);
  useUnsavedGuard(dirty);

  const live = showErrors ? validateDraft(draft) : {};
  const err = (k: string) => errors[k] ?? live[k];
  const inv = (k: string) => (err(k) ? true : undefined);
  const set = <K extends keyof ProductDraft>(k: K, v: ProductDraft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    setShowErrors(true);
    setErrors({});
    const local = validateDraft(draft);
    if (Object.keys(local).length) {
      toast.error("Periksa kembali isian yang ditandai.");
      return;
    }
    startSaving(async () => {
      try {
        const input = toProductInput(draft);
        const res = productId
          ? await updateProduct(productId, input)
          : await createProduct(input);
        if (!res.ok) {
          setErrors(mapServerErrors(res.fieldErrors));
          toast.error(res.error);
          return;
        }
        toast.success("Produk disimpan.");
        setSaved(draft);
        setErrors({});
        if (!productId) router.replace(`/admin/produk/${res.data.id}`);
        else router.refresh();
      } catch {
        toast.error("Gagal terhubung ke server. Coba lagi.");
      }
    });
  }

  const shapeItems = draft.shapeIds.map((id) => ({
    id,
    row: shapes.find((s) => s.id === id),
  }));
  const sizeItems = draft.sizes.map((s) => ({
    id: s.sizeId,
    price: s.price,
    row: sizes.find((x) => x.id === s.sizeId),
  }));
  const mediaItems = draft.mediaIds.map((id) => ({
    id,
    row: media.find((m) => m.id === id),
  }));
  const addableShapes = shapes.filter((s) => !draft.shapeIds.includes(s.id));
  const addableSizes = sizes.filter(
    (s) => !draft.sizes.some((x) => x.sizeId === s.id),
  );
  const addableMedia = media.filter((m) => !draft.mediaIds.includes(m.id));
  const errCount = Object.keys(live).length + Object.keys(errors).length;

  return (
    <form onSubmit={save} noValidate className="flex flex-col gap-6">
      {err("_form") ? <FieldError>{err("_form")}</FieldError> : null}
      <Tabs defaultValue="umum">
        <TabsList>
          <TabsTrigger value="umum">Umum</TabsTrigger>
          <TabsTrigger value="varian">Bentuk & ukuran</TabsTrigger>
          <TabsTrigger value="galeri">Galeri</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="umum" className="pt-5">
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={inv("name")}>
                <FieldLabel htmlFor="p-name">Nama produk *</FieldLabel>
                <Input
                  id="p-name"
                  value={draft.name}
                  maxLength={120}
                  aria-invalid={inv("name")}
                  onChange={(e) => {
                    set("name", e.target.value);
                    if (!slugTouched) set("slug", autoSlug(e.target.value));
                  }}
                />
                {err("name") ? <FieldError>{err("name")}</FieldError> : null}
              </Field>
              <Field data-invalid={inv("slug")}>
                <FieldLabel htmlFor="p-slug">Slug *</FieldLabel>
                <Input
                  id="p-slug"
                  value={draft.slug}
                  aria-invalid={inv("slug")}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug", e.target.value.toLowerCase());
                  }}
                />
                <FieldDescription>
                  Alamat: /produk/{draft.slug || "slug"}. Mengubah slug memutus
                  tautan lama.
                </FieldDescription>
                {err("slug") ? <FieldError>{err("slug")}</FieldError> : null}
              </Field>
              <Field data-invalid={inv("variant")}>
                <FieldLabel htmlFor="p-variant">Varian</FieldLabel>
                <Select
                  value={draft.variant}
                  onValueChange={(v) =>
                    set("variant", v as ProductDraft["variant"])
                  }
                >
                  <SelectTrigger id="p-variant" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Klasik</SelectItem>
                    <SelectItem value="skinless">Tanpa kulit ari</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field data-invalid={inv("priceFrom")}>
                <FieldLabel htmlFor="p-price">Harga mulai dari (Rp)</FieldLabel>
                <Input
                  id="p-price"
                  inputMode="numeric"
                  value={draft.priceFrom}
                  aria-invalid={inv("priceFrom")}
                  onChange={(e) => set("priceFrom", e.target.value)}
                />
                <FieldDescription>
                  Kosongkan untuk menyembunyikan harga (tanya via WhatsApp).
                </FieldDescription>
                {err("priceFrom") ? (
                  <FieldError>{err("priceFrom")}</FieldError>
                ) : null}
              </Field>
              <Field data-invalid={inv("sort")}>
                <FieldLabel htmlFor="p-sort">Urutan</FieldLabel>
                <Input
                  id="p-sort"
                  inputMode="numeric"
                  value={draft.sort}
                  aria-invalid={inv("sort")}
                  onChange={(e) => set("sort", e.target.value)}
                />
                <FieldDescription>
                  Angka kecil tampil lebih dulu.
                </FieldDescription>
                {err("sort") ? <FieldError>{err("sort")}</FieldError> : null}
              </Field>
              <Field orientation="horizontal" className="self-end">
                <Switch
                  id="p-active"
                  checked={draft.isActive}
                  onCheckedChange={(v) => set("isActive", v)}
                />
                <div className="flex flex-col gap-0.5">
                  <FieldLabel htmlFor="p-active">
                    Aktif (tampil di situs)
                  </FieldLabel>
                  <FieldDescription>
                    Nonaktif = disembunyikan, data tetap tersimpan.
                  </FieldDescription>
                </div>
              </Field>
            </div>
            <Field data-invalid={inv("short")}>
              <FieldLabel htmlFor="p-short">Ringkasan</FieldLabel>
              <Textarea
                id="p-short"
                rows={2}
                maxLength={300}
                value={draft.short}
                aria-invalid={inv("short")}
                onChange={(e) => set("short", e.target.value)}
              />
              {err("short") ? <FieldError>{err("short")}</FieldError> : null}
            </Field>
            <Field data-invalid={inv("description")}>
              <FieldLabel htmlFor="p-desc">Deskripsi</FieldLabel>
              <RichTextEditor
                id="p-desc"
                value={draft.description}
                onChange={(v) => set("description", v)}
                media={media}
                invalid={!!err("description")}
              />
              {err("description") ? (
                <FieldError>{err("description")}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
        </TabsContent>

        <TabsContent value="varian" className="flex flex-col gap-8 pt-5">
          <section className="flex flex-col gap-3" aria-labelledby="h-shapes">
            <h2 id="h-shapes" className="text-base font-medium">
              Bentuk
            </h2>
            <SortableList
              items={shapeItems}
              label="Urutan bentuk"
              nameOf={(i) => i.row?.name ?? "Bentuk tidak ditemukan"}
              onMove={(a, b) => set("shapeIds", move(draft.shapeIds, a, b))}
              empty="Belum ada bentuk ditautkan."
              renderItem={(i) => (
                <span className="text-sm font-medium">
                  {i.row?.name ?? "Bentuk tidak ditemukan"}
                </span>
              )}
              actions={(i) => (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Lepas bentuk ${i.row?.name ?? ""}`}
                  onClick={() =>
                    set(
                      "shapeIds",
                      draft.shapeIds.filter((x) => x !== i.id),
                    )
                  }
                >
                  <Trash2 />
                </Button>
              )}
            />
            <AddSelect
              label="Tambah bentuk"
              options={addableShapes.map((s) => ({ id: s.id, label: s.name }))}
              onPick={(id) => set("shapeIds", [...draft.shapeIds, id])}
            />
          </section>
          <section className="flex flex-col gap-3" aria-labelledby="h-sizes">
            <h2 id="h-sizes" className="text-base font-medium">
              Ukuran
            </h2>
            <SortableList
              items={sizeItems}
              label="Urutan ukuran"
              nameOf={(i) => i.row?.name ?? "Ukuran tidak ditemukan"}
              onMove={(a, b) => set("sizes", move(draft.sizes, a, b))}
              empty="Belum ada ukuran ditautkan."
              renderItem={(i) => (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-24 text-sm font-medium">
                    {i.row?.name ?? "Ukuran tidak ditemukan"}
                    {i.row?.price != null ? (
                      <span className="block text-xs font-normal text-muted-foreground">
                        Default Rp {i.row.price.toLocaleString("id-ID")}
                      </span>
                    ) : null}
                  </span>
                  <Input
                    className="h-8 w-40"
                    inputMode="numeric"
                    placeholder="Harga khusus (Rp)"
                    aria-label={`Harga khusus ${i.row?.name ?? "ukuran"}`}
                    aria-invalid={inv(
                      `sizes.${draft.sizes.findIndex((s) => s.sizeId === i.id)}.price`,
                    )}
                    value={i.price}
                    onChange={(e) =>
                      set(
                        "sizes",
                        draft.sizes.map((s) =>
                          s.sizeId === i.id
                            ? { ...s, price: e.target.value }
                            : s,
                        ),
                      )
                    }
                  />
                </div>
              )}
              actions={(i) => (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Lepas ukuran ${i.row?.name ?? ""}`}
                  onClick={() =>
                    set(
                      "sizes",
                      draft.sizes.filter((x) => x.sizeId !== i.id),
                    )
                  }
                >
                  <Trash2 />
                </Button>
              )}
            />
            <AddSelect
              label="Tambah ukuran"
              options={addableSizes.map((s) => ({ id: s.id, label: s.name }))}
              onPick={(id) =>
                set("sizes", [...draft.sizes, { sizeId: id, price: "" }])
              }
            />
            <p className="text-xs text-muted-foreground">
              Bentuk dan ukuran baru dibuat di halaman “Bentuk & ukuran” (daftar
              produk).
            </p>
          </section>
        </TabsContent>

        <TabsContent value="galeri" className="flex flex-col gap-3 pt-5">
          <p className="text-sm text-muted-foreground">
            Foto pertama menjadi foto utama. Pustaka media lengkap (unggah)
            hadir di menu Media.
          </p>
          <SortableList
            items={mediaItems}
            label="Urutan galeri"
            nameOf={(i) => i.row?.alt || "Foto"}
            onMove={(a, b) => set("mediaIds", move(draft.mediaIds, a, b))}
            empty="Galeri kosong."
            renderItem={(i) => (
              <div className="flex items-center gap-3">
                {i.row ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={i.row.url}
                    alt=""
                    className="size-12 rounded-md object-cover"
                  />
                ) : null}
                <span className="truncate text-sm">
                  {i.row?.alt ||
                    (i.row ? "Tanpa alt" : "Media tidak ditemukan")}
                </span>
              </div>
            )}
            actions={(i) => (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Keluarkan ${i.row?.alt ?? "foto"} dari galeri`}
                onClick={() =>
                  set(
                    "mediaIds",
                    draft.mediaIds.filter((x) => x !== i.id),
                  )
                }
              >
                <Trash2 />
              </Button>
            )}
          />
          <AddSelect
            label="Tambah foto"
            options={addableMedia.map((m) => ({
              id: m.id,
              label: m.alt || m.id.slice(0, 8),
            }))}
            onPick={(id) => set("mediaIds", [...draft.mediaIds, id])}
          />
        </TabsContent>

        <TabsContent value="seo" className="pt-5">
          <FieldGroup>
            <Field data-invalid={inv("seo.title")}>
              <FieldLabel htmlFor="s-title">Judul SEO</FieldLabel>
              <Input
                id="s-title"
                value={draft.seoTitle}
                aria-invalid={inv("seo.title")}
                onChange={(e) => set("seoTitle", e.target.value)}
              />
              <FieldDescription>
                Kosong = nama produk. {draft.seoTitle.length}/70
              </FieldDescription>
              {err("seo.title") ? (
                <FieldError>{err("seo.title")}</FieldError>
              ) : null}
            </Field>
            <Field data-invalid={inv("seo.description")}>
              <FieldLabel htmlFor="s-desc">Deskripsi SEO</FieldLabel>
              <Textarea
                id="s-desc"
                rows={3}
                value={draft.seoDescription}
                aria-invalid={inv("seo.description")}
                onChange={(e) => set("seoDescription", e.target.value)}
              />
              <FieldDescription>
                Ideal 120–160 karakter. {draft.seoDescription.length}/170
              </FieldDescription>
              {err("seo.description") ? (
                <FieldError>{err("seo.description")}</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="s-og">Gambar berbagi (OG)</FieldLabel>
              <Select
                value={draft.seoOgImageId ?? NONE}
                onValueChange={(v) =>
                  set("seoOgImageId", v === NONE ? null : v)
                }
              >
                <SelectTrigger id="s-og" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Default situs</SelectItem>
                  {draft.seoOgImageId &&
                  !media.some((m) => m.id === draft.seoOgImageId) ? (
                    <SelectItem value={draft.seoOgImageId}>
                      ID {draft.seoOgImageId.slice(0, 8)}… (tidak ditemukan)
                    </SelectItem>
                  ) : null}
                  {media.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.alt || m.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field orientation="horizontal">
              <Switch
                id="s-noindex"
                checked={draft.noindex}
                onCheckedChange={(v) => set("noindex", v)}
              />
              <FieldLabel htmlFor="s-noindex">
                Sembunyikan dari mesin pencari (noindex)
              </FieldLabel>
            </Field>
          </FieldGroup>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 z-10 -mx-1 flex items-center gap-3 border-t border-border bg-background/95 px-1 py-3 backdrop-blur">
        <Button
          type="submit"
          disabled={saving || (!dirty && productId !== null)}
        >
          {saving ? <LoaderCircle className="animate-spin" /> : null}{" "}
          {productId ? "Simpan perubahan" : "Buat produk"}
        </Button>
        {dirty ? (
          <Button
            type="button"
            variant="ghost"
            disabled={saving}
            onClick={() => {
              setDraft(saved);
              setErrors({});
              setShowErrors(false);
            }}
          >
            Batalkan perubahan
          </Button>
        ) : null}
        <span role="status" className="text-sm text-muted-foreground">
          {errCount
            ? `${errCount} isian perlu diperbaiki`
            : dirty
              ? "Ada perubahan belum disimpan"
              : productId
                ? "Tersimpan"
                : ""}
        </span>
      </div>
    </form>
  );
}

function AddSelect({
  label,
  options,
  onPick,
}: {
  label: string;
  options: { id: string; label: string }[];
  onPick: (id: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <Select value="" onValueChange={onPick}>
      <SelectTrigger className="w-full sm:w-72" aria-label={label}>
        <SelectValue placeholder={`${label}…`} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
