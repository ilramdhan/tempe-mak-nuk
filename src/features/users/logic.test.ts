import { describe, expect, it } from "vitest";

import { checkRoleChange } from "./logic";

const base = { actorId: "a", targetId: "b", currentRole: "owner", newRole: "editor", ownerCount: 2 } as const;

describe("checkRoleChange", () => {
  it("allows demoting another owner when others remain", () => {
    expect(checkRoleChange(base)).toBeNull();
  });
  it("blocks self-demotion", () => {
    expect(checkRoleChange({ ...base, targetId: "a" })).toMatch(/diri sendiri/);
  });
  it("blocks demoting the last owner", () => {
    expect(checkRoleChange({ ...base, ownerCount: 1 })).toMatch(/terakhir/);
  });
  it("allows promotion and rejects no-op", () => {
    expect(checkRoleChange({ ...base, currentRole: "editor", newRole: "owner", ownerCount: 1 })).toBeNull();
    expect(checkRoleChange({ ...base, newRole: "owner" })).toMatch(/tidak berubah/);
  });
});
