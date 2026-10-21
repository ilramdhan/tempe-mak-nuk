"use client";

import { LoaderCircle, MailPlus, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useAdminUser } from "@/components/admin/shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { inviteUser, setUserRole } from "@/features/users/actions";
import { ROLE_LABEL } from "@/lib/auth/roles";

import { useAdminMutation } from "../../slot/_components/use-action";

export type UserRow = {
  id: string;
  email: string | null;
  displayName: string | null;
  role: "owner" | "editor";
  createdAt: string;
};

export function UserTable({ rows }: { rows: UserRow[] }) {
  const me = useAdminUser();
  const { pending, run } = useAdminMutation();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string>();
  const owners = rows.filter((r) => r.role === "owner").length;

  function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Format email tidak valid.");
      return;
    }
    setEmailError(undefined);
    run(() => inviteUser({ email: email.trim() }), {
      success: "Undangan terkirim.",
      onDone: (res) => {
        if (res.ok) setEmail("");
        else setEmailError(res.error);
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={invite}
        noValidate
        className="rounded-lg border border-border bg-card p-4 sm:p-6"
      >
        <h2 className="mb-3 text-lg font-medium">Undang pengguna</h2>
        <Field data-invalid={!!emailError}>
          <FieldLabel htmlFor="invite-email">Email</FieldLabel>
          <div className="flex flex-wrap gap-2">
            <Input
              id="invite-email"
              type="email"
              className="max-w-sm"
              value={email}
              aria-invalid={!!emailError}
              aria-describedby="invite-hint"
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={pending}>
              {pending ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <MailPlus aria-hidden="true" />
              )}
              Kirim undangan
            </Button>
          </div>
          <FieldDescription id="invite-hint">
            Pengguna baru mulai sebagai Editor. Ubah perannya di bawah bila
            perlu.
          </FieldDescription>
          <FieldError>{emailError}</FieldError>
        </Field>
      </form>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pengguna</TableHead>
              <TableHead>Bergabung</TableHead>
              <TableHead className="w-48">Peran</TableHead>
              <TableHead className="w-36">Hak akses</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const self = r.id === me.id;
              const lockedOwner = r.role === "owner" && (self || owners <= 1);
              const name = r.displayName || r.email || r.id.slice(0, 8);
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium">
                      {name}{" "}
                      {self ? <Badge variant="secondary">Anda</Badge> : null}
                    </div>
                    {r.email && r.email !== name ? (
                      <div className="text-xs text-muted-foreground">
                        {r.email}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString("id-ID", {
                      dateStyle: "medium",
                      timeZone: "Asia/Jakarta",
                    })}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.role}
                      disabled={pending || lockedOwner}
                      onValueChange={(v) =>
                        run(
                          () =>
                            setUserRole({
                              id: r.id,
                              role: v as "owner" | "editor",
                            }),
                          { success: `Peran ${name} diubah.` },
                        )
                      }
                    >
                      <SelectTrigger aria-label={`Peran ${name}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">
                          {ROLE_LABEL.owner}
                        </SelectItem>
                        <SelectItem value="editor">
                          {ROLE_LABEL.editor}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {lockedOwner ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {self
                          ? "Tidak dapat menurunkan diri sendiri."
                          : "Pemilik terakhir."}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {r.role === "editor" ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link
                          href={`/admin/akses?pengguna=${r.id}`}
                          aria-label={`Atur hak akses ${name}`}
                        >
                          <ShieldCheck aria-hidden="true" /> Atur akses
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Semua akses
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
