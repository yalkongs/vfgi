import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "../db/client";
import { panelSpec, study } from "../db/schema";
import { desc } from "drizzle-orm";
import { samplePanel, expandProvinces } from "../lib/personaSampler";

async function main() {
  const recent = await db
    .select()
    .from(panelSpec)
    .orderBy(desc(panelSpec.createdAt))
    .limit(5);

  console.log("=== 최근 panel_spec 5건 ===\n");
  for (const ps of recent) {
    const [s] = await db.select().from(study).where(((s) => undefined)());
    void s;
    console.log(`[${ps.id.slice(0, 8)}] study=${ps.studyId.slice(0, 8)}`);
    console.log(`  filters: ${JSON.stringify(ps.filters)}`);
    console.log(`  quotas:  ${JSON.stringify(ps.quotas)}`);
    console.log(`  size: ${ps.size}  seed: ${ps.seed}  diversity: ${ps.diversity}`);

    // 실제 매칭 시도
    const filters = ps.filters as Record<string, unknown>;
    if (filters.province && Array.isArray(filters.province)) {
      const expanded = expandProvinces(filters.province as string[]);
      console.log(`  expanded provinces: ${JSON.stringify(expanded)}`);
    }

    try {
      const panel = await samplePanel({
        filters: ps.filters as never,
        quotas: (ps.quotas ?? []) as never,
        size: ps.size,
        seed: ps.seed,
      });
      console.log(`  → samplePanel result: ${panel.length}명`);
      if (panel.length > 0) {
        console.log(`     첫 3명: ${panel.slice(0, 3).map((p) => `${p.name}(${p.province})`).join(", ")}`);
      }
    } catch (e) {
      console.log(`  ❌ samplePanel error: ${(e as Error).message}`);
    }
    console.log();
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
