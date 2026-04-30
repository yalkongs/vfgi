import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "../db/client";
import { run, event as eventTable, study } from "../db/schema";
import { desc, eq, sql } from "drizzle-orm";

async function main() {
  const recent = await db
    .select({
      id: run.id,
      studyId: run.studyId,
      status: run.status,
      compareLabel: run.compareLabel,
      compareGroup: run.compareGroup,
      panelCount: sql<number>`array_length(${run.panelIds}, 1)`,
      startedAt: run.startedAt,
      endedAt: run.endedAt,
      error: run.error,
      createdAt: run.createdAt,
    })
    .from(run)
    .orderBy(desc(run.createdAt))
    .limit(8);

  console.log("=== 최근 run 8건 ===\n");
  for (const r of recent) {
    const evCount = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(eventTable)
      .where(eq(eventTable.runId, r.id));
    const speakCount = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(eventTable)
      .where(sql`${eventTable.runId} = ${r.id} AND ${eventTable.type} = 'speak'`);
    const errCount = await db
      .select({ c: sql<number>`count(*)::int` })
      .from(eventTable)
      .where(sql`${eventTable.runId} = ${r.id} AND ${eventTable.type} = 'error'`);

    console.log(`[${r.id.slice(0, 8)}] status=${r.status} label=${r.compareLabel ?? "-"}`);
    console.log(`  panel=${r.panelCount ?? 0}  events=${evCount[0].c}  speaks=${speakCount[0].c}  errors=${errCount[0].c}`);
    console.log(`  started=${r.startedAt?.toISOString().slice(0, 19) ?? "-"}  ended=${r.endedAt?.toISOString().slice(0, 19) ?? "-"}`);
    if (r.error) console.log(`  error=${r.error.slice(0, 200)}`);
    if (r.compareGroup) console.log(`  compareGroup=${r.compareGroup}`);

    if (errCount[0].c > 0) {
      const errs = await db
        .select({ payload: eventTable.payload })
        .from(eventTable)
        .where(sql`${eventTable.runId} = ${r.id} AND ${eventTable.type} = 'error'`)
        .limit(3);
      for (const e of errs) {
        console.log(`  ERROR EVENT: ${JSON.stringify(e.payload).slice(0, 300)}`);
      }
    }
    console.log();
  }

  // study 주제 확인
  console.log("=== 최근 study 5건 ===\n");
  const recentStudies = await db
    .select({ id: study.id, title: study.title, objective: study.objective, createdAt: study.createdAt })
    .from(study)
    .orderBy(desc(study.createdAt))
    .limit(5);
  for (const s of recentStudies) {
    console.log(`[${s.id.slice(0, 8)}] ${s.title}`);
    console.log(`  objective: ${s.objective.slice(0, 100)}`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
