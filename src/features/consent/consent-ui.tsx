"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

import {
  acceptAll,
  isConsentCurrent,
  normalizeCategories,
  rejectOptional,
} from "./cookie";
import {
  onOpenConsentPreferences,
  saveConsent,
  setConsentVersion,
  useStoredConsent,
} from "./store";
import type { ConsentConfigProps } from "./types";

export function ConsentUi({
  config,
  privacyHref,
  cookieHref,
}: ConsentConfigProps) {
  const stored = useStoredConsent();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const titleId = useId();

  useEffect(() => setConsentVersion(config.version), [config.version]);

  useEffect(
    () =>
      onOpenConsentPreferences(() => {
        setDraft(stored?.categories ?? rejectOptional(config.categories));
        setDialogOpen(true);
      }),
    [stored, config.categories],
  );

  const decide = (categories: string[]) => {
    saveConsent({
      version: config.version,
      categories: normalizeCategories(categories, config.categories),
      ts: Date.now(),
    });
    setDialogOpen(false);
  };

  const needsPrompt =
    stored !== undefined && !isConsentCurrent(stored, config.version);

  return (
    <>
      {needsPrompt && !dialogOpen ? (
        <section
          role="region"
          aria-labelledby={titleId}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background p-4 shadow-lg sm:inset-x-4 sm:bottom-4 sm:rounded-2xl sm:border"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-4 md:flex-row md:items-center">
            <div className="flex-1 text-sm">
              <p id={titleId} className="font-medium">
                Pengaturan cookie
              </p>
              <p className="mt-1 text-muted-foreground">
                {config.bannerText}{" "}
                <a className="underline underline-offset-4" href={cookieHref}>
                  Kebijakan cookie
                </a>
                {" · "}
                <a className="underline underline-offset-4" href={privacyHref}>
                  Kebijakan privasi
                </a>
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 md:w-auto">
              <Button
                variant="secondary"
                size="md"
                onClick={() => decide(rejectOptional(config.categories))}
              >
                Tolak
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setDraft(rejectOptional(config.categories));
                  setDialogOpen(true);
                }}
              >
                Atur
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => decide(acceptAll(config.categories))}
              >
                Terima semua
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pengaturan cookie</DialogTitle>
            <DialogDescription>
              Pilih kategori cookie yang boleh dipakai. Anda bisa mengubahnya
              kapan saja.
            </DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-4">
            {config.categories.map((c) => {
              const checked = c.required || draft.includes(c.key);
              return (
                <li
                  key={c.key}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="text-sm">
                    <p id={`cc-${c.key}`} className="font-medium">
                      {c.label}
                    </p>
                    <p className="text-muted-foreground">{c.description}</p>
                  </div>
                  <Switch
                    aria-labelledby={`cc-${c.key}`}
                    checked={checked}
                    disabled={c.required}
                    onCheckedChange={(on) =>
                      setDraft((d) =>
                        on ? [...d, c.key] : d.filter((k) => k !== c.key),
                      )
                    }
                  />
                </li>
              );
            })}
          </ul>
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              variant="secondary"
              onClick={() => decide(rejectOptional(config.categories))}
            >
              Tolak
            </Button>
            <Button variant="secondary" onClick={() => decide(draft)}>
              Simpan pilihan
            </Button>
            <Button
              variant="secondary"
              onClick={() => decide(acceptAll(config.categories))}
            >
              Terima semua
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
