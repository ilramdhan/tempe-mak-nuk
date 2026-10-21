"use client";

import { LoaderCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { MediaPicker } from "@/components/admin/media-picker";
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
import type { ActionResult } from "@/features/_shared/action";
import {
  createTestimonial,
  deleteTestimonial,
  reorderTestimonials,
  setTestimonialFlags,
  updateTestimonial,
} from "@/features/testimonials/actions";

import { SortableList } from "../../produk/_components/sortable-list";
import { mapServerErrors, move } from "../../produk/_lib/form-state";
import { useAdminMutation } from "../../slot/_components/use-action";

export type TestimonialRow = {
  id: string;
  name: string;
  role: string | null;
  city: string | null;
  quote: string;
  rating: number | null;
  mediaId: string | null;
  verified: boolean;
  visible: boolean;
  sort: number;
  isPlaceholder: boolean;
};

export function TestimonialManager({ items }: { items: TestimonialRow[] }) {
  const { pending, run } = useAdminMutation();
  const [list, setList] = useState(items);
  const [prev, setPrev] = useState(items);
  if (prev !== items) {
    setPrev(items);
    setList(items);
  }
  const [editing, setEditing] = useState<TestimonialRow | "new" | null>(null);

  function reorder(from: number, to: number) {
    const next = move(list, from, to);
    setList(next);
    run(() => reorderTestimonials(next.map((t) => t.id)), {
      success: "Urutan testimoni disimpan.",
      onDone: (r) => {
        if (!r.ok) setList(items);
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setEditing("new")}>
          <Plus /> Testimoni baru
        </Button>
      </div>
      <SortableList
        items={list}
        label="Urutan testimoni"
        nameOf={(t) => t.name}
        onMove={reorder}
        empty="Belum ada testimoni."
        renderItem={(t) => (
          <div className="text-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-medium">{t.name}</span>
              {t.isPlaceholder ? (
                <Badge variant="secondary">Contoh (placeholder)</Badge>
              ) : null}
              {t.verified ? (
                <Badge variant="outline">Terverifikasi</Badge>
              ) : null}
              {!t.visible ? (
                <Badge variant="outline">Disembunyikan</Badge>
              ) : null}
            </div>
            <p className="line-clamp-2 text-muted-foreground">{t.quote}</p>
          </div>
        )}
        actions={(t) => (
          <>
            <Switch
              aria-label={`Tampilkan testimoni ${t.name}`}
              checked={t.visible}
              disabled={pending}
              onCheckedChange={(v) =>
                run(() => setTestimonialFlags(t.id, { visible: v }), {
                  success: v
                    ? "Testimoni dipublikasikan."
                    : "Testimoni disembunyikan.",
                })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Edit testimoni ${t.name}`}
              disabled={pending}
              onClick={() => setEditing(t)}
            >
              <Pencil />
            </Button>
            <RoleGate role="owner">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Hapus testimoni ${t.name}`}
                disabled={pending}
                onClick={() => {
                  if (
                    window.confirm(
                      `Hapus testimoni dari "${t.name}"? Tindakan ini tidak bisa dibatalkan.`,
                    )
                  )
                    run(() => deleteTestimonial(t.id), {
                      success: "Testimoni dihapus.",
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
        <TestimonialDialog
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

function TestimonialDialog({
  item,
  onClose,
}: {
  item: TestimonialRow | null;
  onClose: () => void;
}) {
  const { pending, run } = useAdminMutation();
  const [name, setName] = useState(item?.name ?? "");
  const [role, setRole] = useState(item?.role ?? "");
  const [city, setCity] = useState(item?.city ?? "");
  const [quote, setQuote] = useState(item?.quote ?? "");
  const [rating, setRating] = useState(item?.rating?.toString() ?? "");
  const [verified, setVerified] = useState(item?.verified ?? false);
  const [visible, setVisible] = useState(item?.visible ?? true);
  const [isPlaceholder, setIsPlaceholder] = useState(
    item?.isPlaceholder ?? true,
  );
  const [mediaId, setMediaId] = useState<string | null>(item?.mediaId ?? null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      name,
      role,
      city,
      quote,
      rating: rating.trim() === "" ? null : Number(rating),
      mediaId,
      verified,
      visible,
      sort: item?.sort ?? 9999,
      isPlaceholder,
    };
    run(
      async () =>
        (item
          ? await updateTestimonial(item.id, input)
          : await createTestimonial(input)) as ActionResult,
      {
        success: "Testimoni disimpan.",
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
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>
              {item ? "Edit testimoni" : "Testimoni baru"}
            </DialogTitle>
            <DialogDescription>
              Hanya tampilkan testimoni asli dengan izin pemberinya.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-5">
            <Field data-invalid={bad("name")}>
              <FieldLabel htmlFor="t-name">Nama *</FieldLabel>
              <Input
                id="t-name"
                value={name}
                maxLength={80}
                aria-invalid={bad("name")}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name ? <FieldError>{errors.name}</FieldError> : null}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="t-role">Peran</FieldLabel>
                <Input
                  id="t-role"
                  value={role}
                  maxLength={80}
                  placeholder="Ibu MPASI"
                  onChange={(e) => setRole(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="t-city">Kota</FieldLabel>
                <Input
                  id="t-city"
                  value={city}
                  maxLength={80}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Field>
            </div>
            <Field data-invalid={bad("quote")}>
              <FieldLabel htmlFor="t-quote">Testimoni *</FieldLabel>
              <Textarea
                id="t-quote"
                rows={4}
                maxLength={1000}
                value={quote}
                aria-invalid={bad("quote")}
                onChange={(e) => setQuote(e.target.value)}
              />
              {errors.quote ? <FieldError>{errors.quote}</FieldError> : null}
            </Field>
            <Field data-invalid={bad("rating")}>
              <FieldLabel htmlFor="t-rating">Rating (1-5)</FieldLabel>
              <Input
                id="t-rating"
                type="number"
                inputMode="numeric"
                min={1}
                max={5}
                value={rating}
                className="w-28"
                aria-invalid={bad("rating")}
                onChange={(e) => setRating(e.target.value)}
              />
              {errors.rating ? <FieldError>{errors.rating}</FieldError> : null}
            </Field>
            <Field data-invalid={bad("mediaId")}>
              <FieldLabel htmlFor="t-media">Foto (opsional)</FieldLabel>
              <MediaPicker
                id="t-media"
                value={mediaId}
                noneLabel="Tanpa foto"
                invalid={!!errors.mediaId}
                onChange={(id) => setMediaId(id)}
              />
              {errors.mediaId ? <FieldError>{errors.mediaId}</FieldError> : null}
            </Field>
            <Field orientation="horizontal">
              <Switch
                id="t-ph"
                checked={isPlaceholder}
                onCheckedChange={setIsPlaceholder}
              />
              <div>
                <FieldLabel htmlFor="t-ph">Contoh / placeholder</FieldLabel>
                <FieldDescription>
                  Selama aktif, testimoni diberi label &quot;contoh&quot; di
                  situs.
                </FieldDescription>
              </div>
            </Field>
            <Field orientation="horizontal">
              <Switch
                id="t-ver"
                checked={verified}
                onCheckedChange={setVerified}
              />
              <FieldLabel htmlFor="t-ver">Terverifikasi</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Switch
                id="t-vis"
                checked={visible}
                onCheckedChange={setVisible}
              />
              <FieldLabel htmlFor="t-vis">Tampilkan di situs</FieldLabel>
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
