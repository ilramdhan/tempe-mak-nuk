"use client";

import { SearchIcon } from "lucide-react";
import {
  useDeferredValue,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { WaLink } from "@/components/site/layout/wa-link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type FaqBrowserItem = {
  id: string;
  question: string;
  /** Plain text used for searching. */
  plain: string;
  group: string;
  groupName: string;
  answer: ReactNode;
};

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function FaqBrowser({
  items,
  waHref,
}: {
  items: FaqBrowserItem[];
  waHref: string | null;
}) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const inputId = useId();

  const filtered = useMemo(() => {
    const terms = norm(deferred).split(/\s+/).filter(Boolean);
    if (!terms.length) return items;
    return items.filter((i) => {
      const hay = norm(`${i.question} ${i.plain}`);
      return terms.every((t) => hay.includes(t));
    });
  }, [items, deferred]);

  const groups = useMemo(() => {
    const map = new Map<string, { name: string; items: FaqBrowserItem[] }>();
    for (const i of filtered) {
      const g = map.get(i.group) ?? { name: i.groupName, items: [] };
      g.items.push(i);
      map.set(i.group, g);
    }
    return [...map.entries()];
  }, [filtered]);

  const searching = deferred.trim().length > 0;

  return (
    <div className="flex flex-col gap-10">
      <div role="search" className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-sm font-medium">
          Cari pertanyaan
        </label>
        <div className="relative">
          <SearchIcon
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={inputId}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mis. tahan berapa lama, kirim, halal"
            autoComplete="off"
            className="h-12 pl-11"
          />
        </div>
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-muted-foreground"
        >
          {searching
            ? `${filtered.length} pertanyaan ditemukan`
            : `${items.length} pertanyaan`}
        </p>
      </div>

      {groups.length ? (
        groups.map(([key, g]) => (
          <section
            key={key}
            aria-labelledby={`faq-g-${key}`}
            className="flex flex-col gap-2"
          >
            <h2
              id={`faq-g-${key}`}
              className="font-display text-xl font-semibold"
            >
              {g.name}
            </h2>
            <Accordion
              type="multiple"
              // Open every match while searching so answers are visible.
              key={searching ? "s" : "n"}
              defaultValue={searching ? g.items.map((i) => i.id) : []}
              className="border-t border-border"
            >
              {g.items.map((f) => (
                <AccordionItem
                  key={f.id}
                  value={f.id}
                  className="border-border"
                >
                  <AccordionTrigger className="py-4 text-base">
                    {f.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-base text-muted-foreground">
                    {f.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ))
      ) : (
        <div className="flex flex-col items-start gap-4 rounded-lg border border-border bg-surface p-6">
          <p>
            <strong>Belum ketemu jawabannya.</strong> Tanyakan langsung via
            WhatsApp, kami balas di jam kerja.
          </p>
          {waHref ? (
            <Button asChild>
              <WaLink href={waHref} source="faq:empty" kind="general">
                Tanya via WhatsApp
              </WaLink>
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
