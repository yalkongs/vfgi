import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _sql: Sql | null = null;

function resolveUrl() {
  const u =
    process.env.vfgi_DATABASE_URL ??
    process.env.DATABASE_URL ??
    process.env.vfgi_POSTGRES_URL;
  if (!u) {
    throw new Error(
      "DATABASE_URL not configured. Run `vercel env pull .env.local` after linking Neon Postgres."
    );
  }
  return u;
}

function getDb() {
  if (_db) return _db;
  const url = resolveUrl();
  _sql = postgres(url, { prepare: false });
  _db = drizzle(_sql, { schema });
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_t, p) {
    const d = getDb() as unknown as Record<string | symbol, unknown>;
    return d[p];
  },
});

export type DB = ReturnType<typeof drizzle>;
