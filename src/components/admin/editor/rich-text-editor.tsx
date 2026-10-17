"use client";

import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
} from "@tiptap/react";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import type { TiptapDoc } from "@/lib/rich-text/schema";
import { cn } from "@/lib/utils";

import { docKey, toStoredDoc, unsupportedTypes } from "./doc-utils";
import { buildExtensions } from "./extensions";
import { ImageDialog, type EditorMediaOption } from "./image-dialog";
import { LinkDialog } from "./link-dialog";

export type RichTextEditorProps = {
  /** Tiptap JSON; `null` = empty. */
  value: TiptapDoc | null | undefined;
  /** Called with cleaned JSON (`null` when empty). */
  onChange: (value: TiptapDoc | null) => void;
  /** id for the editable element (pair with `<FieldLabel htmlFor>`). */
  id?: string;
  /** Accessible name when there is no visible label. */
  ariaLabel?: string;
  ariaDescribedBy?: string;
  invalid?: boolean;
  placeholder?: string;
  /** Media picker options for images (`mediaId` is stored on the node). */
  media?: readonly EditorMediaOption[];
  className?: string;
  /** Min height of the writing area (Tailwind class). */
  minHeightClassName?: string;
};

const isMac = () =>
  typeof navigator !== "undefined" &&
  /Mac|iP(hone|ad)/.test(navigator.platform);

/**
 * Reusable Tiptap 3 editor limited to what `renderRichText` renders: paragraphs, H2/H3,
 * bold/italic/underline, links (http/https/relative), bullet/ordered lists, blockquote,
 * images (mediaId or URL, alt required), undo/redo. SSR-safe (`immediatelyRender: false`).
 */
const noopSubscribe = () => () => {};

/**
 * Client-only mount: Tiptap's `useEditor` reads `Math.random()` during render, which
 * cacheComponents rejects while prerendering. Server/first paint shows a same-size shell.
 */
export function RichTextEditor(props: RichTextEditorProps) {
  const isClient = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  if (!isClient)
    return (
      <div
        className={cn(
          "rounded-md border border-input px-4 py-3 text-muted-foreground",
          props.minHeightClassName ?? "min-h-64",
          props.className,
        )}
        aria-busy="true"
      >
        Memuat editor…
      </div>
    );
  return <EditorInner {...props} />;
}

function EditorInner({
  value,
  onChange,
  id,
  ariaLabel,
  ariaDescribedBy,
  invalid,
  placeholder,
  media = [],
  className,
  minHeightClassName = "min-h-64",
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  // Key of the doc the editor currently holds (to tell echo from external changes).
  const lastKey = useRef(docKey(value));
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const lost = useMemo(() => unsupportedTypes(value), [value]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: buildExtensions(placeholder),
    content: value ?? null,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        role: "textbox",
        "aria-multiline": "true",
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
        ...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
        class: cn(
          "prose-tmn max-w-none px-4 py-3 outline-none [&>:first-child]:mt-0",
          minHeightClassName,
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      const doc = toStoredDoc(ed.getJSON());
      lastKey.current = docKey(doc);
      onChangeRef.current(doc);
    },
  });

  // Keep a11y attributes in sync after mount.
  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        attributes: {
          ...(id ? { id } : {}),
          role: "textbox",
          "aria-multiline": "true",
          ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
          ...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {}),
          ...(invalid ? { "aria-invalid": "true" } : {}),
          class: cn(
            "prose-tmn max-w-none px-4 py-3 outline-none [&>:first-child]:mt-0",
            minHeightClassName,
          ),
        },
      },
    });
  }, [editor, id, ariaLabel, ariaDescribedBy, invalid, minHeightClassName]);

  // External value change (load, discard changes) → replace content without emitting.
  useEffect(() => {
    if (!editor) return;
    const k = docKey(value);
    if (k === lastKey.current) return;
    lastKey.current = k;
    editor.commands.setContent(value ?? null, { emitUpdate: false });
  }, [editor, value]);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className={cn(
          "overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring/50",
          invalid && "border-destructive",
          // Placeholder (Tiptap adds data-placeholder on the empty first node).
          "[&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-muted-foreground [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
          "[&_img.ProseMirror-selectednode]:outline-2 [&_img.ProseMirror-selectednode]:outline-ring",
        )}
      >
        <Toolbar
          editor={editor}
          onLink={() => setLinkOpen(true)}
          onImage={() => setImageOpen(true)}
        />
        <EditorContent editor={editor} />
        {!editor ? (
          <div
            className={cn(
              "px-4 py-3 text-muted-foreground",
              minHeightClassName,
            )}
            aria-hidden
          >
            Memuat editor…
          </div>
        ) : null}
      </div>
      {lost.length ? (
        <p className="text-sm text-destructive">
          Konten memuat elemen yang tidak didukung editor ({lost.join(", ")});
          elemen tsb. akan hilang saat teks diubah.
        </p>
      ) : null}
      <LinkDialog
        open={linkOpen}
        initialHref={
          (editor?.getAttributes("link").href as string | undefined) ?? ""
        }
        onOpenChange={(o) => {
          setLinkOpen(o);
          if (!o) editor?.commands.focus();
        }}
        onSubmit={(href) => {
          setLinkOpen(false);
          if (!editor) return;
          const chain = editor.chain().focus().extendMarkRange("link");
          if (href === null) chain.unsetLink().run();
          else if (editor.state.selection.empty && !editor.isActive("link"))
            chain
              .insertContent({
                type: "text",
                text: href,
                marks: [{ type: "link", attrs: { href } }],
              })
              .run();
          else chain.setLink({ href }).run();
        }}
      />
      <ImageDialog
        open={imageOpen}
        media={media}
        onOpenChange={(o) => {
          setImageOpen(o);
          if (!o) editor?.commands.focus();
        }}
        onSubmit={(img) => {
          setImageOpen(false);
          editor
            ?.chain()
            .focus()
            .insertContent({
              type: "image",
              attrs: {
                src: img.src,
                alt: img.alt,
                title: img.title ?? null,
                mediaId: img.mediaId ?? null,
              },
            })
            .run();
        }}
      />
    </div>
  );
}

type ToolState = {
  paragraph: boolean;
  h2: boolean;
  h3: boolean;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  link: boolean;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  canUndo: boolean;
  canRedo: boolean;
};

function Toolbar({
  editor,
  onLink,
  onImage,
}: {
  editor: Editor | null;
  onLink: () => void;
  onImage: () => void;
}) {
  const s = useEditorState<ToolState | null>({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            paragraph: e.isActive("paragraph"),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            link: e.isActive("link"),
            bulletList: e.isActive("bulletList"),
            orderedList: e.isActive("orderedList"),
            blockquote: e.isActive("blockquote"),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });
  const mod = isMac() ? "⌘" : "Ctrl";
  const run = (fn: (e: Editor) => void) => () => {
    if (editor) fn(editor);
  };

  type Item =
    | {
        key: string;
        label: string;
        icon: LucideIcon;
        onClick: () => void;
        pressed?: boolean;
        disabled?: boolean;
      }
    | "sep";
  const items: Item[] = [
    {
      key: "p",
      label: "Paragraf",
      icon: Pilcrow,
      pressed: s?.paragraph,
      onClick: run((e) => e.chain().focus().setParagraph().run()),
    },
    {
      key: "h2",
      label: "Subjudul (H2)",
      icon: Heading2,
      pressed: s?.h2,
      onClick: run((e) => e.chain().focus().toggleHeading({ level: 2 }).run()),
    },
    {
      key: "h3",
      label: "Sub-subjudul (H3)",
      icon: Heading3,
      pressed: s?.h3,
      onClick: run((e) => e.chain().focus().toggleHeading({ level: 3 }).run()),
    },
    "sep",
    {
      key: "b",
      label: `Tebal (${mod}+B)`,
      icon: Bold,
      pressed: s?.bold,
      onClick: run((e) => e.chain().focus().toggleBold().run()),
    },
    {
      key: "i",
      label: `Miring (${mod}+I)`,
      icon: Italic,
      pressed: s?.italic,
      onClick: run((e) => e.chain().focus().toggleItalic().run()),
    },
    {
      key: "u",
      label: `Garis bawah (${mod}+U)`,
      icon: Underline,
      pressed: s?.underline,
      onClick: run((e) => e.chain().focus().toggleUnderline().run()),
    },
    {
      key: "link",
      label: "Tautan",
      icon: Link2,
      pressed: s?.link,
      onClick: onLink,
    },
    "sep",
    {
      key: "ul",
      label: "Daftar poin",
      icon: List,
      pressed: s?.bulletList,
      onClick: run((e) => e.chain().focus().toggleBulletList().run()),
    },
    {
      key: "ol",
      label: "Daftar bernomor",
      icon: ListOrdered,
      pressed: s?.orderedList,
      onClick: run((e) => e.chain().focus().toggleOrderedList().run()),
    },
    {
      key: "quote",
      label: "Kutipan",
      icon: Quote,
      pressed: s?.blockquote,
      onClick: run((e) => e.chain().focus().toggleBlockquote().run()),
    },
    { key: "img", label: "Gambar", icon: ImagePlus, onClick: onImage },
    "sep",
    {
      key: "undo",
      label: `Urungkan (${mod}+Z)`,
      icon: Undo2,
      disabled: !s?.canUndo,
      onClick: run((e) => e.chain().focus().undo().run()),
    },
    {
      key: "redo",
      label: `Ulangi (${mod}+Shift+Z)`,
      icon: Redo2,
      disabled: !s?.canRedo,
      onClick: run((e) => e.chain().focus().redo().run()),
    },
  ];

  // Roving focus: one tab stop, arrow keys move between buttons.
  const [focusIdx, setFocusIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  function onKeyDown(e: React.KeyboardEvent) {
    const btns = Array.from(
      ref.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    );
    const cur = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (cur < 0) return;
    let next = cur;
    if (e.key === "ArrowRight") next = (cur + 1) % btns.length;
    else if (e.key === "ArrowLeft")
      next = (cur - 1 + btns.length) % btns.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = btns.length - 1;
    else return;
    e.preventDefault();
    btns[next]?.focus();
    setFocusIdx(next);
  }

  let btnIndex = -1;
  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Format teks"
      onKeyDown={onKeyDown}
      className="flex flex-wrap items-center gap-0.5 border-b border-input bg-surface/60 p-1"
    >
      {items.map((it, i) => {
        if (it === "sep")
          return (
            <span
              key={`sep${i}`}
              aria-hidden
              className="mx-1 h-5 w-px bg-border"
            />
          );
        btnIndex++;
        const idx = btnIndex;
        const Icon = it.icon;
        return (
          <button
            key={it.key}
            type="button"
            title={it.label}
            aria-label={it.label}
            aria-pressed={it.pressed === undefined ? undefined : !!it.pressed}
            disabled={!editor || it.disabled}
            tabIndex={idx === focusIdx ? 0 : -1}
            onFocus={() => setFocusIdx(idx)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={it.onClick}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-sm text-foreground hover:bg-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40",
              it.pressed && "bg-background text-primary shadow-xs",
            )}
          >
            <Icon className="size-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
