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
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const restrictToVerticalAxis: Modifier = ({ transform }) => ({
  ...transform,
  x: 0,
});

type Item = { id: string };

/** Vertical sortable list: drag handle (pointer + keyboard) plus explicit up/down buttons. */
export function SortableList<T extends Item>({
  items,
  label,
  nameOf,
  onMove,
  renderItem,
  actions,
  empty,
}: {
  items: T[];
  label: string;
  nameOf: (item: T) => string;
  onMove: (from: number, to: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  actions?: (item: T, index: number) => ReactNode;
  empty?: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const nameById = (id: string | number) => {
    const it = items.find((i) => i.id === id);
    return it ? nameOf(it) : "item";
  };
  const pos = (id: string | number | undefined) =>
    items.findIndex((i) => i.id === id) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Mengambil ${nameById(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${nameById(active.id)} di atas posisi ${pos(over.id)} dari ${items.length}.`
        : undefined,
    onDragEnd: ({ active, over }) =>
      over
        ? `${nameById(active.id)} dipindah ke posisi ${pos(over.id)}.`
        : `${nameById(active.id)} dilepas.`,
    onDragCancel: ({ active }) => `Batal memindah ${nameById(active.id)}.`,
  };

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from >= 0 && to >= 0) onMove(from, to);
  }

  if (items.length === 0)
    return (
      <p className="rounded-lg border border-dashed border-input p-5 text-center text-sm text-muted-foreground">
        {empty ?? "Belum ada item."}
      </p>
    );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Tekan spasi atau Enter untuk mengambil item, panah atas/bawah untuk memindah, spasi/Enter lagi untuk melepas, Escape untuk batal.",
        },
      }}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <ol className="flex flex-col gap-2" aria-label={label}>
          {items.map((item, i) => (
            <Row
              key={item.id}
              id={item.id}
              name={nameOf(item)}
              index={i}
              total={items.length}
              onMove={onMove}
              actions={actions?.(item, i)}
            >
              {renderItem(item, i)}
            </Row>
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function Row({
  id,
  name,
  index,
  total,
  onMove,
  actions,
  children,
}: {
  id: string;
  name: string;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "flex items-center gap-1 rounded-lg border border-input bg-card p-1.5 pr-2",
        isDragging && "relative z-10 shadow-lg",
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
      <div className="min-w-0 flex-1 px-1">{children}</div>
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
        {actions}
      </div>
    </li>
  );
}
