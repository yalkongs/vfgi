import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const url =
  process.env.vfgi_DATABASE_URL_UNPOOLED ??
  process.env.vfgi_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL not set. Run `vercel env pull .env.local`.");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
