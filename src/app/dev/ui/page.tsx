import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  Container,
  Divider,
  Eyebrow,
  Grid,
  Heading,
  Lead,
  Prose,
  Section,
  Stack,
  type HeadingSize,
} from "@/components/site/primitives";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dev · UI",
  robots: { index: false, follow: false },
};

/* Contrast ratios computed in docs/brand.md §6 (WCAG 2.x). [light, dark] */
type Swatch = {
  token: string;
  bg: string;
  fg: string;
  on: string;
  ratio: [number, number];
  min: number;
  note?: string;
};

const SWATCHES: Swatch[] = [
  {
    token: "background",
    bg: "bg-background",
    fg: "text-foreground",
    on: "foreground",
    ratio: [16.06, 16.58],
    min: 4.5,
  },
  {
    token: "surface",
    bg: "bg-surface",
    fg: "text-foreground",
    on: "foreground",
    ratio: [14.46, 15.34],
    min: 4.5,
  },
  {
    token: "card",
    bg: "bg-card",
    fg: "text-card-foreground",
    on: "card-foreground",
    ratio: [16.6, 15.34],
    min: 4.5,
  },
  {
    token: "primary",
    bg: "bg-primary",
    fg: "text-primary-foreground",
    on: "primary-foreground",
    ratio: [9.2, 9.61],
    min: 4.5,
  },
  {
    token: "accent",
    bg: "bg-accent",
    fg: "text-accent-foreground",
    on: "accent-foreground",
    ratio: [4.73, 8.57],
    min: 4.5,
  },
  {
    token: "accent-strong",
    bg: "bg-accent-strong",
    fg: "text-background",
    on: "background",
    ratio: [5.39, 8.57],
    min: 4.5,
    note: "dipakai sebagai warna teks",
  },
  {
    token: "halal",
    bg: "bg-halal",
    fg: "text-halal-foreground",
    on: "halal-foreground",
    ratio: [6.52, 8.65],
    min: 4.5,
  },
  {
    token: "destructive",
    bg: "bg-destructive",
    fg: "text-destructive-foreground",
    on: "destructive-foreground",
    ratio: [6.48, 7.95],
    min: 4.5,
    note: "= slot-full",
  },
  {
    token: "muted-foreground",
    bg: "bg-muted-foreground",
    fg: "text-background",
    on: "background",
    ratio: [5.48, 7.31],
    min: 4.5,
    note: "teks sekunder di background",
  },
  {
    token: "input",
    bg: "bg-input",
    fg: "text-background",
    on: "background",
    ratio: [3.5, 3.42],
    min: 3,
    note: "non-teks 3:1 (border field)",
  },
  {
    token: "border",
    bg: "bg-border",
    fg: "text-foreground",
    on: "background",
    ratio: [1.3, 1.3],
    min: 0,
    note: "dekoratif saja",
  },
];

const TYPE_SCALE: {
  size: HeadingSize | "lead" | "body" | "small" | "caption" | "eyebrow";
  range: string;
}[] = [
  { size: "display-xl", range: "48 → 128" },
  { size: "display", range: "40 → 96" },
  { size: "h1", range: "36 → 60" },
  { size: "h2", range: "30 → 44" },
  { size: "h3", range: "24 → 32" },
  { size: "h4", range: "20 → 24" },
  { size: "lead", range: "17 → 21" },
  { size: "body", range: "15 → 17" },
  { size: "small", range: "13 → 14" },
  { size: "caption", range: "12 → 13" },
  { size: "eyebrow", range: "12 → 13, +0.18em" },
];

const BODY_SIZE = {
  body: "text-body",
  small: "text-small",
  caption: "text-caption",
} as const;

const SLOTS = [
  { label: "Tersedia", cls: "bg-slot-available", marker: "full" },
  { label: "Hampir penuh", cls: "bg-slot-nearly", marker: "half" },
  { label: "Penuh", cls: "bg-slot-full", marker: "empty" },
  { label: "Libur", cls: "bg-slot-closed", marker: "line" },
] as const;

function grade(r: number, min: number) {
  if (min === 0) return "dekor";
  if (r >= 7) return "AAA";
  if (r >= min) return min === 3 ? "AA 3:1" : "AA";
  if (r >= 3) return "AA large";
  return "gagal";
}

function Palette({ mode }: { mode: "light" | "dark" }) {
  const i = mode === "light" ? 0 : 1;
  return (
    <div
      className={cn(
        mode,
        "grain rounded-lg border bg-background p-6 text-foreground",
      )}
    >
      <Stack gap="md">
        <Eyebrow rule>{mode === "light" ? "Light" : "Dark"}</Eyebrow>
        <Grid cols={3} gap="sm">
          {SWATCHES.map((s) => (
            <div key={s.token} className="overflow-hidden rounded-md border">
              <div
                className={cn(
                  "flex h-20 items-end justify-between p-3",
                  s.bg,
                  s.fg,
                )}
              >
                <span className="font-display text-h4">Aa</span>
                <span className="text-caption font-medium tabular-nums">
                  {s.ratio[i].toFixed(2)} · {grade(s.ratio[i], s.min)}
                </span>
              </div>
              <div className="bg-card p-3 text-card-foreground">
                <p className="text-small font-medium">--{s.token}</p>
                <p className="text-caption text-muted-foreground">
                  teks: {s.on}
                  {s.note ? ` · ${s.note}` : ""}
                </p>
              </div>
            </div>
          ))}
        </Grid>
        <Stack direction="row" gap="md" wrap>
          {SLOTS.map((s) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-2 text-small"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "inline-block size-3 rounded-full",
                  s.marker === "full" && s.cls,
                  s.marker === "half" &&
                    "border-2 border-slot-nearly bg-[linear-gradient(90deg,var(--slot-nearly)_50%,transparent_50%)]",
                  s.marker === "empty" && "border-2 border-slot-full",
                  s.marker === "line" && cn(s.cls, "h-0.5 w-3 rounded-none"),
                )}
              />
              {s.label}
            </span>
          ))}
        </Stack>
        <p className="text-small">
          Teks{" "}
          <a
            className="text-primary underline underline-offset-4"
            href="#palette"
          >
            link primary
          </a>
          , teks <span className="text-accent-strong">accent-strong</span>,
          badge{" "}
          <span className="rounded-full bg-halal px-2 py-0.5 text-caption font-medium text-halal-foreground">
            Halal
          </span>
        </p>
      </Stack>
    </div>
  );
}

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="flex-1">
      <Section spacing="tight" grain>
        <Container>
          <Stack direction="row" justify="between" align="start" gap="md">
            <Stack gap="sm">
              <Eyebrow rule tone="accent">
                Dev only · P2.1 / P2.3
              </Eyebrow>
              <Heading level={1} size="display">
                Tiga bahan, tanpa jalan pintas.
              </Heading>
              <Lead muted>
                Token warna, skala tipografi, dan layout primitives Tempe Mak
                Nuk. Halaman ini tidak tersedia di production.
              </Lead>
            </Stack>
            <ThemeToggle />
          </Stack>
        </Container>
      </Section>

      <Section id="palette" tone="surface" spacing="tight">
        <Container size="wide">
          <Stack gap="lg">
            <Heading level={2}>Palet &amp; kontras</Heading>
            <Grid cols={2} gap="md">
              <Palette mode="light" />
              <Palette mode="dark" />
            </Grid>
          </Stack>
        </Container>
      </Section>

      <Section id="type">
        <Container>
          <Stack gap="lg">
            <Heading level={2}>Skala tipografi</Heading>
            <Stack gap="md">
              {TYPE_SCALE.map(({ size, range }) => (
                <div
                  key={size}
                  className="grid grid-cols-4 items-baseline gap-4 md:grid-cols-12"
                >
                  <p className="col-span-4 text-caption text-muted-foreground tabular-nums md:col-span-2">
                    {size} · {range}px
                  </p>
                  <div className="col-span-4 md:col-span-10">
                    {size === "lead" ? (
                      <Lead>
                        Kedelai, air, dan ragi — difermentasi pelan oleh tangan
                        yang sama.
                      </Lead>
                    ) : size === "eyebrow" ? (
                      <Eyebrow>Tempe handmade · Klaten · sejak 2001</Eyebrow>
                    ) : size === "body" ||
                      size === "small" ||
                      size === "caption" ? (
                      <p className={BODY_SIZE[size]}>
                        Karena itulah jumlahnya terbatas setiap hari, dan karena
                        itu pula kami minta Anda pesan lebih dulu.
                      </p>
                    ) : (
                      <Heading level={3} size={size}>
                        Tempe yang layak ditunggu
                      </Heading>
                    )}
                  </div>
                </div>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Section>

      <Section tone="primary" grain>
        <Container>
          <Grid cols={12} gap="lg">
            <div className="col-span-4 md:col-span-5">
              <Eyebrow rule tone="inherit">
                Tone primary
              </Eyebrow>
              <Heading level={2} size="display" className="mt-4">
                Sejak 2001.
              </Heading>
            </div>
            <div className="col-span-4 md:col-span-6 md:col-start-7">
              <Lead>
                Section tone=&quot;primary&quot; dengan grain. Teks muted
                dilunakkan otomatis.
              </Lead>
              <p className="mt-4 text-muted-foreground">
                Muted foreground di atas primary.
              </p>
            </div>
          </Grid>
        </Container>
      </Section>

      <Section tone="inverse" spacing="tight">
        <Container>
          <Stack gap="sm">
            <Eyebrow rule>Tone inverse</Eyebrow>
            <Heading level={2} size="h3">
              Membalik token terang ↔ gelap untuk satu section.
            </Heading>
          </Stack>
        </Container>
      </Section>

      <Section id="primitives">
        <Container>
          <Stack gap="xl">
            <Stack gap="sm">
              <Heading level={2}>Primitives</Heading>
              <Lead muted>
                Container, Section, Heading, Eyebrow, Lead, Prose, Grid, Stack,
                Divider.
              </Lead>
            </Stack>

            <Stack gap="sm">
              <Eyebrow>Grid cols=3 gap=md</Eyebrow>
              <Grid cols={3} gap="md">
                {["Klasik", "Original", "Bentuk bebas"].map((t) => (
                  <div key={t} className="rounded-lg border bg-card p-6">
                    <Heading level={3} size="h4">
                      {t}
                    </Heading>
                    <p className="mt-2 text-small text-muted-foreground">
                      Contoh kartu di atas card.
                    </p>
                  </div>
                ))}
              </Grid>
            </Stack>

            <Stack gap="sm">
              <Eyebrow>Container sizes</Eyebrow>
              {(["prose", "default"] as const).map((s) => (
                <Container
                  key={s}
                  size={s}
                  bleed
                  className="rounded-sm bg-surface py-2 text-caption"
                >
                  size=&quot;{s}&quot;
                </Container>
              ))}
            </Stack>

            <Divider tone="strong" />

            <Prose>
              <h2>Cara Mak Nuk membuat tempe</h2>
              <p>
                Kedelai dicuci dan direbus, diberi ragi, dibungkus, lalu
                dibiarkan bekerja sendiri. Baca{" "}
                <a href="#type">skala tipografi</a> untuk ukuran yang dipakai.
              </p>
              <h3>Tiga bahan</h3>
              <ul>
                <li>Kedelai</li>
                <li>Air</li>
                <li>Ragi</li>
              </ul>
              <ol>
                <li>Rendam semalam</li>
                <li>Kupas kulit ari</li>
                <li>Beri ragi, bungkus, tunggu</li>
              </ol>
              <blockquote>
                Tidak ada pengawet yang mempercepat.
                <cite>Mak Nuk</cite>
              </blockquote>
              <hr />
              <table>
                <thead>
                  <tr>
                    <th>Varian</th>
                    <th>Kulit ari</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Klasik</td>
                    <td>Ya</td>
                  </tr>
                  <tr>
                    <td>Original</td>
                    <td>Dikupas</td>
                  </tr>
                </tbody>
              </table>
              <p>
                Inline <code>tabular-nums</code> untuk angka.
              </p>
            </Prose>
          </Stack>
        </Container>
      </Section>
    </main>
  );
}
