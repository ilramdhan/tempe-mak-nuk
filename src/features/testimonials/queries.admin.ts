import "server-only";

import { asc } from "drizzle-orm";

import { getDb } from "@/db/client";
import { testimonials } from "@/db/schema";

export async function listTestimonialsForAdmin() {
  return getDb().select().from(testimonials).orderBy(asc(testimonials.sort));
}
