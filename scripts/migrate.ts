import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(process.cwd(), ".env.local") });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

const url =
  process.env.vfgi_DATABASE_URL_UNPOOLED ??
  process.env.vfgi_DATABASE_URL ??
  process.env.DATABASE_URL;

if (!url) {
  throw new Error("DATABASE_URL not set. Run `vercel env pull .env.local`.");
}

async function main() {
  const sql = postgres(url!, { max: 1, prepare: false });
  const db = drizzle(sql);
  console.log("Applying migrations from db/migrations …");
  await migrate(db, { migrationsFolder: "db/migrations" });
  console.log("✓ Migrations applied");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
