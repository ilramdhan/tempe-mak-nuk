"use client";

/**
 * Field kit for block forms. Every field reads/writes through `BlockFormContext` by `path`
 * (relative to the block's `data`) and shows its own error from the validation map.
 */
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
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
import { RichTextEditor } from "@/components/admin/editor";
import { MediaPicker } from "@/components/admin/media-picker";
import { emptyDoc, type TiptapDoc } from "@/lib/rich-text/schema";
import { cn } from "@/lib/utils";

import type { FieldErrors } from "../_lib/editor-state";
import {
  getAt,
  insertAt,
  joinPath,
  moveItem,
  removeAt,
  type Path,
} from "../_lib/path";
import type { BuilderOptions } from "./types";

type Ctx = {
  data: Record<string, unknown>;
  errors: FieldErrors;
  set: (path: Path, value: unknown) => void;
  options: BuilderOptions;
  idPrefix: string;
};

const BlockFormContext = createContext<Ctx | null>(null);

export function BlockFormProvider({
  children,
  ...value
}: Ctx & { children: ReactNode }) {
  return (
    <BlockFormContext.Provider value={value}>
      {children}
    </BlockFormContext.Provider>
  );
}

export function useBlockForm() {
  const ctx = useContext(BlockFormContext);
  if (!ctx)
    throw new Error("useBlockForm must be used inside <BlockFormProvider>");
  return ctx;
}

/** Value + setter + error + DOM id for one path. */
function useField<T>(path: Path) {
  const ctx = useBlockForm();
  const key = joinPath(path);
  return {
    ctx,
    id: `${ctx.idPrefix}-${key.replace(/\./g, "-") || "root"}`,
    value: getAt(ctx.data, path) as T | undefined,
    error: ctx.errors[key],
    set: (v: unknown) => ctx.set(path, v),
  };
}

/** Errors at or below a path (for lists / groups). */
function useNestedErrors(path: Path): string[] {
  const { errors } = useBlockForm();
  const prefix = joinPath(path);
  return Object.entries(errors)
    .filter(([k]) => k === prefix)
    .map(([, v]) => v);
}

type BaseProps = {
  path: Path;
  label: string;
  description?: ReactNode;
  className?: string;
};

function Wrap({
  id,
  label,
  description,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  description?: ReactNode;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Field data-invalid={error ? true : undefined} className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      {description ? (
        <FieldDescription id={`${id}-desc`}>{description}</FieldDescription>
      ) : null}
      {error ? <FieldError id={`${id}-err`}>{error}</FieldError> : null}
    </Field>
  );
}

const describedBy = (id: string, description?: ReactNode, error?: string) =>
  [description ? `${id}-desc` : null, error ? `${id}-err` : null]
    .filter(Boolean)
    .join(" ") || undefined;

// ── Primitive fields ─────────────────────────────────────────────────────
export function TextField({
  path,
  label,
  description,
  className,
  required,
  placeholder,
  maxLength,
  nullable = true,
}: BaseProps & {
  required?: boolean;
  placeholder?: string;
  maxLength?: number;
  nullable?: boolean;
}) {
  const f = useField<string | null>(path);
  return (
    <Wrap
      id={f.id}
      label={required ? `${label} *` : label}
      description={description}
      error={f.error}
      className={className}
    >
      <Input
        id={f.id}
        value={f.value ?? ""}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={f.error ? true : undefined}
        aria-describedby={describedBy(f.id, description, f.error)}
        onChange={(e) =>
          f.set(
            nullable && !required && e.target.value === ""
              ? null
              : e.target.value,
          )
        }
      />
    </Wrap>
  );
}

export function TextAreaField({
  path,
  label,
  description,
  className,
  required,
  rows = 3,
  maxLength,
}: BaseProps & { required?: boolean; rows?: number; maxLength?: number }) {
  const f = useField<string | null>(path);
  return (
    <Wrap
      id={f.id}
      label={required ? `${label} *` : label}
      description={description}
      error={f.error}
      className={className}
    >
      <Textarea
        id={f.id}
        rows={rows}
        value={f.value ?? ""}
        maxLength={maxLength}
        aria-invalid={f.error ? true : undefined}
        aria-describedby={describedBy(f.id, description, f.error)}
        onChange={(e) =>
          f.set(!required && e.target.value === "" ? null : e.target.value)
        }
      />
    </Wrap>
  );
}

export function NumberField({
  path,
  label,
  description,
  className,
  min,
  max,
  nullable = true,
}: BaseProps & { min?: number; max?: number; nullable?: boolean }) {
  const f = useField<number | null>(path);
  return (
    <Wrap
      id={f.id}
      label={label}
      description={description}
      error={f.error}
      className={className}
    >
      <Input
        id={f.id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={f.value ?? ""}
        aria-invalid={f.error ? true : undefined}
        aria-describedby={describedBy(f.id, description, f.error)}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") f.set(nullable ? null : undefined);
          else f.set(Number(raw));
        }}
      />
    </Wrap>
  );
}

const NONE = "__none__";

export type Choice = { value: string; label: string };

export function SelectField({
  path,
  label,
  description,
  className,
  choices,
  noneLabel,
  numeric,
}: BaseProps & {
  choices: readonly Choice[];
  /** Adds an empty choice that writes `null`. */
  noneLabel?: string;
  /** Store as number (e.g. columns). */
  numeric?: boolean;
}) {
  const f = useField<string | number | null>(path);
  const current = f.value == null ? (noneLabel ? NONE : "") : String(f.value);
  return (
    <Wrap
      id={f.id}
      label={label}
      description={description}
      error={f.error}
      className={className}
    >
      <Select
        value={current}
        onValueChange={(v) =>
          f.set(v === NONE ? null : numeric ? Number(v) : v)
        }
      >
        <SelectTrigger
          id={f.id}
          className="w-full"
          aria-invalid={f.error ? true : undefined}
          aria-describedby={describedBy(f.id, description, f.error)}
        >
          <SelectValue placeholder="Pilih…" />
        </SelectTrigger>
        <SelectContent>
          {noneLabel ? <SelectItem value={NONE}>{noneLabel}</SelectItem> : null}
          {choices.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Wrap>
  );
}

export function SwitchField({
  path,
  label,
  description,
  className,
}: BaseProps) {
  const f = useField<boolean>(path);
  return (
    <Field
      orientation="horizontal"
      data-invalid={f.error ? true : undefined}
      className={className}
    >
      <Switch
        id={f.id}
        checked={Boolean(f.value)}
        onCheckedChange={(v) => f.set(v)}
        aria-describedby={describedBy(f.id, description, f.error)}
      />
      <div className="flex flex-col gap-0.5">
        <FieldLabel htmlFor={f.id}>{label}</FieldLabel>
        {description ? (
          <FieldDescription id={`${f.id}-desc`}>{description}</FieldDescription>
        ) : null}
        {f.error ? <FieldError id={`${f.id}-err`}>{f.error}</FieldError> : null}
      </div>
    </Field>
  );
}

// ── Composite fields ─────────────────────────────────────────────────────
function Group({
  legend,
  description,
  children,
  error,
}: {
  legend: string;
  description?: ReactNode;
  children: ReactNode;
  error?: string;
}) {
  return (
    <FieldSet className="rounded-lg border border-input p-4">
      <FieldLegend variant="label">{legend}</FieldLegend>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {error ? <FieldError>{error}</FieldError> : null}
      {children}
    </FieldSet>
  );
}

/** Optional CTA `{label, href}`; a switch turns it on/off (off = null). */
export function CtaField({
  path,
  label,
  required,
}: {
  path: Path;
  label: string;
  required?: boolean;
}) {
  const f = useField<{ label: string; href: string } | null>(path);
  const on = f.value != null;
  return (
    <Group legend={label} error={f.error}>
      {!required ? (
        <Field orientation="horizontal">
          <Switch
            id={`${f.id}-on`}
            checked={on}
            onCheckedChange={(v) =>
              f.set(v ? { label: "", href: "/custom-order" } : null)
            }
          />
          <FieldLabel htmlFor={`${f.id}-on`}>Tampilkan tombol</FieldLabel>
        </Field>
      ) : null}
      {on || required ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            path={[...path, "label"]}
            label="Teks tombol"
            required
            maxLength={60}
          />
          <TextField
            path={[...path, "href"]}
            label="Tautan"
            required
            placeholder="/custom-order"
            description="Diawali /, #, https://, mailto: atau tel:"
          />
        </div>
      ) : null}
    </Group>
  );
}

/** Single media id (nullable) via the media library picker. */
export function MediaField({
  path,
  label,
  description,
  className,
  noneLabel,
}: BaseProps & { noneLabel?: string }) {
  const f = useField<string | null>(path);
  return (
    <Wrap
      id={f.id}
      label={label}
      description={description}
      error={f.error}
      className={className}
    >
      <MediaPicker
        id={f.id}
        value={f.value || null}
        noneLabel={noneLabel}
        invalid={!!f.error}
        ariaDescribedBy={describedBy(f.id, !!description, f.error)}
        onChange={(id) => f.set(id)}
      />
    </Wrap>
  );
}

/** Media reference: choose from the media library (or paste an id) + alt override. */
export function ImageField({
  path,
  label,
  withAlt = true,
  withCaption = false,
  required = false,
}: {
  path: Path;
  label: string;
  withAlt?: boolean;
  withCaption?: boolean;
  /** Item must keep an image (gallery): no "none" choice, value never becomes null. */
  required?: boolean;
}) {
  const f = useField<{ mediaId: string; alt?: string | null } | null>(path);
  const errMediaId = f.ctx.errors[joinPath([...path, "mediaId"])];
  return (
    <Group legend={label} error={f.error}>
      <div className="grid gap-4">
        <div className="grid gap-4">
          <Field data-invalid={errMediaId ? true : undefined}>
            <FieldLabel htmlFor={`${f.id}-media`}>Pilih dari Media</FieldLabel>
            <MediaPicker
              id={`${f.id}-media`}
              value={f.value?.mediaId || null}
              clearable={!required}
              noneLabel="Tanpa gambar (placeholder)"
              invalid={!!errMediaId}
              onChange={(id) =>
                id ? f.set({ ...(f.value ?? {}), mediaId: id }) : f.set(null)
              }
            />
            {errMediaId ? <FieldError>{errMediaId}</FieldError> : null}
          </Field>
          {f.value && withAlt ? (
            <TextField
              path={[...path, "alt"]}
              label="Teks alternatif (opsional)"
              description="Kosongkan untuk memakai alt dari Media."
              maxLength={300}
            />
          ) : null}
          {f.value && withCaption ? (
            <TextField
              path={[...path, "caption"]}
              label="Keterangan"
              maxLength={200}
            />
          ) : null}
        </div>
      </div>
    </Group>
  );
}

/** Repeater with add / remove / move up-down (keyboard-friendly buttons). */
export function ListField<T>({
  path,
  label,
  description,
  itemLabel,
  newItem,
  min = 0,
  max = 50,
  children,
}: {
  path: Path;
  label: string;
  description?: ReactNode;
  itemLabel: (item: T, index: number) => string;
  newItem: () => T;
  min?: number;
  max?: number;
  children: (itemPath: Path, index: number) => ReactNode;
}) {
  const f = useField<T[]>(path);
  const items = f.value ?? [];
  const errors = useNestedErrors(path);
  return (
    <Group legend={label} description={description} error={errors[0]}>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada item.</p>
      ) : null}
      <ol className="flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={i} className="rounded-md border border-input bg-card p-3">
            <div className="mb-3 flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {i + 1}. {itemLabel(item, i) || "Tanpa judul"}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Naikkan item ${i + 1}`}
                disabled={i === 0}
                onClick={() => f.set(moveItem(items, i, i - 1))}
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Turunkan item ${i + 1}`}
                disabled={i === items.length - 1}
                onClick={() => f.set(moveItem(items, i, i + 1))}
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Hapus item ${i + 1}`}
                disabled={items.length <= min}
                onClick={() => f.set(removeAt(items, i))}
              >
                <Trash2 />
              </Button>
            </div>
            <div className="grid gap-4">{children([...path, i], i)}</div>
          </li>
        ))}
      </ol>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {items.length}/{max} item{min ? ` · minimal ${min}` : ""}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={items.length >= max}
          onClick={() => f.set(insertAt(items, items.length, newItem()))}
        >
          <Plus /> Tambah item
        </Button>
      </div>
    </Group>
  );
}

/**
 * Multi-select from known options (slugs / ids), ordered as picked. Empty → null
 * (block then falls back to its automatic source).
 */
export function PickListField({
  path,
  label,
  description,
  choices,
  max = 12,
}: BaseProps & { choices: readonly Choice[]; max?: number }) {
  const f = useField<string[] | null>(path);
  const picked = f.value ?? [];
  const errors = useNestedErrors(path);
  const byValue = useMemo(
    () => new Map(choices.map((c) => [c.value, c.label])),
    [choices],
  );
  const available = choices.filter((c) => !picked.includes(c.value));
  const [adding, setAdding] = useState<string>("");
  const set = (next: string[]) => f.set(next.length ? next : null);
  return (
    <Group
      legend={label}
      description={description}
      error={errors[0] ?? f.error}
    >
      {picked.length === 0 ? (
        <p className="text-sm text-muted-foreground">Kosong = otomatis.</p>
      ) : null}
      <ol className="flex flex-col gap-1.5">
        {picked.map((v, i) => (
          <li
            key={v}
            className="flex items-center gap-2 rounded-md border border-input bg-card px-3 py-1.5 text-sm"
          >
            <span
              className={cn(
                "min-w-0 flex-1 truncate",
                !byValue.has(v) && "text-destructive",
              )}
            >
              {byValue.get(v) ?? `${v} (tidak ditemukan)`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Naikkan"
              disabled={i === 0}
              onClick={() => set(moveItem(picked, i, i - 1))}
            >
              <ArrowUp />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Turunkan"
              disabled={i === picked.length - 1}
              onClick={() => set(moveItem(picked, i, i + 1))}
            >
              <ArrowDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label={`Hapus ${byValue.get(v) ?? v}`}
              onClick={() => set(removeAt(picked, i))}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ol>
      {available.length && picked.length < max ? (
        <div className="flex gap-2">
          <Select value={adding} onValueChange={setAdding}>
            <SelectTrigger className="w-full" aria-label={`Tambah ke ${label}`}>
              <SelectValue placeholder="Pilih untuk ditambahkan…" />
            </SelectTrigger>
            <SelectContent>
              {available.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-11"
            disabled={!adding}
            onClick={() => {
              set([...picked, adding]);
              setAdding("");
            }}
          >
            <Plus /> Tambah
          </Button>
        </div>
      ) : null}
    </Group>
  );
}

/** Rich text (Tiptap JSON) via the shared admin editor. */
export function RichTextField({
  path,
  label,
  description,
  nullable,
}: BaseProps & { nullable?: boolean }) {
  const f = useField<TiptapDoc | null>(path);
  return (
    <Wrap id={f.id} label={label} error={f.error} description={description}>
      <RichTextEditor
        id={f.id}
        value={f.value ?? null}
        invalid={!!f.error}
        ariaDescribedBy={describedBy(f.id, !!description, f.error)}
        onChange={(v) => f.set(nullable ? v : (v ?? emptyDoc()))}
      />
    </Wrap>
  );
}
