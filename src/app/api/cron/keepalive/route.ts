import { connection } from "next/server";

import { getSql } from "@/db/client";
import { getServerEnv } from "@/lib/env";

import { isAuthorizedCronRequest } from "../_lib/auth";

const noStore = { "Cache-Control": "no-store" };

/** Vercel Cron: keeps the free Supabase project from pausing (see vercel.json). */
export async function GET(request: Request) {
  await connection();

  const secret = process.env.CRON_SECRET;
  if (!isAuthorizedCronRequest(request.headers.get("authorization"), secret)) {
    return Response.json(
      { ok: false, error: "unauthorized" },
      { status: 401, headers: noStore },
    );
  }

  const startedAt = Date.now();
  try {
    getServerEnv();
    await getSql()`select 1`;
    return Response.json(
      {
        ok: true,
        db: "up",
        latencyMs: Date.now() - startedAt,
        at: new Date().toISOString(),
      },
      { headers: noStore },
    );
  } catch (err) {
    console.error("[cron/keepalive] failed:", err);
    return Response.json(
      { ok: false, db: "down" },
      { status: 503, headers: noStore },
    );
  }
}
