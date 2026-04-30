import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  study,
  run,
  event as eventTable,
  calibration,
} from "@/db/schema";
import { asc, eq, desc } from "drizzle-orm";
import { calibrateRun, RealFgiInputSchema } from "@/lib/agents/calibrator";
import type { FGIEvent } from "@/lib/eventStream";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: studyId } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const [s] = await db.select().from(study).where(eq(study.id, studyId));
  if (!s) return NextResponse.json({ error: "study not found" }, { status: 404 });

  const realFgiParse = RealFgiInputSchema.safeParse(body.realFgi);
  if (!realFgiParse.success) {
    return NextResponse.json(
      { error: "realFgi invalid", issues: realFgiParse.error.flatten() },
      { status: 400 }
    );
  }
  const realFgi = realFgiParse.data;

  const targetRunId: string | undefined = body.runId;

  const [r] = targetRunId
    ? await db.select().from(run).where(eq(run.id, targetRunId))
    : await db
        .select()
        .from(run)
        .where(eq(run.studyId, studyId))
        .orderBy(desc(run.createdAt))
        .limit(1);
  if (!r)
    return NextResponse.json({ error: "no run to calibrate against" }, { status: 400 });

  const evRows = await db
    .select()
    .from(eventTable)
    .where(eq(eventTable.runId, r.id))
    .orderBy(asc(eventTable.seq));
  const events = evRows.map((e) => e.payload as unknown as FGIEvent);

  try {
    const result = await calibrateRun(realFgi, events, s.objective);

    const [created] = await db
      .insert(calibration)
      .values({
        studyId: s.id,
        runId: r.id,
        title: realFgi.source ?? "외부 FGI 비교",
        realFgiSummary: realFgi as never,
        deltas: result as never,
      })
      .returning();

    return NextResponse.json({ calibration: created, deltas: result, runId: r.id });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? String(e) },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: studyId } = await ctx.params;
  const rows = await db
    .select()
    .from(calibration)
    .where(eq(calibration.studyId, studyId))
    .orderBy(desc(calibration.createdAt))
    .limit(20);
  return NextResponse.json({ calibrations: rows });
}
