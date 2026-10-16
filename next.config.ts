import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/** Supabase origin (https + wss) derived from env; tolerant of missing/invalid values at build. */
function supabaseOrigin(): URL | null {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
      : null;
  } catch {
    return null;
  }
}

const supabase = supabaseOrigin();
// Fallback wildcard keeps images/APIs working if the URL is only known at runtime.
const supabaseHttp = supabase ? supabase.origin : "https://*.supabase.co";
const supabaseWs = supabase
  ? `${supabase.protocol === "http:" ? "ws" : "wss"}://${supabase.host}`
  : "wss://*.supabase.co";

const csp = [
  "default-src 'self'",
  // No nonces (keeps pages static under cacheComponents); Next inline bootstrap needs 'unsafe-inline'.
  `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseHttp}`,
  "font-src 'self' data:",
  `media-src 'self' blob: ${supabaseHttp}`,
  `connect-src 'self' ${supabaseHttp} ${supabaseWs} https://va.vercel-scripts.com https://vitals.vercel-insights.com${isDev ? " ws:" : ""}`,
  "frame-src https://www.google.com https://maps.google.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()",
  },
];

type RemotePattern = Exclude<
  NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]>[number],
  URL
>;

const supabaseImagePattern: RemotePattern = supabase
  ? {
      protocol: supabase.protocol === "http:" ? "http" : "https",
      hostname: supabase.hostname,
      port: supabase.port,
      pathname: "/storage/v1/**",
    }
  : {
      protocol: "https",
      hostname: "*.supabase.co",
      pathname: "/storage/v1/**",
    };

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    remotePatterns: [supabaseImagePattern],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
