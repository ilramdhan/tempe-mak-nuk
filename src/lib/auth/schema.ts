import { z } from "zod";

/** Shared (client + server) login form schemas. Messages in Indonesian. */

const email = z
  .string()
  .trim()
  .min(1, "Isi email Anda dulu, ya.")
  .max(254, "Email terlalu panjang.")
  .pipe(z.email("Format email belum benar."))
  .transform((v) => v.toLowerCase());

const next = z.string().max(512).optional();

export const passwordLoginSchema = z.object({
  email,
  password: z
    .string()
    .min(1, "Isi kata sandi Anda dulu, ya.")
    .max(128, "Kata sandi terlalu panjang."),
  next,
});

export const magicLinkSchema = z.object({ email, next });

export type PasswordLoginInput = z.input<typeof passwordLoginSchema>;
export type MagicLinkInput = z.input<typeof magicLinkSchema>;
