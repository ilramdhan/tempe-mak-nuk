import {
  CalendarDays,
  ChefHat,
  Images,
  LayoutDashboard,
  MessageCircleQuestionMark,
  Navigation,
  Tags,
  Newspaper,
  Package,
  PanelsTopLeft,
  Quote,
  Scale,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import { hasRole, type AdminRole } from "@/lib/auth/roles";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Minimum role to see the item (default "editor"). Pages must still call requireRole(). */
  role?: AdminRole;
};

export type AdminNavGroup = { label: string; items: AdminNavItem[] };

/** Sidebar navigation for every Fase 5 module (routes per PLAN.md ownership). */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "Ringkasan",
    items: [{ href: "/admin", label: "Dasbor", icon: LayoutDashboard }],
  },
  {
    label: "Konten",
    items: [
      { href: "/admin/halaman", label: "Halaman", icon: PanelsTopLeft },
      { href: "/admin/produk", label: "Produk", icon: Package },
      { href: "/admin/slot", label: "Slot & PO", icon: CalendarDays },
      { href: "/admin/jurnal", label: "Jurnal", icon: Newspaper },
      { href: "/admin/resep", label: "Resep", icon: ChefHat },
      { href: "/admin/faq", label: "FAQ", icon: MessageCircleQuestionMark },
      { href: "/admin/kategori", label: "Kategori", icon: Tags },
      { href: "/admin/testimoni", label: "Testimoni", icon: Quote },
      { href: "/admin/navigasi", label: "Navigasi", icon: Navigation },
      { href: "/admin/media", label: "Media", icon: Images },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
      {
        href: "/admin/pengguna",
        label: "Pengguna",
        icon: Users,
        role: "owner",
      },
      {
        href: "/admin/akses",
        label: "Hak Akses",
        icon: ShieldCheck,
        role: "owner",
      },
      {
        href: "/admin/legal",
        label: "Legal & Privasi",
        icon: Scale,
        role: "owner",
      },
    ],
  },
];

/** Nav visible to `role`: owner-only items removed for editors, empty groups dropped. */
export function navForRole(
  role: AdminRole | null | undefined,
  nav: AdminNavGroup[] = ADMIN_NAV,
): AdminNavGroup[] {
  return nav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasRole(role, item.role ?? "editor")),
    }))
    .filter((group) => group.items.length > 0);
}

/** Active state: `/admin` matches exactly; modules match their subtree. */
export function isNavItemActive(
  href: string,
  pathname: string | null,
): boolean {
  if (!pathname) return false;
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
