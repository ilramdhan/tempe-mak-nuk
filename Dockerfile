# syntax=docker/dockerfile:1
#
# Tempe Mak Nuk — self-host image (Next.js `output: "standalone"`).
# Guide: docs/deploy.md § "Self-host dengan Docker".
#
#   docker build \
#     --build-arg NEXT_PUBLIC_SITE_URL=https://tempemaknuk.com \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
#     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key> \
#     --secret id=database_url,env=DATABASE_URL \
#     -t tempe-mak-nuk .
#
# NEXT_PUBLIC_* are inlined into the JS bundles and next.config.ts (CSP / image host) at build
# time, so they are build ARGs. `next build` prerenders "use cache" pages from the database
# (generateStaticParams must return ≥1 slug), so DATABASE_URL is a BuildKit secret: mounted for
# the single build RUN only, never an ARG/ENV and never stored in a layer. Every server secret
# (service role, DATABASE_URL, CRON_SECRET, REVALIDATE_SECRET) is a runtime env var only.

# Base image is written literally (not via ARG) so Dependabot's docker ecosystem can bump it;
# keep both FROM lines on the same tag.

# ── base: node + pnpm (version pinned by package.json "packageManager") ──────────────
FROM node:26.12.0-alpine3.23 AS base
ENV PNPM_HOME=/pnpm \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NEXT_TELEMETRY_DISABLED=1
ENV PATH=$PNPM_HOME:$PATH
# libc6-compat: glibc shims some prebuilt binaries still expect on musl.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json ./
RUN corepack enable && corepack install

# ── deps: full install (dev deps are needed by `next build`), cached store ──────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile

# ── build ──────────────────────────────────────────────────────────────────────────
FROM base AS build
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# SKIP_ENV_VALIDATION only for this RUN: the build has no runtime secrets (service role,
# CRON_SECRET, …) and must still reach the DB. The runner stage validates env normally.
RUN --mount=type=secret,id=database_url,env=DATABASE_URL,required=true \
    --mount=type=cache,id=next-cache,target=/app/.next/cache \
    SKIP_ENV_VALIDATION=1 pnpm build

# ── runner: standalone server only, non-root ──────────────────────────────────────────
FROM node:26.12.0-alpine3.23 AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app
# npm/corepack/yarn are unused by `node server.js`; dropping them removes their (frequently
# vulnerable) bundled deps from the attack surface and from the Trivy gate.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
      /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /opt/yarn* \
      /usr/local/bin/yarn /usr/local/bin/yarnpkg && \
    addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
# Writable runtime cache (ISR / "use cache" entries, optimized images).
RUN mkdir -p .next/cache && chown nextjs:nodejs .next/cache

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/robots.txt').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "server.js"]
