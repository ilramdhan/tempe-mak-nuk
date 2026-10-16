"use client";

import type { ReactNode } from "react";

import { openConsentPreferences } from "./store";

/** Footer button that reopens the cookie preferences dialog. */
export function ConsentSettingsButton({
  className,
  children = "Pengaturan cookie",
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={openConsentPreferences}
    >
      {children}
    </button>
  );
}
