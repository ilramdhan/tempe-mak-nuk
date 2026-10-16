"use client";

import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { OrderRules } from "@/features/slots/availability";
import { updateSettings } from "@/features/settings/actions";

import { WEEKDAY_BY_JS_INDEX } from "./calendar-utils";
import { useAdminMutation } from "./use-action";

/** Monday-first display order of JS weekday indexes. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function intOrNull(v: string, min: number, max: number): number | null {
  if (!/^\d{1,4}$/.test(v.trim())) return null;
  const n = Number(v);
  return n >= min && n <= max ? n : null;
}

/** Owner-only: order.* settings. Server action re-checks the owner role. */
export function RulesForm({ rules }: { rules: OrderRules }) {
  const { pending, run } = useAdminMutation();
  const [leadDays, setLeadDays] = useState(String(rules.leadDays));
  const [cutoff, setCutoff] = useState(rules.cutoffTime);
  const [slots, setSlots] = useState(String(rules.slotsPerDay));
  const [nearly, setNearly] = useState(String(rules.nearlyFullThreshold));
  const [closed, setClosed] = useState<number[]>([...rules.closedWeekdays]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function save(event: React.FormEvent) {
    event.preventDefault();
    const lead = intOrNull(leadDays, 0, 60);
    const spd = intOrNull(slots, 0, 1000);
    const nf = intOrNull(nearly, 0, 1000);
    const next: Record<string, string> = {};
    if (lead === null) next.leadDays = "Isi angka 0–60.";
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(cutoff))
      next.cutoffTime = "Format jam HH:mm.";
    if (spd === null) next.slotsPerDay = "Isi angka 0–1000.";
    if (nf === null) next.nearlyFullThreshold = "Isi angka 0–1000.";
    if (closed.length === 7) next.closedWeekdays = "Minimal satu hari buka.";
    setErrors(next);
    if (Object.keys(next).length) return;
    run(
      () =>
        updateSettings({
          "order.leadDays": lead!,
          "order.cutoffTime": cutoff,
          "order.slotsPerDay": spd!,
          "order.nearlyFullThreshold": nf!,
          "order.closedWeekdays": [...closed].sort(),
        }),
      {
        success: "Aturan pemesanan disimpan.",
        onDone: (res) => {
          if (!res.ok && res.fieldErrors) {
            setErrors(
              Object.fromEntries(
                Object.entries(res.fieldErrors).map(([k, v]) => [
                  k.replace(/^order\./, ""),
                  v[0],
                ]),
              ),
            );
          }
        },
      },
    );
  }

  const err = (k: string) => errors[k];

  return (
    <section aria-labelledby="rules-title" className="flex flex-col gap-4">
      <div>
        <h2 id="rules-title" className="text-lg font-medium">
          Aturan pemesanan
        </h2>
        <p className="text-sm text-muted-foreground">
          Berlaku untuk semua tanggal tanpa pengaturan khusus. Batas pesan =
          tanggal pakai dikurangi lead time, pada jam cutoff (WIB).
        </p>
      </div>
      <form
        onSubmit={save}
        noValidate
        className="rounded-lg border border-border bg-card p-4"
      >
        <FieldGroup className="gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field data-invalid={!!err("leadDays")}>
              <FieldLabel htmlFor="rule-lead">Lead time (hari)</FieldLabel>
              <Input
                id="rule-lead"
                inputMode="numeric"
                value={leadDays}
                aria-invalid={!!err("leadDays")}
                aria-describedby="rule-lead-desc"
                onChange={(e) => setLeadDays(e.target.value)}
              />
              <FieldDescription id="rule-lead-desc">
                Contoh 4: pakai Selasa → pesan paling lambat Jumat.
              </FieldDescription>
              <FieldError>{err("leadDays")}</FieldError>
            </Field>
            <Field data-invalid={!!err("cutoffTime")}>
              <FieldLabel htmlFor="rule-cutoff">Jam cutoff (WIB)</FieldLabel>
              <Input
                id="rule-cutoff"
                type="time"
                step={60}
                value={cutoff}
                aria-invalid={!!err("cutoffTime")}
                onChange={(e) => setCutoff(e.target.value.slice(0, 5))}
              />
              <FieldError>{err("cutoffTime")}</FieldError>
            </Field>
            <Field data-invalid={!!err("slotsPerDay")}>
              <FieldLabel htmlFor="rule-slots">
                Kapasitas default per hari
              </FieldLabel>
              <Input
                id="rule-slots"
                inputMode="numeric"
                value={slots}
                aria-invalid={!!err("slotsPerDay")}
                onChange={(e) => setSlots(e.target.value)}
              />
              <FieldError>{err("slotsPerDay")}</FieldError>
            </Field>
            <Field data-invalid={!!err("nearlyFullThreshold")}>
              <FieldLabel htmlFor="rule-nearly">
                &ldquo;Hampir penuh&rdquo; bila sisa ≤
              </FieldLabel>
              <Input
                id="rule-nearly"
                inputMode="numeric"
                value={nearly}
                aria-invalid={!!err("nearlyFullThreshold")}
                onChange={(e) => setNearly(e.target.value)}
              />
              <FieldError>{err("nearlyFullThreshold")}</FieldError>
            </Field>
          </div>
          <FieldSet data-invalid={!!err("closedWeekdays")}>
            <FieldLegend variant="label">Hari produksi libur rutin</FieldLegend>
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {WEEK_ORDER.map((d) => (
                <Field key={d} orientation="horizontal" className="w-auto">
                  <Checkbox
                    id={`rule-closed-${d}`}
                    checked={closed.includes(d)}
                    onCheckedChange={(c) =>
                      setClosed((cur) =>
                        c === true
                          ? [...new Set([...cur, d])]
                          : cur.filter((x) => x !== d),
                      )
                    }
                  />
                  <FieldLabel
                    htmlFor={`rule-closed-${d}`}
                    className="font-normal"
                  >
                    {WEEKDAY_BY_JS_INDEX[d]}
                  </FieldLabel>
                </Field>
              ))}
            </div>
            <FieldError>{err("closedWeekdays")}</FieldError>
          </FieldSet>
          <Button type="submit" className="self-start" disabled={pending}>
            {pending ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : null}
            Simpan aturan
          </Button>
        </FieldGroup>
      </form>
    </section>
  );
}

/** Read-only summary for editors. */
export function RulesSummary({ rules }: { rules: OrderRules }) {
  const closed = [1, 2, 3, 4, 5, 6, 0]
    .filter((d) => rules.closedWeekdays.includes(d))
    .map((d) => WEEKDAY_BY_JS_INDEX[d]);
  return (
    <section aria-labelledby="rules-title" className="flex flex-col gap-3">
      <h2 id="rules-title" className="text-lg font-medium">
        Aturan pemesanan
      </h2>
      <dl className="grid gap-x-6 gap-y-2 rounded-lg border border-border bg-card p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Lead time</dt>
          <dd>{rules.leadDays} hari</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Jam cutoff</dt>
          <dd>{rules.cutoffTime} WIB</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Kapasitas default</dt>
          <dd>{rules.slotsPerDay} per hari</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Hampir penuh bila sisa ≤</dt>
          <dd>{rules.nearlyFullThreshold}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">Libur rutin</dt>
          <dd>{closed.length ? closed.join(", ") : "Tidak ada"}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">
        Hanya pemilik yang dapat mengubah aturan ini.
      </p>
    </section>
  );
}
