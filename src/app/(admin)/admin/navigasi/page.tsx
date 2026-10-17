import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import { PageHeader } from "@/components/admin/shell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listAnnouncementsForAdmin,
  listNavItemsForAdmin,
} from "@/features/navigation/queries.admin";
import { getSettingsForAdmin } from "@/features/settings/queries.admin";

import { NavTabs } from "./_components/nav-tabs";

export const metadata: Metadata = { title: "Navigasi & pengumuman" };

export default function NavigationAdminPage() {
  return (
    <>
      <PageHeader
        eyebrow="Situs"
        title="Navigasi & pengumuman"
        description="Menu header dan footer, bar pengumuman, serta tombol ajakan (CTA) global."
      />
      <Suspense
        fallback={
          <Skeleton
            className="h-96 w-full rounded-lg"
            aria-label="Memuat navigasi"
          />
        }
      >
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  await connection();
  const [items, announcements, { settings }] = await Promise.all([
    listNavItemsForAdmin(),
    listAnnouncementsForAdmin(),
    getSettingsForAdmin(),
  ]);
  return (
    <NavTabs
      items={items.map((n) => ({
        id: n.id,
        location: n.location,
        label: n.label,
        href: n.href,
        parentId: n.parentId,
        sort: n.sort,
        visible: n.visible,
      }))}
      announcements={announcements.map((a) => ({
        id: a.id,
        text: a.text,
        href: a.href,
        startsAt: a.startsAt ? a.startsAt.toISOString() : null,
        endsAt: a.endsAt ? a.endsAt.toISOString() : null,
        active: a.active,
      }))}
      cta={{
        primaryLabel: settings["cta.primaryLabel"],
        primaryHref: settings["cta.primaryHref"],
        waFloatEnabled: settings["cta.waFloatEnabled"],
        waFloatMessage: settings["cta.waFloatMessage"],
      }}
    />
  );
}
