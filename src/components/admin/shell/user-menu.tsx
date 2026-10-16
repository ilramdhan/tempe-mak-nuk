"use client";

import {
  ChevronsUpDown,
  ExternalLink,
  LogOut,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useTransition } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/actions";
import { ROLE_LABEL } from "@/lib/auth/roles";

import { adminDisplayName, useAdminUser } from "./user-context";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return letters.toUpperCase();
}

/** Topbar account menu: identity + role, theme, "Lihat situs", logout. */
export function UserMenu() {
  const user = useAdminUser();
  const name = adminDisplayName(user);
  const { theme, setTheme } = useTheme();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-10 items-center gap-2 rounded-full border border-input bg-card pr-3 pl-1 text-sm outline-none hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Menu akun ${name}`}
      >
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
        >
          {initials(name)}
        </span>
        <span className="hidden max-w-40 truncate font-medium sm:inline">
          {name}
        </span>
        <ChevronsUpDown
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-2">
          <span className="truncate text-sm font-semibold text-foreground">
            {name}
          </span>
          {user.email ? (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {user.email}
            </span>
          ) : null}
          <span className="mt-1 w-fit rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-foreground">
            {ROLE_LABEL[user.role]}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Tema</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={theme ?? "system"}
            onValueChange={setTheme}
          >
            <DropdownMenuRadioItem value="light">
              <Sun aria-hidden="true" /> Terang
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="dark">
              <Moon aria-hidden="true" /> Gelap
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="system">
              <Monitor aria-hidden="true" /> Ikuti sistem
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/" target="_blank" rel="noopener">
            <ExternalLink aria-hidden="true" /> Lihat situs
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          onSelect={(event) => {
            event.preventDefault();
            startTransition(async () => {
              await signOut();
            });
          }}
        >
          <LogOut aria-hidden="true" /> {pending ? "Keluar…" : "Keluar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
