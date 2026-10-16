import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: [".env.local", ".env"], quiet: true });

// Migrations use the direct/session connection (port 5432), not the transaction pooler.
// `generate` works without a URL; `migrate`/`push`/`studio` need DIRECT_URL (preferred) or DATABASE_URL.
const url = process.env.DIRECT_URL || process.env.DATABASE_URL || "";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url },
  schemaFilter: ["public"],
  strict: true,
  verbose: true,
});
