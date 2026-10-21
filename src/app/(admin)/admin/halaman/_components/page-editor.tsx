"use client";

import {
  AlertTriangle,
  ExternalLink,
  LoaderCircle,
  RotateCcw,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { savePageContent } from "@/features/pages/actions";
import { BLOCK_REGISTRY, type BlockType } from "@/features/pages/blocks";

import {
  applySavedIds,
  editorReducer,
  isDirty,
  mapServerErrors,
  snapshot,
  toPageInput,
  toSaveSections,
  validateEditor,
  type EditorState,
  type Validation,
} from "../_lib/editor-state";
import type { Path } from "../_lib/path";
import { BLOCK_FORMS, FormLevelErrors, FrameFields } from "./block-forms";
import { BlockPicker } from "./block-picker";
import { BlockFormProvider } from "./fields";
import { PageMetaForm } from "./page-meta-form";
import { SectionList, sectionSummary } from "./section-list";
import type { BuilderOptions, EditorPage } from "./types";
import { useUnsavedGuard } from "./use-unsaved-guard";

function toState(page: EditorPage): EditorState {
  return {
    page: {
      slug: page.slug,
      title: page.title,
      status: page.status,
      seo: {
        title: page.seo.title ?? "",
        description: page.seo.description ?? "",
        ogImageId: page.seo.ogImageId ?? null,
        noindex: page.seo.noindex ?? false,
      },
    },
    sections: page.sections.map((s) => ({
      key: s.key,
      id: s.id,
      type: s.type,
      data: s.data,
      visible: s.visible,
    })),
  };
}

const newKey = () => `new-${crypto.randomUUID()}`;
const publicPath = (slug: string) => (slug === "home" ? "/" : `/${slug}`);

export function PageEditor({
  page,
  options,
}: {
  page: EditorPage;
  options: BuilderOptions;
}) {
  const router = useRouter();
  const [state, dispatch] = useReducer(editorReducer, page, toState);
  const [saved, setSaved] = useState(() => snapshot(toState(page)));
  const [baseUpdatedAt, setBaseUpdatedAt] = useState(page.updatedAt);
  const [selectedKey, setSelectedKey] = useState<string | null>(
    page.sections[0]?.key ?? null,
  );
  const [tab, setTab] = useState<"sections" | "meta">("sections");
  /** Validation is shown after the first save attempt (then live). */
  const [showErrors, setShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<Validation | null>(null);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  /** Bumped on discard so field-local buffers (rich text textarea) re-initialise. */
  const [formVersion, setFormVersion] = useState(0);
  const [saving, startSaving] = useTransition();
  const formRef = useRef<HTMLDivElement>(null);

  const dirty = isDirty(state, saved);
  useUnsavedGuard(dirty);

  const live = useMemo(() => validateEditor(state), [state]);
  const shown: Validation = useMemo(() => {
    if (!showErrors)
      return serverErrors ?? { page: {}, sections: {}, count: 0 };
    if (!serverErrors) return live;
    return {
      page: { ...serverErrors.page, ...live.page },
      sections: { ...serverErrors.sections, ...live.sections },
      count: live.count + serverErrors.count,
    };
  }, [showErrors, live, serverErrors]);
  const errorCounts = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(shown.sections).map(([k, v]) => [
          k,
          Object.keys(v).length,
        ]),
      ),
    [shown],
  );

  const selectedIndex = state.sections.findIndex((s) => s.key === selectedKey);
  const selected =
    selectedIndex >= 0 ? state.sections[selectedIndex] : undefined;

  const setField = useCallback(
    (path: Path, value: unknown) => {
      if (!selectedKey) return;
      setServerErrors(null);
      dispatch({ type: "field", key: selectedKey, path, value });
    },
    [selectedKey],
  );

  function add(type: BlockType) {
    const key = newKey();
    const index =
      selectedIndex >= 0 ? selectedIndex + 1 : state.sections.length;
    dispatch({ type: "add", blockType: type, index, key });
    setSelectedKey(key);
    setTab("sections");
  }

  function duplicate(key: string) {
    const k = newKey();
    dispatch({ type: "duplicate", key, newKey: k });
    setSelectedKey(k);
  }

  function confirmRemove() {
    if (!pendingRemove) return;
    const i = state.sections.findIndex((s) => s.key === pendingRemove);
    dispatch({ type: "remove", key: pendingRemove });
    if (pendingRemove === selectedKey) {
      const next = state.sections[i + 1] ?? state.sections[i - 1];
      setSelectedKey(next?.key ?? null);
    }
    setPendingRemove(null);
  }

  function save() {
    setShowErrors(true);
    setServerErrors(null);
    if (live.count > 0) {
      toast.error(`Ada ${live.count} isian yang perlu diperbaiki.`);
      const firstKey = state.sections.find((s) => live.sections[s.key])?.key;
      if (Object.keys(live.page).length) setTab("meta");
      else if (firstKey) {
        setTab("sections");
        setSelectedKey(firstKey);
      }
      return;
    }
    const sent = state;
    startSaving(async () => {
      try {
        const res = await savePageContent({
          pageId: page.id,
          baseUpdatedAt,
          page: toPageInput(sent.page),
          sections: toSaveSections(sent.sections),
        });
        if (!res.ok) {
          const mapped = mapServerErrors(sent, res.fieldErrors);
          setServerErrors(mapped.count ? mapped : null);
          toast.error(res.error);
          return;
        }
        const next = applySavedIds(sent, res.data.sectionIds);
        dispatch({
          type: "assignIds",
          ids: Object.fromEntries(next.sections.map((x) => [x.key, x.id!])),
        });
        setSaved(snapshot(next));
        setBaseUpdatedAt(res.data.updatedAt);
        setShowErrors(false);
        toast.success("Halaman disimpan.");
        if (sent.page.slug !== page.slug)
          toast.info(
            "Slug berubah — pastikan rute situs & redirect sudah sesuai.",
          );
        router.refresh();
      } catch {
        toast.error("Gagal terhubung ke server. Coba lagi.");
      }
    });
  }

  function discard() {
    if (!window.confirm("Buang semua perubahan yang belum disimpan?")) return;
    // Back to the last saved version (may be newer than the initial props).
    dispatch({ type: "reset", state: restoreFromSnapshot(saved, state) });
    setFormVersion((v) => v + 1);
    setShowErrors(false);
    setServerErrors(null);
  }

  // Ctrl/Cmd+S saves.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const Form = selected ? BLOCK_FORMS[selected.type] : null;
  const removing = pendingRemove
    ? state.sections.find((s) => s.key === pendingRemove)
    : undefined;
  const metaErrorCount = Object.keys(shown.page).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Sticky action bar */}
      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div
          className="flex min-w-0 flex-1 items-center gap-2 text-sm"
          role="status"
          aria-live="polite"
        >
          {dirty ? (
            <Badge
              variant="outline"
              className="border-accent-strong text-accent-strong"
            >
              Belum disimpan
            </Badge>
          ) : (
            <span className="text-muted-foreground">
              Semua perubahan tersimpan
            </span>
          )}
          {showErrors && shown.count ? (
            <span className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="size-4" aria-hidden /> {shown.count}{" "}
              masalah
            </span>
          ) : null}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link
            href={`/admin/halaman/${page.id}/pratinjau`}
            target="_blank"
            rel="noopener"
          >
            <ExternalLink /> Pratinjau{dirty ? " (versi tersimpan)" : ""}
          </Link>
        </Button>
        {state.page.status === "published" ? (
          <Button asChild variant="ghost" size="sm">
            <a
              href={publicPath(page.slug)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink /> Lihat di situs
            </a>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!dirty || saving}
          onClick={discard}
        >
          <RotateCcw /> Buang perubahan
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={saving || !dirty}
          onClick={save}
          aria-keyshortcuts="Control+S Meta+S"
        >
          {saving ? <LoaderCircle className="animate-spin" /> : <Save />} Simpan
        </Button>
      </div>

      {page.sections.some((s) => s.issues.length) ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Beberapa section tersimpan tidak valid</AlertTitle>
          <AlertDescription>
            Section bertanda masalah tidak tampil di situs sampai diperbaiki dan
            disimpan.
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs value={tab} onValueChange={(v) => setTab(v as "sections" | "meta")}>
        <TabsList>
          <TabsTrigger value="sections">
            Section ({state.sections.length})
          </TabsTrigger>
          <TabsTrigger value="meta">
            Info & SEO
            {metaErrorCount ? (
              <span className="ml-1 text-destructive">({metaErrorCount})</span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="mt-4">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-medium">Urutan section</h2>
                <BlockPicker onPick={add} />
              </div>
              <SectionList
                sections={state.sections}
                selectedKey={selectedKey}
                errorCounts={errorCounts}
                onSelect={(k) => {
                  setSelectedKey(k);
                  requestAnimationFrame(() => formRef.current?.focus());
                }}
                onMove={(from, to) => dispatch({ type: "move", from, to })}
                onToggle={(k) => dispatch({ type: "toggle", key: k })}
                onDuplicate={duplicate}
                onRemove={setPendingRemove}
              />
              <p className="text-xs text-muted-foreground">
                Seret pegangan, atau fokus pegangan lalu tekan Spasi + panah
                untuk mengurutkan. Perubahan baru berlaku setelah disimpan.
              </p>
            </div>

            <div
              ref={formRef}
              tabIndex={-1}
              className="min-w-0 rounded-lg border border-input bg-card p-4 outline-none sm:p-6"
              aria-labelledby={selected ? "block-form-title" : undefined}
            >
              {selected && Form ? (
                <BlockFormProvider
                  key={`${selected.key}:${formVersion}`}
                  data={selected.data}
                  errors={shown.sections[selected.key] ?? {}}
                  set={setField}
                  options={options}
                  idPrefix={`b${selectedIndex}`}
                >
                  <div className="mb-5 flex flex-col gap-1">
                    <h2 id="block-form-title" className="text-lg font-medium">
                      {selectedIndex + 1}. {BLOCK_REGISTRY[selected.type].label}
                      {sectionSummary(selected) ? (
                        <span className="text-muted-foreground">
                          {" "}
                          — {sectionSummary(selected)}
                        </span>
                      ) : null}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {BLOCK_REGISTRY[selected.type].description}
                    </p>
                    {!selected.visible ? (
                      <p className="text-sm text-accent-strong">
                        Section ini disembunyikan dan tidak tampil di situs.
                      </p>
                    ) : null}
                    {page.sections.find((s) => s.key === selected.key)?.issues
                      .length && !showErrors ? (
                      <ul className="mt-2 list-disc pl-5 text-sm text-destructive">
                        {page.sections
                          .find((s) => s.key === selected.key)!
                          .issues.slice(0, 5)
                          .map((i) => (
                            <li key={i}>{i}</li>
                          ))}
                      </ul>
                    ) : null}
                  </div>
                  <FormLevelErrors />
                  <div className="flex flex-col gap-5">
                    <Form />
                    <details className="rounded-lg border border-input p-4">
                      <summary className="cursor-pointer text-sm font-medium">
                        Tampilan section
                      </summary>
                      <div className="mt-4">
                        <FrameFields />
                      </div>
                    </details>
                  </div>
                </BlockFormProvider>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Pilih section di kiri untuk mengedit isinya.
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="meta" className="mt-4">
          <div className="max-w-3xl rounded-lg border border-input bg-card p-4 sm:p-6">
            <PageMetaForm
              page={state.page}
              errors={shown.page}
              isHome={page.slug === "home"}
              onChange={(path, value) => {
                setServerErrors(null);
                dispatch({ type: "page", path, value });
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={pendingRemove !== null}
        onOpenChange={(o) => !o && setPendingRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus section?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing
                ? `"${BLOCK_REGISTRY[removing.type].label}${sectionSummary(removing) ? `: ${sectionSummary(removing)}` : ""}"`
                : "Section"}{" "}
              akan dihapus dari halaman setelah Anda menekan Simpan. Untuk
              menyembunyikan sementara, pakai tombol mata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmRemove}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Rebuild state from the last saved snapshot, re-using client keys by id. */
function restoreFromSnapshot(snap: string, current: EditorState): EditorState {
  const parsed = JSON.parse(snap) as {
    page: EditorState["page"];
    sections: Omit<EditorState["sections"][number], "key">[];
  };
  const keyById = new Map(
    current.sections.filter((s) => s.id).map((s) => [s.id!, s.key]),
  );
  return {
    page: parsed.page,
    sections: parsed.sections.map((s) => ({
      ...s,
      key: (s.id && keyById.get(s.id)) || s.id || newKey(),
    })),
  };
}
