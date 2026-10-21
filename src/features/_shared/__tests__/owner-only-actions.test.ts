/**
 * P7.3: destructive / sensitive Server Actions must require role "owner" on the SERVER
 * (the admin UI hides them via RoleGate, but Drizzle bypasses RLS, so the action is the only gate).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: { entity: string; action: string; role?: string }[] = [];

vi.mock("server-only", () => ({}));
vi.mock("@/features/_shared/admin-action", () => ({
  adminAction: vi.fn(
    async (opts: { entity: string; action: string; role?: string }) => {
      calls.push({ entity: opts.entity, action: opts.action, role: opts.role });
      return { ok: false, error: "stub" };
    },
  ),
}));
vi.mock("@/lib/auth/require-role", () => ({
  requireRole: vi.fn(),
  AuthError: class extends Error {},
}));
vi.mock("@/db/client", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/audit", () => ({ writeAudit: vi.fn() }));
vi.mock("@/features/_shared/revalidate", () => ({ expireTags: vi.fn() }));

const ID = "00000000-0000-4000-8000-000000000001";

beforeEach(() => {
  calls.length = 0;
});

async function roleOf(
  run: () => Promise<unknown>,
): Promise<string | undefined> {
  await run();
  expect(calls).toHaveLength(1);
  return calls[0].role;
}

describe("owner-only server actions", () => {
  it.each([
    [
      "deleteFaq",
      () => import("@/features/faqs/actions").then((m) => m.deleteFaq(ID)),
    ],
    [
      "deleteTestimonial",
      () =>
        import("@/features/testimonials/actions").then((m) =>
          m.deleteTestimonial(ID),
        ),
    ],
    [
      "deleteNavItem",
      () =>
        import("@/features/navigation/actions").then((m) =>
          m.deleteNavItem(ID),
        ),
    ],
    [
      "deleteAnnouncement",
      () =>
        import("@/features/navigation/actions").then((m) =>
          m.deleteAnnouncement(ID),
        ),
    ],
    [
      "deleteMedia",
      () => import("@/features/media/actions").then((m) => m.deleteMedia(ID)),
    ],
    [
      "deleteProduct",
      () =>
        import("@/features/products/actions").then((m) => m.deleteProduct(ID)),
    ],
    [
      "deleteProductShape",
      () =>
        import("@/features/products/actions").then((m) =>
          m.deleteProductShape(ID),
        ),
    ],
    [
      "deleteProductSize",
      () =>
        import("@/features/products/actions").then((m) =>
          m.deleteProductSize(ID),
        ),
    ],
    [
      "deletePage",
      () => import("@/features/pages/actions").then((m) => m.deletePage(ID)),
    ],
    [
      "removeRedirect",
      () =>
        import("@/features/redirects/actions").then((m) =>
          m.removeRedirect(ID),
        ),
    ],
    [
      "deletePost",
      () => import("@/features/posts/actions").then((m) => m.deletePost(ID)),
    ],
    [
      "deleteRecipe",
      () =>
        import("@/features/recipes/actions").then((m) => m.deleteRecipe(ID)),
    ],
    [
      "setRolePermission",
      () =>
        import("@/features/permissions/actions").then((m) =>
          m.setRolePermission({
            role: "editor",
            permission: "posts.delete",
            allowed: true,
          }),
        ),
    ],
    [
      "setUserPermission",
      () =>
        import("@/features/permissions/actions").then((m) =>
          m.setUserPermission({
            userId: ID,
            permission: "posts.delete",
            allowed: false,
          }),
        ),
    ],
    [
      "deleteMediaAndFile",
      () =>
        import("@/features/media/library-actions").then((m) =>
          m.deleteMediaAndFile(ID),
        ),
    ],
    [
      "setUserRole",
      () =>
        import("@/features/users/actions").then((m) =>
          m.setUserRole({ id: ID, role: "editor" }),
        ),
    ],
  ])("%s requires owner", async (_name, run) => {
    expect(await roleOf(run)).toBe("owner");
  });

  it("updateSettings: owner for business keys, editor for contact keys", async () => {
    const { updateSettings } = await import("@/features/settings/actions");
    expect(await roleOf(() => updateSettings({ "business.name": "X" }))).toBe(
      "owner",
    );
    calls.length = 0;
    expect(
      await roleOf(() => updateSettings({ "contact.email": "a@b.co" })),
    ).toBe("editor");
  });
});
