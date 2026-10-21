"use server";

import { createHash } from "node:crypto";

import { headers } from "next/headers";

import { getDb } from "@/db/client";
import { waClicks } from "@/db/schema";
import { hasDatabase } from "@/features/_shared/db";

import { createRateLimiter } from "./rate-limit";
import { waClickInputSchema, type WaClickInput } from "./schema";

// 20 events / minute per client. See rate-limit.ts for serverless limitations.
const allow = createRateLimiter({ limit: 20, windowMs: 60_000 });

/** One-way, salted, truncated hash — used only as an in-memory map key, never stored. */
async function clientKey(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  const salt = process.env.REVALIDATE_SECRET ?? "tmn";
  return createHash("sha256")
    .update(`${salt}:${ip}`)
    .digest("base64url")
    .slice(0, 16);
}

export type TrackResult = { ok: boolean };

/**
 * PUBLIC (no auth) — record an anonymous WhatsApp CTA click.
 * Stores only { source, kind, variant, created_at }: no IP, UA, names or numbers.
 * Fire-and-forget from the client; never throws.
 */
export async function trackWaClick(input: WaClickInput): Promise<TrackResult> {
  const parsed = waClickInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  try {
    if (!allow(await clientKey())) return { ok: false };
    if (!hasDatabase()) return { ok: false };
    await getDb().insert(waClicks).values(parsed.data);
    return { ok: true };
  } catch (error) {
    console.warn(
      "[analytics] trackWaClick failed:",
      error instanceof Error ? error.message : error,
    );
    return { ok: false };
  }
}
