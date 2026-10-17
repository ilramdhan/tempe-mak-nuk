"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Settings } from "@/features/settings/schema";

import { TABS } from "../_lib/fields";
import { RedirectManager, type RedirectRow } from "./redirect-manager";
import { SettingsForm } from "./settings-form";

export function SettingsTabs({ settings, redirects }: { settings: Settings; redirects: RedirectRow[] }) {
  return (
    <Tabs defaultValue={TABS[0].id}>
      <div className="overflow-x-auto">
        <TabsList aria-label="Grup pengaturan">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="redirect">Redirect</TabsTrigger>
        </TabsList>
      </div>
      {TABS.map((t) => (
        <TabsContent key={t.id} value={t.id} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t.description}</p>
          <SettingsForm tab={t} settings={settings} />
        </TabsContent>
      ))}
      <TabsContent value="redirect" className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">Alihkan URL lama ke URL baru (cegah 404 dan jaga SEO).</p>
        <RedirectManager rows={redirects} />
      </TabsContent>
    </Tabs>
  );
}
