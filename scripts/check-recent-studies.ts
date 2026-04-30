import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "../db/client";
import { study, panelSpec, stimulus, guide, run } from "../db/schema";
import { desc, eq, sql } from "drizzle-orm";

async function main() {
  const studies = await db
    .select()
    .from(study)
    .orderBy(desc(study.createdAt))
    .limit(10);

  console.log(`=== 최근 study ${studies.length}건 ===\n`);
  for (const s of studies) {
    const ps = await db.select().from(panelSpec).where(eq(panelSpec.studyId, s.id));
    const stim = await db.select().from(stimulus).where(eq(stimulus.studyId, s.id));
    const g = await db.select().from(guide).where(eq(guide.studyId, s.id));
    const runs = await db.select({ c: sql<number>`count(*)::int` }).from(run).where(eq(run.studyId, s.id));

    console.log(`[${s.id.slice(0, 8)}] ${s.title}`);
    console.log(`  생성: ${s.createdAt.toISOString().slice(0, 19)}`);
    console.log(`  panel_spec: ${ps.length}건  stimulus: ${stim.length}건  guide: ${g.length}건  runs: ${runs[0].c}`);
    if (ps.length === 0) console.log(`  ⚠ panel_spec MISSING — Study 상세에서 패널 미리보기 0명으로 표시됨`);
    if (g.length === 0) console.log(`  ⚠ guide MISSING — vFGI 시작 불가`);
    if (ps.length > 0) {
      const p = ps[0];
      console.log(`  panel filters: ${JSON.stringify(p.filters)}`);
      console.log(`  panel size:    ${p.size}`);
    }
    console.log();
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
