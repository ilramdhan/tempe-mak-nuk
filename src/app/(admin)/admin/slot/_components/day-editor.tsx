"use client";

import { LoaderCircle, Minus, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";

import { SlotBadge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import {
  AVAILABILITY_LABEL,
  toBadgeStatus,
} from "@/features/slots/availability";
import {
  adjustBooked,
  clearSlotDay,
  upsertSlotDay,
} from "@/features/slots/actions";
import { formatDateLong } from "@/lib/dates";

import { parseCapacityInput } from "./calendar-utils";
import {
  OVERRIDE_STATUS_LABEL,
  type CalendarDay,
  type OverrideStatus,
} from "./types";
import { useAdminMutation } from "./use-action";

/** Editor for the selected date. Parent remounts it per date (key) so state resets. */
export function DayEditor({
  day,
  defaultCapacity,
}: {
  day: CalendarDay;
  defaultCapacity: number;
}) {
  const { pending, run } = useAdminMutation();
  const o = day.override;
  const [capacity, setCapacity] = useState(
    o?.capacity == null ? "" : String(o.capacity),
  );
  const [booked, setBooked] = useState(String(o?.booked ?? 0));
  const [status, setStatus] = useState<OverrideStatus>(o?.status ?? "auto");
  const [note, setNote] = useState(o?.note ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const id = (s: string) => `day-${day.date}-${s}`;

  function save(event: React.FormEvent) {
    event.preventDefault();
    const cap = parseCapacityInput(capacity);
    const b = /^\d{1,4}$/.test(booked.trim()) ? Number(booked) : NaN;
    const next: Record<string, string> = {};
    if (cap === undefined) next.capacity = "Isi angka 0–1000 atau kosongkan.";
    if (!Number.isInteger(b) || b < 0 || b > 1000)
      next.booked = "Isi angka 0–1000.";
    if (note.length > 200) next.note = "Maksimal 200 karakter.";
    setErrors(next);
    if (Object.keys(next).length) return;
    run(
      () =>
        upsertSlotDay({
          date: day.date,
          capacity: cap ?? null,
          booked: b,
          status,
          note: note.trim() || null,
        }),
      {
        success: "Pengaturan hari disimpan.",
        onDone: (res) => {
          if (!res.ok && res.fieldErrors) {
            setErrors(
              Object.fromEntries(
                Object.entries(res.fieldErrors).map(([k, v]) => [k, v[0]]),
              ),
            );
          }
        },
      },
    );
  }

  const badge = toBadgeStatus(day.status);

  return (
    <section
      aria-labelledby="day-editor-title"
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="mb-4 flex flex-col gap-2">
        <h2 id="day-editor-title" className="text-base font-medium">
          {formatDateLong(day.date)}
        </h2>
        <div className="flex flex-wrap items-center gap-2" aria-live="polite">
          <SlotBadge status={badge}>{AVAILABILITY_LABEL[day.status]}</SlotBadge>
          <span className="text-sm text-muted-foreground tabular-nums">
            Terpakai {day.booked} dari {day.capacity} · sisa {day.remaining}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{day.reason}</p>
        {day.holiday ? (
          <p className="text-xs text-muted-foreground">
            Hari libur: {day.holiday}
          </p>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium" id={id("quick")}>
          Slot terpakai
        </span>
        <div
          role="group"
          aria-labelledby={id("quick")}
          className="flex items-center gap-1"
        >
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label="Kurangi satu slot terpakai"
            disabled={pending || day.booked <= 0}
            onClick={() =>
              run(() => adjustBooked(day.date, -1), {
                success: "Slot terpakai dikurangi.",
              })
            }
          >
            <Minus aria-hidden="true" />
          </Button>
          <span className="min-w-8 text-center text-sm tabular-nums">
            {day.booked}
          </span>
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            aria-label="Tambah satu slot terpakai"
            disabled={pending}
            onClick={() =>
              run(() => adjustBooked(day.date, 1), {
                success: "Slot terpakai ditambah.",
              })
            }
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
      </div>

      <form onSubmit={save} noValidate>
        <FieldGroup className="gap-4">
          <Field data-invalid={!!errors.capacity}>
            <FieldLabel htmlFor={id("capacity")}>Kapasitas hari ini</FieldLabel>
            <Input
              id={id("capacity")}
              inputMode="numeric"
              placeholder={`Default ${defaultCapacity}`}
              value={capacity}
              aria-invalid={!!errors.capacity}
              aria-describedby={id("capacity-desc")}
              onChange={(e) => setCapacity(e.target.value)}
            />
            <FieldDescription id={id("capacity-desc")}>
              Kosongkan untuk memakai kapasitas default ({defaultCapacity}).
            </FieldDescription>
            <FieldError>{errors.capacity}</FieldError>
          </Field>
          <Field data-invalid={!!errors.booked}>
            <FieldLabel htmlFor={id("booked")}>Slot terpakai</FieldLabel>
            <Input
              id={id("booked")}
              inputMode="numeric"
              value={booked}
              aria-invalid={!!errors.booked}
              onChange={(e) => setBooked(e.target.value)}
            />
            <FieldError>{errors.booked}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor={id("status")}>Status hari</FieldLabel>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as OverrideStatus)}
            >
              <SelectTrigger id={id("status")} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(OVERRIDE_STATUS_LABEL) as OverrideStatus[]).map(
                  (s) => (
                    <SelectItem key={s} value={s}>
                      {OVERRIDE_STATUS_LABEL[s]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </Field>
          <Field data-invalid={!!errors.note}>
            <FieldLabel htmlFor={id("note")}>Catatan internal</FieldLabel>
            <Textarea
              id={id("note")}
              rows={2}
              maxLength={200}
              value={note}
              aria-invalid={!!errors.note}
              aria-describedby={id("note-desc")}
              onChange={(e) => setNote(e.target.value)}
            />
            <FieldDescription id={id("note-desc")}>
              Jangan tulis nama/nomor pelanggan di sini.
            </FieldDescription>
            <FieldError>{errors.note}</FieldError>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : null}
              Simpan hari ini
            </Button>
            {o ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() =>
                  run(() => clearSlotDay(day.date), {
                    success: "Hari dikembalikan ke default.",
                  })
                }
              >
                <RotateCcw aria-hidden="true" /> Kembalikan ke default
              </Button>
            ) : null}
          </div>
        </FieldGroup>
      </form>
    </section>
  );
}
