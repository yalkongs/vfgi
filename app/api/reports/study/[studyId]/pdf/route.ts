import { NextRequest } from "next/server";
import { db } from "@/db/client";
import {
  study,
  stimulus,
  run,
  event as eventTable,
  persona,
  calibration,
} from "@/db/schema";
import { eq, asc, inArray, desc, isNotNull } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildStudyReportDocument } from "@/lib/pdf/studyReport";
import { summarizeRun, compareRuns } from "@/lib/diff";
import { generateExecSummary } from "@/lib/agents/execSummary";
import type { FGIEvent } from "@/lib/eventStream";
import { insight as insightTable } from "@/db/schema";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ studyId: string }> }
) {
  const { studyId } = await ctx.params;

  const [s] = await db.select().from(study).where(eq(study.id, studyId));
  if (!s) return new Response("study not found", { status: 404 });

  const [stim] = await db
    .select()
    .from(stimulus)
    .where(eq(stimulus.studyId, studyId))
    .orderBy(desc(stimulus.version))
    .limit(1);

  const runs = await db
    .select()
    .from(run)
    .where(eq(run.studyId, studyId))
    .orderBy(asc(run.createdAt));

  // 각 Run 의 events + summary
  const runSummaries = await Promise.all(
    runs.map(async (r) => {
      const events = await db
        .select()
        .from(eventTable)
        .where(eq(eventTable.runId, r.id))
        .orderBy(asc(eventTable.seq));
      return summarizeRun(r, events);
    })
  );

  // Panel personas
  const allPanelIds = Array.from(new Set(runs.flatMap((r) => r.panelIds)));
  const panel = allPanelIds.length
    ? await db.select().from(persona).where(inArray(persona.id, allPanelIds))
    : [];
  const panelMap = Object.fromEntries(panel.map((p) => [p.id, p]));

  // Calibrations
  const calibrations = await db
    .select()
    .from(calibration)
    .where(eq(calibration.studyId, studyId))
    .orderBy(desc(calibration.createdAt));

  // Insights (DB에 저장된 Analyst 결과)
  const dbInsights = await db
    .select()
    .from(insightTable)
    .where(
      inArray(
        insightTable.runId,
        runs.length > 0 ? runs.map((r) => r.id) : ["00000000-0000-0000-0000-000000000000"]
      )
    );

  // Compare groups (권역 비교 페어)
  const groupedRuns = new Map<string, typeof runs>();
  for (const r of runs) {
    if (!r.compareGroup) continue;
    const arr = groupedRuns.get(r.compareGroup) ?? [];
    arr.push(r);
    groupedRuns.set(r.compareGroup, arr);
  }
  const compareGroups: Array<{
    groupId: string;
    a: ReturnType<typeof summarizeRun>;
    b: ReturnType<typeof summarizeRun>;
    diff: ReturnType<typeof compareRuns>;
  }> = [];
  for (const [groupId, gRuns] of groupedRuns) {
    if (gRuns.length < 2) continue;
    const [ra, rb] = gRuns.slice(0, 2);
    const sa = runSummaries.find((x) => x.run.id === ra.id);
    const sb = runSummaries.find((x) => x.run.id === rb.id);
    if (!sa || !sb) continue;
    compareGroups.push({ groupId, a: sa, b: sb, diff: compareRuns(sa, sb) });
  }

  // Executive Summary 생성 (LLM)
  let execSummary = null;
  try {
    if (runSummaries.length > 0) {
      execSummary = await generateExecSummary({
        study: s,
        stimulus: stim ?? null,
        runSummaries,
        insights: dbInsights as never,
        calibrations: calibrations as never,
      });
    }
  } catch (e) {
    console.error("[study-pdf] execSummary failed", e);
  }

  // PDF 빌드
  const doc = buildStudyReportDocument({
    study: s,
    stimulus: stim ?? null,
    runs,
    runSummaries,
    panelMap,
    calibrations: calibrations as never,
    compareGroups,
    execSummary,
  });

  const buffer = await renderToBuffer(doc);
  const filename = `vfgi-study-${s.title.replace(/\s+/g, "-")}-${s.id.slice(0, 8)}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${encodeURIComponent(filename)}"`,
      "cache-control": "private, max-age=0, must-revalidate",
    },
  });
}

// silence unused import warnings
void isNotNull;
type _F = FGIEvent;
