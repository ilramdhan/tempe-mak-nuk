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
import { InlineScript } from "@/components/site/layout/inline-script";

import {
  CONSENT_COOKIE,
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

const BANNER_ID = "tmn-consent-banner";

/**
 * Pre-paint script for the server-rendered banner (P6.4: banner paints with the HTML instead of
 * after hydration, which made it a late LCP element).
 * - Already decided for `version` → hide before first paint (no flash).
 * - Otherwise reveal once the UI font is ready (max 1.5 s), so the Geist swap can't reflow the
 *   bottom-anchored banner (CLS). It is `invisible` meanwhile — space is reserved, nothing shifts.
 * Hydration's re-render drops `data-pending` anyway, so the banner can never stay invisible.
 */
function bannerScript(version: number) {
  return `(function(){var e=document.getElementById("${BANNER_ID}");if(!e)return;try{var m=document.cookie.match(/(?:^|; )${CONSENT_COOKIE}=([^;]*)/);if(m){var r=JSON.parse(decodeURIComponent(m[1]));if(r&&r.version===${version}){e.hidden=true;return}}}catch(_){}var d=0,s=function(){if(!d){d=1;e.removeAttribute("data-pending")}};setTimeout(s,1500);try{document.fonts.load("1em "+getComputedStyle(e).fontFamily.split(",")[0]).then(s,s)}catch(_){s()}})()`;
}

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

  // `undefined` = SSR/hydration: render the banner (the inline script hides it pre-paint if decided).
  const needsPrompt =
    stored === undefined || !isConsentCurrent(stored, config.version);

  return (
    <>
      {needsPrompt && !dialogOpen ? (
        <section
          id={BANNER_ID}
          role="region"
          aria-labelledby={titleId}
          data-pending={stored === undefined ? "" : undefined}
          suppressHydrationWarning
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background p-4 shadow-lg data-pending:invisible sm:inset-x-4 sm:bottom-4 sm:rounded-2xl sm:border"
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
      {stored === undefined ? (
        <InlineScript html={bannerScript(config.version)} />
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
