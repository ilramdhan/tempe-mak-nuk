import { SlotDot } from "@/components/ui/badge";
import { AVAILABILITY_LABEL } from "@/features/slots/availability";
import { cn } from "@/lib/utils";

const LEGEND_COLOR = {
  available: "flex text-slot-available",
  nearly: "flex text-slot-nearly",
  full: "flex text-slot-full",
  closed: "flex text-slot-closed",
} as const;

/** Legend for the calendar markers (status + shape). */
export function SlotLegend({
  id,
  className,
}: {
  id?: string;
  className?: string;
}) {
  const items = ["available", "nearly", "full", "closed"] as const;
  return (
    <ul
      id={id}
      className={cn(
        "flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground",
        className,
      )}
    >
      {items.map((s) => (
        <li key={s} className="flex items-center gap-2">
          <span className={LEGEND_COLOR[s]}>
            <SlotDot status={s} />
          </span>
          <span>
            {s === "closed"
              ? `${AVAILABILITY_LABEL.closed} / lewat batas`
              : AVAILABILITY_LABEL[s]}
          </span>
        </li>
      ))}
    </ul>
  );
}
