"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { deleteHoliday, upsertHoliday } from "@/features/slots/actions";
import {
  compareDateKeys,
  formatDateLong,
  isDateKey,
  type DateKey,
} from "@/lib/dates";

import type { HolidayRow } from "./types";
import { useAdminMutation } from "./use-action";

export function HolidayManager({
  holidays,
  today,
}: {
  holidays: HolidayRow[];
  today: DateKey;
}) {
  const { pending, run } = useAdminMutation();
  const [date, setDate] = useState("");
  const [label, setLabel] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPast, setShowPast] = useState(false);

  const upcoming = holidays.filter((h) => compareDateKeys(h.date, today) >= 0);
  const past = holidays.filter((h) => compareDateKeys(h.date, today) < 0);
  const visible = showPast ? holidays : upcoming;

  function add(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!isDateKey(date)) next.date = "Pilih tanggal.";
    if (!label.trim()) next.label = "Keterangan libur wajib diisi.";
    else if (label.trim().length > 120) next.label = "Maksimal 120 karakter.";
    setErrors(next);
    if (Object.keys(next).length) return;
    run(() => upsertHoliday({ date, label: label.trim() }), {
      success: "Hari libur disimpan.",
      onDone: (res) => {
        if (res.ok) {
          setDate("");
          setLabel("");
        }
      },
    });
  }

  return (
    <section aria-labelledby="holiday-title" className="flex flex-col gap-4">
      <div>
        <h2 id="holiday-title" className="text-lg font-medium">
          Hari libur
        </h2>
        <p className="text-sm text-muted-foreground">
          Tanggal libur otomatis tampil &ldquo;Libur&rdquo; di kalender publik
          dan batas pesan mundur ke hari buka sebelumnya. Untuk tetap produksi
          di hari libur, pilih status &ldquo;Buka khusus&rdquo; di kalender.
        </p>
      </div>

      <form
        onSubmit={add}
        noValidate
        className="rounded-lg border border-border bg-card p-4"
      >
        <FieldGroup className="gap-4 sm:flex-row sm:items-start">
          <Field data-invalid={!!errors.date} className="sm:w-48">
            <FieldLabel htmlFor="holiday-date">Tanggal</FieldLabel>
            <Input
              id="holiday-date"
              type="date"
              value={date}
              aria-invalid={!!errors.date}
              onChange={(e) => setDate(e.target.value)}
            />
            <FieldError>{errors.date}</FieldError>
          </Field>
          <Field data-invalid={!!errors.label} className="sm:flex-1">
            <FieldLabel htmlFor="holiday-label">Keterangan</FieldLabel>
            <Input
              id="holiday-label"
              placeholder="mis. Idulfitri"
              maxLength={120}
              value={label}
              aria-invalid={!!errors.label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <FieldError>{errors.label}</FieldError>
          </Field>
          <Button type="submit" className="sm:mt-6" disabled={pending}>
            {pending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : null}
            Tambah libur
          </Button>
        </FieldGroup>
        <p className="mt-2 text-xs text-muted-foreground">
          Tanggal yang sudah ada akan diperbarui keterangannya.
        </p>
      </form>

      {visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada hari libur mendatang.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {visible.map((h) => (
            <li
              key={h.date}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{h.label}</p>
                <p className="text-xs text-muted-foreground">
                  <time dateTime={h.date}>{formatDateLong(h.date)}</time>
                  {compareDateKeys(h.date, today) < 0 ? " · sudah lewat" : ""}
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Hapus libur ${h.label}, ${formatDateLong(h.date)}`}
                    disabled={pending}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus hari libur?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {h.label} ({formatDateLong(h.date)}) akan kembali
                      mengikuti jadwal produksi biasa.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() =>
                        run(() => deleteHoliday(h.date), {
                          success: "Hari libur dihapus.",
                        })
                      }
                    >
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ul>
      )}
      {past.length > 0 ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="self-start"
          aria-expanded={showPast}
          onClick={() => setShowPast((v) => !v)}
        >
          {showPast
            ? "Sembunyikan libur yang sudah lewat"
            : `Tampilkan ${past.length} libur yang sudah lewat`}
        </Button>
      ) : null}
    </section>
  );
}
