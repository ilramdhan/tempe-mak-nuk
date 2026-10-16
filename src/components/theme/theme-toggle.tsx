"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore, type SVGProps } from "react";

import { cn } from "@/lib/utils";

const ORDER = ["light", "dark", "system"] as const;
type ThemeChoice = (typeof ORDER)[number];

const LABEL: Record<ThemeChoice, string> = {
  light: "Terang",
  dark: "Gelap",
  system: "Ikuti sistem",
};

// Local inline icons (lucide-react arrives with shadcn in P2.2).
function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  );
}

function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
    </svg>
  );
}

function SystemIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

const ICON: Record<ThemeChoice, typeof SunIcon> = {
  light: SunIcon,
  dark: MoonIcon,
  system: SystemIcon,
};

const noopSubscribe = () => () => {};

/** true on the client after hydration, false during SSR — no mismatch. */
function useIsClient() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function isChoice(value: string | undefined): value is ThemeChoice {
  return ORDER.includes(value as ThemeChoice);
}

/**
 * Cycles light → dark → system. Before mount it renders a stable,
 * icon-less placeholder of identical size so SSR HTML matches.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();

  const current: ThemeChoice = isClient && isChoice(theme) ? theme : "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const Icon = ICON[current];

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      disabled={!isClient}
      aria-label={
        isClient
          ? `Tema: ${LABEL[current]}. Ganti ke ${LABEL[next]}`
          : "Ganti tema"
      }
      title={isClient ? `Tema: ${LABEL[current]}` : undefined}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full border border-input text-foreground",
        "transition-colors hover:bg-surface disabled:opacity-60",
        className,
      )}
    >
      {isClient ? (
        <Icon className="size-[18px]" />
      ) : (
        <span className="size-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}
