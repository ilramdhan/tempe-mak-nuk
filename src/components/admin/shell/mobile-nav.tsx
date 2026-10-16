"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { SidebarNav } from "./sidebar-nav";

/** Hamburger + left sheet with the same nav (below lg). */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          aria-label="Buka menu admin"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 gap-0 overflow-y-auto bg-surface p-0"
      >
        <SheetHeader className="border-b border-border px-4 py-4">
          <SheetTitle>
            <Logo
              className="h-7 w-auto text-primary"
              aria-label="Tempe Mak Nuk — Admin"
            />
          </SheetTitle>
          <SheetDescription className="sr-only">
            Menu navigasi admin
          </SheetDescription>
        </SheetHeader>
        <div className="p-3">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
