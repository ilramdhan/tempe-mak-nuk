"use client";

import { RoleGate } from "@/components/admin/shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ConsentConfig } from "@/features/settings/schema";

import type { LegalRow } from "../_lib/legal-form";
import { ConsentEditor } from "./consent-editor";
import { DocumentList } from "./document-list";

export function LegalTabs({
  rows,
  consent,
}: {
  rows: LegalRow[];
  consent: ConsentConfig;
}) {
  return (
    <RoleGate
      role="owner"
      fallback={
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
        >
          Akses ditolak. Hanya pemilik yang dapat mengelola dokumen legal dan
          consent.
        </p>
      }
    >
      <Tabs defaultValue="dokumen">
        <TabsList>
          <TabsTrigger value="dokumen">Dokumen legal</TabsTrigger>
          <TabsTrigger value="consent">Consent cookie</TabsTrigger>
        </TabsList>
        <TabsContent value="dokumen" className="mt-4">
          <DocumentList rows={rows} />
        </TabsContent>
        <TabsContent value="consent" className="mt-4">
          <ConsentEditor initial={consent} />
        </TabsContent>
      </Tabs>
    </RoleGate>
  );
}
