import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

export type { ClassValue };

// Custom tokens from globals.css (@theme). Without these, tailwind-merge reads `text-eyebrow`
// as a text colour and drops it when combined with e.g. `text-muted-foreground`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "display-xl",
        "display",
        "h1",
        "h2",
        "h3",
        "h4",
        "lead",
        "body",
        "small",
        "caption",
        "eyebrow",
      ],
      spacing: ["gutter", "section", "section-tight"],
      container: ["measure", "content", "wide"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
