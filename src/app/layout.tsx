import type { Metadata, Viewport } from "next";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { fontVariables } from "@/lib/fonts";
import { rootMetadata } from "@/lib/seo/server";
import "@/styles/globals.css";

export async function generateMetadata(): Promise<Metadata> {
  return rootMetadata();
}

// Matches --background in globals.css (light #FAF7F2 / dark #100F0C).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F2" },
    { media: "(prefers-color-scheme: dark)", color: "#100F0C" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${fontVariables} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
