"use client";

import {
  Counter,
  LenisProvider,
  Magnetic,
  Marquee,
  Parallax,
  PinnedStory,
  Reveal,
  SplitReveal,
  scrollToTarget,
  useLenis,
  useReducedMotion,
} from "@/components/motion";

const STEPS = [
  {
    title: "Kedelai",
    body: "Kedelai pilihan direndam semalam, dikupas, lalu direbus hingga empuk.",
  },
  {
    title: "Ragi",
    body: "Setelah dingin, kedelai ditaburi ragi tempe — hanya secukupnya.",
  },
  {
    title: "Bungkus",
    body: "Dibungkus daun pisang supaya bisa bernapas dan lembapnya terjaga.",
  },
  {
    title: "Fermentasi",
    body: "Dua hari di suhu ruang, miselium putih mengikat butir demi butir.",
  },
];

const TONES = ["bg-surface", "bg-accent/30", "bg-primary/25", "bg-muted"];

function Section({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t border-border px-4 py-24 md:px-12">
      <p className="mb-8 font-mono text-xs tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </section>
  );
}

function Toolbar() {
  const lenis = useLenis();
  const reduced = useReducedMotion();
  return (
    <nav className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b border-border bg-background/90 px-4 py-3 text-sm md:px-12">
      <span>
        Lenis: {lenis ? "on" : "off"} · reduced-motion: {String(reduced)}
      </span>
      <a href="#pinned" className="underline">
        #pinned (anchor)
      </a>
      <a href="#counter" className="underline">
        #counter (anchor)
      </a>
      <button
        type="button"
        className="underline"
        onClick={() => scrollToTarget(lenis, 0)}
      >
        top (scrollToTarget)
      </button>
    </nav>
  );
}

export function MotionDemo() {
  return (
    <LenisProvider>
      <Toolbar />
      <main className="flex-1">
        <header className="px-4 pt-24 pb-32 md:px-12">
          <SplitReveal
            as="h1"
            trigger="load"
            className="max-w-5xl text-6xl leading-[1.02] md:text-8xl"
          >
            Tiga bahan, tanpa jalan pintas. Tempe yang <em>bernapas</em> di daun
            pisang.
          </SplitReveal>
          <Reveal
            as="p"
            delay={0.5}
            className="mt-8 max-w-xl text-lg text-muted-foreground"
          >
            SplitReveal trigger=&quot;load&quot; (hero): painted immediately at
            a faint state, then lines rise.
          </Reveal>
        </header>

        <Section id="reveal" label="Reveal / Reveal stagger">
          <Reveal as="h2" className="text-4xl">
            Reveal — fade + rise, once.
          </Reveal>
          <Reveal stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {["Satu", "Dua", "Tiga"].map((t) => (
              <div key={t} className="rounded-[10px] bg-surface p-8">
                {t}
              </div>
            ))}
          </Reveal>
        </Section>

        <Section id="split" label="SplitReveal (scroll)">
          <SplitReveal className="max-w-4xl text-5xl leading-tight">
            Dibuat pelan-pelan sejak 2001, dari dapur yang sama, dengan tangan
            yang sama.
          </SplitReveal>
        </Section>

        <Section id="parallax" label="Parallax">
          <div className="relative h-[70svh] overflow-clip rounded-[20px]">
            <Parallax
              speed={0.15}
              className="absolute inset-x-0 -inset-y-[15%] bg-[repeating-linear-gradient(45deg,var(--color-surface)_0_24px,var(--color-border)_24px_48px)]"
            >
              <span className="sr-only">parallax layer</span>
            </Parallax>
            <p className="relative p-8 text-2xl">
              Background drifts with scroll (scrub, transform only).
            </p>
          </div>
        </Section>

        <Section id="marquee" label="Marquee">
          <Marquee className="font-display text-3xl">
            {[
              "Halal MUI",
              "Tanpa pengawet",
              "Daun pisang",
              "Sejak 2001",
              "Kedelai pilihan",
            ].map((t) => (
              <span key={t} className="whitespace-nowrap">
                {t} ·
              </span>
            ))}
          </Marquee>
          <Marquee
            direction="right"
            duration={60}
            className="mt-6 text-muted-foreground"
          >
            {[
              "Pasar Kranggan",
              "Warung Bu Sri",
              "Katering Sehat",
              "Resto Daun",
            ].map((t) => (
              <span key={t} className="whitespace-nowrap">
                {t}
              </span>
            ))}
          </Marquee>
        </Section>

        <Section id="pinned" label="PinnedStory">
          <PinnedStory
            steps={STEPS.map((s, i) => (
              <div key={s.title} className="max-w-md">
                <p className="text-sm text-muted-foreground">0{i + 1}</p>
                <h3 className="mt-2 text-4xl">{s.title}</h3>
                <p className="mt-4 text-lg">{s.body}</p>
              </div>
            ))}
            stepClassName="transition-opacity duration-500 md:data-[active=false]:opacity-35"
            renderMedia={(active, { stacked }) =>
              stacked ? (
                <div
                  className={`aspect-[4/3] rounded-[20px] ${TONES[active]}`}
                />
              ) : (
                <div className="relative aspect-[4/5] overflow-clip rounded-[20px]">
                  {STEPS.map((s, i) => (
                    <div
                      key={s.title}
                      className={`absolute inset-0 flex items-end p-8 text-5xl transition-opacity duration-700 ${TONES[i]} ${i === active ? "opacity-100" : "opacity-0"}`}
                    >
                      {s.title}
                    </div>
                  ))}
                </div>
              )
            }
          />
        </Section>

        <Section id="counter" label="Counter">
          <div className="flex flex-wrap gap-16 font-display text-7xl">
            <div>
              <Counter
                value={2001}
                from={1980}
                locale="en-US"
                format={{ useGrouping: false }}
              />
              <p className="mt-2 font-sans text-sm text-muted-foreground">
                sejak
              </p>
            </div>
            <div>
              <Counter value={12500} suffix="+" />
              <p className="mt-2 font-sans text-sm text-muted-foreground">
                bungkus / bulan
              </p>
            </div>
            <div>
              <Counter
                value={4.9}
                format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
              />
              <p className="mt-2 font-sans text-sm text-muted-foreground">
                rating
              </p>
            </div>
          </div>
        </Section>

        <Section id="magnetic" label="Magnetic (pointer: fine)">
          <Magnetic>
            <a
              href="#pinned"
              className="inline-block rounded-full bg-primary px-8 py-4 text-primary-foreground"
            >
              Pesan via WhatsApp
            </a>
          </Magnetic>
        </Section>
        <div className="h-[50svh]" />
      </main>
    </LenisProvider>
  );
}
