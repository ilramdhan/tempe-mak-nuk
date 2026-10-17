/** Pure user-management guards (client-safe, unit-tested). */
export type Role = "owner" | "editor";

export function checkRoleChange(opts: {
  actorId: string;
  targetId: string;
  currentRole: Role;
  newRole: Role;
  ownerCount: number;
}): string | null {
  const { actorId, targetId, currentRole, newRole, ownerCount } = opts;
  if (currentRole === newRole) return "Peran tidak berubah.";
  if (currentRole === "owner" && newRole !== "owner") {
    if (actorId === targetId) return "Anda tidak dapat menurunkan peran diri sendiri.";
    if (ownerCount <= 1) return "Tidak dapat menurunkan pemilik terakhir.";
  }
  return null;
}
