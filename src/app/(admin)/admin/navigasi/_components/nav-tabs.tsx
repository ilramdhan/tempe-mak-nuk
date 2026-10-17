"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AnnouncementPanel, type AnnouncementRow } from "./announcement-panel";
import { CtaPanel, type CtaValues } from "./cta-panel";
import { NavPanel, type NavRow } from "./nav-panel";

export function NavTabs({
  items,
  announcements,
  cta,
}: {
  items: NavRow[];
  announcements: AnnouncementRow[];
  cta: CtaValues;
}) {
  return (
    <Tabs defaultValue="menu">
      <TabsList>
        <TabsTrigger value="menu">Menu</TabsTrigger>
        <TabsTrigger value="announcement">Pengumuman</TabsTrigger>
        <TabsTrigger value="cta">CTA global</TabsTrigger>
      </TabsList>
      <TabsContent value="menu" className="pt-4">
        <NavPanel items={items} />
      </TabsContent>
      <TabsContent value="announcement" className="pt-4">
        <AnnouncementPanel items={announcements} />
      </TabsContent>
      <TabsContent value="cta" className="pt-4">
        <CtaPanel values={cta} />
      </TabsContent>
    </Tabs>
  );
}
