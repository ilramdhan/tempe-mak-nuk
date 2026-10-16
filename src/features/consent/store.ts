"use client";

import { useSyncExternalStore } from "react";

import {
  buildCookieString,
  hasConsent,
  parseConsent,
  readCookieValue,
  type ConsentRecord,
} from "./cookie";

const CHANGE = "tmn-consent-change";
const OPEN = "tmn-consent-open";

function subscribe(cb: () => void) {
  window.addEventListener(CHANGE, cb);
  return () => window.removeEventListener(CHANGE, cb);
}
const clientSnapshot = () => readCookieValue(document.cookie) ?? "";
/** `undefined` during SSR/hydration → consumers render nothing until mounted. */
const serverSnapshot = (): string | undefined => undefined;

/** Stored record (null = none/invalid), or `undefined` before hydration. */
export function useStoredConsent(): ConsentRecord | null | undefined {
  const raw = useSyncExternalStore<string | undefined>(
    subscribe,
    clientSnapshot,
    serverSnapshot,
  );
  return raw === undefined ? undefined : parseConsent(raw);
}

export function saveConsent(record: ConsentRecord) {
  document.cookie = buildCookieString(record, location.protocol === "https:");
  window.dispatchEvent(new Event(CHANGE));
}

export function openConsentPreferences() {
  window.dispatchEvent(new Event(OPEN));
}

export function onOpenConsentPreferences(cb: () => void) {
  window.addEventListener(OPEN, cb);
  return () => window.removeEventListener(OPEN, cb);
}

let currentVersion = 1;
/** Called by <ConsentUi> so hooks know the active config version. */
export function setConsentVersion(v: number) {
  if (v === currentVersion) return;
  currentVersion = v;
  window.dispatchEvent(new Event(CHANGE));
}

/** True once the visitor has allowed `category` under the current config version. */
export function useConsent(
  category: string,
  configVersion: number = currentVersion,
): boolean {
  const stored = useStoredConsent();
  return stored ? hasConsent(stored, configVersion, category) : false;
}
