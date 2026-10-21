import "server-only";

import { asc } from "drizzle-orm";

import { getDb } from "@/db/client";
import { testimonials } from "@/db/schema";
import { requireRole } from "@/lib/auth/require-role";

export async function listTestimonialsForAdmin() {
  await requireRole("editor", { onFail: "redirect" });
  return getDb().select().from(testimonials).orderBy(asc(testimonials.sort));
}
