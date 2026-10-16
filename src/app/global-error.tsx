"use client";

import { useEffect } from "react";

/** Replaces the root layout: own document, inline styles (no global CSS), follows OS color scheme. */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <head>
        <title>Terjadi kesalahan — Tempe Mak Nuk</title>
        <meta name="robots" content="noindex" />
        <style>{`
          :root{color-scheme:light dark;--bg:#FAF7F2;--fg:#1B1812;--muted:#6B6355;--btn:#2F4A2A;--btn-fg:#fff}
          @media (prefers-color-scheme:dark){:root{--bg:#100F0C;--fg:#F3EEE4;--muted:#A89F8D;--btn:#E3B23C;--btn-fg:#1B1812}}
          body{margin:0;background:var(--bg);color:var(--fg);font-family:system-ui,sans-serif}
          main{max-width:40rem;margin:0 auto;padding:6rem 1rem;min-height:100vh;box-sizing:border-box}
          h1{font-size:2.25rem;line-height:1.15;margin:.5rem 0 1rem}
          p{color:var(--muted);font-size:1.125rem;line-height:1.5}
          .row{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1.5rem}
          button,a.b{min-height:2.75rem;padding:0 1.5rem;border-radius:9999px;border:1px solid var(--btn);font:inherit;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;text-decoration:none}
          button{background:var(--btn);color:var(--btn-fg)}
          a.b{background:transparent;color:var(--fg);border-color:var(--muted)}
          :focus-visible{outline:2px solid var(--fg);outline-offset:2px}
        `}</style>
      </head>
      <body>
        <main>
          <p style={{ fontSize: ".875rem", letterSpacing: ".1em" }}>500</p>
          <h1>Ada yang salah di sisi kami.</h1>
          <p>Coba muat ulang sebentar lagi, atau kembali ke beranda.</p>
          <div className="row">
            <button type="button" onClick={() => retry()}>
              Muat ulang
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- full reload is intended when the root layout crashed */}
            <a className="b" href="/">
              Kembali ke beranda
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
