import { describe, expect, it } from "vitest";

import { setRolePermissionSchema, setUserPermissionSchema } from "../schema";

const ID = "00000000-0000-4000-8000-000000000001";

describe("permission schemas", () => {
  it("accepts grantable keys with allow/deny/inherit", () => {
    for (const allowed of [true, false, null])
      expect(
        setRolePermissionSchema.safeParse({
          role: "editor",
          permission: "posts.delete",
          allowed,
        }).success,
      ).toBe(true);
    expect(
      setUserPermissionSchema.safeParse({
        userId: ID,
        permission: "recipes.delete",
        allowed: true,
      }).success,
    ).toBe(true);
  });

  it("rejects unknown and non-grantable keys", () => {
    expect(
      setRolePermissionSchema.safeParse({
        role: "editor",
        permission: "nope.delete",
        allowed: true,
      }).success,
    ).toBe(false);
    const res = setUserPermissionSchema.safeParse({
      userId: ID,
      permission: "profiles.update",
      allowed: true,
    });
    expect(res.success).toBe(false);
    expect(res.error?.issues[0]?.message).toMatch(/khusus pemilik/);
  });

  it("only the editor role is configurable and user id must be a uuid", () => {
    expect(
      setRolePermissionSchema.safeParse({
        role: "owner",
        permission: "posts.delete",
        allowed: false,
      }).success,
    ).toBe(false);
    expect(
      setUserPermissionSchema.safeParse({
        userId: "x",
        permission: "posts.delete",
        allowed: true,
      }).success,
    ).toBe(false);
  });
});
