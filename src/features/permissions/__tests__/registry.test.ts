/**
 * Static coverage check: every `adminAction({ entity, action })` in src/features/** must map to a
 * registry key, and the registry default must match the call-site role (unless the registry is
 * intentionally stricter). Dynamic actions (`cond ? "a" : "b"`) contribute every literal branch.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  isPermissionKey,
  PERMISSION_GROUPS,
  PERMISSIONS,
  permissionsByGroup,
} from "../registry";

const ROOT = join(process.cwd(), "src/features");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === "__tests__" ? [] : walk(p);
    return /\.tsx?$/.test(name) && !name.endsWith(".test.ts") ? [p] : [];
  });
}

type CallSite = {
  file: string;
  keys: string[];
  role: string | null;
};

function scan(): CallSite[] {
  const sites: CallSite[] = [];
  for (const file of walk(ROOT)) {
    const src = readFileSync(file, "utf8");
    if (file.endsWith("admin-action.ts")) continue;
    const re = /adminAction\(\{([\s\S]*?)\brun:/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      const body = m[1];
      const entity = /entity:\s*"([^"]+)"/.exec(body)?.[1];
      const actionExpr = /action:\s*([^\n]+)/.exec(body)?.[1] ?? "";
      // `cond ? "a" : "b"` → the branches only (not literals inside the condition).
      const branches = actionExpr.includes("?")
        ? actionExpr.slice(actionExpr.indexOf("?"))
        : actionExpr;
      const actions = [...branches.matchAll(/"([a-z_]+)"/g)].map((x) => x[1]);
      const roleExpr = /role:\s*([^\n,]+)/.exec(body)?.[1]?.trim() ?? null;
      const role = roleExpr?.startsWith('"')
        ? roleExpr.replaceAll('"', "")
        : roleExpr
          ? "dynamic"
          : null;
      expect(entity, `${file}: entity literal`).toBeTruthy();
      expect(actions.length, `${file}: action literal`).toBeGreaterThan(0);
      sites.push({ file, keys: actions.map((a) => `${entity}.${a}`), role });
    }
  }
  return sites;
}

describe("permission registry", () => {
  const sites = scan();

  it("finds the admin actions", () => {
    expect(sites.length).toBeGreaterThan(50);
  });

  it("every adminAction entity/action pair is registered", () => {
    const missing = sites
      .flatMap((s) => s.keys.map((k) => ({ k, file: s.file })))
      .filter(({ k }) => !isPermissionKey(k));
    expect(missing).toEqual([]);
  });

  it("call-site owner role is never weaker than the registry default", () => {
    for (const s of sites)
      for (const k of s.keys)
        if (s.role === "owner" && isPermissionKey(k))
          expect(PERMISSIONS[k].defaultRole, `${k} in ${s.file}`).toBe("owner");
  });

  it("posts/recipes delete are owner-only by default but grantable", () => {
    for (const k of ["posts.delete", "recipes.delete"] as const) {
      expect(PERMISSIONS[k].defaultRole).toBe("owner");
      expect(PERMISSIONS[k].grantable).toBe(true);
    }
  });

  it("critical permissions are not grantable", () => {
    for (const k of [
      "profiles.create",
      "profiles.update",
      "role_permissions.update",
      "user_permissions.update",
      "legal_documents.create",
      "legal_documents.update",
      "legal_documents.delete",
    ] as const) {
      expect(PERMISSIONS[k].grantable).toBe(false);
      expect(PERMISSIONS[k].defaultRole).toBe("owner");
    }
  });

  it("groups cover every key exactly once", () => {
    const grouped = permissionsByGroup().flatMap((g) =>
      g.items.map((i) => i.key),
    );
    expect(grouped.sort()).toEqual(Object.keys(PERMISSIONS).sort());
    const ids = new Set(PERMISSION_GROUPS.map((g) => g.id));
    for (const def of Object.values(PERMISSIONS))
      expect(ids.has(def.group)).toBe(true);
  });
});
