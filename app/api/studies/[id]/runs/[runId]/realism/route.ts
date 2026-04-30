import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  run,
  event as eventTable,
  persona,
} from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";
import { computeRealismScores, realismGrade } from "@/lib/agents/realismJudge";
import type { FGIEvent } from "@/lib/eventStream";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; runId: string }> }
) {
  const { runId } = await ctx.params;
  const [r] = await db.select().from(run).where(eq(run.id, runId));
  if (!r) return NextResponse.json({ error: "run not found" }, { status: 404 });

  const evRows = await db
    .select()
    .from(eventTable)
    .where(eq(eventTable.runId, runId))
    .orderBy(asc(eventTable.seq));
  const events = evRows.map((e) => e.payload as unknown as FGIEvent);

  const panel = r.panelIds.length
    ? await db.select().from(persona).where(inArray(persona.id, r.panelIds))
    : [];

  const scores = computeRealismScores(events, panel);
  const grade = realismGrade(scores);

  await db
    .update(run)
    .set({ realismScores: scores as never })
    .where(eq(run.id, runId));

  return NextResponse.json({ scores, grade });
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; runId: string }> }
) {
  const { runId } = await ctx.params;
  const [r] = await db.select().from(run).where(eq(run.id, runId));
  if (!r) return NextResponse.json({ error: "run not found" }, { status: 404 });
  const scores = (r.realismScores ?? null) as never;
  const grade = scores ? realismGrade(scores) : null;
  return NextResponse.json({ scores, grade });
}
