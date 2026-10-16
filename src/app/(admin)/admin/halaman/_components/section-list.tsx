"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BLOCK_REGISTRY } from "@/features/pages/blocks";
import { cn } from "@/lib/utils";

import type { SectionDraft } from "../_lib/editor-state";

/** Same as @dnd-kit/modifiers' restrictToVerticalAxis (package not installed). */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

export function sectionSummary(s: SectionDraft): string {
  const d = s.data;
  const pick = (k: string) =>
    typeof d[k] === "string" && d[k] ? (d[k] as string) : null;
  return pick("headline") ?? pick("heading") ?? pick("eyebrow") ?? "";
}

type Props = {
  sections: SectionDraft[];
  selectedKey: string | null;
  errorCounts: Record<string, number>;
  onSelect: (key: string) => void;
  onMove: (from: number, to: number) => void;
  onToggle: (key: string) => void;
  onDuplicate: (key: string) => void;
  onRemove: (key: string) => void;
};

export function SectionList({
  sections,
  selectedKey,
  errorCounts,
  onSelect,
  onMove,
  onToggle,
  onDuplicate,
  onRemove,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const labelOf = (id: string | number) => {
    const i = sections.findIndex((s) => s.key === id);
    const s = sections[i];
    return s ? `${BLOCK_REGISTRY[s.type].label} (posisi ${i + 1})` : "section";
  };
  const posOf = (id: string | number | undefined) =>
    sections.findIndex((s) => s.key === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Mengambil ${labelOf(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${labelOf(active.id)} di atas posisi ${posOf(over.id)} dari ${sections.length}.`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${labelOf(active.id)} dipindah ke posisi ${posOf(over.id)}.`
        : `${labelOf(active.id)} dilepas.`,
    onDragCancel: ({ active }) => `Batal memindah ${labelOf(active.id)}.`,
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = sections.findIndex((s) => s.key === active.id);
    const to = sections.findIndex((s) => s.key === over.id);
    if (from >= 0 && to >= 0) onMove(from, to);
  }

  if (sections.length === 0)
    return (
      <p className="rounded-lg border border-dashed border-input p-6 text-center text-sm text-muted-foreground">
        Halaman ini belum punya section. Tambahkan blok pertama.
      </p>
    );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Tekan spasi atau Enter untuk mengambil section, panah atas/bawah untuk memindah, spasi/Enter lagi untuk melepas, Escape untuk batal.",
        },
      }}
    >
      <SortableContext
        items={sections.map((s) => s.key)}
        strategy={verticalListSortingStrategy}
      >
        <ol className="flex flex-col gap-2" aria-label="Urutan section">
          {sections.map((s, i) => (
            <SortableRow
              key={s.key}
              section={s}
              index={i}
              total={sections.length}
              selected={s.key === selectedKey}
              errors={errorCounts[s.key] ?? 0}
              onSelect={onSelect}
              onMove={onMove}
              onToggle={onToggle}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  section,
  index,
  total,
  selected,
  errors,
  onSelect,
  onMove,
  onToggle,
  onDuplicate,
  onRemove,
}: {
  section: SectionDraft;
  index: number;
  total: number;
  selected: boolean;
  errors: number;
} & Omit<Props, "sections" | "selectedKey" | "errorCounts">) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.key,
  });
  const def = BLOCK_REGISTRY[section.type];
  const summary = sectionSummary(section);
  const name = `${def.label}${summary ? `: ${summary}` : ""}`;
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "flex items-center gap-1 rounded-lg border bg-card p-1.5 pr-2",
        selected ? "border-primary ring-2 ring-primary/30" : "border-input",
        isDragging && "relative z-10 shadow-lg",
        !section.visible && "opacity-70",
      )}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
        aria-label={`Seret untuk mengurutkan ${name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onSelect(section.key)}
        aria-current={selected ? "true" : undefined}
        className="flex min-w-0 flex-1 flex-col items-start rounded-md px-2 py-1 text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="flex w-full items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground tabular-nums">
            {index + 1}.
          </span>
          <span className="truncate">{def.label}</span>
        </span>
        {summary || errors || !section.visible || section.id === null ? (
          <span className="flex w-full items-center gap-1.5 text-xs text-muted-foreground">
            {!section.visible ? (
              <Badge variant="outline" className="shrink-0">
                Disembunyikan
              </Badge>
            ) : null}
            {section.id === null ? (
              <Badge variant="outline" className="shrink-0">
                Baru
              </Badge>
            ) : null}
            {errors ? (
              <span className="flex shrink-0 items-center gap-1 text-xs text-destructive">
                <AlertTriangle className="size-3.5" aria-hidden />
                {errors} masalah
              </span>
            ) : null}
            {summary ? (
              <span className="min-w-0 truncate">{summary}</span>
            ) : null}
          </span>
        ) : null}
      </button>
      <div className="flex shrink-0 items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Naikkan ${name}`}
          disabled={index === 0}
          onClick={() => onMove(index, index - 1)}
        >
          <ArrowUp />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Turunkan ${name}`}
          disabled={index === total - 1}
          onClick={() => onMove(index, index + 1)}
        >
          <ArrowDown />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={
            section.visible ? `Sembunyikan ${name}` : `Tampilkan ${name}`
          }
          aria-pressed={!section.visible}
          onClick={() => onToggle(section.key)}
        >
          {section.visible ? <Eye /> : <EyeOff />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Duplikat ${name}`}
          onClick={() => onDuplicate(section.key)}
        >
          <Copy />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={`Hapus ${name}`}
          onClick={() => onRemove(section.key)}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}
