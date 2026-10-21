"use client";

import { LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { MediaPicker } from "@/components/admin/media-picker";
import { useHasRole } from "@/components/admin/shell";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { updateSettings } from "@/features/settings/actions";
import { isOwnerOnlySetting } from "@/features/settings/roles";
import type { Settings } from "@/features/settings/schema";

import { useAdminMutation } from "../../slot/_components/use-action";
import { useUnsavedGuard } from "../../halaman/_components/use-unsaved-guard";
import {
  parseDraft,
  toDraft,
  type Draft,
  type FieldDef,
  type TabDef,
} from "../_lib/fields";

function inputProps(kind: FieldDef["kind"]) {
  switch (kind) {
    case "url":
      return { type: "url", inputMode: "url" as const };
    case "email":
      return { type: "email", inputMode: "email" as const };
    case "phone":
      return { type: "tel", inputMode: "tel" as const };
    case "date":
      return { type: "date" };
    case "time":
      return { type: "time" };
    case "int":
      return { type: "text", inputMode: "numeric" as const };
    case "number":
      return { type: "text", inputMode: "decimal" as const };
    default:
      return { type: "text" };
  }
}

/** One form per settings group. Validates with the shared Zod schemas, then calls updateSettings. */
export function SettingsForm({
  tab,
  settings,
}: {
  tab: TabDef;
  settings: Settings;
}) {
  const isOwner = useHasRole("owner");
  const fieldLocked = (key: FieldDef["key"]) =>
    !isOwner && (tab.ownerOnly || isOwnerOnlySetting(key));
  const fields = useMemo(() => tab.sections.flatMap((s) => s.fields), [tab]);
  const initial = useMemo(
    () =>
      Object.fromEntries(
        fields.map((d) => [d.key, toDraft(d, settings[d.key])]),
      ) as Record<string, Draft>,
    [fields, settings],
  );
  const [values, setValues] = useState<Record<string, Draft>>(initial);
  const [base, setBase] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { pending, run } = useAdminMutation();

  const canEdit = fields.some((d) => !fieldLocked(d.key));
  const partlyLocked = canEdit && fields.some((d) => fieldLocked(d.key));
  const dirty = fields.some((d) => values[d.key] !== base[d.key]);
  useUnsavedGuard(dirty);

  function save(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    const payload: Record<string, unknown> = {};
    for (const d of fields) {
      if (values[d.key] === base[d.key]) continue;
      const res = parseDraft(d, values[d.key], settings);
      if (res.ok) payload[d.key] = res.value;
      else next[d.key] = res.message;
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    if (Object.keys(payload).length === 0) return;
    const snapshot = values;
    run(() => updateSettings(payload as Parameters<typeof updateSettings>[0]), {
      success: `Pengaturan ${tab.label} disimpan.`,
      onDone: (res) => {
        if (res.ok) setBase(snapshot);
        else if (res.fieldErrors) {
          setErrors(
            Object.fromEntries(
              Object.entries(res.fieldErrors).map(([k, v]) => [k, v[0]]),
            ),
          );
        }
      },
    });
  }

  function reset() {
    setValues(base);
    setErrors({});
  }

  const set = (key: string, v: Draft) =>
    setValues((cur) => ({ ...cur, [key]: v }));

  return (
    <form
      onSubmit={save}
      noValidate
      className="flex flex-col gap-6 rounded-lg border border-border bg-card p-4 sm:p-6"
    >
      {!canEdit ? (
        <p
          role="note"
          className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
        >
          Hanya pemilik yang dapat mengubah pengaturan ini. Anda melihat dalam
          mode baca.
        </p>
      ) : null}
      {partlyLocked ? (
        <p
          role="note"
          className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
        >
          Beberapa isian (mis. URL situs) hanya dapat diubah oleh pemilik.
        </p>
      ) : null}
      <fieldset disabled={pending} className="contents">
        {tab.sections.map((section, i) => (
          <FieldSet key={section.title ?? i}>
            {section.title ? <FieldLegend>{section.title}</FieldLegend> : null}
            <FieldGroup className="gap-5">
              {section.fields.map((d) => {
                const id = `set-${d.key.replace(/\./g, "-")}`;
                const err = errors[d.key];
                const hintId = d.hint ? `${id}-hint` : undefined;
                const locked = fieldLocked(d.key);
                if (d.kind === "boolean") {
                  return (
                    <Field
                      key={d.key}
                      orientation="horizontal"
                      data-invalid={!!err}
                    >
                      <Switch
                        id={id}
                        disabled={locked}
                        checked={values[d.key] === true}
                        onCheckedChange={(c) => set(d.key, c)}
                        aria-describedby={hintId}
                      />
                      <FieldLabel htmlFor={id}>{d.label}</FieldLabel>
                    </Field>
                  );
                }
                if (d.kind === "media") {
                  const v = String(values[d.key] ?? "");
                  return (
                    <Field key={d.key} data-invalid={!!err}>
                      <FieldLabel htmlFor={id}>{d.label}</FieldLabel>
                      <MediaPicker
                        id={id}
                        value={v || null}
                        invalid={!!err}
                        ariaDescribedBy={hintId}
                        noneLabel="Belum ada gambar default"
                        onChange={(m) => set(d.key, m ?? "")}
                      />
                      {d.hint ? (
                        <FieldDescription id={hintId}>
                          {d.hint}
                        </FieldDescription>
                      ) : null}
                      <FieldError>{err}</FieldError>
                    </Field>
                  );
                }
                const multi =
                  d.kind === "textarea" ||
                  d.kind === "lines" ||
                  d.kind === "hours" ||
                  d.kind === "json";
                return (
                  <Field key={d.key} data-invalid={!!err}>
                    <FieldLabel htmlFor={id}>{d.label}</FieldLabel>
                    {multi ? (
                      <Textarea
                        id={id}
                        disabled={locked}
                        value={String(values[d.key])}
                        rows={
                          d.kind === "json" ? 14 : d.kind === "textarea" ? 3 : 4
                        }
                        className={
                          d.kind === "json" ? "font-mono text-xs" : undefined
                        }
                        aria-invalid={!!err}
                        aria-describedby={hintId}
                        onChange={(e) => set(d.key, e.target.value)}
                      />
                    ) : (
                      <Input
                        id={id}
                        disabled={locked}
                        {...inputProps(d.kind)}
                        value={String(values[d.key])}
                        placeholder={d.placeholder}
                        aria-invalid={!!err}
                        aria-describedby={hintId}
                        onChange={(e) => set(d.key, e.target.value)}
                      />
                    )}
                    {d.hint ? (
                      <FieldDescription id={hintId}>{d.hint}</FieldDescription>
                    ) : null}
                    <FieldError>{err}</FieldError>
                  </Field>
                );
              })}
            </FieldGroup>
          </FieldSet>
        ))}
      </fieldset>
      {canEdit ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || !dirty}>
            {pending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : null}
            Simpan
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={pending || !dirty}
            onClick={reset}
          >
            Batalkan
          </Button>
          {dirty ? (
            <span role="status" className="text-sm text-muted-foreground">
              Ada perubahan belum disimpan
            </span>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
