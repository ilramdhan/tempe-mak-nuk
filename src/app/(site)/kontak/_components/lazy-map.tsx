"use client";

import { MapPinIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/** Iframe is mounted only after an explicit click (no third-party load on view). */
export function LazyMap({
  embedUrl,
  mapsUrl,
  title,
}: {
  embedUrl: string;
  mapsUrl: string;
  title: string;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-surface sm:aspect-video">
        {loaded ? (
          <iframe
            src={embedUrl}
            title={title}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <MapPinIcon aria-hidden className="size-8 text-muted-foreground" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Peta Google Maps dimuat setelah Anda klik, supaya halaman tetap
              ringan.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setLoaded(true)}
            >
              Tampilkan peta
            </Button>
          </div>
        )}
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-fit rounded-sm text-sm font-medium text-accent-strong underline-offset-4 hover:underline"
      >
        Buka di Google Maps
      </a>
    </div>
  );
}
