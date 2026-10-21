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
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/features/_shared/action";
import {
  createFaq,
  deleteFaq,
  reorderFaqs,
  setFaqVisibility,
  updateFaq,
} from "@/features/faqs/actions";

import { SortableList } from "../../produk/_components/sortable-list";
import { mapServerErrors } from "../../produk/_lib/form-state";
import { useAdminMutation } from "../../slot/_components/use-action";
import {
  groupFaqs,
  reorderWithin,
  type CategoryRow,
  type FaqRow,
} from "../_lib/group";

export function FaqManager({
  faqs,
  categories,
}: {
  faqs: FaqRow[];
  categories: CategoryRow[];
}) {
  const { pending, run } = useAdminMutation();
  const [list, setList] = useState(faqs);
  const [prev, setPrev] = useState(faqs);
  if (prev !== faqs) {
    setPrev(faqs);
    setList(faqs);
  }
  const [editing, setEditing] = useState<FaqRow | "new" | null>(null);
  const groups = groupFaqs(list, categories);

  function reorder(groupIds: string[], from: number, to: number) {
    const next = reorderWithin(list, groupIds, from, to);
    setList(next);
    const ids = next.filter((f) => groupIds.includes(f.id)).map((f) => f.id);
    run(() => reorderFaqs(ids), {
      success: "Urutan FAQ disimpan.",
      onDone: (r) => {
        if (!r.ok) setList(faqs);
      },
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={() => setEditing("new")}>
          <Plus /> FAQ baru
        </Button>
      </div>
      {groups.map((g) => (
        <section
          key={g.key}
          aria-labelledby={`faq-g-${g.key}`}
          className="flex flex-col gap-3"
        >
          <h2 id={`faq-g-${g.key}`} className="text-lg font-medium">
            {g.name}{" "}
            <span className="text-sm text-muted-foreground">
              ({g.items.length})
            </span>
          </h2>
          <SortableList
            items={g.items}
            label={`Urutan FAQ ${g.name}`}
            nameOf={(f) => f.question}
            onMove={(from, to) =>
              reorder(
                g.items.map((i) => i.id),
                from,
                to,
              )
            }
            empty="Belum ada FAQ."
            renderItem={(f) => (
              <div className="text-sm">
                <div className="font-medium">{f.question}</div>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {!f.visible ? (
                    <Badge variant="outline">Disembunyikan</Badge>
                  ) : null}
                  {f.showOnHome ? (
                    <Badge variant="secondary">Beranda</Badge>
                  ) : null}
                </div>
              </div>
            )}
            actions={(f) => (
              <>
                <Switch
                  aria-label={`Tampilkan FAQ ${f.question}`}
                  checked={f.visible}
                  disabled={pending}
                  onCheckedChange={(v) =>
                    run(() => setFaqVisibility(f.id, v), {
                      success: v ? "FAQ ditampilkan." : "FAQ disembunyikan.",
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Edit FAQ ${f.question}`}
                  disabled={pending}
                  onClick={() => setEditing(f)}
                >
                  <Pencil />
                </Button>
                <RoleGate permission="faqs.delete">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Hapus FAQ ${f.question}`}
                    disabled={pending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Hapus FAQ "${f.question}"? Tindakan ini tidak bisa dibatalkan.`,
                        )
                      )
                        run(() => deleteFaq(f.id), { success: "FAQ dihapus." });
                    }}
                  >
                    <Trash2 />
                  </Button>
                </RoleGate>
              </>
            )}
          />
        </section>
      ))}
      {editing ? (
        <FaqDialog
          key={editing === "new" ? "new" : editing.id}
          faq={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

const NONE = "__none";

function FaqDialog({
  faq,
  categories,
  onClose,
}: {
  faq: FaqRow | null;
  categories: CategoryRow[];
  onClose: () => void;
}) {
  const { pending, run } = useAdminMutation();
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer, setAnswer] = useState(faq?.answer ?? "");
  const [categoryId, setCategoryId] = useState(faq?.categoryId ?? NONE);
  const [visible, setVisible] = useState(faq?.visible ?? true);
  const [showOnHome, setShowOnHome] = useState(faq?.showOnHome ?? false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      question,
      answer,
      categoryId: categoryId === NONE ? null : categoryId,
      sort: faq?.sort ?? 9999,
      visible,
      showOnHome,
    };
    run(
      async () =>
        (faq
          ? await updateFaq(faq.id, input)
          : await createFaq(input)) as ActionResult,
      {
        success: "FAQ disimpan.",
        onDone: (r) => {
          if (r.ok) onClose();
          else setErrors(mapServerErrors(r.fieldErrors));
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>{faq ? "Edit FAQ" : "FAQ baru"}</DialogTitle>
            <DialogDescription>
              Jawaban mendukung **tebal**, [tautan](/halaman), dan baris baru.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-5">
            <Field data-invalid={errors.question ? true : undefined}>
              <FieldLabel htmlFor="faq-q">Pertanyaan *</FieldLabel>
              <Input
                id="faq-q"
                value={question}
                maxLength={300}
                aria-invalid={errors.question ? true : undefined}
                onChange={(e) => setQuestion(e.target.value)}
              />
              {errors.question ? (
                <FieldError>{errors.question}</FieldError>
              ) : null}
            </Field>
            <Field data-invalid={errors.answer ? true : undefined}>
              <FieldLabel htmlFor="faq-a">Jawaban *</FieldLabel>
              <Textarea
                id="faq-a"
                rows={6}
                maxLength={4000}
                value={answer}
                aria-invalid={errors.answer ? true : undefined}
                onChange={(e) => setAnswer(e.target.value)}
              />
              {errors.answer ? <FieldError>{errors.answer}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="faq-cat">Kategori</FieldLabel>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="faq-cat" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Tanpa kategori</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Kategori dikelola di menu taksonomi (jenis FAQ).
              </FieldDescription>
            </Field>
            <Field orientation="horizontal">
              <Switch
                id="faq-visible"
                checked={visible}
                onCheckedChange={setVisible}
              />
              <FieldLabel htmlFor="faq-visible">Tampilkan di situs</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Switch
                id="faq-home"
                checked={showOnHome}
                onCheckedChange={setShowOnHome}
              />
              <FieldLabel htmlFor="faq-home">Tampilkan di beranda</FieldLabel>
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
