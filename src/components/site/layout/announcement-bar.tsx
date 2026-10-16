"use client";

import { ArrowRightIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

import { InlineScript } from "./inline-script";
import { isExternalHref } from "./nav-utils";

const STORAGE_KEY = "tmn:announcement-dismissed";
const EVENT = "tmn:announcement-dismissed";

function readDismissed(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && onChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, onChange);
  };
}

export type AnnouncementBarProps = {
  id: string;
  text: string;
  href: string | null;
};

/**
 * Dismissible announcement. The dismissed id lives in localStorage (per announcement,
 * so a new one shows again). An inline script hides the bar before first paint when it
 * was dismissed, so there is no flash and no layout shift after hydration.
 */
export function AnnouncementBar({ id, text, href }: AnnouncementBarProps) {
  const dismissed = useSyncExternalStore(
    subscribe,
    () => readDismissed() === id,
    () => false,
  );
  const domId = "tmn-announcement";

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Storage blocked: hide for this page view only.
      document.getElementById(domId)?.setAttribute("hidden", "");
    }
    window.dispatchEvent(new Event(EVENT));
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [id]);

  const external = href ? isExternalHref(href) : false;
  const linkClass =
    "group inline-flex min-h-11 items-center gap-2 rounded-sm underline-offset-4 hover:underline";

  return (
    <>
      <aside
        id={domId}
        aria-label="Pengumuman"
        hidden={dismissed}
        suppressHydrationWarning
        className="relative bg-primary text-primary-foreground"
      >
        <div className="mx-auto flex min-h-11 w-full max-w-wide items-center justify-center gap-2 pr-14 pl-gutter text-center text-sm sm:pl-14">
          {href ? (
            external ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <span>{text}</span>
                <ArrowRightIcon
                  className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </a>
            ) : (
              <Link href={href} className={linkClass}>
                <span>{text}</span>
                <ArrowRightIcon
                  className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            )
          ) : (
            <p className="py-2">{text}</p>
          )}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Tutup pengumuman"
            className={cn(
              "absolute top-1/2 right-[max(0.25rem,calc(var(--gutter)-0.75rem))] inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full",
              "text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground",
              "focus-visible:outline-primary-foreground",
            )}
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
        </div>
      </aside>
      <InlineScript
        html={`try{if(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})===${JSON.stringify(id)})document.getElementById(${JSON.stringify(domId)}).hidden=true}catch(e){}`}
      />
    </>
  );
}
