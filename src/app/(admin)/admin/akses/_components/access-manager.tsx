"use client";

import { Lock } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  setRolePermission,
  setUserPermission,
} from "@/features/permissions/actions";
import {
  permissionsByGroup,
  PERMISSIONS,
  type PermissionKey,
} from "@/features/permissions/registry";
import { rolePermissionValue } from "@/features/permissions/resolve";

import { useAdminMutation } from "../../slot/_components/use-action";

type Editor = { id: string; name: string; email: string | null };
type UserChoice = "inherit" | "allow" | "deny";

const GROUPS = permissionsByGroup();

export function AccessManager({
  roleOverrides,
  userOverrides,
  editors,
  initialUserId,
}: {
  roleOverrides: Record<string, boolean>;
  userOverrides: Record<string, Record<string, boolean>>;
  editors: Editor[];
  initialUserId?: string;
}) {
  return (
    <Tabs defaultValue={initialUserId ? "pengguna" : "peran"}>
      <TabsList>
        <TabsTrigger value="peran">Peran Editor</TabsTrigger>
        <TabsTrigger value="pengguna">Per pengguna</TabsTrigger>
      </TabsList>
      <TabsContent value="peran" className="mt-4">
        <RoleMatrix overrides={roleOverrides} />
      </TabsContent>
      <TabsContent value="pengguna" className="mt-4">
        <UserOverrides
          roleOverrides={roleOverrides}
          userOverrides={userOverrides}
          editors={editors}
          initialUserId={initialUserId}
        />
      </TabsContent>
    </Tabs>
  );
}

function GroupCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border bg-card">
      <h2 className="border-b border-border px-4 py-3 text-base font-medium sm:px-5">
        {label}
      </h2>
      <ul className="divide-y divide-border">{children}</ul>
    </section>
  );
}

function PermissionText({ k }: { k: PermissionKey }) {
  const def = PERMISSIONS[k];
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium">{def.label}</p>
      <p className="text-xs text-muted-foreground">
        <code>{k}</code>
        {"hint" in def && def.hint ? <> · {def.hint}</> : null}
      </p>
    </div>
  );
}

function OwnerOnlyBadge() {
  return (
    <Badge variant="outline" className="shrink-0 gap-1">
      <Lock aria-hidden="true" className="size-3" /> Khusus pemilik
    </Badge>
  );
}

function RoleMatrix({ overrides }: { overrides: Record<string, boolean> }) {
  const { pending, run } = useAdminMutation();
  const map = new Map(Object.entries(overrides));
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Nyalakan untuk mengizinkan semua Editor. Bawaan mengikuti pengaturan
        awal sistem; perubahan berlaku pada permintaan berikutnya.
      </p>
      {GROUPS.map((g) => (
        <GroupCard key={g.id} label={g.label}>
          {g.items.map((item) => {
            const value = rolePermissionValue("editor", item.key, map);
            const overridden = map.has(item.key);
            const id = `role-${item.key}`;
            return (
              <li
                key={item.key}
                className="flex items-center justify-between gap-4 px-4 py-3 sm:px-5"
              >
                <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
                  <PermissionText k={item.key} />
                </label>
                {item.grantable ? (
                  <div className="flex shrink-0 items-center gap-3">
                    {overridden ? (
                      <button
                        type="button"
                        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50"
                        disabled={pending}
                        onClick={() =>
                          run(
                            () =>
                              setRolePermission({
                                role: "editor",
                                permission: item.key,
                                allowed: null,
                              }),
                            { success: "Dikembalikan ke bawaan." },
                          )
                        }
                      >
                        Kembalikan bawaan
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Bawaan
                      </span>
                    )}
                    <Switch
                      id={id}
                      checked={value}
                      disabled={pending}
                      onCheckedChange={(checked) =>
                        run(
                          () =>
                            setRolePermission({
                              role: "editor",
                              permission: item.key,
                              allowed: checked,
                            }),
                          {
                            success: `${item.label}: ${checked ? "diizinkan" : "dicabut"} untuk Editor.`,
                          },
                        )
                      }
                    />
                  </div>
                ) : (
                  <OwnerOnlyBadge />
                )}
              </li>
            );
          })}
        </GroupCard>
      ))}
    </div>
  );
}

const CHOICE_LABEL: Record<UserChoice, string> = {
  inherit: "Ikut peran",
  allow: "Izinkan",
  deny: "Tolak",
};

function UserOverrides({
  roleOverrides,
  userOverrides,
  editors,
  initialUserId,
}: {
  roleOverrides: Record<string, boolean>;
  userOverrides: Record<string, Record<string, boolean>>;
  editors: Editor[];
  initialUserId?: string;
}) {
  const { pending, run } = useAdminMutation();
  const [userId, setUserId] = useState(initialUserId ?? editors[0]?.id ?? "");
  const roleMap = new Map(Object.entries(roleOverrides));

  if (editors.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Belum ada pengguna dengan peran Editor. Undang pengguna di halaman
        Pengguna.
      </p>
    );
  }

  const current = editors.find((e) => e.id === userId) ?? editors[0];
  const mine = userOverrides[current.id] ?? {};

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:p-5">
        <label htmlFor="akses-user" className="text-sm font-medium">
          Pengguna
        </label>
        <Select value={current.id} onValueChange={setUserId}>
          <SelectTrigger id="akses-user" className="sm:w-80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {editors.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
                {e.email && e.email !== e.name ? ` (${e.email})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground sm:ml-auto sm:max-w-xs">
          Izinkan/Tolak menimpa pengaturan peran Editor hanya untuk pengguna
          ini.
        </p>
      </div>
      {GROUPS.map((g) => (
        <GroupCard key={g.id} label={g.label}>
          {g.items.map((item) => {
            const own = mine[item.key];
            const choice: UserChoice =
              own === undefined ? "inherit" : own ? "allow" : "deny";
            const inherited = rolePermissionValue("editor", item.key, roleMap);
            return (
              <li
                key={item.key}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5"
              >
                <PermissionText k={item.key} />
                {item.grantable ? (
                  <Select
                    value={choice}
                    disabled={pending}
                    onValueChange={(v) =>
                      run(
                        () =>
                          setUserPermission({
                            userId: current.id,
                            permission: item.key,
                            allowed: v === "inherit" ? null : v === "allow",
                          }),
                        {
                          success: `${item.label}: ${CHOICE_LABEL[v as UserChoice].toLowerCase()} untuk ${current.name}.`,
                        },
                      )
                    }
                  >
                    <SelectTrigger
                      className="shrink-0 sm:w-56"
                      aria-label={`${item.label} untuk ${current.name}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inherit">
                        {CHOICE_LABEL.inherit} (
                        {inherited ? "diizinkan" : "ditolak"})
                      </SelectItem>
                      <SelectItem value="allow">
                        {CHOICE_LABEL.allow}
                      </SelectItem>
                      <SelectItem value="deny">{CHOICE_LABEL.deny}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <OwnerOnlyBadge />
                )}
              </li>
            );
          })}
        </GroupCard>
      ))}
    </div>
  );
}
