# Changelog

## [0.2.0](https://github.com/ilramdhan/tempe-mak-nuk/compare/v0.1.4...v0.2.0) (2026-10-23)


### Fitur

* **db:** guard seed against remote databases; phase 9 audit and session 9 handover ([#25](https://github.com/ilramdhan/tempe-mak-nuk/issues/25)) ([8807386](https://github.com/ilramdhan/tempe-mak-nuk/commit/88073868038bbe14abf674e7162d3dae228b1fde))

## [0.1.4](https://github.com/ilramdhan/tempe-mak-nuk/compare/v0.1.3...v0.1.4) (2026-10-22)


### Perbaikan

* **docker:** patch Alpine CVEs and scope Trivy to vulnerabilities ([#23](https://github.com/ilramdhan/tempe-mak-nuk/issues/23)) ([1ee35b6](https://github.com/ilramdhan/tempe-mak-nuk/commit/1ee35b6ebed75a21e9442ffca1d4d0eefda68ff6))

## [0.1.3](https://github.com/ilramdhan/tempe-mak-nuk/compare/v0.1.2...v0.1.3) (2026-10-22)


### Perbaikan

* **data:** log the driver cause behind failed public queries ([#20](https://github.com/ilramdhan/tempe-mak-nuk/issues/20)) ([b7638ba](https://github.com/ilramdhan/tempe-mak-nuk/commit/b7638bad5fd6db0dee9ec3cb6c713d03a8d84d9e))
* **db:** disable postgres-js pipelining for Supabase transaction pooler ([#21](https://github.com/ilramdhan/tempe-mak-nuk/issues/21)) ([5188a88](https://github.com/ilramdhan/tempe-mak-nuk/commit/5188a8873ac10db3f8ee7812d704cdbd0217c73a))


### Dokumentasi

* session 8 handover and ledger update ([#19](https://github.com/ilramdhan/tempe-mak-nuk/issues/19)) ([d7fb66b](https://github.com/ilramdhan/tempe-mak-nuk/commit/d7fb66bf802fa41e34f2e62c70da8078bf71d617))

## [0.1.2](https://github.com/ilramdhan/tempe-mak-nuk/compare/v0.1.1...v0.1.2) (2026-10-21)


### Perbaikan

* **db:** prerender through Supabase session pooler during next build ([#17](https://github.com/ilramdhan/tempe-mak-nuk/issues/17)) ([58911df](https://github.com/ilramdhan/tempe-mak-nuk/commit/58911df97cd0afa7bcd2eacbd0996c2896707c5e))

## [0.1.1](https://github.com/ilramdhan/tempe-mak-nuk/compare/v0.1.0...v0.1.1) (2026-10-21)


### Perbaikan

* **cron:** run publish cron daily for Vercel Hobby with 25h window ([#13](https://github.com/ilramdhan/tempe-mak-nuk/issues/13)) ([64974aa](https://github.com/ilramdhan/tempe-mak-nuk/commit/64974aa3ceeeebc4e293b7e8b0083f4350fdd59b))


### Dokumentasi

* align admin guide, README and security notes with RBAC, categories, cron (P8.8) ([#12](https://github.com/ilramdhan/tempe-mak-nuk/issues/12)) ([0d4e2c0](https://github.com/ilramdhan/tempe-mak-nuk/commit/0d4e2c0950dfae8e160ffe91a23d0b32e7136500))

## 0.1.0 (2026-10-21)


### Fitur

* **admin:** /admin/kategori — manage FAQ/journal/recipe categories and tags (P8.5) ([89ce747](https://github.com/ilramdhan/tempe-mak-nuk/commit/89ce74701e47de779b28f616d5d943406c44e43e))
* **admin:** auth (password + magic link), proxy guard, admin shell with role-aware sidebar (P5.1) ([5b21ee0](https://github.com/ilramdhan/tempe-mak-nuk/commit/5b21ee0e3ad59c6cfcf85d947f9dfcbe715b0621))
* **admin:** dashboard — slot week, WA clicks 30d, drafts, shortcuts (P5.2) ([27eb8a9](https://github.com/ilramdhan/tempe-mak-nuk/commit/27eb8a98a9b5578184af635312e90720ab749cf2))
* **admin:** dashboard content warnings card (P8.6) ([a28aace](https://github.com/ilramdhan/tempe-mak-nuk/commit/a28aacef2d7d5a585f576457f8e8fb6fdab67ff4))
* **admin:** dynamic RBAC — owner-managed role/user permission overrides, post/recipe delete owner-only (P8.14) ([cf30599](https://github.com/ilramdhan/tempe-mak-nuk/commit/cf305999cff5ebf0500ea6f05a2f94ce924b4435))
* **admin:** FAQ, testimonials, navigation/announcement/CTA managers with dnd ordering (P5.7) ([607cad5](https://github.com/ilramdhan/tempe-mak-nuk/commit/607cad5103db0dcc532a0db7d5345177cc50bd0a))
* **admin:** media library — Storage upload via sharp WebP, required alt, usage-aware delete, reusable MediaPicker (P5.8) ([8e3e589](https://github.com/ilramdhan/tempe-mak-nuk/commit/8e3e589aaab39077874bfe983634dae6768444aa))
* **admin:** owner-only legal document editor with versions and consent config editor (P5.10) ([880c28d](https://github.com/ilramdhan/tempe-mak-nuk/commit/880c28de9c8bfd3be68d5977092498a7951a9507))
* **admin:** page builder — sortable sections, 17 block forms, SEO tab, preview, transactional savePageContent with optimistic lock (P5.3) ([c37bf32](https://github.com/ilramdhan/tempe-mak-nuk/commit/c37bf32858fa68ef9dcd5b2516af642eb0301b7d))
* **admin:** products CRUD — shapes/sizes, nutrition, gallery, SEO, global options (P5.4) ([cda63fd](https://github.com/ilramdhan/tempe-mak-nuk/commit/cda63fd6c886a2621e34c30f33af6800a55d6938))
* **admin:** settings tabs, owner-only redirects and user management with invite (P5.9) ([4696812](https://github.com/ilramdhan/tempe-mak-nuk/commit/4696812c206c345f63df5549b79bd61194d39ac0))
* **admin:** slot & PO calendar, holidays, order rules (P5.5) ([459f7ed](https://github.com/ilramdhan/tempe-mak-nuk/commit/459f7edf0d7ce9e1202fb53f2d70c1ec6b67a480))
* **admin:** Tiptap RichTextEditor + jurnal & resep CRUD with scheduling and SEO (P5.6) ([88ae09c](https://github.com/ilramdhan/tempe-mak-nuk/commit/88ae09ccbc4cbb402d239c3df963632e3c7c908a))
* **brand:** tagline, tokens, outlined SVG logo set ([af490dd](https://github.com/ilramdhan/tempe-mak-nuk/commit/af490dd89e54f9abae0b5d1f77070e32929075c7))
* **cache:** expire media users' tags on alt change; cron revalidate for scheduled content (P8.4) ([#7](https://github.com/ilramdhan/tempe-mak-nuk/issues/7)) ([7ae7039](https://github.com/ilramdhan/tempe-mak-nuk/commit/7ae7039212596d7db61ff3ceacf09cec1471d95f))
* **data:** section blocks + renderer, per-domain queries/actions, slot availability engine, wa-link, rich text ([ca370c4](https://github.com/ilramdhan/tempe-mak-nuk/commit/ca370c42e0114b974fe37aa87af408290e24c118))
* **db:** 27-table drizzle schema, RLS policies, auth profile trigger, RLS tests ([3606e64](https://github.com/ilramdhan/tempe-mak-nuk/commit/3606e643b4b141c8f30915c2f3cb1fbbd3790924))
* **design:** OKLCH tokens, fluid type, fonts, theme toggle, layout primitives ([9d46072](https://github.com/ilramdhan/tempe-mak-nuk/commit/9d4607259c21b86390b36facf59ee654573cc911))
* **infra:** zod env, supabase ssr clients, proxy, security headers, drizzle, keepalive cron ([27a09c3](https://github.com/ilramdhan/tempe-mak-nuk/commit/27a09c3d8771fb12ac1d64a68b6b71e06373490f))
* **motion:** GSAP/Lenis motion kit with reduced-motion and SSR-safe reveals ([ca53080](https://github.com/ilramdhan/tempe-mak-nuk/commit/ca53080d5f0bf65ecf63d0214a71f86c94608e1d))
* **scaffold:** Next.js 16 + Tailwind v4 + tooling; photo brief & SEO docs ([b572712](https://github.com/ilramdhan/tempe-mak-nuk/commit/b57271278560c59a1b201635925a4598255f009f))
* **seed:** idempotent dummy content for all domains ([d44e99d](https://github.com/ilramdhan/tempe-mak-nuk/commit/d44e99dddf9e830c650c5a1ff027616d0f7534d6))
* **seo:** dynamic OG images (global, product, article, recipe) + icon/apple-icon (P6.3) ([38f5771](https://github.com/ilramdhan/tempe-mak-nuk/commit/38f5771f1703b0ac6d194cab395a38df1edc9f6d))
* **seo:** lib/seo metadata builder + typed JSON-LD builders applied to all public pages; default global OG image (P6.1) ([57f898b](https://github.com/ilramdhan/tempe-mak-nuk/commit/57f898b5c425502baef49f6d43b2b8eb7f1d6e2d))
* **seo:** PNG + maskable manifest icons ([51670ee](https://github.com/ilramdhan/tempe-mak-nuk/commit/51670eedc6638d2bce0f057f34d389b9979537d9))
* **seo:** sitemap, robots, manifest; DB redirects in proxy with in-memory TTL cache (P6.2) ([d804912](https://github.com/ilramdhan/tempe-mak-nuk/commit/d804912c6e4a23259e5e1528546621880d571c2c))
* **site:** /cara-pesan with public slot calendar; shared SlotWeekStrip on beranda (P4.5) ([5bacc43](https://github.com/ilramdhan/tempe-mak-nuk/commit/5bacc43d04f5983c0e85be6981a181b090583bd1))
* **site:** /faq search + groups, /kontak with lazy map, 404 & error pages (P4.10) ([760c907](https://github.com/ilramdhan/tempe-mak-nuk/commit/760c9071327fd496967cc5dfb1a0a84f9710218f))
* **site:** /jurnal list, category, detail with TOC, reading time, related, BlogPosting JSON-LD (P4.8) ([2d5a8d7](https://github.com/ilramdhan/tempe-mak-nuk/commit/2d5a8d7e40758a3524b8437673a05a615b491c93))
* **site:** /kemitraan B2B page + inquiry form → WhatsApp (P4.6) ([67c403d](https://github.com/ilramdhan/tempe-mak-nuk/commit/67c403d1917fe1f1e91836a094c4156e0c307db9))
* **site:** /produk list + detail with comparison, nutrition, Product JSON-LD (P4.3) ([192a919](https://github.com/ilramdhan/tempe-mak-nuk/commit/192a9199a3710098d339e249d4f864ab358e02f3))
* **site:** /produk, /faq, /kontak driven by CMS pages; public catch-all for CMS pages with reserved-slug guard (P8.1) ([1044ae0](https://github.com/ilramdhan/tempe-mak-nuk/commit/1044ae0a067c01f63b4c272c4ea84036c74f6246))
* **site:** /proses, /manfaat-tempe, /halal-kualitas, /tentang from CMS blocks + JSON-LD (P4.7) ([0d1da96](https://github.com/ilramdhan/tempe-mak-nuk/commit/0d1da964942a816ee39f0f0757d6adb1cfbac6fe))
* **site:** /resep list with client filter, detail with Recipe JSON-LD (P4.9) ([eaff15d](https://github.com/ilramdhan/tempe-mak-nuk/commit/eaff15d38f3c830d9bc8553c13424b7e14db6a4d))
* **site:** cookie consent (banner, preferences, analytics gate) + legal pages; mount in site layout/footer (P4.11) ([21133c7](https://github.com/ilramdhan/tempe-mak-nuk/commit/21133c754eb92b56069d27187a47f47b43bf577f))
* **site:** global layout shell — header, mobile menu, announcement, footer, floating WA, breadcrumb (P4.1) ([476d667](https://github.com/ilramdhan/tempe-mak-nuk/commit/476d6674bb76f30b9514c038b07e4e2c45355dd9))
* **site:** home page — split-text hero, trust marquee, pinned process story, slot teaser, audience, CTA, JSON-LD (P4.2) ([9283fc7](https://github.com/ilramdhan/tempe-mak-nuk/commit/9283fc705cb779f1fcbb2b8bac1291d0ee72b805))
* **site:** Order Builder /custom-order — 4-step builder, slot calendar, lead/cutoff rules, WA message, draft (P4.4) ([0e543c3](https://github.com/ilramdhan/tempe-mak-nuk/commit/0e543c311e4b8cd1f9e159e42bada3bb6a859e4b))
* **site:** product FAQ + related recipes, shapes gallery, slot announcement, consent 12 months + reject, legal TOC, seed probiotic/timeline/team (P8.7) ([#10](https://github.com/ilramdhan/tempe-mak-nuk/issues/10)) ([979278d](https://github.com/ilramdhan/tempe-mak-nuk/commit/979278d2bce3056b6fa1a6c183ee56b7da8ac99a))
* **ui:** shadcn primitives on brand tokens, slot/halal badges, textures ([ddf519e](https://github.com/ilramdhan/tempe-mak-nuk/commit/ddf519ed62b2267bd9157b132192c8b81261b431))


### Perbaikan

* **a11y,ui:** visual consistency review + axe strict green (P7.2) ([cd526e1](https://github.com/ilramdhan/tempe-mak-nuk/commit/cd526e1509ec13f613e6bc5b7ba757a43318f076))
* **admin:** editors can edit seo/cta settings per key; drop legacy redirect actions (P8.9) ([40f6ff1](https://github.com/ilramdhan/tempe-mak-nuk/commit/40f6ff1162afb100a2011561252abac9bc3d8f6f))
* **db:** build uses DIRECT_URL with 1 conn/worker — transaction pooler stalls "use cache" prerender reads ([663279d](https://github.com/ilramdhan/tempe-mak-nuk/commit/663279d2c0532b822996a7182ffb670ee0cda76d))
* **db:** keep pooler URL for build (direct host is IPv6-only, session port blocked); 1 conn/worker ([51ed6aa](https://github.com/ilramdhan/tempe-mak-nuk/commit/51ed6aa9f572cb1e92195a1e1b66d6ebadab2f56))
* keep jsonb strings as strings, teach cn() the custom design tokens ([cdd5152](https://github.com/ilramdhan/tempe-mak-nuk/commit/cdd5152b6f343717bf93b39e2c9953d01a9a2a98))
* **routes:** real 404 for unknown slugs via ensureStatic, category title, JSON-LD image (P8.2) ([c542df9](https://github.com/ilramdhan/tempe-mak-nuk/commit/c542df9d57e64e26c6e824d8b01b54efe6f4fe76))
* **security:** close self-signup admin access + server-side owner checks (P7.3) ([5f0633c](https://github.com/ilramdhan/tempe-mak-nuk/commit/5f0633cd264638beaf15573ac620939f6171b3b2))
* **seo:** single brand in titles, sitemap noindex filter, favicon.ico, JSON-LD image, legal descriptions (P8.3) ([a0760d3](https://github.com/ilramdhan/tempe-mak-nuk/commit/a0760d310e3f1ab6bb99810aca015bcc5a835bab))
* **ui:** dark card token, sticky order bar shows with builder, floating WA hides over footer/banner/custom-order (P8.12) ([48c1462](https://github.com/ilramdhan/tempe-mak-nuk/commit/48c1462d23fc22d8198335f3b3b9c88cc3dabe84))


### Performa

* defer below-the-fold motion to idle/near-viewport, lazy SlotCalendar, modern browserslist (P8.11) ([4d7b232](https://github.com/ilramdhan/tempe-mak-nuk/commit/4d7b232e097ffc4687baf65d75cc5d3ca8d01c63))
* **site:** static consent banner (LCP 4.4s→&lt;2s mobile), lazy Lenis/GSAP + analytics, font preload, next/image preload; OG covers accept WebP; stable /og-default.png fallback (P6.4) ([4fbd396](https://github.com/ilramdhan/tempe-mak-nuk/commit/4fbd396edda343dbbbd3b27c9150a409bf23767b))


### Refaktor

* **admin:** page builder rich text uses shared Tiptap RichTextEditor; drop markdown shim ([f350544](https://github.com/ilramdhan/tempe-mak-nuk/commit/f350544003a424814a854d87bc74a9a7e2737ab8))
* **admin:** replace legacy media selects with MediaPicker across products, posts, recipes, pages, settings, testimonials, editor (P5.8) ([4396e83](https://github.com/ilramdhan/tempe-mak-nuk/commit/4396e83283d6e4cfc7d2ea56665dbbe260ff5d6f))


### Dokumentasi

* community health files, proprietary LICENSE, README badges + setup via make (P9.1) ([6efa2a1](https://github.com/ilramdhan/tempe-mak-nuk/commit/6efa2a118f8a17e0d80140c548d90ca05bfdc512))
* **handover:** redact Supabase project ref ([df16ebc](https://github.com/ilramdhan/tempe-mak-nuk/commit/df16ebcf4b595c7b36dd5f135fda73022dd479d5))
* plan Phase 8 & 9 (session 7), add P8.14 dynamic RBAC ([cf7ad44](https://github.com/ilramdhan/tempe-mak-nuk/commit/cf7ad44d35ded2b1287c014a82261451b570c772))
* production deploy checklist — Supabase, Vercel env, domain, Search Console, GBP (P7.5) ([5791f37](https://github.com/ilramdhan/tempe-mak-nuk/commit/5791f3748f96e57de200a32cd59c045ee668e8b3))
* prompt, plan, state, dummy business data ([f8c6b3e](https://github.com/ilramdhan/tempe-mak-nuk/commit/f8c6b3e80b74dc11834da1ee2ee9c8357f38045d))
* README (developer) + docs/admin-guide.md (panduan pemilik, non-teknis) (P7.4) ([56df67a](https://github.com/ilramdhan/tempe-mak-nuk/commit/56df67ab9e0f1592b4272e91a27c6cb8fea75877))
* session 2 handover, P4.1/P5.1 done ([dad218e](https://github.com/ilramdhan/tempe-mak-nuk/commit/dad218e9ad8614de4e4d9512e8987baf56aef8ba))
* session 3 handover — Fase 4 (minus P4.5) + P5.2–P5.6 done ([3e840ed](https://github.com/ilramdhan/tempe-mak-nuk/commit/3e840ed48b099c963b1e5e3d4877dd0460bbce6e))
* session 4 handover — Fase 5 & 6 done, next Fase 7 ([4f6a467](https://github.com/ilramdhan/tempe-mak-nuk/commit/4f6a4676ecec46ac1803f97a0b036252cf755ad4))
* session 5 handover — P7.1, P7.3, P7.4 done; next P7.2 (+a11y fixes) and P7.5 ([f0934d2](https://github.com/ilramdhan/tempe-mak-nuk/commit/f0934d28f40c0f649c9fbbbfc70d1ceba5e0e7db))
* session 6 final handover — audit findings (docs/audit), Phase 8 gaps + Phase 9 GitHub repo plan ([917bafe](https://github.com/ilramdhan/tempe-mak-nuk/commit/917bafefa22d25491c2450beaacb33a1511f8d72))
* session 6 handover — Phase 7 complete (P7.2, P7.5) ([cf720d5](https://github.com/ilramdhan/tempe-mak-nuk/commit/cf720d547fa1bcc26594f2aec6424a592b13d5ca))
* session 7 handover — Phase 8 near-complete, Phase 9 progress, PR workflow ([#9](https://github.com/ilramdhan/tempe-mak-nuk/issues/9)) ([5b8a34d](https://github.com/ilramdhan/tempe-mak-nuk/commit/5b8a34d204cdb018dbce527b382445331581652a))
* session handover ([bcfa036](https://github.com/ilramdhan/tempe-mak-nuk/commit/bcfa036a8a840d7d4b0ab7e51e612a274ab155fe))
* **state:** record available skills (P0.6/P8.13), start P9.2 ([4914d6f](https://github.com/ilramdhan/tempe-mak-nuk/commit/4914d6fcd7dd671c4a2eab595ce12f2f806613e1))
* **state:** start P8.1–P8.3 ([a32ca43](https://github.com/ilramdhan/tempe-mak-nuk/commit/a32ca432be923c833df598329f77cc21fe1a9065))
* **state:** start P8.10 ([8e74545](https://github.com/ilramdhan/tempe-mak-nuk/commit/8e7454551c99feb68a5feddc79448f6d144caded))
* **state:** start P8.11 ([bedecee](https://github.com/ilramdhan/tempe-mak-nuk/commit/bedecee3af9d5248324b804354d8c804ad56c5d9))
* **state:** start P8.12 ([2853d7f](https://github.com/ilramdhan/tempe-mak-nuk/commit/2853d7f01c7c0b6459a43b97bc5cd115b94e9f6b))
* **state:** start P8.14 ([dad2dd2](https://github.com/ilramdhan/tempe-mak-nuk/commit/dad2dd21a533d7aeeeac810003f42bf53cb49a49))
* **state:** start P8.4 ([f219117](https://github.com/ilramdhan/tempe-mak-nuk/commit/f21911756b5c9c3a9c5ab15e8ac7c494ebf421b9))
* **state:** start P8.5 ([684ce12](https://github.com/ilramdhan/tempe-mak-nuk/commit/684ce122a238ae1fb75586303358f27b9deff311))
* **state:** start P8.6 ([e610f2f](https://github.com/ilramdhan/tempe-mak-nuk/commit/e610f2f47144ce319d4ad973b64f3cd1d48b33f2))
* **state:** start P8.7 ([e732b7e](https://github.com/ilramdhan/tempe-mak-nuk/commit/e732b7e4c95437b3f71a03625321489cb3f0a558))
* **state:** start P8.9 ([fd28b9a](https://github.com/ilramdhan/tempe-mak-nuk/commit/fd28b9a203dba8a84501183dd5b4a466fe5475c6))
* **state:** start P9.1 ([072e319](https://github.com/ilramdhan/tempe-mak-nuk/commit/072e3197921f7a87c461820ef447d11f072bda64))
* **state:** start P9.3 ([845d79c](https://github.com/ilramdhan/tempe-mak-nuk/commit/845d79cb92da3bb8428bedd1ffcc8ef0b99ff7f6))
