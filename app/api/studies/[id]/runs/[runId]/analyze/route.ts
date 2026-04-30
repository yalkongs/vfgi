import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  run,
  study,
  event as eventTable,
  insight as insightTable,
  persona,
} from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { analyzeRun } from "@/lib/agents/analyst";
import type { FGIEvent } from "@/lib/eventStream";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; runId: string }> }
) {
  const { runId } = await ctx.params;
  const [r] = await db.select().from(run).where(eq(run.id, runId));
  if (!r) return NextResponse.json({ error: "run not found" }, { status: 404 });
  const [s] = await db.select().from(study).where(eq(study.id, r.studyId));
  if (!s) return NextResponse.json({ error: "study not found" }, { status: 404 });

  const evRows = await db
    .select()
    .from(eventTable)
    .where(eq(eventTable.runId, runId))
    .orderBy(asc(eventTable.seq));
  const events = evRows.map((e) => e.payload as unknown as FGIEvent);

  const panel = r.panelIds.length
    ? await db.select().from(persona).where(inArray(persona.id, r.panelIds))
    : [];

  try {
    const result = await analyzeRun(events, panel, s.objective);

    if (result.insights.length > 0) {
      await db.insert(insightTable).values(
        result.insights.map((i) => ({
          runId: r.id,
          segment: i.segment,
          theme: i.theme,
          quote: i.quote ?? null,
          strength: String(i.strength),
          personaIds: i.personaIds,
        }))
      );
    }

    const enrichedMetrics: Record<string, unknown> = {
      ...(r.metrics as Record<string, unknown>),
      analystMetrics: result.metrics,
      killKeepChange: result.killKeepChange,
      topQuotes: result.topQuotes,
    };

    await db
      .update(run)
      .set({
        metrics: enrichedMetrics as never,
        verdict: result.verdict as never,
      })
      .where(eq(run.id, r.id));

    return NextResponse.json({ analysis: result });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message ?? String(e) },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; runId: string }> }
) {
  const { runId } = await ctx.params;
  const insights = await db
    .select()
    .from(insightTable)
    .where(eq(insightTable.runId, runId));
  return NextResponse.json({ insights });
}
