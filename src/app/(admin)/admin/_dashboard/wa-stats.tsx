import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getWaClickStats } from "@/features/analytics/queries.admin";
import { formatDateShort, toDateKey } from "@/lib/dates";

import { fillDailySeries, KIND_LABEL, percent } from "./aggregate";

const DAYS = 30;

export async function WaStatsCard({ now }: { now: Date }) {
  const stats = await getWaClickStats(DAYS);
  const series = fillDailySeries(stats.byDay, toDateKey(now), DAYS);
  const max = Math.max(1, ...series.map((s) => s.total));
  const topSources = stats.bySource.slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Klik WhatsApp 30 hari</CardTitle>
        <CardDescription>
          <span className="text-2xl font-semibold text-foreground tabular-nums">
            {stats.total}
          </span>{" "}
          klik total
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div
            className="flex h-20 items-end gap-px"
            role="img"
            aria-label={`Tren klik harian, ${stats.total} klik dalam ${DAYS} hari`}
          >
            {series.map((s) => (
              <div
                key={s.day}
                title={`${formatDateShort(s.day)}: ${s.total} klik`}
                className="min-h-px flex-1 rounded-t-sm bg-primary/80"
                style={{
                  height: `${s.total === 0 ? 1 : Math.max(4, percent(s.total, max))}%`,
                }}
              />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{formatDateShort(series[0].day)}</span>
            <span>{formatDateShort(series[series.length - 1].day)}</span>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium">Per jenis</h3>
            {stats.byKind.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada klik.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {stats.byKind.map((k) => (
                  <li key={k.kind} className="flex justify-between gap-2">
                    <span>{KIND_LABEL[k.kind] ?? k.kind}</span>
                    <span className="tabular-nums">{k.total}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium">Sumber teratas</h3>
            {topSources.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada klik.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {topSources.map((s) => (
                  <li key={s.source ?? "-"} className="space-y-0.5">
                    <div className="flex justify-between gap-2">
                      <span className="truncate">
                        {s.source || "(tanpa sumber)"}
                      </span>
                      <span className="tabular-nums">{s.total}</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${percent(s.total, topSources[0].total)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
