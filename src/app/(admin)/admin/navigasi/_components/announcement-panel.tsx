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
import type { ActionResult } from "@/features/_shared/action";
import {
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
} from "@/features/navigation/actions";

import { mapServerErrors } from "../../produk/_lib/form-state";
import { useAdminMutation } from "../../slot/_components/use-action";
import {
  announcementStatus,
  fromLocalInput,
  toLocalInput,
  type AnnouncementStatus,
} from "../_lib/datetime";

export type AnnouncementRow = {
  id: string;
  text: string;
  href: string | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
};

const STATUS: Record<AnnouncementStatus, string> = {
  live: "Tayang",
  scheduled: "Terjadwal",
  expired: "Berakhir",
  inactive: "Nonaktif",
};

const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

export function AnnouncementPanel({ items }: { items: AnnouncementRow[] }) {
  const { pending, run } = useAdminMutation();
  const [editing, setEditing] = useState<AnnouncementRow | "new" | null>(null);
  const [now] = useState(() => Date.now());

  return (
    <section aria-labelledby="h-ann" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="h-ann" className="text-lg font-medium">
          Bar pengumuman
        </h2>
        <Button type="button" size="sm" onClick={() => setEditing("new")}>
          <Plus /> Pengumuman baru
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-input p-5 text-center text-sm text-muted-foreground">
          Belum ada pengumuman.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((a) => {
            const st = announcementStatus(a, now);
            return (
              <li
                key={a.id}
                className="flex items-center gap-2 rounded-lg border border-input bg-card p-3"
              >
                <div className="min-w-0 flex-1 text-sm">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium">{a.text}</span>
                    <Badge variant={st === "live" ? "secondary" : "outline"}>
                      {STATUS[st]}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {[
                      a.href,
                      fmt(a.startsAt) && `Mulai ${fmt(a.startsAt)}`,
                      fmt(a.endsAt) && `Selesai ${fmt(a.endsAt)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <Switch
                  aria-label={`Aktifkan pengumuman ${a.text}`}
                  checked={a.active}
                  disabled={pending}
                  onCheckedChange={(v) =>
                    run(
                      () =>
                        updateAnnouncement(a.id, {
                          text: a.text,
                          href: a.href,
                          startsAt: a.startsAt,
                          endsAt: a.endsAt,
                          active: v,
                        }) as Promise<ActionResult>,
                      {
                        success: v
                          ? "Pengumuman diaktifkan."
                          : "Pengumuman dinonaktifkan.",
                      },
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Edit pengumuman ${a.text}`}
                  disabled={pending}
                  onClick={() => setEditing(a)}
                >
                  <Pencil />
                </Button>
                <RoleGate permission="announcements.delete">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label={`Hapus pengumuman ${a.text}`}
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm(`Hapus pengumuman "${a.text}"?`))
                        run(() => deleteAnnouncement(a.id), {
                          success: "Pengumuman dihapus.",
                        });
                    }}
                  >
                    <Trash2 />
                  </Button>
                </RoleGate>
              </li>
            );
          })}
        </ul>
      )}
      {editing ? (
        <AnnouncementDialog
          key={editing === "new" ? "new" : editing.id}
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </section>
  );
}

function AnnouncementDialog({
  item,
  onClose,
}: {
  item: AnnouncementRow | null;
  onClose: () => void;
}) {
  const { pending, run } = useAdminMutation();
  const [text, setText] = useState(item?.text ?? "");
  const [href, setHref] = useState(item?.href ?? "");
  const [startsAt, setStartsAt] = useState(
    toLocalInput(item?.startsAt ?? null),
  );
  const [endsAt, setEndsAt] = useState(toLocalInput(item?.endsAt ?? null));
  const [active, setActive] = useState(item?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      text,
      href: href.trim() === "" ? null : href,
      startsAt: fromLocalInput(startsAt),
      endsAt: fromLocalInput(endsAt),
      active,
    };
    run(
      async () =>
        (item
          ? await updateAnnouncement(item.id, input)
          : await createAnnouncement(input)) as ActionResult,
      {
        success: "Pengumuman disimpan.",
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
              {item ? "Edit pengumuman" : "Pengumuman baru"}
            </DialogTitle>
            <DialogDescription>
              Tampil di bar atas situs pada rentang waktu yang diatur.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-5">
            <Field data-invalid={bad("text")}>
              <FieldLabel htmlFor="an-text">Teks *</FieldLabel>
              <Input
                id="an-text"
                value={text}
                maxLength={200}
                aria-invalid={bad("text")}
                onChange={(e) => setText(e.target.value)}
              />
              {errors.text ? <FieldError>{errors.text}</FieldError> : null}
            </Field>
            <Field data-invalid={bad("href")}>
              <FieldLabel htmlFor="an-href">Tautan (opsional)</FieldLabel>
              <Input
                id="an-href"
                value={href}
                aria-invalid={bad("href")}
                onChange={(e) => setHref(e.target.value)}
              />
              {errors.href ? <FieldError>{errors.href}</FieldError> : null}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={bad("startsAt")}>
                <FieldLabel htmlFor="an-start">Mulai</FieldLabel>
                <Input
                  id="an-start"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
                {errors.startsAt ? (
                  <FieldError>{errors.startsAt}</FieldError>
                ) : null}
              </Field>
              <Field data-invalid={bad("endsAt")}>
                <FieldLabel htmlFor="an-end">Selesai</FieldLabel>
                <Input
                  id="an-end"
                  type="datetime-local"
                  value={endsAt}
                  aria-invalid={bad("endsAt")}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
                {errors.endsAt ? (
                  <FieldError>{errors.endsAt}</FieldError>
                ) : null}
              </Field>
            </div>
            <FieldDescription>
              Kosongkan waktu untuk tayang tanpa batas.
            </FieldDescription>
            <Field orientation="horizontal">
              <Switch
                id="an-active"
                checked={active}
                onCheckedChange={setActive}
              />
              <FieldLabel htmlFor="an-active">Aktif</FieldLabel>
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
