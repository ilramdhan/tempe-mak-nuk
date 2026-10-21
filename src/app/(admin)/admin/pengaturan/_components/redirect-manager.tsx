"use client";

import { LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { RoleGate } from "@/components/admin/shell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { removeRedirect, saveRedirect } from "@/features/redirects/actions";

import { useAdminMutation } from "../../slot/_components/use-action";

export type RedirectRow = {
  id: string;
  from: string;
  to: string;
  permanent: boolean;
};

const EMPTY = { id: null as string | null, from: "", to: "", permanent: true };

export function RedirectManager({ rows }: { rows: RedirectRow[] }) {
  const { pending, run } = useAdminMutation();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toDelete, setToDelete] = useState<RedirectRow | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!/^\/(?!\/)[^\s?#]*$/.test(form.from.trim()))
      next.from = "Harus path internal diawali / (tanpa query).";
    if (!/^(\/(?!\/)|#|https?:\/\/)/i.test(form.to.trim()))
      next.to = "Tujuan harus diawali / atau https://.";
    setErrors(next);
    if (Object.keys(next).length) return;
    run(
      () =>
        saveRedirect({ ...form, from: form.from.trim(), to: form.to.trim() }),
      {
        success: "Redirect disimpan.",
        onDone: (res) => {
          if (res.ok) setForm(EMPTY);
          else if (res.fieldErrors)
            setErrors(
              Object.fromEntries(
                Object.entries(res.fieldErrors).map(([k, v]) => [k, v[0]]),
              ),
            );
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <RoleGate
        role="owner"
        fallback={
          <p className="text-sm text-muted-foreground">
            Hanya pemilik yang dapat mengelola redirect.
          </p>
        }
      >
        <form
          onSubmit={submit}
          noValidate
          className="rounded-lg border border-border bg-card p-4 sm:p-6"
        >
          <h2 className="mb-4 text-lg font-medium">
            {form.id ? "Ubah redirect" : "Tambah redirect"}
          </h2>
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.from}>
                <FieldLabel htmlFor="rd-from">Dari (path)</FieldLabel>
                <Input
                  id="rd-from"
                  value={form.from}
                  placeholder="/produk-lama"
                  aria-invalid={!!errors.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                />
                <FieldError>{errors.from}</FieldError>
              </Field>
              <Field data-invalid={!!errors.to}>
                <FieldLabel htmlFor="rd-to">Ke (path / URL)</FieldLabel>
                <Input
                  id="rd-to"
                  value={form.to}
                  placeholder="/produk"
                  aria-invalid={!!errors.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                />
                <FieldError>{errors.to}</FieldError>
              </Field>
            </div>
            <Field orientation="horizontal">
              <Switch
                id="rd-perm"
                checked={form.permanent}
                onCheckedChange={(c) => setForm({ ...form, permanent: c })}
              />
              <FieldLabel htmlFor="rd-perm">Permanen (301)</FieldLabel>
            </Field>
            <div className="flex gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : null}
                {form.id ? "Simpan perubahan" : "Tambah"}
              </Button>
              {form.id ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setForm(EMPTY);
                    setErrors({});
                  }}
                >
                  Batal
                </Button>
              ) : null}
            </div>
          </FieldGroup>
        </form>
      </RoleGate>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada redirect.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
            >
              <code className="text-sm">{r.from}</code>
              <span aria-hidden="true">→</span>
              <span className="sr-only">dialihkan ke</span>
              <code className="min-w-0 text-sm break-all">{r.to}</code>
              <Badge variant="secondary">{r.permanent ? "301" : "302"}</Badge>
              <RoleGate role="owner">
                <div className="ml-auto flex gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Ubah redirect ${r.from}`}
                    onClick={() => {
                      setForm({
                        id: r.id,
                        from: r.from,
                        to: r.to,
                        permanent: r.permanent,
                      });
                      setErrors({});
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Hapus redirect ${r.from}`}
                    onClick={() => setToDelete(r)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </RoleGate>
            </li>
          ))}
        </ul>
      )}

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus redirect?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.from} tidak lagi dialihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const id = toDelete!.id;
                setToDelete(null);
                run(() => removeRedirect(id), { success: "Redirect dihapus." });
              }}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
