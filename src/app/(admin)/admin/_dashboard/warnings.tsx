import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  OctagonAlertIcon,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getContentWarnings } from "@/features/dashboard/warnings";
import {
  SEVERITY_LABEL,
  type WarningSeverity,
} from "@/features/dashboard/warnings-logic";

const ICON = {
  high: OctagonAlertIcon,
  medium: AlertTriangleIcon,
  low: InfoIcon,
} satisfies Record<WarningSeverity, unknown>;

const BADGE = {
  high: "destructive",
  medium: "secondary",
  low: "outline",
} as const satisfies Record<WarningSeverity, string>;

export async function WarningsCard({ now }: { now: Date }) {
  const warnings = await getContentWarnings(now);
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Peringatan konten</CardTitle>
        <CardDescription>
          {warnings.length === 0
            ? "Semua beres. Tidak ada konten kosong atau data contoh yang perlu diperbaiki."
            : `${warnings.length} hal perlu diperbaiki sebelum situs siap tayang.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {warnings.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2Icon className="size-4" aria-hidden="true" />
            Semua beres
          </p>
        ) : (
          <ul className="divide-y">
            {warnings.map((w) => {
              const Icon = ICON[w.severity];
              return (
                <li key={w.id}>
                  <Link
                    href={w.href}
                    className="flex items-center gap-3 py-2.5 hover:bg-surface"
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 text-sm font-medium">
                      {w.message}
                    </span>
                    <Badge variant={BADGE[w.severity]}>
                      {SEVERITY_LABEL[w.severity]}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
