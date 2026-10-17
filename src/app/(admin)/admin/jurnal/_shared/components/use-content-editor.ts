"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import { useUnsavedGuard } from "../../../halaman/_components/use-unsaved-guard";
import { fromServerErrors, type FieldErrors } from "../lib/form";

type SaveResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  data?: { id: string; slug: string };
};

/**
 * Draft state + dirty tracking + validate → Server Action → toast/errors, for the Jurnal and
 * Resep editors. Ctrl/Cmd+S saves; leaving with unsaved changes asks for confirmation.
 */
export function useContentEditor<D>(opts: {
  initial: D;
  /** null = new item */
  id: string | null;
  basePath: string;
  snapshot: (d: D) => string;
  validate: (d: D) => FieldErrors;
  save: (d: D) => Promise<SaveResult>;
  /** Map server error keys onto draft keys (e.g. filtered recipe rows). */
  mapServerErrors?: (d: D, errors: FieldErrors) => FieldErrors;
  label: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<D>(opts.initial);
  const [savedDraft, setSavedDraft] = useState<D>(opts.initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [pending, startTransition] = useTransition();
  const { snapshot, validate } = opts;

  const saved = useMemo(() => snapshot(savedDraft), [savedDraft, snapshot]);
  const dirty = useMemo(
    () => snapshot(draft) !== saved,
    [draft, saved, snapshot],
  );
  useUnsavedGuard(dirty && !pending);

  // Live re-validation after the first submit attempt.
  const shownErrors = useMemo(
    () => (submitted ? { ...errors, ...validate(draft) } : errors),
    [submitted, errors, validate, draft],
  );

  const update = useCallback((fn: (d: D) => D) => {
    setDraft(fn);
    setErrors((e) => (Object.keys(e).length ? {} : e));
  }, []);

  const optsRef = useRef(opts);
  useEffect(() => {
    optsRef.current = opts;
  });

  const submit = useCallback(() => {
    const o = optsRef.current;
    setSubmitted(true);
    const clientErrors = o.validate(draft);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      toast.error(
        `Periksa ${Object.keys(clientErrors).length} isian yang ditandai.`,
      );
      return;
    }
    const current = draft;
    startTransition(async () => {
      try {
        const res = await o.save(current);
        if (!res.ok) {
          const fe = fromServerErrors(res.fieldErrors);
          setErrors(o.mapServerErrors ? o.mapServerErrors(current, fe) : fe);
          toast.error(res.error ?? "Gagal menyimpan.");
          return;
        }
        setErrors({});
        setSubmitted(false);
        setSavedDraft(current);
        if (!o.id && res.data) {
          toast.success(`${o.label} dibuat.`);
          router.replace(`${o.basePath}/${res.data.id}`);
        } else {
          toast.success("Perubahan disimpan.");
          router.refresh();
        }
      } catch {
        toast.error("Gagal terhubung ke server. Coba lagi.");
      }
    });
  }, [draft, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submit]);

  const discard = useCallback(() => {
    setDraft(savedDraft);
    setErrors({});
    setSubmitted(false);
  }, [savedDraft]);

  return {
    draft,
    update,
    errors: shownErrors,
    dirty,
    pending,
    submit,
    discard,
  };
}
