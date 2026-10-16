"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BLOCK_CATEGORY_LABEL,
  BLOCK_LIST,
  type BlockCategory,
  type BlockType,
} from "@/features/pages/blocks";

const CATEGORIES = Object.keys(BLOCK_CATEGORY_LABEL) as BlockCategory[];

/** Dialog listing the 17 block types grouped by category. */
export function BlockPicker({
  onPick,
  label = "Tambah blok",
}: {
  onPick: (type: BlockType) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          <Plus /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pilih jenis blok</DialogTitle>
          <DialogDescription>
            Blok baru ditambahkan setelah section yang sedang dipilih (atau di
            akhir).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          {CATEGORIES.map((cat) => {
            const defs = BLOCK_LIST.filter((d) => d.category === cat);
            if (!defs.length) return null;
            return (
              <section key={cat} aria-labelledby={`cat-${cat}`}>
                <h2
                  id={`cat-${cat}`}
                  className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                  {BLOCK_CATEGORY_LABEL[cat]}
                </h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {defs.map((d) => (
                    <li key={d.type}>
                      <button
                        type="button"
                        className="flex h-full w-full flex-col items-start gap-0.5 rounded-lg border border-input bg-card p-3 text-left hover:border-primary hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                        onClick={() => {
                          onPick(d.type);
                          setOpen(false);
                        }}
                      >
                        <span className="text-sm font-medium">{d.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {d.description}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
