/**
 * Friendly Indonesian messages for the page builder's client-side validation. Messages set
 * explicitly in the schemas still win; anything not covered falls back to Zod's `id` locale.
 */
import type { z } from "zod";
import idLocale from "zod/v4/locales/id.js";

const fallback = idLocale().localeError;

export const idErrorMap: z.core.$ZodErrorMap = (issue) => {
  switch (issue.code) {
    case "too_small":
      if (issue.origin === "string")
        return Number(issue.minimum) <= 1
          ? "Wajib diisi"
          : `Minimal ${issue.minimum} karakter`;
      if (issue.origin === "array") return `Minimal ${issue.minimum} item`;
      if (issue.origin === "number") return `Minimal ${issue.minimum}`;
      break;
    case "too_big":
      if (issue.origin === "string")
        return `Maksimal ${issue.maximum} karakter`;
      if (issue.origin === "array") return `Maksimal ${issue.maximum} item`;
      if (issue.origin === "number") return `Maksimal ${issue.maximum}`;
      break;
    case "invalid_format":
      return issue.format === "regex"
        ? "Format tidak valid"
        : `Format ${issue.format} tidak valid`;
    case "invalid_value":
      return "Pilih salah satu opsi yang tersedia";
    case "invalid_type":
      if (issue.input === undefined || issue.input === null)
        return "Wajib diisi";
      if (issue.expected === "number") return "Harus berupa angka";
      return "Isian tidak valid";
    case "not_multiple_of":
      return "Harus bilangan bulat";
  }
  return fallback(issue);
};
