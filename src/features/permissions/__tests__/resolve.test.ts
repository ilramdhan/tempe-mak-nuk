import { describe, expect, it } from "vitest";

import { PERMISSIONS } from "../registry";
import {
  effectivePermissions,
  resolvePermission,
  rolePermissionValue,
  type PermissionOverrides,
} from "../resolve";

const ov = (
  role: Record<string, boolean> = {},
  user: Record<string, boolean> = {},
): PermissionOverrides => ({
  role: new Map(Object.entries(role)),
  user: new Map(Object.entries(user)),
});

describe("resolvePermission", () => {
  it("owner always has everything, even non-grantable and with deny overrides", () => {
    expect(resolvePermission({ role: "owner", key: "profiles.update" })).toBe(
      true,
    );
    expect(
      resolvePermission({
        role: "owner",
        key: "posts.delete",
        overrides: ov({ "posts.delete": false }, { "posts.delete": false }),
      }),
    ).toBe(true);
    expect(resolvePermission({ role: "owner", key: "unknown.x" })).toBe(true);
  });

  it("no role → denied", () => {
    expect(resolvePermission({ role: null, key: "posts.create" })).toBe(false);
    expect(resolvePermission({ role: undefined, key: "posts.create" })).toBe(
      false,
    );
  });

  it("editor uses registry defaults (posts/recipes delete owner-only)", () => {
    expect(resolvePermission({ role: "editor", key: "posts.create" })).toBe(
      true,
    );
    expect(resolvePermission({ role: "editor", key: "posts.delete" })).toBe(
      false,
    );
    expect(resolvePermission({ role: "editor", key: "recipes.delete" })).toBe(
      false,
    );
  });

  it("role override grants and revokes", () => {
    expect(
      resolvePermission({
        role: "editor",
        key: "posts.delete",
        overrides: ov({ "posts.delete": true }),
      }),
    ).toBe(true);
    expect(
      resolvePermission({
        role: "editor",
        key: "faqs.create",
        overrides: ov({ "faqs.create": false }),
      }),
    ).toBe(false);
  });

  it("user override wins over role override (allow and deny)", () => {
    expect(
      resolvePermission({
        role: "editor",
        key: "posts.delete",
        overrides: ov({ "posts.delete": false }, { "posts.delete": true }),
      }),
    ).toBe(true);
    expect(
      resolvePermission({
        role: "editor",
        key: "faqs.create",
        overrides: ov({ "faqs.create": true }, { "faqs.create": false }),
      }),
    ).toBe(false);
  });

  it("non-grantable permissions ignore overrides", () => {
    expect(
      resolvePermission({
        role: "editor",
        key: "profiles.update",
        overrides: ov({ "profiles.update": true }, { "profiles.update": true }),
      }),
    ).toBe(false);
    expect(
      resolvePermission({
        role: "editor",
        key: "role_permissions.update",
        overrides: ov({}, { "role_permissions.update": true }),
      }),
    ).toBe(false);
  });

  it("call-site role stricter than default is a hard floor (owner-only settings groups)", () => {
    expect(
      resolvePermission({
        role: "editor",
        key: "settings.update",
        callRole: "owner",
        overrides: ov({}, { "settings.update": true }),
      }),
    ).toBe(false);
    expect(
      resolvePermission({
        role: "editor",
        key: "settings.update",
        callRole: "editor",
      }),
    ).toBe(true);
  });

  it("call-site owner equal to registry default stays overridable", () => {
    expect(
      resolvePermission({
        role: "editor",
        key: "posts.delete",
        callRole: "owner",
        overrides: ov({}, { "posts.delete": true }),
      }),
    ).toBe(true);
  });

  it("unknown keys fall back to the call-site role (default owner)", () => {
    expect(
      resolvePermission({ role: "editor", key: "x.y", callRole: "editor" }),
    ).toBe(true);
    expect(resolvePermission({ role: "editor", key: "x.y" })).toBe(false);
  });
});

describe("effectivePermissions / rolePermissionValue", () => {
  it("owner gets every registry key", () => {
    expect(effectivePermissions("owner")).toHaveLength(
      Object.keys(PERMISSIONS).length,
    );
  });

  it("editor list reflects overrides", () => {
    const base = effectivePermissions("editor");
    expect(base).toContain("posts.create");
    expect(base).not.toContain("posts.delete");
    expect(base).not.toContain("profiles.update");
    const withGrant = effectivePermissions(
      "editor",
      ov({}, { "posts.delete": true }),
    );
    expect(withGrant).toContain("posts.delete");
  });

  it("rolePermissionValue shows default or override", () => {
    expect(rolePermissionValue("editor", "posts.delete", new Map())).toBe(
      false,
    );
    expect(
      rolePermissionValue(
        "editor",
        "posts.delete",
        new Map([["posts.delete", true]]),
      ),
    ).toBe(true);
  });
});
