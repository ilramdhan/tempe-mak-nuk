"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createLegalVersion } from "@/features/legal/actions";
import { LEGAL_ROUTES } from "@/features/legal/schema";

import { useAdminMutation } from "../../slot/_components/use-action";
import {
  groupBySlug,
  LEGAL_SLUG_LABEL,
  STATUS_LABEL,
  type LegalRow,
} from "../_lib/legal-form";
import { formatWib } from "../../jurnal/_shared/lib/publish";

export function DocumentList({ rows }: { rows: LegalRow[] }) {
  const router = useRouter();
  const { pending, run } = useAdminMutation();
  const groups = groupBySlug(rows);

  function newVersion(slug: LegalRow["slug"]) {
    run(() => createLegalVersion(slug), {
      success: "Versi baru (draf) dibuat dari versi terakhir.",
      onDone: (res) => {
        if (res.ok) router.push(`/admin/legal/${res.data.id}`);
      },
    });
  }

  if (groups.length === 0) return <p className="text-sm text-muted-foreground">Belum ada dokumen legal.</p>;

  return (
    <div className="flex flex-col gap-4">
      {groups.map(({ slug, rows: versions }) => (
        <section key={slug} aria-labelledby={`lg-${slug}`} className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id={`lg-${slug}`} className="font-medium">
                {LEGAL_SLUG_LABEL[slug]}
              </h2>
              <p className="text-xs text-muted-foreground">Alamat publik: {LEGAL_ROUTES[slug]}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => newVersion(slug)}
            >
              Buat versi baru
            </Button>
          </div>
          <ul className="mt-3 divide-y divide-border">
            {versions.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                <Link href={`/admin/legal/${r.id}`} className="font-medium underline-offset-2 hover:underline">
                  Versi {r.version}
                </Link>
                <Badge variant={r.status === "published" ? "default" : "secondary"}>{STATUS_LABEL[r.status]}</Badge>
                <span className="text-muted-foreground">
                  {r.effectiveAt ? `Berlaku ${formatWib(r.effectiveAt)}` : "Tanggal berlaku belum diatur"}
                </span>
                {r.sample ? (
                  <span className="text-accent-strong">Dokumen contoh — perlu ditinjau ahli hukum</span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
