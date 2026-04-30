import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "../db/client";
import { persona } from "../db/schema";
import { sql } from "drizzle-orm";

async function main() {
  const rows = await db
    .select({
      province: persona.province,
      cnt: sql<number>`count(*)::int`,
    })
    .from(persona)
    .groupBy(persona.province)
    .orderBy(sql`count(*) desc`);

  console.log(`총 ${rows.length} 개 province 값 (총 인원: ${rows.reduce((s, r) => s + r.cnt, 0)}):`);
  for (const r of rows) {
    console.log(`  ${JSON.stringify(r.province).padEnd(20)} ${r.cnt}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
