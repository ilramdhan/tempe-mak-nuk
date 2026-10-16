"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { RoleGate } from "@/components/admin/shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DateKey } from "@/lib/dates";

import { DayEditor } from "./day-editor";
import { HolidayManager } from "./holiday-manager";
import { RulesForm, RulesSummary } from "./rules-form";
import { monthHref, SlotCalendar } from "./slot-calendar";
import type { HolidayRow, SlotAdminData } from "./types";

export function SlotAdmin({
  data,
  initialDate,
  holidays,
}: {
  data: SlotAdminData;
  initialDate: DateKey;
  holidays: HolidayRow[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(initialDate);
  const day = data.days[selected];

  return (
    <Tabs defaultValue="kalender" className="gap-6">
      <TabsList className="w-full sm:w-fit">
        <TabsTrigger value="kalender">Kalender</TabsTrigger>
        <TabsTrigger value="libur">Hari libur</TabsTrigger>
        <TabsTrigger value="aturan">Aturan</TabsTrigger>
      </TabsList>

      <TabsContent value="kalender">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <SlotCalendar
            data={data}
            selected={selected}
            onSelect={setSelected}
            onNavigateMonth={(month, date) =>
              router.push(monthHref(month, date), { scroll: false })
            }
          />
          {day ? (
            <DayEditor
              key={`${day.date}:${JSON.stringify(day.override)}`}
              day={day}
              defaultCapacity={data.rules.slotsPerDay}
            />
          ) : null}
        </div>
      </TabsContent>

      <TabsContent value="libur">
        <HolidayManager holidays={holidays} today={data.today} />
      </TabsContent>

      <TabsContent value="aturan">
        <RoleGate role="owner" fallback={<RulesSummary rules={data.rules} />}>
          <RulesForm rules={data.rules} />
        </RoleGate>
      </TabsContent>
    </Tabs>
  );
}
