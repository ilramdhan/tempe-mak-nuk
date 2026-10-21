"use client";

import { ImageIcon, Loader2, Search } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getMediaLibraryItem,
  searchMediaLibrary,
  type MediaLibraryItem,
} from "@/features/media/library-actions";
import { cn } from "@/lib/utils";

import { MediaUploader } from "./media-uploader";

const PAGE = 24;

export type MediaPickerProps = {
  /** Selected media id, or null. */
  value: string | null;
  onChange: (id: string | null, item: MediaLibraryItem | null) => void;
  /** id for the trigger button (pair with <FieldLabel htmlFor>). */
  id?: string;
  invalid?: boolean;
  ariaDescribedBy?: string;
  /** Accessible name when no visible <label htmlFor={id}> exists. */
  ariaLabel?: string;
  /** Allow clearing the selection (default true). */
  clearable?: boolean;
  noneLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Known item for `value` (skips a fetch for the preview). */
  initialItem?: Pick<MediaLibraryItem, "id" | "url" | "alt"> | null;
};

/**
 * Reusable media field (P5.8): preview + "Pilih gambar" opens a dialog to search the library
 * (paged) or upload new images (alt required). Value is a media id. Keyboard: Tab to the grid,
 * arrow keys move between images, Enter/Space selects, Esc closes.
 */
export function MediaPicker({
  value,
  onChange,
  id,
  invalid,
  ariaDescribedBy,
  ariaLabel,
  clearable = true,
  noneLabel = "Belum ada gambar dipilih",
  disabled,
  className,
  initialItem,
}: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<Pick<
    MediaLibraryItem,
    "id" | "url" | "alt"
  > | null>(initialItem && initialItem.id === value ? initialItem : null);
  const [missing, setMissing] = useState(false);

  // Resolve the preview for an externally supplied value.
  useEffect(() => {
    if (!value) return;
    if (current?.id === value) return;
    let alive = true;
    getMediaLibraryItem(value)
      .then((res) => {
        if (!alive) return;
        if (res.ok && res.data) {
          setCurrent(res.data);
          setMissing(false);
        } else setMissing(res.ok);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [value, current?.id]);

  const shown = value && current?.id === value ? current : null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div
          className={cn(
            "flex aspect-video w-40 shrink-0 items-center justify-center overflow-hidden rounded-md border border-input bg-surface",
            invalid && "border-destructive",
          )}
        >
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shown.url}
              alt={`Pratinjau: ${shown.alt}`}
              className="size-full object-cover"
            />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="truncate text-sm text-muted-foreground">
            {shown
              ? shown.alt
              : value
                ? missing
                  ? `Media ${value.slice(0, 8)}… tidak ditemukan`
                  : "Memuat…"
                : noneLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              id={id}
              variant="secondary"
              size="sm"
              disabled={disabled}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={ariaDescribedBy}
              aria-label={ariaLabel}
              aria-haspopup="dialog"
              onClick={() => setOpen(true)}
            >
              {value ? "Ganti gambar" : "Pilih gambar"}
            </Button>
            {clearable && value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  onChange(null, null);
                }}
              >
                Hapus pilihan
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {open ? (
        <MediaPickerDialog
          open={open}
          onOpenChange={setOpen}
          value={value}
          onSelect={(item) => {
            setCurrent(item);
            setMissing(false);
            onChange(item.id, item);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

/** The library dialog on its own (e.g. for galleries that add several items). */
export function MediaPickerDialog({
  open,
  onOpenChange,
  value,
  onSelect,
  title = "Pilih gambar",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: string | null;
  onSelect: (item: MediaLibraryItem) => void;
  title?: string;
}) {
  const searchId = useId();
  const [tab, setTab] = useState<"pustaka" | "unggah">("pustaka");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [highlight, setHighlight] = useState<string | null>(value ?? null);
  const gridRef = useRef<HTMLDivElement>(null);
  const reqRef = useRef(0);

  const load = useCallback((query: string, offset: number) => {
    const req = ++reqRef.current;
    startLoading(async () => {
      try {
        const res = await searchMediaLibrary({
          q: query || undefined,
          limit: PAGE,
          offset,
        });
        if (req !== reqRef.current) return;
        if (res.ok) {
          setItems((prev) =>
            offset ? [...prev, ...res.data.items] : res.data.items,
          );
          setHasMore(res.data.hasMore);
          setError(null);
        } else setError(res.error);
      } catch {
        if (req === reqRef.current)
          setError("Gagal terhubung ke server. Coba lagi.");
      }
    });
  }, []);

  // Debounced search (also the initial load).
  useEffect(() => {
    const t = setTimeout(() => load(q.trim(), 0), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q, load]);

  const selected = items.find((i) => i.id === highlight) ?? null;

  function onGridKey(e: React.KeyboardEvent<HTMLDivElement>) {
    const buttons = Array.from(
      gridRef.current?.querySelectorAll<HTMLButtonElement>(
        "[data-media-option]",
      ) ?? [],
    );
    const idx = buttons.findIndex((b) => b === document.activeElement);
    if (idx < 0) return;
    const cols = Math.max(
      1,
      Math.round(
        (gridRef.current?.clientWidth ?? 1) / (buttons[0]?.offsetWidth || 1),
      ),
    );
    const delta = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: cols,
      ArrowUp: -cols,
      Home: -idx,
      End: buttons.length - 1 - idx,
    }[e.key];
    if (delta === undefined) return;
    e.preventDefault();
    buttons[Math.min(buttons.length - 1, Math.max(0, idx + delta))]?.focus();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Pilih dari pustaka media atau unggah gambar baru (teks alt wajib).
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as typeof tab)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList>
            <TabsTrigger value="pustaka">Pustaka</TabsTrigger>
            <TabsTrigger value="unggah">Unggah baru</TabsTrigger>
          </TabsList>
          <TabsContent
            value="pustaka"
            className="flex min-h-0 flex-1 flex-col gap-3 pt-3"
          >
            <div className="relative">
              <label htmlFor={searchId} className="sr-only">
                Cari media
              </label>
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id={searchId}
                type="search"
                value={q}
                placeholder="Cari teks alt atau nama berkas…"
                className="pl-9"
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            {error ? (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {items.length === 0 && !loading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {q
                    ? "Tidak ada media yang cocok."
                    : "Belum ada media. Unggah di tab “Unggah baru”."}
                </p>
              ) : (
                <div
                  ref={gridRef}
                  role="listbox"
                  aria-label="Pustaka media"
                  className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6"
                  onKeyDown={onGridKey}
                >
                  {items.map((m, i) => {
                    const active = m.id === highlight;
                    const tabbable = items.some((x) => x.id === highlight)
                      ? active
                      : i === 0;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        data-media-option
                        tabIndex={tabbable ? 0 : -1}
                        title={m.alt}
                        onClick={() => setHighlight(m.id)}
                        onDoubleClick={() => onSelect(m)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (active) onSelect(m);
                            else setHighlight(m.id);
                          }
                        }}
                        className={cn(
                          "relative aspect-square overflow-hidden rounded-md border-2 border-transparent bg-surface outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          active && "border-primary",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.url}
                          alt={m.alt}
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              )}
              {loading ? (
                <p
                  className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  <Loader2 className="size-4 animate-spin" aria-hidden />{" "}
                  Memuat…
                </p>
              ) : hasMore ? (
                <div className="flex justify-center py-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => load(q.trim(), items.length)}
                  >
                    Muat lebih banyak
                  </Button>
                </div>
              ) : null}
            </div>
          </TabsContent>
          <TabsContent
            value="unggah"
            className="min-h-0 flex-1 overflow-y-auto pt-3"
          >
            <MediaUploader
              onUploaded={(item) => {
                setItems((prev) => [
                  item,
                  ...prev.filter((p) => p.id !== item.id),
                ]);
                setHighlight(item.id);
              }}
              onFinished={(count) => {
                if (count > 0) setTab("pustaka");
              }}
            />
          </TabsContent>
        </Tabs>
        <DialogFooter className="items-center gap-2 sm:justify-between">
          <p
            className="truncate text-sm text-muted-foreground"
            aria-live="polite"
          >
            {selected ? `Dipilih: ${selected.alt}` : "Belum ada yang dipilih"}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={!selected}
              onClick={() => selected && onSelect(selected)}
            >
              Gunakan gambar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
