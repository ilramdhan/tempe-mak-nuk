/**
 * Admin shell public API (P5.1). Import from "@/components/admin/shell".
 * - PageHeader     — title/description/actions header for every admin page (server-safe).
 * - RoleGate       — hide UI for roles below `role` (client; UI only, re-check server-side).
 * - useAdminUser / useHasRole — current admin in client components inside the admin layout.
 * - ADMIN_NAV / navForRole    — sidebar definition (owner-only items filtered for editors).
 */
export { PageHeader, type PageHeaderProps } from "./page-header";
export { RoleGate } from "./role-gate";
export {
  ADMIN_NAV,
  isNavItemActive,
  navForRole,
  type AdminNavGroup,
  type AdminNavItem,
} from "./nav";
export {
  adminDisplayName,
  useAdminUser,
  useHasRole,
  type AdminUser,
} from "./user-context";
